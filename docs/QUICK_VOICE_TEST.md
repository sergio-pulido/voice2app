# Quick Voice Testing Guide

A fast guide to test your voice input/output system in under 5 minutes.

## 🚀 Quick Start

### 1. Setup (First time only)

```bash
# Get your Telegram chat ID
bun run dev
# → Send a message to your bot on Telegram
# → Check logs for: "chat": { "id": 123456789 }
# → Add to .env: TEST_CHAT_ID=123456789
```

### 2. Run Tests

```bash
# Run the automated test suite
bun run test:voice
```

This will test:
- ✅ Text-to-Speech (ElevenLabs)
- ✅ WhatsApp notifications (if enabled)
- ✅ Telegram voice messages
- ✅ Full voice workflow

### 3. Manual Test

**Send a voice message to your Telegram bot:**

```
"Create a simple counter app with buttons"
```

**Expected result:**
1. Bot replies: "🎤 Got your voice message! Processing..."
2. Bot sends voice message with summary (30-60s later)
3. Bot sends text with full details
4. Bot sends screenshot
5. WhatsApp/Discord notification (if enabled)

## 🔧 Common Issues

### No voice output?

```bash
# Check your .env file
ELEVENLABS_API_KEY=your_key_here
STT_PROVIDER=elevenlabs
```

### No WhatsApp notifications?

```bash
# Check your .env file
ENABLE_WHATSAPP_ADMIN=true
VONAGE_API_KEY=...
VONAGE_API_SECRET=...
VONAGE_WHATSAPP_TO=34622035636  # Your number
```

### Bot not responding?

```bash
# Check webhook
bun run hookdeck

# Check logs
tail -f logs/server.log
```

## 📋 Quick Checklist

- [ ] Server running: `bun run dev`
- [ ] Webhook set up: `bun run hookdeck`
- [ ] `.env` configured with `TEST_CHAT_ID`
- [ ] ElevenLabs API key set
- [ ] Sent test voice message
- [ ] Received voice reply

## 📚 Full Documentation

See [VOICE_TESTING.md](./VOICE_TESTING.md) for:
- Detailed troubleshooting
- Advanced testing scenarios
- Multi-channel output setup
- Different intent categories
- Performance monitoring

## 🎯 Test Different Features

```bash
# App generation
Voice: "Create a todo list app"

# Question answering  
Voice: "What is React?"

# Translation
Voice: "Translate hello to Spanish"

# Image generation
Voice: "Generate a sunset image"
```

## 💡 Pro Tips

1. **Speak clearly** - Better transcription = better results
2. **Keep it short** - Voice messages under 30s work best
3. **Wait for completion** - App generation takes 30-60s
4. **Check both channels** - Customer (Telegram) + Admin (WhatsApp/Discord)
5. **Monitor logs** - `tail -f logs/server.log` shows everything

## 🆘 Still Having Issues?

```bash
# Run diagnostic
bun run test:voice

# Check configuration
bun run test-setup

# View detailed logs
tail -f logs/server.log | grep -i "voice\|tts\|stt"
```

For more help, see the [full testing guide](./VOICE_TESTING.md).

