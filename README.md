# 🎙️ Voice-to-App (HackBarna)

**Goal:**  
Develop and iterate complete apps **using only voice or chat prompts**.  
You talk via **Telegram**, the system generates or edits code, runs it in a sandbox,
captures **screenshots and logs**, analyzes results, and replies back to you.
You can build while walking, running, or hiking — completely hands-free.

## ✨ What's New

### Recent Updates

- 🎤 **Voice-to-Voice Responses**: Send voice, get voice back! Full TTS integration with ElevenLabs
- 📱 **WhatsApp Admin Monitoring**: Real-time notifications with detailed metrics, errors, and user activity
- 🔄 **Smart Response Matching**: Automatic voice/text detection with appropriate response format
- 📊 **Dual Channel Architecture**: Separate customer (Telegram) and admin (WhatsApp) interfaces
- 🎯 **Multi-Provider AI**: Support for ElevenLabs/OpenAI (STT/TTS) and Groq/OpenAI/Anthropic (LLMs)
- 🚀 **Makefile + Hookdeck CLI**: One command (`make dev`) to start server + dual tunnels
- 🛠️ **Enhanced Error Handling**: Detailed admin notifications with stack traces
- ⚡ **Performance Tracking**: Processing time metrics in every admin notification

### Why These Features Matter

**For Developers**:
- Build apps completely hands-free while hiking/running
- Get instant voice feedback without looking at your phone
- Monitor system health via WhatsApp

**For Admins**:
- Track all customer activity in real-time
- Get immediate error alerts
- Understand usage patterns and performance metrics

**For Customers**:
- Natural voice interaction
- Fast, intelligent responses
- Professional experience via Telegram

## 🚀 Quick Start

```bash
# Start everything (server + Hookdeck tunnels)
make dev

# View logs
make logs

# Stop everything
make clean
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

#### **WhatsApp (Admin Monitoring)**
- Real-time activity notifications
- Detailed metrics per request:
  - User information (name, ID)
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
- Groq (llama-3.3-70b-versatile) - Default, fast
- OpenAI (gpt-4o-mini) - Alternative
- Anthropic (claude-3-5-sonnet) - Alternative

### 📊 Complete Pipeline

```
1. Input Processing
   └─ Voice: ElevenLabs STT transcription
   └─ Text: Direct processing

2. Task Planning (Groq LLM)
   └─ Convert natural language to structured task
   └─ Define project type, intent, checks

3. Code Generation (Groq/OpenAI/Anthropic)
   └─ Generate complete app files
   └─ Support for React, Node.js, fullstack apps

4. Sandboxed Execution
   └─ Build with Bun
   └─ Run on random port
   └─ Screenshot with Playwright

5. AI Analysis (Groq LLM)
   └─ Evaluate results
   └─ Generate suggestions
   └─ Provide next steps

6. Dual Delivery
   └─ Telegram: Full customer experience
   └─ WhatsApp: Admin monitoring dashboard
```

---

## ⚙️ Tech Stack

| Layer        | Tooling / Notes |
|---------------|----------------|
| **Gateway**       | Hono + Bun, dual webhook endpoints |
| **Tunneling**     | Hookdeck CLI (localhost development) |
| **STT**           | ElevenLabs (scribe_v1) + OpenAI Whisper |
| **TTS**           | ElevenLabs (eleven_monolingual_v1) |
| **LLMs**          | Groq (llama-3.3-70b) + OpenAI + Anthropic |
| **Code Execution**| Sandboxed Bun processes |
| **Browser Testing**| Playwright (Chromium) |
| **Customer Channel**| Telegram Bot API |
| **Admin Channel** | WhatsApp (Vonage Messages API) |
| **Storage**       | Local `artifacts/` + `sandbox/` |
| **Orchestration** | Sequential pipeline with dual notifications |

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
cp .env.example .env
   # Edit .env with your API keys:
   # - TELEGRAM_BOT_TOKEN
   # - ELEVENLABS_API_KEY
   # - GROQ_API_KEY (or OPENAI_API_KEY)
   # - VONAGE_API_KEY, VONAGE_API_SECRET
   # - VONAGE_WHATSAPP_TO (your admin WhatsApp number)
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
   - Set **Inbound URL**: `https://hkdk.events/...` (from vonage-tunnel.log)
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
      ├── tts.ts            # Text-to-Speech (ElevenLabs)
      └── index.ts          # Package exports
  
  sandbox/                   # Generated apps (temporary)
  artifacts/                 # Screenshots, logs (persistent)
  docs/                      # Documentation
    ├── PROVIDERS.md         # AI provider setup guide
    ├── MULTI-PROVIDER-UPDATE.md
    └── ...
  
  Makefile                   # Development commands
  server.ts                  # Main server entry point
  .env                       # Your API credentials
  ADMIN_NOTIFICATIONS.md     # Admin WhatsApp guide
  QUICKSTART.md              # Detailed setup guide
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

# WhatsApp Admin Monitoring
VONAGE_API_KEY=your_vonage_api_key
VONAGE_API_SECRET=your_vonage_api_secret
VONAGE_WHATSAPP_TO=34622035636              # Your admin WhatsApp number
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

# Start Vonage/WhatsApp tunnel only
make tunnel-vonage

# Stop all tunnels
make kill-tunnels

# Stop server only
make kill-server

# Stop everything (server + tunnels)
make kill-all
```

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
- `server.log` - Server logs
- `telegram-tunnel.log` - Telegram tunnel logs
- `vonage-tunnel.log` - Vonage tunnel logs

Use `make logs` to tail the server logs in real-time.

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

### 📱 **WhatsApp Admin Dashboard**

Real-time monitoring of all customer activity via WhatsApp:

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

Switch providers via environment variables - see [docs/PROVIDERS.md](./docs/PROVIDERS.md)

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

### Voice Message Examples

**Simple App**:
> 🎤 "Create a hello world page with a big title"

**Complex App**:
> 🎤 "Build a todo list app with add, delete, and mark as complete functionality. Use React and Tailwind CSS."

**Iterative Development**:
> 🎤 "Add dark mode toggle to the previous app"

### Text Message Examples

**Quick Prototype**:
> 📝 "Create a counter with increment and decrement buttons"

**Specific Requirements**:
> 📝 "Build a landing page with:
> - Hero section with gradient background
> - Feature cards (3 columns)
> - Contact form
> - Mobile responsive design"

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
   cat telegram-tunnel.log | grep "https://hkdk.events"
   cat vonage-tunnel.log | grep "https://hkdk.events"
   ```

3. **Update Vonage dashboard** with the new URL from `vonage-tunnel.log`

### Voice Messages Not Transcribing

- Check ElevenLabs API key: `echo $ELEVENLABS_API_KEY`
- Verify model is `scribe_v1` in `packages/planner/providers/elevenlabs-stt.ts`
- Check server logs: `make logs`

### No WhatsApp Notifications

- Verify `VONAGE_WHATSAPP_TO` is set in `.env`
- Check WhatsApp number format: `34622035636` (no + or spaces)
- Look for errors in server logs

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

---

## 📖 Additional Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Detailed setup instructions
- **[ADMIN_NOTIFICATIONS.md](./ADMIN_NOTIFICATIONS.md)** - WhatsApp admin guide
- **[docs/PROVIDERS.md](./docs/PROVIDERS.md)** - AI provider configuration
- **[CHANGES.md](./CHANGES.md)** - Changelog and version history

---

## 🧱 License

MIT — open source for experimental and educational use.
