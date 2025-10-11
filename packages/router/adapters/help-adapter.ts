/**
 * Help Adapter: Explains system capabilities and usage
 */

import { logger } from '../../shared'
import type { Adapter, AdapterInput, AdapterOutput } from '../types'

export class HelpAdapter implements Adapter {
  async run(input: AdapterInput): Promise<AdapterOutput> {
    logger.info('❓ Running Help adapter...')
    
    const startTime = Date.now()
    
    const helpText = this.getHelpText()
    
    const processingTime = Date.now() - startTime
    
    return {
      summaryText: helpText,
      ttsText: this.getTTSVersion(),
      metadata: {
        category: 'help',
        processingTime,
        status: 'success'
      }
    }
  }
  
  private getHelpText(): string {
    return `**🤖 Voice2App - Your AI Assistant**

I can help you with many tasks using just your voice or text!

**🎯 What I Can Do:**

**💬 Q&A (Question Answering)**
• Simple questions → Fast answers with Groq AI (2-3s)
  _Example: "What is the capital of France?"_
• Complex questions → Detailed answers with Linkup web search (5-8s)
  _Example: "Explain how quantum computing works"_

**🎨 Image Generation**
• Create AI-generated images with HuggingFace Stable Diffusion XL
• High quality 1024x1024 images
  _Example: "Generate an image of a sunset over mountains"_

**🎬 Video Generation**
• Coming soon with Veed.io integration
  _Example: "Create a video about AI"_

**💻 App Development**
• Full app generation from voice/text description
• Automatic building, testing, and iteration
• Get screenshots and AI analysis
  _Example: "Create a counter app with increment and decrement"_

**🌐 Translation**
• Translate text between 50+ languages
• Supports German, Spanish, French, Italian, Portuguese, and more
  _Example: "Translate 'Hello world' to Spanish"_

**🗣️ How to Use:**
• **Voice**: Just send a voice message in any language - I'll transcribe and respond with voice!
• **Text**: Send a text message and get instant text responses
• **Auto-Translation**: I automatically detect and translate non-English input

**💡 Pro Tips:**
• Be specific with your requests for better results
• For images, describe what you want in detail
• For apps, explain the features you need
• I work in multiple languages - speak naturally!

**Examples:**
• "What are the main hormones in the body?"
• "Generate an image of a robot in a forest"
• "Translate the next to Spanish: [your text]"
• "Build a todo list app with dark mode"
• "How does the European Union work?"

**Need more help?** Just ask me anything! 🚀`
  }
  
  private getTTSVersion(): string {
    return `I'm Voice2App, your AI assistant. I can answer questions with Groq AI or web search, generate images with Stable Diffusion, translate between languages, and even build complete apps from voice descriptions. I support simple Q&A, complex research, image generation, translation, and full app development with testing. Just speak naturally or type your request, and I'll handle the rest!`
  }
}

export const helpAdapter = new HelpAdapter()

