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
let currentPopover: { root: ReactDOM.Root; container: HTMLElement } | null = null;
let hoverTimeout: number | null = null;
let currentSentenceHighlight: HTMLElement | null = null;
let capturePopoverElement: HTMLElement | null = null;
let lastSelectedSentence: string | null = null;

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

const SENTENCE_BOUNDARY_REGEX = /[.!?]/;
const SENTENCE_CHAR_LIMIT = 100;

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

const storageGet = async <T = unknown>(key: string): Promise<T | undefined> => {
  const storage = getExtensionStorage();
  if (!storage?.local) {
    return undefined;
  }

  return new Promise<T | undefined>((resolve, reject) => {
    try {
      storage.local.get(key, (result) => {
        if (chrome.runtime?.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(result?.[key] as T | undefined);
      });
    } catch (error) {
      reject(error);
    }
  });
};

const storageSet = async (value: Record<string, unknown>): Promise<void> => {
  const storage = getExtensionStorage();
  if (!storage?.local) {
    throw new Error('Storage API unavailable');
  }

  return new Promise<void>((resolve, reject) => {
    try {
      storage.local.set(value, () => {
        if (chrome.runtime?.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
};

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
      }
    });

    // Initialize selection capture
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeSelectionCapture);
    } else {
      initializeSelectionCapture();
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
        await storeCapturedSentence(captureCandidate, tagResult);
      }
    : undefined;
  
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
      definition={definition}
      usage={usage}
      quiz={entry.quiz}
      position={{ x: event.clientX, y: event.clientY }}
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

function initializeSelectionCapture(): void {
  console.log('[Fluent] Initializing selection capture listeners');
  document.addEventListener('mouseup', handleSelectionInteraction);
  document.addEventListener('keyup', handleSelectionInteraction);
  document.addEventListener('mousedown', handlePointerDown, true);
  document.addEventListener('scroll', handleScroll, true);
}

function handleSelectionInteraction(): void {
  setTimeout(() => {
    if (!hasExtensionContext()) {
      console.warn('[Fluent] Extension context invalidated - ignoring selection');
      return;
    }

    const selection = window.getSelection();
    console.log('[Fluent] Selection interaction detected', {
      hasSelection: !!selection,
      isCollapsed: selection?.isCollapsed,
      text: selection?.toString().slice(0, 50)
    });

    if (!selection || selection.isCollapsed) {
      clearSentenceCaptureArtifacts();
      return;
    }

    if (isSelectionInsideExtension(selection)) {
      console.log('[Fluent] Selection is inside extension, ignoring');
      return;
    }

    const extraction = extractSentenceFromSelection(selection);
    if (!extraction) {
      console.log('[Fluent] Failed to extract sentence from selection');
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
  }, 0);
}

function handlePointerDown(event: MouseEvent): void {
  const target = event.target as Node | null;
  if (capturePopoverElement && target && capturePopoverElement.contains(target)) {
    return;
  }

  if (currentSentenceHighlight && target && currentSentenceHighlight.contains(target as Node)) {
    return;
  }

  clearSentenceCaptureArtifacts();
}

function handleScroll(): void {
  if (capturePopoverElement && currentSentenceHighlight) {
    // Reposition using the highlight element
    requestAnimationFrame(() => {
      if (currentSentenceHighlight) {
        const range = document.createRange();
        range.selectNodeContents(currentSentenceHighlight);
        positionCapturePopover(range);
      }
    });
  }
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
        current.classList.contains('fluent-capture-popover'))
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

function extractSentenceFromSelection(selection: Selection): SentenceExtraction | null {
  if (selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
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

  const highlightWrapper = document.createElement('span');
  highlightWrapper.className = 'fluent-sentence-highlight';

  try {
    // Try the simple approach first
    const clonedRange = range.cloneRange();
    clonedRange.surroundContents(highlightWrapper);
    currentSentenceHighlight = highlightWrapper;
    console.log('[Fluent] Successfully highlighted sentence with surroundContents');
  } catch (error) {
    // Fallback: Use extractContents and reinsert for complex ranges
    console.log('[Fluent] surroundContents failed, using fallback method');
    try {
      const contents = range.extractContents();
      highlightWrapper.appendChild(contents);
      range.insertNode(highlightWrapper);
      currentSentenceHighlight = highlightWrapper;
      console.log('[Fluent] Successfully highlighted sentence with fallback method');
    } catch (fallbackError) {
      console.error('[Fluent] Failed to highlight sentence:', fallbackError);
      removeSentenceHighlight();
    }
  }
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

    // Get edited values
    const editedTagResult = {
      terms: tagResult.terms,
      context: contextInput.value,
      framework: tagResult.framework,
      secondaryContext: tagResult.secondaryContext,
      confidence: tagResult.confidence
    };

    await storeCapturedSentence(sentence, editedTagResult);
    popover.classList.add('fluent-capture-popover--captured');
    confirmButton.disabled = true;
    confirmButton.textContent = 'Saved ✓';
    setTimeout(() => {
      clearSentenceCaptureArtifacts();
    }, 800);
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
    if (currentSentenceHighlight) {
      const highlightRange = document.createRange();
      highlightRange.selectNodeContents(currentSentenceHighlight);
      positionCapturePopover(highlightRange);
    } else {
      positionCapturePopover(range);
    }
  });
}

function positionCapturePopover(range?: Range): void {
  if (!capturePopoverElement) {
    return;
  }

  let referenceRange = range;
  if (!referenceRange && currentSentenceHighlight) {
    referenceRange = document.createRange();
    referenceRange.selectNodeContents(currentSentenceHighlight);
  }

  if (!referenceRange) {
    console.log('[Fluent] No reference range for positioning');
    return;
  }

  try {
    const rect = referenceRange.getBoundingClientRect();
    const popoverWidth = capturePopoverElement.offsetWidth || 320; // fallback to max-width
    const popoverHeight = capturePopoverElement.offsetHeight || 100;
    const viewportPadding = 12;

    // Calculate vertical position (prefer below, but go above if not enough space)
    let top = rect.bottom + window.scrollY + viewportPadding;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < popoverHeight + viewportPadding && spaceAbove > spaceBelow) {
      // Position above if more space there
      top = rect.top + window.scrollY - popoverHeight - viewportPadding;
    }

    // Calculate horizontal position (keep within viewport)
    let left = rect.left + window.scrollX;
    
    // Ensure popover doesn't overflow right edge
    const maxLeft = window.scrollX + window.innerWidth - popoverWidth - viewportPadding;
    if (left > maxLeft) {
      left = maxLeft;
    }
    
    // Ensure popover doesn't overflow left edge
    const minLeft = window.scrollX + viewportPadding;
    if (left < minLeft) {
      left = minLeft;
    }

    // Apply with smooth constraints
    capturePopoverElement.style.top = `${Math.max(top, window.scrollY + viewportPadding)}px`;
    capturePopoverElement.style.left = `${left}px`;

    // console.log('[Fluent] Positioned popover at', { top, left, rect, popoverWidth, popoverHeight });
  } catch (error) {
    console.error('[Fluent] Error positioning popover:', error);
  }
}

async function storeCapturedSentence(sentence: string, tagResult: { terms: string[]; context: string; framework?: string; secondaryContext?: string; confidence: number }): Promise<void> {
  try {
    if (!hasExtensionContext()) {
      console.warn('[Fluent] Extension context invalidated - cannot store sentence. Please refresh the page.');
      return;
    }

    const existingLog = await storageGet<CapturedSentence[]>('fluentSentenceLog');
    const log = Array.isArray(existingLog) ? [...existingLog] : [];

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

    log.push(entry);
    await storageSet({ fluentSentenceLog: log });

    console.log('[Fluent] Captured Sentence with Tags:', {
      sentence: sentence.slice(0, 100) + (sentence.length > 100 ? '...' : ''),
      terms: tagResult.terms,
      context: tagResult.context,
      framework: tagResult.framework,
      secondaryContext: tagResult.secondaryContext,
      confidence: tagResult.confidence
    });
    
    latestCapturedSentenceEntry = entry;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Extension context invalidated')) {
      console.warn('[Fluent] Extension context invalidated - cannot store sentence. Please refresh the page to restore functionality.');
      return;
    }

    console.error('[Fluent] Failed to store captured sentence:', error);
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
  if (!currentSentenceHighlight) {
    return;
  }

  const parent = currentSentenceHighlight.parentNode;
  if (!parent) {
    currentSentenceHighlight = null;
    return;
  }

  while (currentSentenceHighlight.firstChild) {
    parent.insertBefore(currentSentenceHighlight.firstChild, currentSentenceHighlight);
  }

  parent.removeChild(currentSentenceHighlight);
  currentSentenceHighlight = null;
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

