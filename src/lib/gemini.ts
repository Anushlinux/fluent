import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

// ============================================================================
// TYPES
// ============================================================================

export type ActionType =
  | 'deposit'
  | 'withdraw'
  | 'check_balance'
  | 'get_apy'
  | 'compare_protocols'
  | 'explain'
  | 'confirm_yes'
  | 'confirm_no'
  | 'modify_amount'
  | 'unknown'

export type ProtocolType = 'aave' | 'morpho' | 'both'
export type CurrencyType = 'usd' | 'usdc' | 'eth'
export type TimeframeType = 'daily' | 'monthly' | 'yearly'
export type SentimentType = 'positive' | 'neutral' | 'negative' | 'cautious'
export type RiskToleranceType = 'low' | 'medium' | 'high'

export interface IntentEntities {
  amount?: number
  protocol?: ProtocolType
  currency?: CurrencyType
  percentage?: number
  timeframe?: TimeframeType
}

export interface Intent {
  action: ActionType
  entities: IntentEntities
  confidence: number
  needsClarification: boolean
  clarificationQuestion?: string
  sentiment: SentimentType
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface UserContext {
  name?: string
  balance?: string
  aaveBalance?: string
  morphoBalance?: string
  totalEarnings?: string
  currentAPY?: string
  hasDeposited?: boolean
  riskTolerance?: RiskToleranceType
}

export interface ConfirmationOptions {
  action: 'deposit' | 'withdraw'
  amount: number
  protocol: string
  apy?: string
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  console.warn('⚠️ NEXT_PUBLIC_GEMINI_API_KEY not set - Gemini AI features will not work')
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  maxOutputTokens: 1024,
}

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function sanitizeInput(text: string): string {
  // Remove wallet addresses (0x followed by 40 hex chars)
  let sanitized = text.replace(/0x[a-fA-F0-9]{40}/g, '[ADDRESS]')
  
  // Remove transaction hashes (0x followed by 64 hex chars)
  sanitized = sanitized.replace(/0x[a-fA-F0-9]{64}/g, '[TXHASH]')
  
  // Remove email addresses
  sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]')
  
  return sanitized
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      if (i === maxRetries - 1) throw error
      
      const delay = baseDelay * Math.pow(2, i)
      console.log(`[Gemini] Retry ${i + 1}/${maxRetries} after ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max retries exceeded')
}

function parseJsonResponse(text: string): any {
  let cleanedText = text.trim()
  
  // First try: direct parse
  try {
    return JSON.parse(cleanedText)
  } catch (e) {
    // Continue to next attempts
  }
  
  // Second try: extract from markdown code blocks
  const codeBlockMatch = cleanedText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1])
    } catch (e) {
      // Continue
    }
  }
  
  // Third try: find any JSON object in the text
  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    let jsonStr = jsonMatch[0]
    // Clean up trailing commas
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1')
    try {
      return JSON.parse(jsonStr)
    } catch (e) {
      // Continue
    }
  }
  
  // Log for debugging (first 300 chars)
  console.log('[Gemini] Could not parse response:', cleanedText.substring(0, 300))
  throw new Error('Could not parse JSON response')
}

function extractActionFromText(text: string): ActionType {
  const lowerText = text.toLowerCase()
  
  if (lowerText.includes('deposit')) return 'deposit'
  if (lowerText.includes('withdraw')) return 'withdraw'
  if (lowerText.includes('balance')) return 'check_balance'
  if (lowerText.includes('apy') || lowerText.includes('interest')) return 'get_apy'
  if (lowerText.includes('compare') || lowerText.includes('better')) return 'compare_protocols'
  if (lowerText.includes('explain') || lowerText.includes('how') || lowerText.includes('what')) return 'explain'
  if (lowerText.includes('yes') || lowerText.includes('confirm')) return 'confirm_yes'
  if (lowerText.includes('no') || lowerText.includes('cancel')) return 'confirm_no'
  
  return 'unknown'
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

export async function parseIntent(
  message: string,
  conversationHistory: ConversationMessage[] = [],
  userContext?: UserContext
): Promise<Intent> {
  const startTime = Date.now()
  
  if (!genAI) {
    console.error('[Gemini] API key not configured')
    return {
      action: 'unknown',
      entities: {},
      confidence: 0,
      needsClarification: true,
      clarificationQuestion: 'Could you rephrase that?',
      sentiment: 'neutral',
    }
  }
  
  const sanitizedMessage = sanitizeInput(message)
  const sanitizedHistory = conversationHistory.map(msg => ({
    ...msg,
    content: sanitizeInput(msg.content),
  }))
  
  const systemPrompt = `You are an expert DeFi intent parser. Analyze the user's message and return a JSON object.

Extract structured intent from financial queries:
- Amounts: '$50', '100 dollars'
- Percentages: '25%', 'half', 'all'
- Confirmations: 'yes', 'sure', 'no', 'cancel'
- Comparisons: 'which is better?'
- Questions: 'how does it work?', 'is it safe?'

Consider conversation context for follow-ups.

Return a valid JSON object with this exact structure:
{
  "action": "deposit",
  "entities": {},
  "confidence": 0.9,
  "needsClarification": false,
  "sentiment": "positive"
}

Valid actions: deposit, withdraw, check_balance, get_apy, compare_protocols, explain, confirm_yes, confirm_no, modify_amount, unknown
Valid sentiments: positive, neutral, negative, cautious`

  const contextInfo = userContext
    ? `\n\nUser Context: ${JSON.stringify(userContext, null, 2)}`
    : ''
  
  const historyInfo = sanitizedHistory.length > 0
    ? `\n\nConversation History (last ${Math.min(5, sanitizedHistory.length)} messages):\n${sanitizedHistory.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}`
    : ''
  
  const prompt = `${systemPrompt}${contextInfo}${historyInfo}\n\nUser message: "${sanitizedMessage}"\n\nExtract intent as JSON:`
  
  try {
    const result = await retryWithBackoff(async () => {
      const model = genAI!.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig,
        safetySettings,
      })
      
      const result = await model.generateContent(prompt)
      const response = result.response
      return response.text()
    })
    
    const intent = parseJsonResponse(result) as Intent
    
    // Ensure required fields have defaults
    intent.action = intent.action || 'unknown'
    intent.entities = intent.entities || {}
    intent.confidence = intent.confidence !== undefined ? intent.confidence : 0.5
    intent.needsClarification = intent.needsClarification !== undefined ? intent.needsClarification : false
    intent.sentiment = intent.sentiment || 'neutral'
    
    const latency = Date.now() - startTime
    console.log('[Gemini] Intent:', intent.action, 'Confidence:', intent.confidence, 'Time:', latency + 'ms')
    
    return intent
    
  } catch (error: any) {
    console.error('[Gemini] Parse intent failed:', error.message)
    
    // Fallback: try to extract action with regex
    const fallbackAction = extractActionFromText(message)
    const fallbackIntent: Intent = {
      action: fallbackAction,
      entities: {},
      confidence: 0.3,
      needsClarification: true,
      clarificationQuestion: 'Could you please rephrase that? I want to make sure I understand correctly.',
      sentiment: 'neutral',
    }
    
    const latency = Date.now() - startTime
    console.log('[Gemini] Fallback intent:', fallbackIntent.action, 'Time:', latency + 'ms')
    
    return fallbackIntent
  }
}

export async function generateResponse(
  userMessage: string,
  intent: Intent,
  userContext: UserContext,
  conversationHistory: ConversationMessage[] = []
): Promise<string> {
  const startTime = Date.now()
  
  if (!genAI) {
    console.error('[Gemini] API key not configured')
    return "I'm having trouble connecting right now. Please try again in a moment."
  }
  
  const sanitizedMessage = sanitizeInput(userMessage)
  const sanitizedHistory = conversationHistory.map(msg => ({
    ...msg,
    content: sanitizeInput(msg.content),
  }))
  
  const systemPrompt = `You are a friendly, knowledgeable DeFi financial advisor. Your personality:
- Warm and encouraging, not salesy
- Explain complex concepts simply (8th grade reading level)
- Use analogies from traditional finance
- Always mention risks transparently
- Celebrate user milestones
- Use light emojis (💰 ✅ 📈) but don't overdo it

Response guidelines:
- Keep responses 2-4 sentences
- For deposit/withdraw: summarize action + expected outcome
- For questions: answer directly, then offer next step
- For confusion: rephrase, give examples
- Match user's language style (formal vs casual)
- Never use: 'smart contracts', 'gas fees', 'blockchain', 'web3'
- Instead say: 'secure protocol', 'no fees', 'earning platform'

If user seems cautious (sentiment='cautious'):
- Address concerns first
- Provide specific safety info
- Suggest starting small
- Mention instant withdrawals

If user is experienced (hasDeposited=true):
- Skip basics
- Provide advanced info (compound earnings, protocol comparison)
- Suggest optimizations

Dynamic context injection:
${userContext.balance ? `- User has $${userContext.balance} available` : ''}
${userContext.hasDeposited ? `- User has already deposited before` : '- First time user'}
${userContext.aaveBalance ? `- Currently has $${userContext.aaveBalance} in Aave` : ''}
${userContext.name ? `- User's name: ${userContext.name}` : ''}`

  const intentInfo = `\n\nParsed Intent: ${JSON.stringify(intent, null, 2)}`
  
  const historyInfo = sanitizedHistory.length > 0
    ? `\n\nConversation History:\n${sanitizedHistory.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}`
    : ''
  
  const prompt = `${systemPrompt}${intentInfo}${historyInfo}\n\nUser message: "${sanitizedMessage}"\n\nGenerate natural, helpful response:`
  
  try {
    const result = await retryWithBackoff(async () => {
      const model = genAI!.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig,
        safetySettings,
      })
      
      const result = await model.generateContent(prompt)
      const response = result.response
      return response.text()
    }, 3, 1000)
    
    const latency = Date.now() - startTime
    console.log('[Gemini] Response generated. Time:', latency + 'ms')
    
    return result.trim()
    
  } catch (error: any) {
    console.error('[Gemini] Generate response failed:', error.message)
    
    // Fallback responses based on intent
    const fallbackResponses: Record<ActionType, string> = {
      deposit: "I'd love to help you deposit! How much would you like to invest?",
      withdraw: "I can help you withdraw your funds. How much would you like to take out?",
      check_balance: "Let me check your balance for you.",
      get_apy: "The current APY on Aave is around 6.2% annually. Would you like to start earning?",
      compare_protocols: "Both Aave and Morpho are great options. Aave is more established with $15B+ in deposits. What matters most to you?",
      explain: "I'm here to help! DeFi lets you earn interest on your crypto, similar to a savings account but with higher rates.",
      confirm_yes: "Got it! Proceeding with your request.",
      confirm_no: "No problem! Let me know if you'd like to do something else.",
      modify_amount: "What amount would you prefer?",
      unknown: "I'm not quite sure what you'd like to do. Could you rephrase that?",
    }
    
    const latency = Date.now() - startTime
    console.log('[Gemini] Fallback response used. Time:', latency + 'ms')
    
    return fallbackResponses[intent.action] || fallbackResponses.unknown
  }
}

export function extractAmountFromContext(
  message: string,
  userBalance: string,
  percentageFromIntent?: number
): number {
  const balance = parseFloat(userBalance)
  
  if (isNaN(balance)) {
    return 0
  }
  
  // Check for percentage from intent
  if (percentageFromIntent !== undefined) {
    return balance * (percentageFromIntent / 100)
  }
  
  const lowerMessage = message.toLowerCase()
  
  // Check for keywords
  if (lowerMessage.includes('all') || lowerMessage.includes('everything') || lowerMessage.includes('entire')) {
    return balance
  }
  
  if (lowerMessage.includes('half')) {
    return balance * 0.5
  }
  
  // Extract percentage
  const percentMatch = lowerMessage.match(/(\d+)%/)
  if (percentMatch) {
    const percent = parseFloat(percentMatch[1])
    return balance * (percent / 100)
  }
  
  // Extract dollar amount
  const dollarMatch = lowerMessage.match(/\$?\s*(\d+(?:\.\d{2})?)/)
  if (dollarMatch) {
    return parseFloat(dollarMatch[1])
  }
  
  return 0
}

export function shouldAskForConfirmation(
  intent: Intent,
  amount: number,
  userContext: UserContext
): boolean {
  // First deposit: always confirm
  if (!userContext.hasDeposited && intent.action === 'deposit') {
    return true
  }
  
  // Large amounts: always confirm
  if (amount > 100) {
    return true
  }
  
  // Withdrawals: always confirm
  if (intent.action === 'withdraw') {
    return true
  }
  
  // More than 50% of balance
  if (userContext.balance) {
    const balance = parseFloat(userContext.balance)
    if (amount > balance * 0.5) {
      return true
    }
  }
  
  // Low confidence: ask for confirmation
  if (intent.confidence < 0.7) {
    return true
  }
  
  return false
}

export function generateConfirmationMessage(
  action: 'deposit' | 'withdraw',
  amount: number,
  protocol: string,
  apy?: string
): string {
  const actionText = action === 'deposit' ? 'Deposit' : 'Withdraw'
  const apyInfo = apy ? `\n• ${protocol}: ${apy}% APY` : ''
  const earningsInfo = apy ? `\n• Estimated earnings: $${(amount * parseFloat(apy) / 100).toFixed(2)}/year` : ''
  
  return `Let me confirm:
• Action: ${actionText}
• Amount: $${amount.toFixed(2)}${apyInfo}${earningsInfo}

Reply 'confirm' to proceed or 'cancel' to stop.`
}

// ============================================================================
// TESTING HELPER
// ============================================================================

export async function testIntent(message: string): Promise<{ intent: Intent; response: string }> {
  console.log('\n=== Testing Intent ===')
  console.log('Message:', message)
  
  const mockContext: UserContext = {
    name: 'Test User',
    balance: '500.00',
    aaveBalance: '200.00',
    hasDeposited: true,
    riskTolerance: 'medium',
  }
  
  const mockHistory: ConversationMessage[] = [
    { role: 'user', content: 'Hi there' },
    { role: 'assistant', content: 'Hello! How can I help you today?' },
  ]
  
  const intent = await parseIntent(message, mockHistory, mockContext)
  console.log('\nParsed Intent:', JSON.stringify(intent, null, 2))
  
  const response = await generateResponse(message, intent, mockContext, mockHistory)
  console.log('\nGenerated Response:', response)
  
  return { intent, response }
}

