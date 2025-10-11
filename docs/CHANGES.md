# 🎉 Voice2App - Changelog

## 🚀 Version 2.0 - Voice-to-Voice + WhatsApp Admin (October 11, 2025)

### Major Features Added

#### 🎤 Voice-to-Voice Communication
- **ElevenLabs TTS Integration**: Voice responses for voice inputs
- **Smart Response Matching**: Voice→Voice, Text→Text
- **Dual Format Delivery**: Voice summary + Full text
- **Optimized Audio**: MP3 format, faster playback (1.1x), 500-char truncation

**New Files**:
- `packages/shared/tts.ts` - Text-to-Speech implementation
- Updated `packages/notifier/index.ts` - Voice message sending

#### 📱 WhatsApp Admin Monitoring
- **Real-Time Notifications**: Track all customer activity
- **Detailed Metrics**: User info, processing time, status, files generated
- **Error Alerts**: Immediate notifications with stack traces
- **Vonage Integration**: Messages API with status webhooks

**New Files**:
- `packages/shared/whatsapp.ts` - WhatsApp sender
- Updated `packages/telegram-gateway/orchestrator.ts` - Admin notifications
- Updated `packages/telegram-gateway/index.ts` - Vonage webhook endpoint
- `ADMIN_NOTIFICATIONS.md` - Admin guide

#### 🔧 Hookdeck CLI Integration
- **Makefile**: Development commands for server + tunnels
- **Dual Tunnels**: Separate tunnels for Telegram and WhatsApp
- **One-Command Setup**: `make dev` starts everything
- **Easy Management**: `make clean`, `make logs`, etc.

**New Files**:
- `Makefile` - All development commands
- `telegram-tunnel.log`, `vonage-tunnel.log`, `server.log` - Log files

#### 🤖 Enhanced Provider Support
- **Multi-Provider STT**: ElevenLabs (scribe_v1) + OpenAI Whisper
- **Multi-Provider LLM**: Groq + OpenAI + Anthropic
- **Provider Selection**: Environment-based configuration

**Updated Files**:
- `packages/planner/providers/elevenlabs-stt.ts` - Fixed model ID
- `packages/shared/config.ts` - Added Vonage config
- `packages/shared/providers.ts` - Provider selection logic

### Bug Fixes

- ✅ Fixed "Maximum call stack size exceeded" error (circular dependency)
- ✅ Fixed ElevenLabs model ID (eleven_multilingual_v2 → scribe_v1)
- ✅ Fixed ElevenLabs parameter name (audio → file)
- ✅ Fixed Telegram webhook secret validation for Hookdeck CLI
- ✅ Fixed markdown parsing errors in Telegram messages
- ✅ Fixed file content type validation in codegen
- ✅ Fixed JSON parsing in task planner (removed markdown code blocks)

### Configuration Changes

**New Environment Variables**:
```env
# WhatsApp Admin
VONAGE_API_KEY=...
VONAGE_API_SECRET=...
VONAGE_WHATSAPP_TO=...
VONAGE_WHATSAPP_FROM=14157386102  # Default sandbox

# Speech-to-Text
ELEVENLABS_API_KEY=...
STT_PROVIDER=elevenlabs  # or 'openai'

# Disable for Hookdeck CLI
# TELEGRAM_WEBHOOK_SECRET=...
```

**Renamed Variables**:
- `HOOKDECK_URL` → `HOOKDECK_TELEGRAM_URL` (no longer used with CLI)
- Added `HOOKDECK_VONAGE_URL` (no longer used with CLI)

### Documentation

**New Documentation**:
- `ADMIN_NOTIFICATIONS.md` - WhatsApp admin notification guide
- `FEATURES_SUMMARY.md` - Complete feature overview
- Updated `README.md` - Comprehensive feature documentation
- Updated `setup-env.sh` - Environment setup script

---

## 📊 Version 1.0 - Modular Architecture (Previous)

### ✨ What Was Done

Complete restructure from monolithic to modular architecture.

### 📦 New Package Structure

Created **6 modular packages** + 1 shared utilities package:

#### 1. **`packages/shared/`** - Common utilities
   - `types.ts` - TypeScript interfaces (Task, Results, etc.)
   - `config.ts` - Environment configuration & validation
   - `logger.ts` - Consistent logging with emojis
   - `index.ts` - Exports

#### 2. **`packages/telegram-gateway/`** - Entry point
   - `index.ts` - Hono app with `/telegram` webhook endpoint
   - `orchestrator.ts` - Main pipeline coordinator
   - `telegram-client.ts` - Telegram API utilities
   - Handles incoming webhooks from Hookdeck

#### 3. **`packages/planner/`** - Speech & Task Planning
   - `index.ts` - Main entry point
   - `stt.ts` - OpenAI Whisper speech-to-text transcription
   - `task-planner.ts` - Natural language → structured JSON task
   - Converts voice/text to actionable tasks

#### 4. **`packages/codegen/`** - Code Generation
   - `index.ts` - Main entry point
   - `generator.ts` - GPT-4o-mini powered code generation
   - `file-writer.ts` - Writes generated files to sandbox
   - Creates complete applications from tasks

#### 5. **`packages/runner/`** - Build & Execute
   - `index.ts` - Main entry point
   - `builder.ts` - Runs `bun install` and `bun run build`
   - `server.ts` - Starts dev server for generated apps
   - `screenshot.ts` - Playwright-based screenshot capture
   - Builds, serves, and captures screenshots

#### 6. **`packages/analyzer/`** - Results Analysis
   - `index.ts` - GPT-powered analysis of results
   - Generates summaries and suggestions
   - Checks task completion

#### 7. **`packages/notifier/`** - Telegram Replies
   - `index.ts` - Sends messages and photos back to Telegram
   - Formats results with Markdown
   - Handles screenshots as attachments

---

## 🔄 Architecture Flow

```
Telegram Message
  ↓
telegram-gateway (webhook receiver)
  ↓
orchestrator (coordinates pipeline)
  ↓
planner (STT → Task)
  ↓
codegen (Task → Code Files)
  ↓
runner (Files → Running App + Screenshot)
  ↓
analyzer (Results → Summary + Suggestions)
  ↓
notifier (Send to Telegram)
```

---

## 📝 New Files Created

### Core Files
- ✅ `server.ts` - Updated main entry point
- ✅ `index.ts` - Re-exports for backward compatibility
- ✅ `QUICKSTART.md` - Comprehensive setup guide
- ✅ `packages/README.md` - Package architecture documentation
- ✅ `CHANGES.md` - This file!

### Configuration
- ✅ `.env.example` - Environment variable template
- ✅ Updated `package.json` with Playwright dependency
- ✅ Updated `.gitignore` for sandbox/artifacts

### Testing
- ✅ `scripts/test-setup.ts` - Setup verification script

### Directories
- ✅ `sandbox/` - For generated apps (with .gitkeep)
- ✅ `artifacts/` - For screenshots (with .gitkeep)

---

## 🎯 Key Features

### 1. **Modularity**
Each package has a single responsibility and can be:
- Developed independently
- Tested in isolation
- Replaced with alternative implementations
- Scaled separately

### 2. **Type Safety**
- Strong TypeScript types throughout
- Shared types in `packages/shared/types.ts`
- Proper interfaces for all data structures

### 3. **Error Handling**
- Graceful fallbacks at each pipeline stage
- Detailed error logging with job IDs
- User-friendly error messages

### 4. **Logging**
- Consistent emoji-prefixed logs
- Job-specific logging (`[job_xxx]`)
- Debug mode support

### 5. **Scalability**
- Easy to add new packages
- Simple to extend functionality
- Clear separation of concerns
- Queue system ready (future)

---

## 🚀 How to Use

### 1. Setup (First Time)
```bash
# Install dependencies
bun install

# Install Playwright browsers
bunx playwright install chromium

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Test setup
bun run test-setup
```

### 2. Run the Server
```bash
bun run dev
```

### 3. Test with Telegram
Send a voice or text message to your bot:
- 🎤 "Create a landing page with a hero title"
- 📝 "Build a todo app with React"
- 🎤 "Make a portfolio site"

### 4. Check Results
- View screenshots in `artifacts/<jobId>.png`
- Check generated code in `sandbox/<jobId>/`
- See logs in terminal

---

## 📚 Documentation

- **[README.md](./README.md)** - Project overview & architecture
- **[QUICKSTART.md](./QUICKSTART.md)** - Detailed setup instructions
- **[packages/README.md](./packages/README.md)** - Package details

---

## 🔧 Available Scripts

```bash
bun run dev          # Start with watch mode
bun run start        # Start production server
bun run test-setup   # Verify setup
bun run test-webhook # Test webhook (if exists)
```

---

## 🎨 Code Quality

✅ **DRY** - No code duplication, shared utilities  
✅ **SOLID** - Single responsibility per package  
✅ **KISS** - Simple, clear implementations  
✅ **Typed** - Full TypeScript coverage  
✅ **Modular** - Clean package boundaries  
✅ **Documented** - Comprehensive docs & comments  

---

## 🔜 Next Steps

### Immediate
1. Set up your `.env` file with API keys
2. Run `bun run test-setup` to verify
3. Start the server with `bun run dev`
4. Test with a Telegram message

### Future Enhancements
- Add queue system (Bull, Bee-Queue)
- Implement TTS for voice replies
- Add MinIO/S3 for artifact storage
- Create admin dashboard
- Add user authentication
- Implement rate limiting
- Add metrics & monitoring
- Support multiple projects per user

---

## 📊 Project Stats

- **Total Packages**: 7
- **TypeScript Files**: 19
- **Lines of Code**: ~1,500+
- **Dependencies**: Hono, Playwright, OpenAI APIs
- **Architecture**: Modular, Event-driven

---

## 🎉 Summary

The project has been transformed from a **Lovable-dependent monolith** to a **fully self-contained, scalable system** that:

✅ Generates code using GPT-4o-mini  
✅ Transcribes voice with Whisper  
✅ Builds and serves apps automatically  
✅ Captures screenshots with Playwright  
✅ Analyzes results with AI  
✅ Sends replies to Telegram  

All without external dependencies on Lovable or other third-party code generation services!

---

**Ready to build apps with your voice? Start with:**
```bash
bun run dev
```

Then send a message to your Telegram bot! 🚀

