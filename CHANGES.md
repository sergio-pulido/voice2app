# 🎉 Voice2App - Changelog

## 🚀 Version 2.1 - AI Router & Multi-Tool Support (October 11, 2025)

### 🧠 **NEW: AI Router System**

Added intelligent intent detection and routing to support multiple types of requests:

#### **Intent Router** (`packages/router/`)
- **Fast keyword classification**: 93% accuracy in <1ms
- **LLM fallback**: For uncertain cases
- **4 Categories**: Q&A, App Builder, Image Gen, Video Gen
- **Extensible**: Easy to add new tools

**New Files**:
- `packages/router/intent-router.ts` - Intent detection
- `packages/router/types.ts` - Router interfaces
- `packages/router/index.ts` - Main router entry

#### **Adapter System** (`packages/router/adapters/`)
- **Q&A Adapter**: Answer questions (with placeholder for Linkup integration)
- **App Code Adapter**: Full Voice2App pipeline (production-ready)
- **Image Adapter**: Placeholder for HuggingFace integration
- **Video Adapter**: Placeholder for Veed.io integration

**New Files**:
- `packages/router/adapters/qa-adapter.ts`
- `packages/router/adapters/app-code-adapter.ts`
- `packages/router/adapters/image-adapter.ts`
- `packages/router/adapters/video-adapter.ts`
- `packages/router/adapters/index.ts`

#### **Enhanced Notifications**

**Customer Notifications** (Telegram):
- Now show which tool was used: `💻 App Builder`, `💬 Q&A`, etc.
- Tool-specific formatting
- Context-aware responses

**Admin Notifications** (WhatsApp):
- New field: `🎯 Tool: [Tool Name]`
- Shows routing confidence
- Intent detection status

**Updated Files**:
- `packages/telegram-gateway/orchestrator.ts` - Integrated router

### Features

**Supported Intents**:

1. **💬 Q&A** (Fully functional)
   - Keywords: "what is", "how to", "explain", "capital"
   - Example: "What is the capital of Spain?"
   - Returns: Direct answer with suggestions

2. **💻 App Builder** (Production-ready)
   - Keywords: "create app", "build page", "make component"
   - Example: "Create a counter app"
   - Returns: Full pipeline (Code → Build → Screenshot → Analysis)

3. **🎨 Image Generator** (Placeholder - Coming Soon)
   - Keywords: "create image", "generate logo", "draw"
   - Example: "Generate a logo for my startup"
   - Returns: Placeholder message with roadmap

4. **🎬 Video Generator** (Placeholder - Coming Soon)
   - Keywords: "create video", "make clip", "short video"
   - Example: "Create a short video about AI"
   - Returns: Placeholder message with roadmap

### Keyword Detection

**Multilingual Support**:
- English: create, build, make, generate, what, how, explain
- Spanish: crea, genera, haz, qué, cómo, explica, dime

**Priority Order**:
1. App/Code keywords (highest - core feature)
2. Image keywords
3. Video keywords
4. Q&A keywords (lowest - to avoid false positives)

### Documentation

**New Documentation**:
- `docs/AI_ROUTER.md` - Complete router guide
- Updated `README.md` - AI Router section added
- Updated folder structure to include `router/` package

### Testing

- ✅ 93% accuracy on test suite (13/14 cases)
- ✅ Fast classification handles most cases
- ✅ Multilingual support verified
- ✅ All adapters tested

---

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
- `docs/ADMIN_NOTIFICATIONS.md` - Admin guide

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

---

## 📊 Version 1.0 - Modular Architecture

Initial modular restructure with 7 packages and complete Voice2App pipeline.

See git history for full details.

---

**Latest Version**: 2.1  
**Last Updated**: October 11, 2025

