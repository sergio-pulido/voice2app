# 🚀 Voice Testing - Quick Reference Card

## Setup (One Time)

```bash
# 1. Get your chat ID
bun run dev
# → Message your bot → Check logs → Add to .env: TEST_CHAT_ID=123456789

# 2. Start services
bun run dev          # Terminal 1
bun run hookdeck     # Terminal 2
```

## Run Tests

```bash
# Automated test suite
bun run test:voice

# Manual test: Send voice message to your bot
"Create a simple counter app"
```

## What to Expect

### Voice Input → Voice Output Flow

```
1. Send voice to bot
   ↓
2. Bot: "🎤 Got your voice message!" (voice)
   ↓
3. Processing... (30-60s)
   ↓
4. Bot replies:
   • Voice message with summary
   • Text message with details
   • Screenshot (if app generated)
   ↓
5. Admin notified (WhatsApp/Discord)
```

## Voice Commands to Try

```bash
# App Generation
"Create a todo list app"
"Build a calculator"
"Make a weather dashboard"

# Q&A
"What is React?"
"Explain async await"

# Translation
"Translate hello to Spanish"

# Image Generation
"Generate a sunset image"
```

## Quick Checks

```bash
# Configuration
✓ TELEGRAM_BOT_TOKEN set
✓ ELEVENLABS_API_KEY set
✓ TEST_CHAT_ID set
✓ Webhook running (bun run hookdeck)

# Verify Voice Works
✓ Send voice → Get voice back
✓ Voice transcription accurate
✓ Voice output clear

# Verify Multi-Channel
✓ Telegram gets customer reply
✓ WhatsApp gets admin notification (if enabled)
✓ Discord gets rich embed (if enabled)
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No voice output | Check `ELEVENLABS_API_KEY` |
| No WhatsApp | Check `VONAGE_*` keys + `ENABLE_WHATSAPP_ADMIN=true` |
| Bot not responding | Restart webhook: `bun run hookdeck` |
| Bad transcription | Speak slowly, clearly, reduce noise |

## Monitor Logs

```bash
tail -f logs/server.log                           # All
tail -f logs/server.log | grep -i "voice"        # Voice only
tail -f logs/server.log | grep -i "whatsapp"     # WhatsApp only
tail -f logs/telegram-tunnel.log                  # Webhook
```

## Channels

| Channel | Type | Purpose | Gets |
|---------|------|---------|------|
| Telegram | Customer | Request & Response | Voice ack, Voice reply, Text details, Screenshot |
| WhatsApp | Admin | Notifications | "NEW REQUEST", "COMPLETED", "ERROR" |
| Discord | Admin | Rich Embeds | Detailed status, metadata, color-coded |

## Environment Variables

```bash
# Required
TELEGRAM_BOT_TOKEN=...
ELEVENLABS_API_KEY=...
TEST_CHAT_ID=123456789

# Optional (WhatsApp)
ENABLE_WHATSAPP_ADMIN=true
VONAGE_API_KEY=...
VONAGE_API_SECRET=...
VONAGE_WHATSAPP_TO=34622035636

# Optional (Discord)
ENABLE_DISCORD_ADMIN=true
DISCORD_WEBHOOK_URL=...
```

## Success Criteria

- [x] Voice input transcribed correctly
- [x] Voice output generated and clear
- [x] Text fallback works
- [x] Multi-channel notifications arrive
- [x] All intent categories work
- [x] Errors are clear and helpful

## Full Docs

- Complete Guide: `docs/VOICE_TESTING.md`
- Quick Start: `docs/QUICK_VOICE_TEST.md`
- Step-by-Step: `TEST_INSTRUCTIONS.md`

