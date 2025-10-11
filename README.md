# 🎙️ Voice-to-App (HackBarna)

**Goal:**  
Develop and iterate complete apps **using only voice or chat prompts**.  
You talk via **Telegram**, the system generates or edits code, runs it in a sandbox,
captures **screenshots and logs**, analyzes results, and replies back to you.
You can build while walking, running, or hiking — completely hands-free.

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
cd voice-to-app
bun install
bun run packages/telegram-gateway/index.ts
```

Then:
1. In **Hookdeck**, create a Source (Webhook) and Destination (`http://localhost:3001/telegram`).
2. Set your **Telegram webhook** to the Hookdeck URL:
   ```bash
   curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook"      --data-urlencode "url=https://hookdeck.com/e/your-endpoint"      --data "drop_pending_updates=true"
   ```
3. Send a voice or text message to your bot:
   > “Create a landing page with a big title ‘Hello Mountain’ and a dark-mode toggle.”

Within seconds you’ll receive:
- a **screenshot** of the generated app,
- a **short summary** of build results,
- (optional) **voice reply** synthesized from the summary.

---

## 🧩 Folder Structure

```
voice-to-app/
  packages/
    telegram-gateway/   # receives Telegram events, runs orchestrator
    planner/            # STT + natural-language to JSON task
    codegen/            # LLM-based code writer
    runner/             # builds, runs, screenshots
    analyzer/           # summarizes results
    notifier/           # sends replies to Telegram
  sandbox/              # generated temporary apps
  artifacts/            # screenshots, logs
  .env
```

---

## 🔒 Environment Variables

```env
OPENAI_API_KEY=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ADMIN_CHAT_ID=...
HOOKDECK_SECRET=...
```

---

## 💡 Vision

Voice-to-App is the **first step toward a hands-free development environment**.  
It merges speech, AI code generation, browser automation, and agentic feedback —  
letting you **build, debug, and ship software while walking in nature**.

---

## 🧱 License

MIT — open source for experimental and educational use.
