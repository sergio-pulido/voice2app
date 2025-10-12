/**
 * Intent Router: Classifies user requests into categories
 */

import { logger } from '../shared'

export type IntentCategory = 'qa' | 'app_code' | 'app_interaction' | 'image_gen' | 'video_gen' | 'translate' | 'help' | 'friend'

export interface IntentResult {
  category: IntentCategory
  confidence: number
  reasoning?: string
}

interface RouterInput {
  text: string
  userId: number
  lang?: string
}

/**
 * Simple keyword-based classification fallback (ONLY used when Groq LLM fails)
 * This is a last resort - the LLM should handle 99% of cases
 */
async function llmClassify(text: string): Promise<IntentResult> {
  const lowerText = text.toLowerCase()
  
  // PRIORITY 0: Check for numbered menu choices first (1., 2., etc.)
  if (/^\s*\d+\./.test(lowerText)) {
    return {
      category: 'app_interaction',
      confidence: 0.9,
      reasoning: 'Numbered menu choice detected (fallback)'
    }
  }
  
  // PRIORITY 1: Check for commands first (generate/create/make/build)
  const hasCommandVerb = /\b(generate|create|make|build|draw|design|genera|crea|haz|dibuja)\b/i.test(lowerText)
  
  if (hasCommandVerb) {
    // Video generation
    if (/\b(video|clip|animation|animate|animación)\b/i.test(lowerText)) {
      return {
        category: 'video_gen',
        confidence: 0.8,
        reasoning: 'Video generation command detected (fallback)'
      }
    }
    
    // Image generation
    if (/\b(image|imagen|picture|photo|foto|logo|illustration|ilustración|drawing)\b/i.test(lowerText)) {
      return {
        category: 'image_gen',
        confidence: 0.8,
        reasoning: 'Image generation command detected (fallback)'
      }
    }
    
    // App/code generation
    if (/\b(app|page|website|site|component|código|página)\b/i.test(lowerText)) {
      return {
        category: 'app_code',
        confidence: 0.8,
        reasoning: 'App building command detected (fallback)'
      }
    }
  }
  
  // PRIORITY 2: Translation
  if (/\b(translate|traduce|tradueix|how do you say|cómo se dice)\b/i.test(lowerText)) {
    return {
      category: 'translate',
      confidence: 0.8,
      reasoning: 'Translation request detected (fallback)'
    }
  }
  
  // PRIORITY 3: Greetings/casual (only if NO command detected)
  if (/\b(hello|hi|hey|hola|good morning|buenos días|how are you|cómo estás)\b/i.test(lowerText)) {
    return {
      category: 'friend',
      confidence: 0.7,
      reasoning: 'Greeting detected (fallback)'
    }
  }
  
  // PRIORITY 4: Default to Q&A for questions
  return {
    category: 'qa',
    confidence: 0.6,
    reasoning: 'Default to Q&A (fallback)'
  }
}

/**
 * Validate and sanitize input
 */
function validateInput(text: string): { valid: boolean; reason?: string; cleaned: string } {
  // Remove extra whitespace
  const cleaned = text.trim().replace(/\s+/g, ' ')
  
  // Check minimum length (at least 2 words or 3 characters)
  if (cleaned.length < 3) {
    return { valid: false, reason: 'Input too short', cleaned }
  }
  
  // Check if it's just emojis or special characters
  if (!/[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]/.test(cleaned)) {
    return { valid: false, reason: 'No valid text content', cleaned }
  }
  
  // Check word count (at least 1 meaningful word)
  const words = cleaned.split(' ').filter(w => w.length > 0)
  if (words.length === 0) {
    return { valid: false, reason: 'No words found', cleaned }
  }
  
  return { valid: true, cleaned }
}

/**
 * Use Groq to intelligently classify the request
 */
async function groqClassify(text: string): Promise<IntentResult> {
  const apiKey = require('../shared/config').config.groqApiKey || require('../shared/config').config.openaiApiKey
  
  if (!apiKey) {
    logger.warn('No LLM API key for classification, using fallback')
    return llmClassify(text)
  }
  
  const isGroq = !!require('../shared/config').config.groqApiKey
  const url = isGroq 
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  
  const model = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini'
  
  // Retry logic for Groq (up to 2 attempts)
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `You are an expert intent classifier for an AI-first voice application. Analyze the user's request and classify it into ONE category.

🎤 IMPORTANT: Input may be TRANSCRIBED VOICE - handle natural speech patterns, filler words, and slight transcription errors.
🌍 MULTILINGUAL: Input can be in ANY language (English, Spanish, Catalan, French, etc.) - understand the intent regardless of language.

⚠️ CRITICAL PRIORITY ORDER:
1. COMMANDS (image_gen, video_gen, app_code, translate) - If user wants to CREATE/GENERATE/BUILD/MAKE something, this ALWAYS takes priority!
2. Help requests
3. Factual questions (qa)
4. Casual conversation (friend) - ONLY if purely social with NO action requested

📋 CATEGORIES:

**"image_gen"** - Creating/generating images, logos, illustrations, drawings
   🎯 Keywords: generate, create, make, draw, design + image/logo/picture/illustration
   ✅ "Generate a logo", "Create an image of a cat", "Draw a sunset", "Make me a picture of X"
   ✅ "genera una imagen", "crea un logo"

**"video_gen"** - Creating/generating videos, clips, animations
   🎯 Keywords: generate, create, make, build + video/clip/animation
   ✅ "Generate a video", "Create a clip", "Make a video about X", "Build an animation"
   ✅ "genera un video", "crea un video"

**"app_code"** - Building apps, websites, components, pages, code
   🎯 Keywords: create, build, make + app/website/page/component/code
   ✅ "Create a counter app", "Build a landing page", "Make a todo list", "Build a website"
   ✅ "crea una app", "haz una página"

**"app_interaction"** - Testing/using/interacting with an already generated app
   🎯 Keywords: test, use, play, click, add, subtract, calculate, interact, numbered choices (1., 2., etc.)
   ✅ "Add 2+5", "Play the game", "Test the calculator", "Click the button"
   ✅ "1. add 3+56", "2. play the game", "suma 2+5", "juega el juego", "prueba la calculadora"
   ✅ Any message starting with "1." or "2." after app generation is app_interaction

**"translate"** - Translation between languages
   🎯 Keywords: translate, how do you say, what is X in [language]
   ✅ "Translate 'Hello' to Spanish", "How do you say 'cat' in French?", "What is 'good morning' in German?"

**"help"** - Asking about bot capabilities, features, or how to use the system
   ✅ "What can you do?", "Help", "What are your features?", "How do I use this?"

**"qa"** - Factual questions, explanations, information requests (NO action requested)
   ✅ "What is photosynthesis?", "Explain quantum computing", "How does the EU work?"
   ❌ NOT for "How do I make X" → that's often app_code

**"friend"** - PURELY casual conversation, greetings, small talk, personal chat (NO commands or questions)
   ✅ "Hello!", "How are you?", "What's up?", "Good morning", "Thanks!", "You're cool", "I'm tired"
   ❌ NOT if they want something created/generated/built/translated

🚨 DISAMBIGUATION RULES:
- "Generate/Create/Make/Build + [something]" → ALWAYS a command (image_gen/video_gen/app_code), NEVER friend
- Messages starting with "1." or "2." → ALWAYS app_interaction (user choosing from menu)
- "Hello" alone → friend
- "Hello, generate a video" → video_gen (command takes priority)
- "How are you?" alone → friend
- "Tell me a joke" → friend (casual entertainment, not a command)
- "What is X?" → qa (factual question)
- "How do I create X?" → probably app_code if about building something

Respond with ONLY ONE WORD: image_gen, video_gen, app_code, app_interaction, translate, help, qa, or friend

When in doubt between friend and a command: CHOOSE THE COMMAND.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3,
          max_tokens: 10
        })
      })
      
      if (!response.ok) {
        const is500 = response.status === 500
        if (is500 && attempt < 2) {
          logger.warn(`Groq classification failed (${response.status}), retrying...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }
        logger.warn('Groq classification failed, using fallback')
        return llmClassify(text)
      }
    
      const data: any = await response.json()
      const result = data.choices[0]?.message?.content?.trim().toLowerCase() || 'qa'
      
      // Validate the response
      const validCategories: IntentCategory[] = ['help', 'friend', 'qa', 'app_code', 'app_interaction', 'image_gen', 'video_gen', 'translate']
      const category = validCategories.includes(result as IntentCategory) 
        ? result as IntentCategory 
        : 'qa'
      
      return {
        category,
        confidence: 0.95,
        reasoning: 'Groq LLM classification'
      }
    } catch (error: any) {
      lastError = error
      const is500 = error?.message?.includes('500')
      if (is500 && attempt < 2) {
        logger.warn(`Groq classification error (attempt ${attempt}), retrying...`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        continue
      }
      logger.warn('Groq classification error, using fallback:', error)
      return llmClassify(text)
    }
  }
  
  // If we get here, all retries failed
  logger.warn('All Groq classification attempts failed, using fallback')
  return llmClassify(text)
}

/**
 * Main intent detection function
 */
export async function detectIntent(input: RouterInput): Promise<IntentResult> {
  const textToLog = typeof input.text === 'string' ? input.text.substring(0, 100) : String(input.text).substring(0, 100)
  logger.info(`🧠 Intent Router received: "${textToLog}${input.text.length > 100 ? '...' : ''}"`)
  
  // Step 1: Validate and sanitize input
  const textToValidate = typeof input.text === 'string' ? input.text : String(input.text)
  const validation = validateInput(textToValidate)
  
  if (!validation.valid) {
    logger.warn(`⚠️  Invalid input: ${validation.reason}`)
    // Return Q&A as safe default for invalid input
    return {
      category: 'qa',
      confidence: 0.5,
      reasoning: `Invalid input: ${validation.reason}`
    }
  }
  
  const cleanedText = validation.cleaned
  logger.info(`✅ Cleaned text for Groq: "${cleanedText.substring(0, 100)}${cleanedText.length > 100 ? '...' : ''}"`)
  
  // Step 2: Use Groq for intelligent classification
  logger.info('🤖 Sending to Groq LLM for intent classification...')
  const groqResult = await groqClassify(cleanedText)
  
  logger.success(`🎯 Groq result: ${groqResult.category} (${groqResult.confidence} confidence) - ${groqResult.reasoning}`)
  
  return groqResult
}

/**
 * Get human-readable category name
 */
export function getCategoryName(category: IntentCategory): string {
  const names: Record<IntentCategory, string> = {
    'help': '❓ Help',
    'friend': '🤖 Barna Hacker',
    'qa': '💬 Q&A',
    'app_code': '💻 App Builder',
    'app_interaction': '🎮 App Tester',
    'image_gen': '🎨 Image Generator',
    'video_gen': '🎬 Video Generator',
    'translate': '🌐 Translator'
  }
  return names[category]
}

/**
 * Get category emoji
 */
export function getCategoryEmoji(category: IntentCategory): string {
  const emojis: Record<IntentCategory, string> = {
    'help': '❓',
    'friend': '🤖',
    'qa': '💬',
    'app_code': '💻',
    'app_interaction': '🎮',
    'image_gen': '🎨',
    'video_gen': '🎬',
    'translate': '🌐'
  }
  return emojis[category]
}

