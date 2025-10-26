import ReactDOM from 'react-dom/client';
import nlp from 'compromise';
import { v4 as uuidv4 } from 'uuid';
import { defineContentScript } from 'wxt/sandbox';
import { Popover, type Quiz } from '../../components/Popover';
import { logPopoverView, logQuizResult } from '../../utils/logger';
import { tagSentence, detectPageContext } from '../../utils/tagger';
import { unlockTerm } from '../../utils/pokedex';
import './content.css';
import browser from 'webextension-polyfill';

interface GlossaryEntry {
  term: string;
  definition?: string; // Legacy single definition
  definitions?: { [context: string]: string }; // New context-aware definitions
  usage?: string; // Legacy single example
  examples?: { [context: string]: string }; // New context-aware examples
  sources?: string[];
  category?: string;
  quiz: Quiz;
}

interface TermMatch {
  term: string;
  element: HTMLElement;
  entry: GlossaryEntry;
}

let glossary: GlossaryEntry[] = [];
let currentPopover: { root: ReactDOM.Root; container: HTMLElement; anchorElement?: HTMLElement; scrollListener?: () => void; mouseMoveListener?: ((e: MouseEvent) => void) | null } | null = null;
let hoverTimeout: number | null = null;
let closeTimeout: number | null = null;
let currentSentenceHighlight: HTMLElement[] = [];
let capturePopoverElement: HTMLElement | null = null;
let lastSelectedSentence: string | null = null;
let isPopoverOpen = false;
let isClickActive = false;
let currentRange: Range | null = null;

interface CapturedSentence {
  id: string;
  sentence: string;
  terms: string[];
  context: string;
  framework?: string;
  secondaryContext?: string;
  confidence: number;
  timestamp: string;
}

let latestCapturedSentenceEntry: CapturedSentence | null = null;
let analysisActive: boolean = false;
let analyzing: boolean = false;
let pageContext: string = 'General';
let currentToast: HTMLElement | null = null;

const SENTENCE_BOUNDARY_REGEX = /[.!?]/;
const SENTENCE_CHAR_LIMIT = 100;

/**
 * Safely escape HTML characters to prevent injection
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const getExtensionStorage = (): typeof chrome.storage | undefined => {
  // Prefer the typed chrome storage API when available
  if (chrome?.storage?.local) {
    return chrome.storage;
  }

  // Fallback to the browser polyfill (needs casting to satisfy TS)
  const browserStorage = (browser as typeof chrome | undefined)?.storage;
  if (browserStorage?.local) {
    return browserStorage as unknown as typeof chrome.storage;
  }

  return undefined;
};

// Storage functions removed - using immediate sync to Supabase instead

const hasExtensionContext = (): boolean => {
  const runtime = chrome?.runtime?.id || (browser as typeof chrome | undefined)?.runtime?.id;
  return Boolean(runtime && getExtensionStorage()?.local);
};

/**
 * Main content script entry point
 */
export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    console.log('[Fluent] Content script loaded');

    if (!hasExtensionContext()) {
      console.warn('[Fluent] Extension context is invalid. Content script cannot function properly.');
      return;
    }

    await loadGlossary();
    
    // Detect page context
    pageContext = detectPageContext(document.body.innerText).context;
    console.log(`[Fluent] Page context detected: ${pageContext}`);

    // Restore analysis state if page was previously analyzed
    await restoreAnalysisState();

    // Listen for analyze commands from popup
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.action === 'analyzePage') {
        handleAnalyzeRequest().then(() => {
          sendResponse({ success: true });
        });
        return true; // Required for async response
      } else if (message.action === 'clearAnalysis') {
        handleClearRequest().then(() => {
          sendResponse({ success: true });
        });
        return true;
      } else if (message.action === 'captureSentence') {
        handleCaptureFromContextMenu().then(() => {
          sendResponse({ success: true });
        });
        return true;
      }
    });

    // Initialize context menu for sentence capture
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('mousedown', handlePointerDown, true);

    // Add text selection listener for AI explanations
    document.addEventListener('mouseup', handleTextSelectionForButton);

    // Listen for auth messages from website
    window.addEventListener('message', async (event) => {
      const websiteUrl = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:3001';
      
      // Validate origin for security
      if (!event.origin.startsWith(websiteUrl)) {
        return;
      }
      
      // Check for auth success message
      if (event.data.type === 'FLUENT_AUTH_SUCCESS' && event.data.session) {
        console.log('[Fluent Content] Received auth message from website');
        
        // Forward to background script
        chrome.runtime.sendMessage({
          action: 'setAuthSession',
          session: event.data.session,
        });
      }
    });
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
 * Restore analysis state on page load
 */
async function restoreAnalysisState(): Promise<void> {
  try {
    const result = await chrome.storage.local.get('analysisMode');
    const state = result.analysisMode;
    
    if (state?.active) {
      console.log('[Fluent] Restoring previous analysis state');
      // Re-highlight terms without animation
      const matches = findTermsInPage();
      matches.forEach(match => highlightTerm(match));
      analysisActive = true;
    }
  } catch (error) {
    console.error('[Fluent] Failed to restore analysis state:', error);
  }
}

/**
 * Handle analyze page request from popup
 */
async function handleAnalyzeRequest(): Promise<void> {
  if (analyzing || analysisActive) {
    console.log('[Fluent] Analysis already active or in progress');
    return;
  }
  
  console.log('[Fluent] Starting page analysis...');
  analyzing = true;
  
  // Show scanning animation
  await showScanningAnimation();
  
  // Find and highlight terms
  const matches = findTermsInPage();
  console.log(`[Fluent] Found ${matches.length} term matches on page`);
  matches.forEach(match => highlightTerm(match));
  
  // Update state
  analyzing = false;
  analysisActive = true;
  
  // Persist state
  await chrome.storage.local.set({ 
    analysisMode: { active: true, analyzing: false } 
  });
  
  console.log('[Fluent] Page analysis complete');
}

/**
 * Handle clear analysis request from popup
 */
async function handleClearRequest(): Promise<void> {
  console.log('[Fluent] Clearing analysis...');
  clearAllHighlights();
  analysisActive = false;
  
  await chrome.storage.local.set({ 
    analysisMode: { active: false, analyzing: false } 
  });
  
  console.log('[Fluent] Analysis cleared');
}

/**
 * Show scanning animation overlay
 */
function showScanningAnimation(): Promise<void> {
  return new Promise((resolve) => {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'fluent-scan-overlay';
    
    // Create scan line
    const scanLine = document.createElement('div');
    scanLine.className = 'fluent-scan-line';
    
    // Create scan text
    const scanText = document.createElement('div');
    scanText.className = 'fluent-scan-text';
    scanText.style.paddingLeft = '32px'; // Make room for pulsing indicator
    scanText.textContent = 'Scanning page...';
    
    overlay.appendChild(scanLine);
    document.body.appendChild(overlay);
    document.body.appendChild(scanText);
    
    // Remove after animation (1.5s)
    setTimeout(() => {
      overlay.remove();
      scanText.remove();
      resolve();
    }, 1500);
  });
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
  element.addEventListener('mouseenter', (event) => {
    // Don't show preview if click is active or popover already open
    if (isClickActive || isPopoverOpen) {
      return;
    }
    
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      closeTimeout = null;
    }
    
    // Store cursor position before timeout
    const cursorX = event.clientX;
    const cursorY = event.clientY;
    
    hoverTimeout = window.setTimeout(() => {
      if (!isClickActive) {
        // Create a new mouse event with stored coordinates
        const syntheticEvent = {
          clientX: cursorX,
          clientY: cursorY
        } as MouseEvent;
        showPopover(element, entry, 'preview', syntheticEvent);
      }
    }, 300);
  });
  
  element.addEventListener('mouseleave', (e) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    
    // Check if mouse is moving to the popover
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && currentPopover?.container?.contains(relatedTarget)) {
      return; // Don't close if moving to popover
    }
    
    // Only close preview popover, not full popover
    if (currentPopover && !isClickActive) {
      closeTimeout = window.setTimeout(() => {
        if (!isClickActive) {
          hidePopover();
        }
      }, 150);
    }
  });
  
  // Click to show full popover with quiz
  element.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      closeTimeout = null;
    }
    
    isClickActive = true;
    hidePopover();
    
    // Small delay to ensure cleanup
    setTimeout(() => {
      showPopover(element, entry, 'full', e);
    }, 10);
  });
}

/**
 * Show popover anchored to element
 */
function showPopover(
  anchorElement: HTMLElement,
  entry: GlossaryEntry,
  mode: 'preview' | 'full',
  mouseEvent?: MouseEvent
): void {
  // Remove existing popover
  hidePopover();
  
  isPopoverOpen = true;
  
  // Get context sentence
  const contextSentence = getContextSentence(anchorElement);
  
  // Detect context for this specific sentence and page
  const sentenceContext = tagSentence(contextSentence, glossary.map(e => e.term));
  const detectedContext = sentenceContext.context !== 'General' ? sentenceContext.context : pageContext;
  
  // Select appropriate definition and example based on context
  let definition: string;
  let usage: string;
  
  if (entry.definitions) {
    // New context-aware format
    definition = entry.definitions[detectedContext] || entry.definitions['General'] || entry.definitions[Object.keys(entry.definitions)[0]];
  } else {
    // Legacy format
    definition = entry.definition || '';
  }
  
  if (entry.examples) {
    // New context-aware format
    usage = entry.examples[detectedContext] || entry.examples['General'] || entry.examples[Object.keys(entry.examples)[0]];
  } else {
    // Legacy format
    usage = entry.usage || '';
  }
  
  // Log popover view and unlock term
  logPopoverView(entry.term, window.location.href, contextSentence);
  unlockTerm(entry.term);

  const captureCandidate = lastSelectedSentence || contextSentence || '';
  const handleCaptureSentence = captureCandidate
    ? async () => {
        const glossaryTerms = glossary.map(e => e.term);
        const tagResult = tagSentence(captureCandidate, glossaryTerms);
        const result = await storeCapturedSentence(captureCandidate, tagResult);
        return result.success;
      }
    : undefined;
  
  // Create popover container
  const container = document.createElement('div');
  container.className = 'fluent-popover-container';
  document.body.appendChild(container);
  
  // Position container based on anchor element or cursor position
  if (mode === 'preview' && mouseEvent) {
    // For hover popups, use smart left/right positioning based on cursor position
    const cursorX = mouseEvent.clientX || 0;
    const anchorRect = anchorElement.getBoundingClientRect();
    
    container.style.position = 'fixed';
    container.style.zIndex = '2147483647';
    container.style.opacity = '0'; // Hide until positioned
    
    // Determine if cursor is on left or right half of screen
    const isLeftSide = cursorX < window.innerWidth / 2;
    
    // Wait for multiple frames to ensure layout is complete
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const viewportPadding = 16;
        const horizontalGap = 12;
        
        let left: number;
        if (isLeftSide) {
          left = anchorRect.right + horizontalGap;
          if (left + rect.width > window.innerWidth - viewportPadding) {
            left = anchorRect.left - rect.width - horizontalGap;
          }
        } else {
          left = anchorRect.left - rect.width - horizontalGap;
          if (left < viewportPadding) {
            left = anchorRect.right + horizontalGap;
          }
        }
        
        let top = anchorRect.top + (anchorRect.height / 2) - (rect.height / 2);
        
        // Clamp to viewport with extra safety margin
        top = Math.max(viewportPadding, Math.min(top, window.innerHeight - rect.height - viewportPadding));
        left = Math.max(viewportPadding, Math.min(left, window.innerWidth - rect.width - viewportPadding));
        
        container.style.left = `${left}px`;
        container.style.top = `${top}px`;
        container.style.opacity = '1'; // Show after positioned
      });
    });
  } else {
    // For click popups, position relative to element
    const anchorRect = anchorElement.getBoundingClientRect();
    positionPopover(container, anchorRect, { preferredSide: 'below', offset: 8 });
  }
  
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
      definition={definition}
      usage={usage}
      quiz={entry.quiz}
      position={{ x: 0, y: 0 }}
      mode={mode}
      captureCandidateSentence={captureCandidate || null}
      latestCapturedSentence={latestCapturedSentenceEntry}
      onCaptureSentence={handleCaptureSentence}
      onQuizAnswer={handleQuizAnswer}
      onClose={mode === 'full' ? handleClose : undefined}
      sources={entry.sources}
      detectedContext={detectedContext}
    />
  );
  
  // Add mouseenter/mouseleave to popover to keep it open when hovering
  container.addEventListener('mouseenter', () => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      closeTimeout = null;
    }
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
  });
  
  container.addEventListener('mouseleave', (e: MouseEvent) => {
    if (!isClickActive && mode === 'preview') {
      // Check if mouse is moving to the anchor element
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (relatedTarget && currentPopover?.anchorElement?.contains(relatedTarget)) {
        return; // Don't close if moving back to word
      }
      
      closeTimeout = window.setTimeout(() => {
        if (!isClickActive) {
          hidePopover();
        }
      }, 150);
    }
  });
  
  // Set up scroll listener to reposition
  const scrollListener = () => {
    if (container.parentElement) {
      if (mode === 'preview' && mouseEvent) {
        // For hover popups, just close on scroll to avoid confusion
        hidePopover();
      } else {
        // For click popups, reposition relative to element
        const rect = anchorElement.getBoundingClientRect();
        positionPopover(container, rect, { preferredSide: 'below', offset: 8 });
      }
    }
  };
  
  window.addEventListener('scroll', scrollListener, true);
  
  currentPopover = { root, container, anchorElement, scrollListener, mouseMoveListener: null };
  
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
  if (!currentPopover || !isPopoverOpen) {
    return;
  }
  
  isPopoverOpen = false;
  
  try {
    // Remove scroll listener
    if (currentPopover.scrollListener) {
      window.removeEventListener('scroll', currentPopover.scrollListener, true);
    }
    
    // Remove mouse move listener
    if (currentPopover.mouseMoveListener) {
      document.removeEventListener('mousemove', currentPopover.mouseMoveListener);
    }
    
    // Unmount React component
    currentPopover.root.unmount();
    
    // Remove DOM element
    if (currentPopover.container.parentElement) {
      currentPopover.container.remove();
    }
  } catch (error) {
    console.error('[Fluent] Error cleaning up popover:', error);
  } finally {
    currentPopover = null;
    document.removeEventListener('click', handleOutsideClick);
    
    // Clear timeouts
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      closeTimeout = null;
    }
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
    isClickActive = false;
    hidePopover();
  }
}

interface PopoverPositionOptions {
  preferredSide?: 'below' | 'above';
  offset?: number;
}

function positionPopover(
  popoverElement: HTMLElement,
  anchorRect: DOMRect,
  _options: PopoverPositionOptions = {}
): void {
  
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const popoverRect = popoverElement.getBoundingClientRect();
      const viewportPadding = 16;
      const horizontalGap = 12;
      
      // Determine if word is on left or right half of screen
      const wordCenterX = anchorRect.left + (anchorRect.width / 2);
      const isLeftSide = wordCenterX < window.innerWidth / 2;
      
      // Calculate horizontal position
      let left: number;
      if (isLeftSide) {
        // Position to the right of the word
        left = anchorRect.right + horizontalGap;
        if (left + popoverRect.width > window.innerWidth - viewportPadding) {
          left = anchorRect.left - popoverRect.width - horizontalGap;
        }
      } else {
        // Position to the left of the word
        left = anchorRect.left - popoverRect.width - horizontalGap;
        if (left < viewportPadding) {
          left = anchorRect.right + horizontalGap;
        }
      }
      
      // Vertically center with the word
      let top = anchorRect.top + (anchorRect.height / 2) - (popoverRect.height / 2);
      
      // Clamp to viewport
      top = Math.max(viewportPadding, Math.min(top, window.innerHeight - popoverRect.height - viewportPadding));
      left = Math.max(viewportPadding, Math.min(left, window.innerWidth - popoverRect.width - viewportPadding));
      
      // Apply positioning
      popoverElement.style.position = 'fixed';
      popoverElement.style.top = `${top}px`;
      popoverElement.style.left = `${left}px`;
      popoverElement.style.margin = '0';
      popoverElement.style.transform = 'none';
    });
  });
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

/**
 * Handle context menu (right-click) events
 */
function handleContextMenu(): void {
  const selection = window.getSelection();
  
  if (!selection || selection.isCollapsed) {
    clearSentenceCaptureArtifacts();
    return;
  }
  
  if (isSelectionInsideExtension(selection)) {
    return;
  }
  
  // Store the selection range for later use
  if (selection.rangeCount > 0) {
    currentRange = selection.getRangeAt(0).cloneRange();
  }
  
  // The context menu will be shown by the browser
  // Background script will handle the menu click and send message
}

/**
 * Handle capture request from context menu
 */
async function handleCaptureFromContextMenu(): Promise<void> {
  if (!currentRange) {
    console.warn('[Fluent] No selection range stored');
    return;
  }
  
  if (!hasExtensionContext()) {
    console.warn('[Fluent] Extension context invalidated - ignoring capture request');
    return;
  }
  
  const extraction = extractSentenceFromRange(currentRange);
  if (!extraction) {
    console.log('[Fluent] Failed to extract sentence from stored range');
    clearSentenceCaptureArtifacts();
    return;
  }
  
  const { sentence, range, root } = extraction;
  
  if (!sentence) {
    console.log('[Fluent] Extracted sentence is empty');
    clearSentenceCaptureArtifacts();
    return;
  }
  
  console.log('[Fluent] Successfully extracted sentence:', sentence.slice(0, 100));
  
  // Tag the sentence with terms and context
  const glossaryTerms = glossary.map(entry => entry.term);
  const tagResult = tagSentence(sentence, glossaryTerms);
  console.log('[Fluent] Tagged sentence:', tagResult);
  
  highlightSentenceRange(range);
  showCapturePopover(range, root, sentence, tagResult);
  lastSelectedSentence = sentence;
}

/**
 * Handle text selection for instant AI explanation
 */
let selectionButton: HTMLElement | null = null;
let selectionButtonTimeout: number | null = null;
let currentSelection: { text: string; range: Range } | null = null;
let aiModal: HTMLElement | null = null;
let aiTopBar: HTMLElement | null = null;
let chatExpanded: boolean = false;

function handleTextSelectionForButton(): void {
  // Clear existing timeout
  if (selectionButtonTimeout) {
    clearTimeout(selectionButtonTimeout);
    selectionButtonTimeout = null;
  }
  
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    hideSelectionButton();
    return;
  }

  const selectedText = selection.toString().trim();
  if (!selectedText || selectedText.length < 15) {
    hideSelectionButton();
    return;
  }

  if (isSelectionInsideExtension(selection)) {
    hideSelectionButton();
    return;
  }

  // Store selection
  const range = selection.getRangeAt(0);
  currentSelection = { text: selectedText, range: range.cloneRange() };

  // Show button after 500ms delay
  selectionButtonTimeout = window.setTimeout(() => {
    showSelectionButton(range);
  }, 500);
}

function showSelectionButton(range: Range): void {
  hideSelectionButton();

  const rect = range.getBoundingClientRect();
  
  selectionButton = document.createElement('button');
  selectionButton.className = 'fluent-selection-button';
  selectionButton.innerHTML = '<span class="fluent-selection-button__icon">→</span>';
  selectionButton.style.position = 'absolute';
  selectionButton.style.left = `${rect.right + window.scrollX + 12}px`;
  selectionButton.style.top = `${rect.top + window.scrollY + (rect.height / 2) - 20}px`;
  selectionButton.setAttribute('aria-label', 'Get AI explanation for this selection');
  selectionButton.setAttribute('title', 'Ask AI');
  
  selectionButton.addEventListener('click', handleSelectionButtonClick);
  
  document.body.appendChild(selectionButton);
}

function hideSelectionButton(): void {
  if (selectionButton) {
    selectionButton.remove();
    selectionButton = null;
  }
}

function handleSelectionButtonClick(e: Event): void {
  e.stopPropagation();
  
  if (!currentSelection) return;
  
  // Show top bar instead of modal
  showAITopBar(currentSelection.text);
}

function openAIModal(text: string, _range: Range): void {
  closeAIModal();
  
  // Create modal
  aiModal = document.createElement('div');
  aiModal.className = 'fluent-ai-modal';
  
  aiModal.innerHTML = `
    <div class="fluent-ai-modal__header">
      <span class="fluent-ai-modal__title">AI Explanation</span>
      <button class="fluent-ai-modal__close">×</button>
    </div>
    <div class="fluent-ai-modal__content">
      <div class="fluent-ai-modal__loading">
        <div class="fluent-ai-modal__spinner"></div>
        <p>Analyzing text...</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(aiModal);
  
  // Add close handler
  const closeBtn = aiModal.querySelector('.fluent-ai-modal__close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeAIModal);
  }
  
  // Fetch AI explanation
  fetchAIExplanation(text);
  
  // Add click listener to close modal on outside click
  setTimeout(() => {
    document.addEventListener('click', handleModalOutsideClick);
  }, 0);
}

function handleModalOutsideClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  
  if (
    aiModal && 
    !aiModal.contains(target) && 
    !target.closest('.fluent-selection-button')
  ) {
    closeAIModal();
    document.removeEventListener('click', handleModalOutsideClick);
  }
}

async function fetchAIExplanation(text: string): Promise<void> {
  try {
    const storage = getExtensionStorage();
    let userId = '';
    if (storage) {
      const authData = await storage.local.get('fluentAuthSession');
      userId = authData?.fluentAuthSession?.user?.id || '';
    }

    const response = await chrome.runtime.sendMessage({
      action: 'callAgent',
      data: { sentence: text, url: window.location.href, user_id: userId }
    });

    if (response.success && response.data) {
      console.log('[Fluent] Agent response received (modal):', response.data);
      showAIModalContent(response.data);
    } else {
      console.error('[Fluent] Agent response failed (modal):', response);
      throw new Error(response.error || 'Agent call failed');
    }
  } catch (error) {
    console.warn('[Fluent] Agent unavailable:', error);
    showAIModalContent({
      explanation: "⚠️ AI Agent Offline: The AI explanation service is not running. Start the agent with 'python agent/mailbox_agent.py' to enable AI-powered explanations.",
      concepts: [],
      captured: false
    });
  }
}

function showAIModalContent(data: any): void {
  if (!aiModal) return;
  
  const content = aiModal.querySelector('.fluent-ai-modal__content');
  if (!content) return;
  
  // Validate data structure
  if (!data || typeof data.explanation !== 'string') {
    console.error('[Fluent] Invalid agent response:', data);
    return;
  }
  
  // Get user ID to show appropriate message
  const storage = getExtensionStorage();
  let userId = '';
  if (storage) {
    storage.local.get('fluentAuthSession').then((authData: any) => {
      userId = authData?.fluentAuthSession?.user?.id || '';
    });
  }
  
  const escapedExplanation = escapeHtml(data.explanation);
  const conceptsHtml = data.concepts && Array.isArray(data.concepts) && data.concepts.length > 0
    ? `<div class="fluent-ai-modal__concepts">
         <strong>Key Concepts:</strong>
         <div class="fluent-ai-modal__tags">
           ${data.concepts.map((c: string) => `<span class="fluent-ai-modal__tag">${escapeHtml(c)}</span>`).join('')}
         </div>
       </div>`
    : '';
  
  const statusMessage = data.captured 
    ? '✅ Saved to your knowledge graph! View on website.' 
    : userId 
      ? '⚠️ Failed to save. Please check connection.'
      : 'ℹ️ Sign in to save to your graph.';
  
  content.innerHTML = `
    <div class="fluent-ai-modal__explanation">
      <p>${escapedExplanation}</p>
    </div>
    ${conceptsHtml}
    <div class="fluent-ai-modal__status">
      ${statusMessage}
    </div>
  `;
}

function closeAIModal(): void {
  if (aiModal) {
    aiModal.remove();
    aiModal = null;
  }
  hideSelectionButton();
  currentSelection = null;
  document.removeEventListener('click', handleModalOutsideClick);
}

function showAITopBar(text: string): void {
  closeAITopBar();
  
  // Truncate text for header (shorter for title)
  const truncatedTitle = text.length > 60 ? `${text.slice(0, 57)}...` : text;
  
  // Reset chat state
  chatExpanded = false;
  
  // Create top bar
  aiTopBar = document.createElement('div');
  aiTopBar.className = 'fluent-ai-topbar';
  
  aiTopBar.innerHTML = `
    <div class="fluent-ai-topbar__header">
      <div class="fluent-ai-topbar__title">
        <span class="fluent-ai-topbar__text">${escapeHtml(truncatedTitle)}</span>
      </div>
      <div class="fluent-ai-topbar__actions">
        <button class="fluent-ai-topbar__close" aria-label="Close">×</button>
      </div>
    </div>
    <div class="fluent-ai-topbar__content">
      <div class="fluent-ai-topbar__skeleton">
        <div class="fluent-ai-topbar__skeleton-line fluent-ai-topbar__skeleton-line--title"></div>
        <div class="fluent-ai-topbar__skeleton-line fluent-ai-topbar__skeleton-line--content"></div>
        <div class="fluent-ai-topbar__skeleton-line fluent-ai-topbar__skeleton-line--content"></div>
        <div class="fluent-ai-topbar__skeleton-line fluent-ai-topbar__skeleton-line--content-short"></div>
        <div class="fluent-ai-topbar__skeleton-line fluent-ai-topbar__skeleton-line--tags">
          <div class="fluent-ai-topbar__skeleton-tag"></div>
          <div class="fluent-ai-topbar__skeleton-tag"></div>
          <div class="fluent-ai-topbar__skeleton-tag"></div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(aiTopBar);
  
  // Add close handler
  const closeBtn = aiTopBar.querySelector('.fluent-ai-topbar__close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeAITopBar);
  }
  
  // Fetch AI explanation
  fetchAIExplanationForTopBar(text);
  
  // Add outside click listener
  setTimeout(() => {
    document.addEventListener('click', handleTopBarOutsideClick);
  }, 0);
}

async function fetchAIExplanationForTopBar(text: string): Promise<void> {
  // Update to stage 2 after initial delay
  setTimeout(() => {
    if (!aiTopBar) return;
    const progressStage = aiTopBar.querySelector('.fluent-ai-topbar__progress-stage');
    if (progressStage) {
      progressStage.innerHTML = '<span class="fluent-ai-topbar__spinner"></span> Generating explanation...';
    }
  }, 500);
  
  try {
    const storage = getExtensionStorage();
    let userId = '';
    if (storage) {
      const authData = await storage.local.get('fluentAuthSession');
      userId = authData?.fluentAuthSession?.user?.id || '';
    }

    const response = await chrome.runtime.sendMessage({
      action: 'callAgent',
      data: { sentence: text, url: window.location.href, user_id: userId }
    });

    if (response.success && response.data) {
      console.log('[Fluent] Agent response received:', response.data);
      showTopBarContent(response.data, text);
    } else {
      console.error('[Fluent] Agent response failed:', response);
      throw new Error(response.error || 'Agent call failed');
    }
  } catch (error) {
    console.warn('[Fluent] Agent unavailable:', error);
    showTopBarContent({
      explanation: "⚠️ AI Agent Offline: The AI explanation service is not running. Start the agent with 'python agent/mailbox_agent.py' to enable AI-powered explanations.",
      concepts: [],
      captured: false
    }, text);
  }
}

function showTopBarContent(data: any, originalText: string): void {
  if (!aiTopBar) return;
  
  const content = aiTopBar.querySelector('.fluent-ai-topbar__content');
  if (!content) return;
  
  // Validate data structure
  if (!data || typeof data.explanation !== 'string') {
    console.error('[Fluent] Invalid agent response:', data);
    // Show error in top bar
    if (aiTopBar) {
      const content = aiTopBar.querySelector('.fluent-ai-topbar__content');
      if (content) {
        content.innerHTML = `
          <div class="fluent-ai-topbar__explanation">
            <p>⚠️ Error: Invalid response from AI agent</p>
          </div>
        `;
      }
    }
    return;
  }
  
  const escapedExplanation = escapeHtml(data.explanation);
  const conceptsHtml = data.concepts && Array.isArray(data.concepts) && data.concepts.length > 0
    ? `<div class="fluent-ai-topbar__concepts">
         <div class="fluent-ai-topbar__tags">
           ${data.concepts.map((c: string) => `<span class="fluent-ai-topbar__tag">${escapeHtml(c)}</span>`).join('')}
         </div>
       </div>`
    : '';
  
  // Add content with always-visible chat section
  content.innerHTML = `
    <div class="fluent-ai-topbar__explanation fluent-ai-topbar__explanation--animate">
      <p>${escapedExplanation}</p>
    </div>
    ${conceptsHtml}
    <div class="fluent-ai-topbar__chat-section">
      <div class="fluent-ai-topbar__chat-container">
        <div class="fluent-ai-topbar__chat-messages"></div>
        <div class="fluent-ai-topbar__chat-input">
          <input type="text" placeholder="Ask a question..." />
          <button class="fluent-ai-topbar__chat-send">→</button>
        </div>
      </div>
    </div>
  `;
  
  // Trigger fade-in animation for content
  requestAnimationFrame(() => {
    const explanation = content.querySelector('.fluent-ai-topbar__explanation--animate');
    if (explanation) {
      setTimeout(() => {
        (explanation as HTMLElement).style.opacity = '1';
      }, 10);
    }
  });
  
  // Add chat functionality - always visible
  const chatMessagesContainer = content.querySelector('.fluent-ai-topbar__chat-messages');
  const chatInput = content.querySelector('.fluent-ai-topbar__chat-input input') as HTMLInputElement;
  const chatSend = content.querySelector('.fluent-ai-topbar__chat-send') as HTMLButtonElement;
  
  if (chatSend && chatInput && chatMessagesContainer) {
    const sendMessage = async () => {
      const messageText = chatInput.value.trim();
      if (!messageText) return;
      
      // Add user message
      chatMessagesContainer.innerHTML += `
        <div class="fluent-ai-topbar__message fluent-ai-topbar__message--user">${escapeHtml(messageText)}</div>
      `;
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
      chatInput.value = '';
      
      // Disable send button
      chatSend.disabled = true;
      
      // Call agent API with conversation context
      try {
        const storage = getExtensionStorage();
        let userId = '';
        if (storage) {
          const authData = await storage.local.get('fluentAuthSession');
          userId = authData?.fluentAuthSession?.user?.id || '';
        }
        
        const response = await chrome.runtime.sendMessage({
          action: 'callAgent',
          data: { 
            sentence: messageText, 
            url: window.location.href, 
            user_id: userId,
            context: originalText,
            conversation: chatMessagesContainer.innerHTML
          }
        });
        
        if (response.success && response.data) {
          const aiResponse = response.data.explanation || 'Sorry, I could not generate a response.';
          chatMessagesContainer.innerHTML += `
            <div class="fluent-ai-topbar__message fluent-ai-topbar__message--ai">${escapeHtml(aiResponse)}</div>
          `;
          chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        } else {
          chatMessagesContainer.innerHTML += `
            <div class="fluent-ai-topbar__message fluent-ai-topbar__message--ai">❌ Failed to get response from AI agent.</div>
          `;
          chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }
      } catch (error) {
        console.warn('[Fluent] Chat error:', error);
        chatMessagesContainer.innerHTML += `
          <div class="fluent-ai-topbar__message fluent-ai-topbar__message--ai">⚠️ AI Agent Offline: The service is not running.</div>
        `;
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
      } finally {
        chatSend.disabled = false;
      }
    };
    
    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
}

function closeAITopBar(): void {
  if (aiTopBar) {
    aiTopBar.remove();
    aiTopBar = null;
  }
  document.removeEventListener('click', handleTopBarOutsideClick);
}

function handleTopBarOutsideClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  
  if (
    aiTopBar && 
    !aiTopBar.contains(target) && 
    !target.closest('.fluent-selection-button')
  ) {
    closeAITopBar();
  }
}

function handlePointerDown(event: MouseEvent): void {
  const target = event.target as Node | null;
  if (capturePopoverElement && target && capturePopoverElement.contains(target)) {
    return;
  }

  // Check if clicking on any sentence highlight overlay
  if (currentSentenceHighlight.length > 0 && target instanceof HTMLElement) {
    if (currentSentenceHighlight.some(el => el.contains(target))) {
      return;
    }
  }

  // Check if clicking on selection button or modal
  if (target instanceof HTMLElement) {
    if (target.classList.contains('fluent-selection-button') || 
        target.closest('.fluent-ai-modal') ||
        target.closest('.fluent-ai-topbar')) {
      return;
    }
  }

  clearSentenceCaptureArtifacts();
}

function isSelectionInsideExtension(selection: Selection): boolean {
  const anchor = selection.anchorNode;
  const focus = selection.focusNode;
  return isNodeInsideExtension(anchor) || isNodeInsideExtension(focus);
}

function isNodeInsideExtension(node: Node | null): boolean {
  if (!node) return false;
  let current: Node | null = node;
  while (current && current !== document.body) {
    if (
      current instanceof HTMLElement &&
      (current.classList.contains('fluent-popover') ||
        current.classList.contains('fluent-popover-container') ||
        current.classList.contains('fluent-capture-popover') ||
        current.classList.contains('fluent-selection-button') ||
        current.classList.contains('fluent-ai-modal') ||
        current.classList.contains('fluent-ai-topbar'))
    ) {
      return true;
    }
    current = current.parentNode;
  }
  return false;
}

interface SentenceExtraction {
  sentence: string;
  range: Range;
  root: HTMLElement;
}

function extractSentenceFromRange(range: Range): SentenceExtraction | null {
  if (range.collapsed) {
    return null;
  }

  const root = findBlockAncestor(range.commonAncestorContainer);
  if (!root) {
    return null;
  }

  const fullText = root.textContent ?? '';
  if (!fullText.trim()) {
    return null;
  }

  const startOffset = getTextOffsetWithin(root, range.startContainer, range.startOffset);
  const endOffset = getTextOffsetWithin(root, range.endContainer, range.endOffset);
  if (startOffset === null || endOffset === null) {
    return null;
  }

  const sentenceBoundaries = calculateSentenceBoundaries(fullText, startOffset, endOffset);
  if (!sentenceBoundaries) {
    return null;
  }

  const { sentenceStart, sentenceEnd } = sentenceBoundaries;
  const sentence = fullText.slice(sentenceStart, sentenceEnd).trim();
  if (!sentence) {
    return null;
  }

  const sentenceRange = document.createRange();
  const didSetStart = setRangeBoundaryFromTextOffset(sentenceRange, root, sentenceStart, true);
  const didSetEnd = setRangeBoundaryFromTextOffset(sentenceRange, root, sentenceEnd, false);

  if (!didSetStart || !didSetEnd) {
    return null;
  }

  return {
    sentence,
    range: sentenceRange,
    root,
  };
}

function findBlockAncestor(node: Node | null): HTMLElement | null {
  let current: Node | null = node;
  while (current && current !== document.body) {
    if (current instanceof HTMLElement) {
      const display = window.getComputedStyle(current).display;
      if (display !== 'inline' && display !== 'inline-block' && display !== 'contents') {
        return current;
      }
    }
    current = current?.parentNode ?? null;
  }

  return document.body;
}

function getTextOffsetWithin(
  root: HTMLElement,
  node: Node,
  offset: number
): number | null {
  try {
    const range = document.createRange();
    range.setStart(root, 0);
    range.setEnd(node, offset);
    return range.toString().length;
  } catch (error) {
    return null;
  }
}

function calculateSentenceBoundaries(
  text: string,
  selectionStart: number,
  selectionEnd: number
): { sentenceStart: number; sentenceEnd: number } | null {
  if (selectionStart >= selectionEnd) {
    return null;
  }

  let sentenceStart = selectionStart;
  let searchedChars = 0;
  while (sentenceStart > 0 && searchedChars <= SENTENCE_CHAR_LIMIT) {
    const char = text.charAt(sentenceStart - 1);
    if (SENTENCE_BOUNDARY_REGEX.test(char)) {
      break;
    }
    sentenceStart -= 1;
    searchedChars += 1;
  }

  let sentenceEnd = selectionEnd;
  searchedChars = 0;
  while (sentenceEnd < text.length && searchedChars <= SENTENCE_CHAR_LIMIT) {
    const char = text.charAt(sentenceEnd);
    if (SENTENCE_BOUNDARY_REGEX.test(char)) {
      sentenceEnd += 1;
      break;
    }
    sentenceEnd += 1;
    searchedChars += 1;
  }

  if (sentenceEnd > text.length) {
    sentenceEnd = text.length;
  }

  return { sentenceStart, sentenceEnd };
}

function setRangeBoundaryFromTextOffset(
  range: Range,
  root: HTMLElement,
  offset: number,
  isStart: boolean
): boolean {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let remaining = offset;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const length = node.textContent?.length ?? 0;
    if (remaining <= length) {
      if (isStart) {
        range.setStart(node, remaining);
      } else {
        range.setEnd(node, remaining);
      }
      return true;
    }
    remaining -= length;
  }

  if (!isStart) {
    range.setEnd(root, root.childNodes.length);
    return true;
  }

  return false;
}

function highlightSentenceRange(range: Range): void {
  removeSentenceHighlight();

  if (range.collapsed) {
    console.log('[Fluent] Range is collapsed, cannot highlight');
    return;
  }

  // Use overlay divs instead of DOM manipulation to avoid corruption
  const rects = range.getClientRects();
  
  if (rects.length === 0) {
    console.warn('[Fluent] No rects found for range');
    return;
  }

  // Create overlay for each rect (handles multi-line selections)
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    
    // Skip tiny rects (often line breaks)
    if (rect.width < 2 || rect.height < 2) {
      continue;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'fluent-sentence-highlight-overlay';
    overlay.style.position = 'absolute';
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '2147483646';
    overlay.style.background = 'rgba(0, 0, 255, 0.12)';
    overlay.style.borderBottom = '2px solid rgba(0, 0, 255, 0.3)';
    
    document.body.appendChild(overlay);
    currentSentenceHighlight.push(overlay);
  }
  
  // Set up scroll listener to update positions
  const updatePositions = () => {
    if (currentSentenceHighlight.length > 0) {
      const newRects = range.getClientRects();
      for (let i = 0; i < Math.min(currentSentenceHighlight.length, newRects.length); i++) {
        const rect = newRects[i];
        const overlay = currentSentenceHighlight[i];
        overlay.style.left = `${rect.left + window.scrollX}px`;
        overlay.style.top = `${rect.top + window.scrollY}px`;
      }
    }
  };
  
  window.addEventListener('scroll', updatePositions, true);
  window.addEventListener('resize', updatePositions);
  
  console.log(`[Fluent] Created ${currentSentenceHighlight.length} highlight overlays`);
}

function showCapturePopover(range: Range, _root: HTMLElement, sentence: string, tagResult: { terms: string[]; context: string; framework?: string; secondaryContext?: string; confidence: number }): void {
  removeCapturePopover();

  console.log('[Fluent] Showing capture popover for sentence:', sentence.slice(0, 50) + '...');

  const popover = document.createElement('div');
  popover.className = 'fluent-capture-popover';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'fluent-capture-popover__close';
  closeButton.setAttribute('aria-label', 'Close capture popover');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => {
    clearSentenceCaptureArtifacts();
  });

  const sentencePreview = document.createElement('div');
  sentencePreview.className = 'fluent-capture-popover__text';
  sentencePreview.textContent = sentence.length > 180 ? `${sentence.slice(0, 177)}…` : sentence;

  // Tags section
  const tagsSection = document.createElement('div');
  tagsSection.className = 'fluent-capture-popover__tags';
  
  // Terms display (as chips)
  if (tagResult.terms.length > 0) {
    const termsContainer = document.createElement('div');
    termsContainer.className = 'fluent-capture-popover__field';
    const termsLabel = document.createElement('label');
    termsLabel.textContent = 'Terms:';
    termsContainer.appendChild(termsLabel);
    
    const termsChips = document.createElement('div');
    termsChips.className = 'fluent-capture-popover__chips';
    tagResult.terms.forEach(term => {
      const chip = document.createElement('span');
      chip.className = 'fluent-capture-popover__chip';
      chip.textContent = term;
      termsChips.appendChild(chip);
    });
    termsContainer.appendChild(termsChips);
    tagsSection.appendChild(termsContainer);
  }

  // Context field (editable)
  const contextField = document.createElement('div');
  contextField.className = 'fluent-capture-popover__field';
  const contextLabel = document.createElement('label');
  contextLabel.textContent = 'Context:';
  contextField.appendChild(contextLabel);
  const contextInput = document.createElement('input');
  contextInput.type = 'text';
  contextInput.value = tagResult.context;
  contextInput.className = 'fluent-capture-popover__input';
  contextField.appendChild(contextInput);
  tagsSection.appendChild(contextField);

  // Framework field (editable)
  if (tagResult.framework) {
    const frameworkField = document.createElement('div');
    frameworkField.className = 'fluent-capture-popover__field';
    const frameworkLabel = document.createElement('label');
    frameworkLabel.textContent = 'Framework:';
    frameworkField.appendChild(frameworkLabel);
    const frameworkInput = document.createElement('input');
    frameworkInput.type = 'text';
    frameworkInput.value = tagResult.framework;
    frameworkInput.className = 'fluent-capture-popover__input';
    frameworkField.appendChild(frameworkInput);
    tagsSection.appendChild(frameworkField);
  }

  // Secondary Context field (editable)
  if (tagResult.secondaryContext) {
    const secondaryField = document.createElement('div');
    secondaryField.className = 'fluent-capture-popover__field';
    const secondaryLabel = document.createElement('label');
    secondaryLabel.textContent = 'Secondary:';
    secondaryField.appendChild(secondaryLabel);
    const secondaryInput = document.createElement('input');
    secondaryInput.type = 'text';
    secondaryInput.value = tagResult.secondaryContext;
    secondaryInput.className = 'fluent-capture-popover__input';
    secondaryField.appendChild(secondaryInput);
    tagsSection.appendChild(secondaryField);
  }

  // Confidence indicator
  const confidenceField = document.createElement('div');
  confidenceField.className = 'fluent-capture-popover__field';
  const confidenceLabel = document.createElement('label');
  confidenceLabel.textContent = 'Confidence:';
  confidenceField.appendChild(confidenceLabel);
  const confidenceBar = document.createElement('div');
  confidenceBar.className = 'fluent-capture-popover__confidence';
  const confidenceFill = document.createElement('div');
  confidenceFill.className = 'fluent-capture-popover__confidence-fill';
  confidenceFill.style.width = `${tagResult.confidence}%`;
  // Color code: red < 40, yellow 40-70, green > 70
  if (tagResult.confidence < 40) {
    confidenceFill.style.background = '#ef4444';
  } else if (tagResult.confidence < 70) {
    confidenceFill.style.background = '#f59e0b';
  } else {
    confidenceFill.style.background = '#10b981';
  }
  const confidenceText = document.createElement('span');
  confidenceText.className = 'fluent-capture-popover__confidence-text';
  confidenceText.textContent = `${tagResult.confidence}%`;
  confidenceBar.appendChild(confidenceFill);
  confidenceField.appendChild(confidenceBar);
  confidenceField.appendChild(confidenceText);
  tagsSection.appendChild(confidenceField);

  // Actions section
  const actions = document.createElement('div');
  actions.className = 'fluent-capture-popover__actions';

  const confirmButton = document.createElement('button');
  confirmButton.type = 'button';
  confirmButton.className = 'fluent-capture-popover__button';
  confirmButton.textContent = 'Confirm & Save';

  if (!hasExtensionContext()) {
    confirmButton.disabled = true;
    confirmButton.textContent = 'Extension Reloaded - Refresh Page';
    confirmButton.style.background = '#ef4444';
  }

  confirmButton.addEventListener('click', async () => {
    if (!hasExtensionContext()) {
      console.warn('[Fluent] Cannot capture sentence - extension context invalidated. Please refresh the page.');
      return;
    }

    // Update button to show loading state
    confirmButton.disabled = true;
    confirmButton.textContent = 'Saving...';

    // Get edited values
    const editedTagResult = {
      terms: tagResult.terms,
      context: contextInput.value,
      framework: tagResult.framework,
      secondaryContext: tagResult.secondaryContext,
      confidence: tagResult.confidence
    };

    const result = await storeCapturedSentence(sentence, editedTagResult);
    
    if (result.success) {
      popover.classList.add('fluent-capture-popover--captured');
      confirmButton.textContent = 'Saved ✓';
      setTimeout(() => {
        clearSentenceCaptureArtifacts();
      }, 1000);
    } else {
      confirmButton.disabled = false;
      confirmButton.textContent = 'Retry';
      confirmButton.style.background = '#ef4444';
    }
  });

  actions.appendChild(confirmButton);
  popover.appendChild(closeButton);
  popover.appendChild(sentencePreview);
  popover.appendChild(tagsSection);
  popover.appendChild(actions);

  document.body.appendChild(popover);
  capturePopoverElement = popover;

  // Wait for next frame to ensure layout is complete before positioning
  requestAnimationFrame(() => {
    // Use highlight element for positioning if available (more reliable after DOM changes)
    if (currentSentenceHighlight.length > 0) {
      const firstOverlay = currentSentenceHighlight[0];
      const anchorRect = firstOverlay.getBoundingClientRect();
      positionPopover(capturePopoverElement!, anchorRect, { preferredSide: 'below', offset: 8 });
    } else {
      const anchorRect = range.getBoundingClientRect();
      positionPopover(capturePopoverElement!, anchorRect, { preferredSide: 'below', offset: 8 });
    }
  });
}

async function storeCapturedSentence(sentence: string, tagResult: { terms: string[]; context: string; framework?: string; secondaryContext?: string; confidence: number }): Promise<{ success: boolean; error?: string }> {
  try {
    if (!hasExtensionContext()) {
      console.warn('[Fluent] Extension context invalidated - cannot store sentence. Please refresh the page.');
      return { success: false, error: 'Extension context invalidated. Please refresh the page.' };
    }

    // Create sentence entry
    const entry: CapturedSentence = {
      id: uuidv4(),
      sentence,
      terms: tagResult.terms,
      context: tagResult.context,
      framework: tagResult.framework,
      secondaryContext: tagResult.secondaryContext,
      confidence: tagResult.confidence,
      timestamp: new Date().toISOString(),
    };

    console.log('[Fluent] Capturing Sentence with Tags:', {
      sentence: sentence.slice(0, 100) + (sentence.length > 100 ? '...' : ''),
      terms: tagResult.terms,
      context: tagResult.context,
      framework: tagResult.framework,
      secondaryContext: tagResult.secondaryContext,
      confidence: tagResult.confidence
    });

    // Import and use immediate sync
    const { syncSentenceImmediately } = await import('../../utils/syncService');
    const syncResult = await syncSentenceImmediately(entry);

    if (syncResult.success) {
      console.log('[Fluent] Sentence synced to database successfully');
      latestCapturedSentenceEntry = entry;
      showToastNotification('success', 'Sentence captured and synced!');
      return { success: true };
    } else {
      console.error('[Fluent] Failed to sync sentence:', syncResult.error);
      showToastNotification('error', syncResult.error || 'Failed to sync sentence');
      return { success: false, error: syncResult.error };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Fluent] Failed to capture sentence:', error);
    showToastNotification('error', 'Failed to capture sentence. Please try again.');
    return { success: false, error: errorMessage };
  }
}

function clearSentenceCaptureArtifacts(): void {
  removeCapturePopover();
  removeSentenceHighlight();
  lastSelectedSentence = null;
}

function removeCapturePopover(): void {
  if (capturePopoverElement) {
    capturePopoverElement.remove();
    capturePopoverElement = null;
  }
}

function removeSentenceHighlight(): void {
  if (currentSentenceHighlight.length === 0) {
    return;
  }

  // Remove all overlay elements
  currentSentenceHighlight.forEach(overlay => {
    if (overlay.parentElement) {
      overlay.remove();
    }
  });

  currentSentenceHighlight = [];
}

/**
 * Show toast notification
 */
function showToastNotification(type: 'success' | 'error', message: string): void {
  // Remove existing toast
  if (currentToast) {
    currentToast.remove();
    currentToast = null;
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `fluent-toast fluent-toast--${type}`;

  // Add icon
  const icon = document.createElement('div');
  icon.className = 'fluent-toast__icon';
  icon.textContent = type === 'success' ? '✓' : '✗';
  toast.appendChild(icon);

  // Add message
  const messageEl = document.createElement('div');
  messageEl.className = 'fluent-toast__message';
  messageEl.textContent = message;
  toast.appendChild(messageEl);

  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'fluent-toast__close';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Close notification');
  closeBtn.addEventListener('click', () => {
    toast.remove();
    currentToast = null;
  });
  toast.appendChild(closeBtn);

  // Add to page
  document.body.appendChild(toast);
  currentToast = toast;

  // Auto-remove after 4 seconds
  setTimeout(() => {
    if (currentToast === toast) {
      toast.remove();
      currentToast = null;
    }
  }, 4000);
}

/**
 * Clear all existing term highlights from the page
 */
function clearAllHighlights(): void {
  const highlights = document.querySelectorAll('.fluent-highlight');
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    if (parent) {
      // Replace highlight span with its text content
      const textNode = document.createTextNode(highlight.textContent || '');
      parent.replaceChild(textNode, highlight);
    }
  });
  console.log(`[Fluent] Cleared ${highlights.length} highlights`);
}

