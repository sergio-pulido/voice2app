# 🎙️ Voice-to-App (HackBarna)

**Goal:**  
Develop and iterate complete apps **using only voice or chat prompts**.  
You talk via **Telegram**, the system generates or edits code, runs it in a sandbox,
captures **screenshots and logs**, analyzes results, and replies back to you.
You can build while walking, running, or hiking — completely hands-free.

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
1. **Telegram voice/text → Hookdeck → Gateway**
   - Telegram sends your message.
   - Hookdeck forwards it to your local or cloud gateway.

2. **Speech-to-Text (STT)**
   - Voice notes are transcribed with Whisper or another STT API.

3. **Planner**
   - Converts natural-language instructions into structured JSON tasks:
     ```json
     {
       "project": "mvp",
       "intent": "frontend",
       "context": "create landing with hero title",
       "checks": ["h1", "button"],
       "artifact": {"screenshot": true, "logs": true}
     }
     ```

4. **Codegen**
   - Generates or edits files in a sandboxed folder (`sandbox/<jobId>`).

5. **Runner**
   - Builds and serves the generated app.
   - Uses Playwright to visit it, capture a **screenshot** and **console logs**.

6. **Analyzer**
   - Summarizes what happened and lists next-step suggestions.

7. **Notifier**
   - Sends a short **text (and optional TTS voice)** reply to Telegram,
     including the **screenshot** and **summary**.

---

## 🏗️ Architecture

```
Telegram → Hookdeck → Gateway (Hono)
            ↓
        STT (Whisper)
            ↓
         Planner
            ↓
        Codegen → Runner → Playwright
            ↓
         Analyzer
            ↓
         Notifier → Telegram reply
```

Artifacts and logs are stored under `artifacts/`  
(you can later move them to MinIO or S3).

---

## ⚙️ Tech Stack

| Layer        | Tooling / Notes |
|---------------|----------------|
| Gateway       | **Hono + Bun/Node** |
| STT / LLMs    | **OpenAI (Whisper + GPT-4o-mini)** |
| Code execution | Local sandbox or container |
| Browser runs  | **Playwright (Chromium)** |
| Delivery      | **Telegram Bot API via Hookdeck** |
| Storage       | Local `artifacts/` → MinIO later |
| Orchestration | Simple sequential pipeline (extendable to queue system) |

---

## 🚀 Quick Start

```bash
git clone <repo>
cd voice2app
bun install
bunx playwright install chromium
cp .env.example .env
# Edit .env with your credentials
bun run dev
```

Then:
1. In **Hookdeck**, create a Source (Webhook) and Destination (`http://localhost:3020/telegram`)
2. Add your `HOOKDECK_TELEGRAM_URL` to `.env` - the server will auto-configure the webhook
3. Send a voice or text message to your bot:
   > 🎤 "Create a landing page with a big title 'Hello Mountain' and a dark-mode toggle."

Within seconds you'll receive:
- a **screenshot** of the generated app
- a **short summary** of build results
- **suggestions** for next steps

📖 **See [QUICKSTART.md](./QUICKSTART.md) for detailed setup instructions!**

---

## 🧩 Folder Structure

```
voice2app/
  packages/
    telegram-gateway/        # receives Telegram events, runs orchestrator
      ├── index.ts          # Hono app with webhook endpoint
      ├── orchestrator.ts   # main pipeline coordinator
      └── telegram-client.ts # Telegram API utilities
    planner/                 # STT + natural-language to JSON task
      ├── index.ts          # main entry point
      ├── stt.ts            # Whisper speech-to-text
      └── task-planner.ts   # natural language → task
    codegen/                 # LLM-based code writer
      ├── index.ts          # main entry point
      ├── generator.ts      # GPT code generation
      └── file-writer.ts    # writes files to sandbox
    runner/                  # builds, runs, screenshots
      ├── index.ts          # main entry point
      ├── builder.ts        # bun install & build
      ├── server.ts         # dev server
      └── screenshot.ts     # Playwright capture
    analyzer/                # summarizes results
      └── index.ts          # GPT-powered analysis
    notifier/                # sends replies to Telegram
      └── index.ts          # send messages & photos
    shared/                  # common utilities
      ├── types.ts          # TypeScript interfaces
      ├── config.ts         # environment config
      ├── logger.ts         # logging utilities
      └── index.ts          # exports
  sandbox/                   # generated temporary apps
  artifacts/                 # screenshots, logs
  server.ts                  # main entry point
  .env                       # your credentials
```

---

## 🔒 Environment Variables

```env
OPENAI_API_KEY=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ADMIN_CHAT_ID=...
HOOKDECK_SECRET=...
VONAGE_API_KEY=...
VONAGE_API_SECRET=...
VONAGE_WHATSAPP_TO=...
```

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

## 💡 Vision

Voice-to-App is the **first step toward a hands-free development environment**.  
It merges speech, AI code generation, browser automation, and agentic feedback —  
letting you **build, debug, and ship software while walking in nature**.

---

## 🧱 License

MIT — open source for experimental and educational use.
