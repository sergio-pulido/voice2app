# 🎙️ Voice-to-App (HackBarna)

**Goal:**  
Develop and iterate complete apps **using only voice or chat prompts**.  
You talk via **Telegram**, the system generates or edits code, runs it in a sandbox,
captures **screenshots and logs**, analyzes results, and replies back to you.
You can build while walking, running, or hiking — completely hands-free.

## ✨ What's New

### Latest Updates (v2.3 - October 2025)

**🚀 Major Improvements:**

- 🧠 **Intelligent AI Router**: Groq LLM-powered intent classification with input validation - no keyword matching, always routes correctly!
- 🎨 **Image Generation**: HuggingFace Stable Diffusion XL integration for creating logos, illustrations, and images
- 🔍 **Smart Q&A System**: Groq automatically assesses complexity - simple questions get instant answers, complex ones use Linkup web search
- 📢 **Discord Admin Notifications**: Free, unlimited admin alerts with rich embeds (recommended over WhatsApp)
- 🎤 **Voice-to-Voice**: Send voice, get voice back! Full TTS/STT integration with ElevenLabs/OpenAI
- 🛡️ **Input Validation**: Safeguards check length, content quality before processing
- ⚙️ **Configurable Channels**: Enable/disable WhatsApp and Discord admin notifications independently
- 🎯 **Multi-Provider AI**: Support for Groq/OpenAI/Anthropic (LLMs), ElevenLabs/OpenAI (STT/TTS), HuggingFace (Image Gen)
- 🚀 **Makefile + Hookdeck CLI**: One command (`make dev`) to start server + dual tunnels
- 🛠️ **Enhanced Error Handling**: Detailed admin notifications with stack traces and performance metrics

### Why These Features Matter

**For Developers**:
- 🏃 Build apps completely hands-free while hiking/running
- 🎤 Get instant voice feedback without looking at your phone
- 📊 Monitor system health via Discord or WhatsApp
- 🎨 Generate images and logos on the fly
- 📁 Organized project structure (logs/, tests/, sandbox/, artifacts/)

**For Admins**:
- 📊 Track all customer activity in real-time with rich Discord embeds
- ⚠️ Get immediate error alerts with stack traces
- 📈 Understand usage patterns and performance metrics
- 💰 Free unlimited notifications with Discord (vs WhatsApp paid tiers)
- 🎯 See which AI tool was used for each request

**For Customers**:
- 💬 Natural voice interaction with voice responses
- ⚡ Fast, intelligent responses - simple Q&A in 2-3 seconds
- 🔍 Complex questions get comprehensive web-searched answers
- 🎨 Generate images with natural language prompts
- 💻 Build complete apps from voice descriptions
- 🤖 Smart AI router always picks the right tool

## 🚀 Quick Start

### First Time Setup (5 minutes)

1. **Prerequisites**: Hookdeck CLI, Bun, Playwright
2. **Configure**: Copy `env.template` to `.env` and add your keys
3. **Start**: Run `make dev`
4. **Test**: Send a message to your Telegram bot

### Daily Development

```bash
# Start everything (server + Hookdeck tunnels)
make dev

# View logs
make logs

# Stop everything
make clean
```

**Quick Configuration Check**:
```bash
# Verify your environment
bun run scripts/test-setup.ts
```

---

## 🧠 Overview

### Core Flow

1. **Input (Telegram)**
   - 🎤 **Voice messages**: Transcribed with ElevenLabs STT
   - 📝 **Text messages**: Direct processing
   - User sends via Telegram bot → Hookdeck tunnel → Local server

2. **Processing Pipeline**
   - **Step 1: Planner** - Transcribe (if voice) + Convert to structured task
   - **Step 2: Codegen** - Generate app files with LLM (Groq/OpenAI/Anthropic)
   - **Step 3: Runner** - Build, serve, screenshot with Playwright
   - **Step 4: Analyzer** - AI-powered analysis and suggestions
   - **Step 5: Notifier** - Deliver results to both channels

3. **Output (Dual Channel)**
   - **Telegram (Customer)**:
     - 🔊 Voice acknowledgment (if input was voice)
     - 🔊 Voice summary (truncated, ~30s)
     - 📝 Full text details
     - 📸 Screenshot
   - **WhatsApp (Admin)**:
     - 📊 Detailed metrics
     - 👤 User information
     - ⏱️  Processing time
     - ✅ Status and summary
     - 🔴 Error details (if any)

### Architecture Diagram

```
Customer (Telegram)                        Admin (WhatsApp)
       ↓                                          ↓
   [Hookdeck Tunnel]                      [Hookdeck Tunnel]
       ↓                                          ↓
   localhost:3020/telegram                localhost:3020/vonage
       ↓                                          ↓
   ┌─────────────────────────────────────────────────┐
   │              Orchestrator Pipeline              │
   ├─────────────────────────────────────────────────┤
   │ 1. STT (ElevenLabs/OpenAI)                      │
   │ 2. Planner (Groq LLM)                           │
   │ 3. Codegen (Groq/OpenAI/Anthropic)              │
   │ 4. Runner (Bun + Playwright)                    │
   │ 5. Analyzer (Groq LLM)                          │
   └─────────────────────────────────────────────────┘
       ↓                                          ↓
   Full Experience                         Admin Monitoring
   (Voice/Text/Screenshot)                 (Metrics/Errors/Status)
```

---

## 🎯 Key Features

### 🧠 AI Router - Multi-Tool Support

The system uses **Groq LLM** to intelligently classify and route requests with high accuracy:

**Smart Classification Process:**
1. **Input Validation**: Checks content quality (minimum length, text validation)
2. **Groq Classification**: LLM understands user intent (no keyword matching!)
3. **Intelligent Routing**: Always routes to the correct tool
4. **Complexity Assessment**: For Q&A, Groq decides if web search is needed

**Available Tools:**

**💬 Q&A** - Intelligent question answering with AI-powered web search:
- **Simple questions**: "What is the capital of Spain?" → Fast Groq answer (2-3 seconds)
- **Complex questions**: "Explain how quantum computing works" → Linkup search + Detailed answer (5-8 seconds)
- **Groq decides** when to use web search (not keyword-based!)
- **Linkup** provides web data for complex queries
- **Full detailed answers** (up to 1000 tokens) when using web search

**💻 App Builder** - Generate complete applications (core feature):
- "Create a counter app"
- "Build a landing page"
- "Make a todo list with React"

**🎨 Image Generator** - Create AI-generated images with HuggingFace:
- "Generate a logo for my startup" → Stable Diffusion XL creates it
- "Create an illustration of a mountain" → High-quality 1024x1024 image
- "Design an icon for my app" → AI-generated design
- **Free tier available** - Get API key from huggingface.co

**🎬 Video Generator** - Generate video clips (coming soon):
- "Create a short video about AI"
- "Make a promotional clip"
- "Generate an explainer video"

**How It Works**:
1. 🛡️ **Input Validation** - Safeguards check minimum length, content quality, word count
2. 🧠 **Groq LLM Classification** (~500ms) - Intelligently determines intent (qa/app_code/image_gen/video_gen)
3. 🎯 **Smart Routing** - Always routes to the correct tool (95%+ accuracy)
4. 🔍 **Complexity Assessment** (Q&A only) - Groq decides if web search is needed
5. 📝 **Adaptive Responses** - Simple answers in 2-3s, complex answers with web search in 5-8s
6. 🎨 **Tool Indicators** - Responses show which tool was used (**💬 Q&A**, **💻 App Builder**, etc.)

### 🎤 Voice-to-Voice Communication
- **Intelligent Response Matching**: 
  - Voice input → Voice acknowledgment + Voice summary + Full text
  - Text input → Text acknowledgment + Text response
- **ElevenLabs TTS Integration**: Natural-sounding voice responses
- **Smart Truncation**: Voice summaries limited to 500 chars (~30 seconds)
- **Dual Delivery**: Voice for quick listening, text for full details

### 📱 Dual Channel Architecture

#### **Telegram (Customer Interface)**
- Primary interaction channel
- Full-featured experience with voice/text/screenshots
- Instant acknowledgments
- Comprehensive results with AI analysis
- Screenshot previews of generated apps

#### **Admin Monitoring (Discord or WhatsApp)**

**💎 Discord (Recommended - Free!)**
- ✅ Unlimited notifications (no rate limits)
- ✅ Rich embeds with colors and formatting
- ✅ Team collaboration (multiple admins)
- ✅ Message history and search
- ✅ Zero cost
- Easy setup via webhook (5 minutes)

**WhatsApp (Optional)**
- Real-time notifications on mobile
- Personal WhatsApp messages
- ⚠️ Has rate limits (Vonage sandbox)
- ⚠️ Costs money after free tier
- Use only if you need mobile push notifications

**Admin notifications include**:
- User information (name, ID)
- Tool used (Q&A, App Builder, etc.)
- Processing time
- Status (success/partial/error)
- Files generated count
- Project type and intent
- Transcriptions (for voice)
- Error details with stack traces

### 🔌 Hookdeck CLI Integration
- **Dual Tunnels**: Separate tunnels for Telegram and WhatsApp
- **Localhost Development**: Test webhooks locally without deploying
- **Auto-Configuration**: `make dev` starts everything
- **Easy Management**: Simple Makefile commands

### 🤖 Multi-Provider AI Support

**Speech-to-Text (STT)**:
- ElevenLabs (scribe_v1) - Primary
- OpenAI Whisper - Alternative

**Text-to-Speech (TTS)**:
- ElevenLabs (eleven_monolingual_v1)

**Language Models**:
- Groq (llama-3.3-70b-versatile) - Default, fast, used for routing & Q&A
- OpenAI (gpt-4o-mini) - Alternative
- Anthropic (claude-3-5-sonnet) - Alternative

**Image Generation**:
- HuggingFace (stabilityai/stable-diffusion-xl-base-1.0) - 1024x1024 images

**Web Search**:
- Linkup SDK - AI-powered search for complex Q&A

### 📊 Complete Pipeline

```
1. Input Processing
   └─ Voice: ElevenLabs STT transcription
   └─ Text: Direct processing

2. AI Router (Intent Detection)
   └─ Input validation (length, content checks)
   └─ Groq LLM classification → Tool category
   └─ Routes to: Q&A, App Builder, Image Gen, or Video Gen

3a. Q&A Path (Intelligent Search)
   └─ Step 1: Groq assesses complexity
   └─ Simple → Direct answer (2-3 sentences)
   └─ Complex → Step 2: Linkup web search
   └─ Step 3: Groq + search results → Detailed answer (up to 1000 tokens)

3b. App Builder Path (Full Pipeline)
   └─ Task Planning (Groq LLM)
   └─ Code Generation (Groq/OpenAI/Anthropic)
   └─ Sandboxed Execution (Bun + Playwright)
   └─ AI Analysis (Groq LLM)
   └─ Screenshot capture

3c. Image Generation Path
   └─ HuggingFace Stable Diffusion XL
   └─ Generate 1024x1024 images
   └─ Save to artifacts/ directory
   └─ Return image with metadata

3d. Video Generation Path
   └─ Coming soon

4. Dual Delivery
   └─ Telegram: Full customer experience (voice/text + screenshots)
   └─ Discord/WhatsApp: Admin monitoring (metrics, tool used, status)
```

---

## ⚙️ Tech Stack

| Layer        | Tooling / Notes |
|---------------|----------------|
| **Gateway**       | Hono + Bun, dual webhook endpoints |
| **Tunneling**     | Hookdeck CLI (localhost development) |
| **AI Router**     | Groq LLM classification with input validation → 4 tools |
| **Web Search**    | Linkup SDK (AI-powered search triggered by Groq) |
| **Image Gen**     | HuggingFace Stable Diffusion XL (1024x1024 PNG) |
| **STT**           | ElevenLabs (scribe_v1) + OpenAI Whisper |
| **TTS**           | ElevenLabs (eleven_monolingual_v1) |
| **LLMs**          | Groq (llama-3.3-70b) for routing & Q&A + OpenAI + Anthropic |
| **Code Execution**| Sandboxed Bun processes |
| **Browser Testing**| Playwright (Chromium) |
| **Customer Channel**| Telegram Bot API |
| **Admin Channels**| Discord (webhooks) + WhatsApp (Vonage) |
| **Storage**       | Local `artifacts/` + `sandbox/` |
| **Orchestration** | AI routing + parallel tool execution |

---

## 🚀 Setup & Usage

### Prerequisites

1. **Install Hookdeck CLI**:
   ```bash
   npm install -g hookdeck
   hookdeck login
   ```

2. **Install Dependencies**:
```bash
bun install
bunx playwright install chromium
   ```

3. **Configure Environment**:
   ```bash
   cp env.template .env
   # Edit .env with your API keys:
   # 
   # Required:
   # - TELEGRAM_BOT_TOKEN (from @BotFather)
   # - GROQ_API_KEY (from console.groq.com - free!)
   # - ELEVENLABS_API_KEY (from elevenlabs.io)
   #
   # Recommended:
   # - DISCORD_WEBHOOK_URL (free, unlimited admin notifications!)
   # - LINKUP_API_KEY (from linkup.so - for smart Q&A with web search)
   #
   # Optional:
   # - VONAGE credentials (only if you want WhatsApp admin)
   ```

### Start the System

```bash
# Start server + both Hookdeck tunnels
make dev
```

This will:
1. Start the server on `http://localhost:3020`
2. Create Telegram tunnel: `https://hkdk.events/...` → `localhost:3020/telegram`
3. Create Vonage tunnel: `https://hkdk.events/...` → `localhost:3020/vonage`

### Configure Webhooks

1. **Telegram**: 
   - The server auto-configures the webhook on startup
   - Or manually run: `make setup-webhook`

2. **Vonage WhatsApp**:
   - Go to: https://dashboard.nexmo.com/messages/sandbox
   - Set **Inbound URL**: `https://hkdk.events/...` (from logs/vonage-tunnel.log)
   - Set **Status URL**: Same URL as above

### Usage

Send a message to your Telegram bot:

**Voice Example**:
> 🎤 "Create a landing page with a hero section and contact form"

**Text Example**:
> 📝 "Build a counter app with increment and decrement buttons"

**You'll receive**:
- Voice/text acknowledgment
- Voice summary (~30s) + Full text details
- Screenshot of the generated app
- AI analysis and suggestions

**Admins receive on WhatsApp**:
- User info, processing time, status
- Transcription (if voice)
- Detailed metrics and errors

📖 **See [QUICKSTART.md](./QUICKSTART.md) and [ADMIN_NOTIFICATIONS.md](./ADMIN_NOTIFICATIONS.md) for more details!**

---

## 🧩 Folder Structure

```
voice2app/
  packages/
    telegram-gateway/        # Telegram & orchestration
      ├── index.ts          # Hono app (Telegram + Vonage webhooks)
      ├── orchestrator.ts   # Main pipeline + admin notifications
      └── telegram-client.ts # Telegram API utilities
    
    router/                  # AI Router & Multi-Tool System
      ├── intent-router.ts  # Intent detection & classification
      ├── types.ts          # Router interfaces
      ├── index.ts          # Main router entry
      ├── adapters/
      │   ├── qa-adapter.ts       # Q&A with Linkup + LLM
      │   ├── app-code-adapter.ts # App building (wraps pipeline)
      │   ├── image-adapter.ts    # Image generation (placeholder)
      │   └── video-adapter.ts    # Video generation (placeholder)
      └── services/
          └── linkup-service.ts   # Web search integration
    
    planner/                 # STT + Task Planning
      ├── index.ts          # Main entry point
      ├── stt.ts            # Multi-provider STT
      ├── task-planner.ts   # Natural language → structured task
      └── providers/
          ├── elevenlabs-stt.ts  # ElevenLabs STT
          └── openai-stt.ts      # OpenAI Whisper
    
    codegen/                 # Code Generation
      ├── index.ts          # Main entry point
      ├── generator.ts      # Multi-provider LLM code gen
      ├── file-writer.ts    # Sandbox file management
      └── providers/
          ├── groq-llm.ts        # Groq LLM
          ├── openai-llm.ts      # OpenAI LLM
          └── anthropic-llm.ts   # Anthropic LLM
    
    runner/                  # Build + Run + Screenshot
      ├── index.ts          # Main entry point
      ├── builder.ts        # Bun install & build
      ├── server.ts         # Dev server (random ports)
      └── screenshot.ts     # Playwright capture
    
    analyzer/                # AI Analysis
      └── index.ts          # Result analysis & suggestions
    
    notifier/                # Multi-channel Notifications
      └── index.ts          # Telegram messages (text/voice/photos)
    
    shared/                  # Shared Utilities
      ├── types.ts          # TypeScript interfaces
      ├── config.ts         # Environment configuration
      ├── logger.ts         # Logging utilities
      ├── providers.ts      # Provider selection logic
      ├── whatsapp.ts       # WhatsApp sender (Vonage)
      ├── discord-admin.ts  # Discord admin notifications
      ├── tts.ts            # Text-to-Speech (ElevenLabs)
      └── index.ts          # Package exports
  
  sandbox/                   # Generated apps (temporary)
  artifacts/                 # Screenshots, logs (persistent)
  docs/                      # Documentation
    ├── AI_ROUTER.md         # AI Router guide
    ├── DISCORD_ADMIN.md     # Discord admin setup (recommended!)
    ├── ADMIN_NOTIFICATIONS.md # WhatsApp admin guide
    ├── PROVIDERS.md         # AI provider setup
    └── QUICKSTART.md        # Detailed setup guide
  
  logs/                      # Runtime logs
    ├── server.log           # Server logs
    ├── telegram-tunnel.log  # Telegram Hookdeck tunnel
    └── vonage-tunnel.log    # WhatsApp Hookdeck tunnel
  
  Makefile                   # Development commands
  server.ts                  # Main server entry point
  env.template               # Environment variable template
  .env                       # Your API credentials (gitignored)
  CHANGES.md                 # Version changelog
```

---

## 🔒 Environment Variables

### Required

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Primary LLM (choose one)
GROQ_API_KEY=your_groq_api_key              # Recommended (fast & free)
# OR
OPENAI_API_KEY=your_openai_api_key          # Alternative
# OR  
ANTHROPIC_API_KEY=your_anthropic_api_key    # Alternative

# Speech-to-Text (choose one)
ELEVENLABS_API_KEY=your_elevenlabs_api_key  # Recommended (scribe_v1)
# OR use OPENAI_API_KEY for Whisper

# Q&A Enhancement (optional but recommended)
LINKUP_API_KEY=your_linkup_api_key          # For web search - get from linkup.so

# Image Generation (optional)
HUGGINGFACE_API_KEY=your_huggingface_api_key  # For image generation - get from huggingface.co

# Admin Notifications (choose one or both)
ENABLE_DISCORD_ADMIN=true                    # Recommended (free, unlimited)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

ENABLE_WHATSAPP_ADMIN=false                  # Optional (has costs & limits)
VONAGE_API_KEY=your_vonage_api_key
VONAGE_API_SECRET=your_vonage_api_secret
VONAGE_WHATSAPP_TO=34622035636
```

### Optional

```env
# Webhook Security (disable for Hookdeck CLI)
# TELEGRAM_WEBHOOK_SECRET=mys3cr3t

# WhatsApp From Number (default: Vonage sandbox)
VONAGE_WHATSAPP_FROM=14157386102

# Provider Selection
STT_PROVIDER=elevenlabs                      # or 'openai'
LLM_PROVIDER=groq                           # or 'openai', 'anthropic'
```

### 💡 Recommended Configuration

For production, we recommend:
- ✅ **Discord for admin notifications** (free, unlimited, team collaboration)
- ⚠️ **WhatsApp disabled** (avoid rate limits and costs)

```env
ENABLE_DISCORD_ADMIN=true
ENABLE_WHATSAPP_ADMIN=false
```

### Provider Configuration

See [docs/PROVIDERS.md](./docs/PROVIDERS.md) for detailed provider setup and API key instructions.

---

## 🛠️ Development Commands

### Main Commands

```bash
# Start everything (server + both tunnels)
make dev

# Start server only
make server

# Start both Hookdeck tunnels
make tunnels

# View server logs
make logs

# Stop everything
make clean
```

### Tunnel Management

```bash
# Start Telegram tunnel only
make tunnel-telegram

# Start Vonage/WhatsApp tunnel only (if using WhatsApp)
make tunnel-vonage

# Stop all tunnels
make kill-tunnels

# Stop server only
make kill-server

# Stop everything (server + tunnels)
make kill-all
```

**Note**: If using Discord-only admin notifications, you only need the Telegram tunnel.

### What's Running?

When you run `make dev`, it starts:
1. **Server** on `http://localhost:3020`
   - `/telegram` - Telegram webhook endpoint
   - `/vonage` - Vonage WhatsApp webhook endpoint
   - `/health` - Health check endpoint

2. **Telegram Tunnel** - Hookdeck tunnel for Telegram webhooks
   - Forwards `https://hkdk.events/...` → `http://localhost:3020/telegram`

3. **Vonage Tunnel** - Hookdeck tunnel for WhatsApp webhooks
   - Forwards `https://hkdk.events/...` → `http://localhost:3020/vonage`

### Logs

All logs are saved to:
- `logs/server.log` - Server logs
- `logs/telegram-tunnel.log` - Telegram tunnel logs
- `logs/vonage-tunnel.log` - Vonage tunnel logs

Use `make logs` to tail the server logs in real-time.

---

## 📁 Project Structure

```
voice2app/
├── packages/           # Core system modules
│   ├── analyzer/       # AI-powered analysis
│   ├── codegen/        # Code generation (Groq/OpenAI/Anthropic)
│   ├── notifier/       # Dual-channel notifications (Telegram + Admin)
│   ├── planner/        # Task planning and STT
│   ├── router/         # AI Router - Intent detection and routing
│   │   ├── adapters/   # Tool adapters (Q&A, App, Image, Video)
│   │   └── services/   # Linkup web search integration
│   ├── runner/         # Sandboxed execution and screenshots
│   ├── shared/         # Shared utilities, config, logger
│   └── telegram-gateway/ # Telegram bot orchestrator
├── logs/              # All log files (server, tunnels)
│   ├── server.log
│   ├── telegram-tunnel.log
│   └── vonage-tunnel.log
├── tests/             # Test files (future)
├── sandbox/           # Generated app sandboxes (git-ignored)
├── artifacts/         # Screenshots and build outputs (git-ignored)
├── scripts/           # Setup and utility scripts
├── docs/              # Additional documentation
├── Makefile           # Development commands
├── server.ts          # Main server entry point
└── .env               # Environment configuration
```

**Directory Highlights**:
- **`packages/`**: Modular architecture - each package is independent
- **`logs/`**: Centralized log management (use `make logs` to view)
- **`tests/`**: Ready for unit and integration tests
- **`sandbox/`**: Each job gets its own isolated environment
- **`artifacts/`**: Screenshots and build artifacts for each job

---

## 🎯 Feature Highlights

### 🎤 **Voice-to-Voice Communication**

Send voice messages and receive voice responses! The system:
- Transcribes your voice with **ElevenLabs STT** (supports multiple languages)
- Processes your request through the AI pipeline
- Generates a **voice summary** using **ElevenLabs TTS**
- Also sends the **full text version** for detailed reference
- Includes **your transcription** in the response

**Example**:
> 🎤 You: "Create a counter app"  
> 🔊 Bot: "Task to create a counter app was successfully executed..." (voice)  
> 📝 Bot: [Full details with screenshot]

### 📢 **Admin Dashboard (Discord or WhatsApp)**

Real-time monitoring of all customer activity via your preferred channel:

**Discord (Recommended)**:
- Rich embeds with color-coded status (green=success, yellow=partial, red=error)
- Unlimited notifications (no rate limits)
- Team collaboration support
- Free forever
- See [docs/DISCORD_ADMIN.md](./docs/DISCORD_ADMIN.md) for setup

**WhatsApp (Optional)**:

**New Request Notification**:
```
🔔 NEW REQUEST
👤 User: Sergio (6181465305)
📱 Type: 🎤 Voice
💬 Input: "Create a counter app"
⏰ Started: 4:27:36 PM
🔄 Status: Processing...
```

**Completion Notification**:
```
✅ REQUEST COMPLETED
👤 User: Sergio (6181465305)
📋 Task: create a counter app
⏱️  Time: 12.3s
📊 Status: PARTIAL
📦 Files: 8 generated
🎯 Project: frontend
🔧 Intent: create
🎤 Transcription: "Create a counter app"

📝 Summary: The task to create a counter app...
💡 Suggestions: 2 provided
```

**Error Notification**:
```
❌ REQUEST FAILED
👤 User: Sergio (6181465305)
⏱️  Time: 5.2s
💬 Input: Build a complex dashboard

🔴 Error: Code generation failed...
📋 Stack: Error at orchestrate...
⏰ Failed at: 4:30:15 PM
```

### 🔄 **Smart Response Matching**

- **Voice Input** → Voice acknowledgment + Voice summary + Full text + Screenshot
- **Text Input** → Text acknowledgment + Text response + Screenshot
- Automatic detection of input type
- Optimized for each communication method

### 🤖 **Multi-Provider AI Support**

Flexibility to use different AI providers:

**Speech-to-Text**:
- ✅ ElevenLabs (scribe_v1) - Multilingual, high quality
- ✅ OpenAI Whisper - Alternative option

**Text-to-Speech**:
- ✅ ElevenLabs (eleven_monolingual_v1) - Natural voices

**Language Models**:
- ✅ Groq (llama-3.3-70b) - Default, very fast, free tier
- ✅ OpenAI (gpt-4o-mini) - High quality alternative
- ✅ Anthropic (claude-3-5-sonnet) - Advanced reasoning

**Web Search**:
- ✅ Linkup SDK - AI-powered search for Q&A
- Groq decides when to trigger search (intelligent, not keyword-based)
- Full detailed answers (1000 tokens) when search is used

Switch providers via environment variables - see [docs/PROVIDERS.md](./docs/PROVIDERS.md)

### 🔍 **Intelligent Q&A System**

The Q&A mode uses a **3-step intelligent process**:

**Step 1: Groq Assesses**
- Groq analyzes the question
- Decides if it's SIMPLE (can answer from knowledge) or COMPLEX (needs web data)

**Step 2: Conditional Search** (only if complex)
- If SIMPLE → Skip to answer
- If COMPLEX → Linkup searches the web for current, detailed information

**Step 3: Generate Answer**
- SIMPLE questions: Concise answer (2-3 sentences, ~300 tokens)
- COMPLEX questions: Comprehensive answer with web data (up to 1000 tokens)

**Examples**:

*Simple (Groq only - fast)*:
- Q: "What is the capital of Spain?"
- A: "🇪🇸 The capital of Spain is Madrid..." (2-3 seconds)

*Complex (Linkup + Groq - detailed)*:
- Q: "Explain how the European Union works"
- A: [Long, detailed explanation with web sources] (5-8 seconds)
- Shows: "🔍 Answer enhanced with web search"

**Why This is Smart**:
- 🧠 AI decides complexity (not dumb keywords)
- ⚡ Fast for simple questions
- 📚 Comprehensive for complex topics
- 💰 Cost-effective (only searches when beneficial)

### 🚀 **Hookdeck CLI Integration**

Simplified local development:
- **One command** to start everything: `make dev`
- **Automatic tunnels** for both Telegram and WhatsApp
- **No manual webhook configuration** needed
- **Live logs** for debugging

### 📊 **Complete Observability**

- Real-time logs with emoji indicators
- Processing time tracking
- User activity monitoring
- Error tracking with stack traces
- Status webhooks from Vonage (submitted/delivered/read)

---

## 📚 Examples

### Q&A Examples

**Simple Questions** (Groq only - fast):
> 📝 "What is the capital of Italy?"  
> Response: "🇮🇹 The capital of Italy is Rome..." (2-3 seconds)

> 📝 "What is photosynthesis?"  
> Response: Brief explanation (2-3 sentences)

**Complex Questions** (Linkup + Groq - detailed):
> 📝 "Explain how the European Union works"  
> Response: Long, comprehensive answer with web sources + "🔍 Answer enhanced with web search"

> 📝 "Tell me about Microsoft's revenue for 2024"  
> Response: Detailed financial information with current data

> 🎤 "Explain in detail how quantum computing works"  
> Response: Multi-paragraph explanation + voice summary

### App Building Examples

**Voice Message**:
> 🎤 "Create a hello world page with a big title"

**Complex App**:
> 🎤 "Build a todo list app with add, delete, and mark as complete functionality. Use React and Tailwind CSS."

**Iterative Development**:
> 🎤 "Add dark mode toggle to the previous app"

**Text Message**:
> 📝 "Create a counter with increment and decrement buttons"

**Specific Requirements**:
> 📝 "Build a landing page with:
> - Hero section with gradient background
> - Feature cards (3 columns)
> - Contact form
> - Mobile responsive design"

### Image Generation Examples

> 📝 "Generate a logo for a tech startup"  
> Response: "🎨 Image Generated! Your AI-generated image is ready!" + [Image attached]

> 🎤 "Create an illustration of a mountain at sunset"  
> Response: Beautiful AI-generated landscape + voice confirmation

> 📝 "Make a minimalist logo for a coffee shop, brown and cream colors"  
> Response: Professional logo design + [Image attached]

**Features**:
- High-quality 1024x1024 images
- Stable Diffusion XL model
- Saved to `artifacts/` directory
- 10-20 second generation time

### Video Examples (Coming Soon)

> 📝 "Create a short video about coding"  
> Response: "🎬 Video generation coming soon..."

### What You'll Receive

**On Telegram (Customer)**:
1. 🔊 Voice acknowledgment (1-2 seconds)
2. ⏳ Processing happens (10-30 seconds)
3. 🔊 Voice summary of results (~30 seconds)
4. 📝 Full text with all details
5. 📸 Screenshot of generated app
6. 💡 AI suggestions for next steps

**On WhatsApp (Admin)**:
1. 🔔 New request alert with user info
2. ✅ Completion notification with metrics
3. 📊 Processing time, files count, status
4. 🎤 Transcription (if voice input)
5. 📝 Summary preview
6. 🔴 Detailed errors (if any issues)

---

## 💡 Vision

Voice-to-App is the **first step toward a hands-free development environment**.  
It merges speech, AI code generation, browser automation, and agentic feedback —  
letting you **build, debug, and ship software while walking in nature**.

---

## 🔧 Troubleshooting

### Server Won't Start

```bash
# Kill all processes and restart
make clean
make dev
```

### Webhooks Not Working

1. **Check tunnels are running**:
   ```bash
   ps aux | grep hookdeck
   ```

2. **Verify Hookdeck URLs**:
   ```bash
   cat logs/telegram-tunnel.log | grep "https://hkdk.events"
   cat logs/vonage-tunnel.log | grep "https://hkdk.events"
   ```

3. **Update Vonage dashboard** with the new URL from `logs/vonage-tunnel.log`

### Voice Messages Not Transcribing

- Check ElevenLabs API key: `echo $ELEVENLABS_API_KEY`
- Verify model is `scribe_v1` in `packages/planner/providers/elevenlabs-stt.ts`
- Check server logs: `make logs`

### No Admin Notifications

**Discord**:
- Verify `DISCORD_WEBHOOK_URL` is set in `.env`
- Test webhook: `curl -X POST -H "Content-Type: application/json" -d '{"content":"Test"}' YOUR_WEBHOOK_URL`
- Check server logs: `make logs`
- Ensure `ENABLE_DISCORD_ADMIN=true` in `.env`

**WhatsApp**:
- Verify `VONAGE_WHATSAPP_TO` is set in `.env`
- Check WhatsApp number format: `34622035636` (no + or spaces)
- Ensure `ENABLE_WHATSAPP_ADMIN=true` in `.env`
- Look for rate limit errors in server logs

### Voice Responses Too Long

- Adjust `MAX_TTS_LENGTH` in `packages/notifier/index.ts` (currently 500 chars)
- Reduce to 200-300 for shorter voice messages

### Common Issues

**"Maximum call stack size exceeded"**: 
- Circular dependency issue (already fixed in latest version)

**"Invalid webhook secret"**:
- Comment out `TELEGRAM_WEBHOOK_SECRET` in `.env` when using Hookdeck CLI

**"Must provide file parameter"** (ElevenLabs):
- Fixed in latest version - using `scribe_v1` model

**Rate Limits (WhatsApp)**:
- Switch to Discord for unlimited notifications: `ENABLE_DISCORD_ADMIN=true`
- Disable WhatsApp to avoid rate limits: `ENABLE_WHATSAPP_ADMIN=false`
- See [docs/DISCORD_ADMIN.md](./docs/DISCORD_ADMIN.md)

---

## 📖 Additional Documentation

### Setup Guides
- **[QUICKSTART.md](./QUICKSTART.md)** - Detailed setup instructions
- **[docs/DISCORD_ADMIN.md](./docs/DISCORD_ADMIN.md)** - **⭐ Discord admin setup (recommended!)**
- **[docs/ADMIN_NOTIFICATIONS.md](./docs/ADMIN_NOTIFICATIONS.md)** - WhatsApp admin guide (optional)
- **[docs/PROVIDERS.md](./docs/PROVIDERS.md)** - AI provider configuration

### System Documentation
- **[docs/AI_ROUTER.md](./docs/AI_ROUTER.md)** - **⭐ AI Router and multi-tool system**
- **[docs/IMAGE_GENERATION.md](./docs/IMAGE_GENERATION.md)** - Image generation setup and usage
- **[docs/FEATURES_SUMMARY.md](./docs/FEATURES_SUMMARY.md)** - Complete feature overview
- **[CHANGES.md](./CHANGES.md)** - Changelog and version history

---

## 🧱 License

MIT — open source for experimental and educational use.
