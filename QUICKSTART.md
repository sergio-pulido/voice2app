# 🚀 Quick Start Guide

Get Voice2App running in minutes!

## Prerequisites

- [Bun](https://bun.sh) installed (`curl -fsSL https://bun.sh/install | bash`)
- OpenAI API key
- Telegram Bot Token
- [Hookdeck](https://hookdeck.com) account (free tier works)

## Step 1: Clone and Install

```bash
git clone <your-repo-url>
cd voice2app
bun install
bunx playwright install chromium
```

## Step 2: Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
OPENAI_API_KEY=sk-your-openai-key
TELEGRAM_BOT_TOKEN=123456789:ABC-your-bot-token
HOOKDECK_URL=https://hkdk.events/your-endpoint
```

### Getting API Keys

**OpenAI API Key:**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy and paste into `.env`

**Telegram Bot Token:**
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow the instructions
3. Copy the bot token and paste into `.env`

**Hookdeck URL:**
1. Sign up at https://hookdeck.com (free)
2. Create a new Source → choose "Telegram Bot"
3. Create a Destination → set URL to `http://localhost:3020/telegram`
4. Copy the Hookdeck webhook URL and paste into `.env`

## Step 3: Start the Server

```bash
bun run dev
```

You should see:

```
✅ Voice2App Gateway started on http://localhost:3020
📡 Waiting for Telegram messages...
✅ Telegram webhook set successfully!
🔗 Hookdeck Dashboard: https://dashboard.hookdeck.com/
```

## Step 4: Test It!

1. Open Telegram and find your bot
2. Send a voice message or text like:
   - 🎤 "Create a landing page with a big title 'Hello World' and a dark blue background"
   - 📝 "Build a simple todo app with React"
   - 🎤 "Make a portfolio site with my name John Doe"

3. Wait 10-30 seconds...

4. You'll receive:
   - ✅ A text summary of what was built
   - 📸 A screenshot of the generated app
   - 💡 Suggestions for next steps

## 🎯 What Happens Behind the Scenes

```
Your voice → Whisper STT → GPT plans task → GPT generates code
  ↓
Code written to sandbox/<jobId>/
  ↓
App built and served → Playwright captures screenshot
  ↓
Results analyzed → Sent back to you on Telegram
```

## 📂 Project Structure

```
voice2app/
├── packages/
│   ├── telegram-gateway/    # Webhook receiver
│   ├── planner/             # STT + task planning
│   ├── codegen/             # Code generation
│   ├── runner/              # Build + serve + screenshot
│   ├── analyzer/            # Results analysis
│   ├── notifier/            # Telegram replies
│   └── shared/              # Common types & utils
├── sandbox/                 # Generated apps
├── artifacts/               # Screenshots
├── server.ts               # Main entry point
└── .env                    # Your credentials
```

## 🔧 Troubleshooting

### "Invalid configuration. Please check your environment variables."
- Make sure `.env` exists and has `OPENAI_API_KEY` and `TELEGRAM_BOT_TOKEN`
- Check that there are no typos in your keys

### "Failed to download voice file"
- Check your `TELEGRAM_BOT_TOKEN` is correct
- Try restarting the bot with a new token

### "Webhook setup failed"
- Check your `HOOKDECK_URL` is correct
- Make sure Hookdeck destination points to `http://localhost:3020/telegram`
- If using production, use your server's public URL instead of localhost

### No screenshot generated
- Make sure Playwright is installed: `bunx playwright install chromium`
- Check `artifacts/` folder for error logs

### App build fails
- Check the logs in the Telegram response
- The generated code might have errors - try simplifying your request
- Check `sandbox/<jobId>/` to see the generated files

## 🎨 Example Prompts

Voice or text messages you can try:

- "Create a portfolio site with sections for about, projects, and contact"
- "Build a weather app with a search bar"
- "Make a simple calculator with buttons"
- "Create a login page with email and password fields"
- "Build a countdown timer app"
- "Make a dark-themed landing page for a startup"

## 🚶 Development Tips

### Watch Mode
The default `bun run dev` uses watch mode - it will auto-restart on file changes.

### Debug Mode
Enable detailed logging:

```bash
DEBUG=true bun run dev
```

### Testing Without Voice
You can send text messages to test without using voice:

```
Create a landing page
```

### Checking Generated Files
Look in `sandbox/<jobId>/` to see what code was generated.

### Viewing Screenshots
Screenshots are saved in `artifacts/<jobId>.png`

## 🔄 Next Steps

- Try different types of apps (landing pages, web apps, components)
- Iterate on designs: "Make it darker", "Add animations", "Change the color scheme"
- Build while walking, running, or hiking - completely hands-free!

## 📚 Learn More

- [README.md](./README.md) - Full project documentation
- [packages/README.md](./packages/README.md) - Architecture details
- [OpenAI Whisper](https://platform.openai.com/docs/guides/speech-to-text)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Hookdeck Docs](https://hookdeck.com/docs)

---

**Need help?** Check the logs in your terminal or open an issue on GitHub.

Happy building! 🎉

