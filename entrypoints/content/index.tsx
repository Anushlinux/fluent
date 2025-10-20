import ReactDOM from 'react-dom/client';
import nlp from 'compromise';
import { defineContentScript } from 'wxt/sandbox';
import { Popover, type Quiz } from '../../components/Popover';
import { logPopoverView, logQuizResult } from '../../utils/logger';
import './content.css';

interface GlossaryEntry {
  term: string;
  definition: string;
  usage: string;
  quiz: Quiz;
}

interface TermMatch {
  term: string;
  element: HTMLElement;
  entry: GlossaryEntry;
}

let glossary: GlossaryEntry[] = [];
let currentPopover: { root: ReactDOM.Root; container: HTMLElement } | null = null;
let hoverTimeout: number | null = null;

/**
 * Main content script entry point
 */
export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    console.log('[Fluent] Content script loaded');
    
    // Load glossary
    await loadGlossary();
    
    // Wait for page to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeExtension);
    } else {
      initializeExtension();
    }
  },
});

/**
 * Load glossary from extension resources
 */
async function loadGlossary(): Promise<void> {
  try {
    const glossaryUrl = chrome.runtime.getURL('glossary.json');
    const response = await fetch(glossaryUrl);
    glossary = await response.json();
    console.log(`[Fluent] Loaded ${glossary.length} terms from glossary`);
  } catch (error) {
    console.error('[Fluent] Failed to load glossary:', error);
  }
}

/**
 * Initialize the extension on the page
 */
function initializeExtension(): void {
  // Find and highlight terms
  const matches = findTermsInPage();
  console.log(`[Fluent] Found ${matches.length} term matches on page`);
  
  // Highlight each match
  matches.forEach(match => highlightTerm(match));
}

/**
 * Find all glossary terms in the page
 */
function findTermsInPage(): TermMatch[] {
  const matches: TermMatch[] = [];
  const bodyText = document.body.innerText.toLowerCase();
  
  // Check which terms exist on the page using compromise
  const doc = nlp(bodyText);
  
  glossary.forEach(entry => {
    const termLower = entry.term.toLowerCase();
    if (doc.has(termLower)) {
      // Find actual occurrences in the DOM
      const elements = findTextNodesWithTerm(document.body, entry.term);
      elements.forEach(element => {
        matches.push({ term: entry.term, element, entry });
      });
    }
  });
  
  return matches;
}

/**
 * Find text nodes containing a specific term
 */
function findTextNodesWithTerm(root: Node, term: string): HTMLElement[] {
  const matches: HTMLElement[] = [];
  const termRegex = new RegExp(`\\b${term}\\b`, 'gi');
  
  function walk(node: Node): void {
    // Skip script and style elements
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node as HTMLElement).tagName &&
      ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME'].includes((node as HTMLElement).tagName)
    ) {
      return;
    }
    
    // Skip already highlighted terms
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node as HTMLElement).classList?.contains('fluent-highlight')
    ) {
      return;
    }
    
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      const text = node.textContent;
      if (termRegex.test(text) && node.parentElement) {
        matches.push(node.parentElement);
      }
    } else {
      node.childNodes.forEach(child => walk(child));
    }
  }
  
  walk(root);
  return matches;
}

/**
 * Highlight a term in the DOM
 */
function highlightTerm(match: TermMatch): void {
  const { term, element, entry } = match;
  const termRegex = new RegExp(`\\b(${term})\\b`, 'gi');
  
  // Create a walker to process text nodes
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip if parent is already highlighted
        if ((node.parentElement as HTMLElement)?.classList?.contains('fluent-highlight')) {
          return NodeFilter.FILTER_REJECT;
        }
        return termRegex.test(node.textContent || '')
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    }
  );
  
  const nodesToReplace: { node: Node; parent: Node }[] = [];
  let currentNode = walker.nextNode();
  
  while (currentNode) {
    nodesToReplace.push({ node: currentNode, parent: currentNode.parentNode! });
    currentNode = walker.nextNode();
  }
  
  // Replace text nodes with highlighted spans
  nodesToReplace.forEach(({ node, parent }) => {
    const text = node.textContent || '';
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    
    termRegex.lastIndex = 0;
    
    while ((match = termRegex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.slice(lastIndex, match.index))
        );
      }
      
      // Create highlighted span
      const span = document.createElement('span');
      span.className = 'fluent-highlight';
      span.textContent = match[0];
      span.dataset.term = term;
      
      // Add event listeners
      addEventListeners(span, entry);
      
      fragment.appendChild(span);
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
    
    parent.replaceChild(fragment, node);
  });
}

/**
 * Add event listeners to highlighted term
 */
function addEventListeners(element: HTMLElement, entry: GlossaryEntry): void {
  // Hover to show preview
  element.addEventListener('mouseenter', (e) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    hoverTimeout = window.setTimeout(() => {
      showPopover(e as MouseEvent, entry, 'preview');
    }, 300);
  });
  
  element.addEventListener('mouseleave', () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    
    // Hide preview popover after delay
    setTimeout(() => {
      if (currentPopover) {
        hidePopover();
      }
    }, 200);
  });
  
  // Click to show full popover with quiz
  element.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    
    showPopover(e as MouseEvent, entry, 'full');
  });
}

/**
 * Show popover at mouse position
 */
function showPopover(
  event: MouseEvent,
  entry: GlossaryEntry,
  mode: 'preview' | 'full'
): void {
  // Remove existing popover
  hidePopover();
  
  // Get context sentence
  const contextSentence = getContextSentence(event.target as HTMLElement);
  
  // Log popover view
  logPopoverView(entry.term, window.location.href, contextSentence);
  
  // Create popover container
  const container = document.createElement('div');
  container.className = 'fluent-popover-container';
  document.body.appendChild(container);
  
  // Create React root and render popover
  const root = ReactDOM.createRoot(container);
  
  const handleQuizAnswer = (correct: boolean) => {
    logQuizResult(entry.term, window.location.href, correct, contextSentence);
  };
  
  const handleClose = () => {
    hidePopover();
  };
  
  root.render(
    <Popover
      term={entry.term}
      definition={entry.definition}
      usage={entry.usage}
      quiz={entry.quiz}
      position={{ x: event.clientX, y: event.clientY }}
      mode={mode}
      onQuizAnswer={handleQuizAnswer}
      onClose={mode === 'full' ? handleClose : undefined}
    />
  );
  
  currentPopover = { root, container };
  
  // Close on outside click (for full mode)
  if (mode === 'full') {
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 0);
  }
}

/**
 * Hide current popover
 */
function hidePopover(): void {
  if (currentPopover) {
    currentPopover.root.unmount();
    currentPopover.container.remove();
    currentPopover = null;
    document.removeEventListener('click', handleOutsideClick);
  }
}

/**
 * Handle clicks outside popover
 */
function handleOutsideClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  
  if (
    !target.closest('.fluent-popover') &&
    !target.closest('.fluent-highlight')
  ) {
    hidePopover();
  }
}

/**
 * Get the sentence containing the highlighted term
 */
function getContextSentence(element: HTMLElement): string {
  const parent = element.parentElement;
  if (!parent) return '';
  
  const text = parent.textContent || '';
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  const term = element.textContent || '';
  const sentence = sentences.find(s => s.includes(term));
  
  return sentence?.trim() || text.slice(0, 150);
}

