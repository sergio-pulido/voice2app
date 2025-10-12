# 🎤 Voice Testing Instructions

Quick guide to test voice input/output with Telegram and WhatsApp.

## ✅ Prerequisites

Before you start, make sure you have:

1. **Server running**: `bun run dev`
2. **Webhook set up**: `bun run hookdeck` (in another terminal)
3. **Environment configured**: Check your `.env` file

## 🎯 Step 1: Get Your Telegram Chat ID

If you don't have it yet:

```bash
# 1. Start your server
bun run dev

# 2. Send any message to your bot on Telegram

# 3. Check the logs for your chat ID
tail -f logs/server.log | grep "chat_id"
# Look for: "chat": { "id": 123456789 }

# 4. Add it to your .env file
echo "TEST_CHAT_ID=123456789" >> .env
```

## 🧪 Step 2: Run Automated Tests

```bash
bun run test:voice
```

This will automatically test:
- ✅ Text-to-Speech generation (ElevenLabs)
- ✅ WhatsApp notifications (if configured)
- ✅ Telegram voice message sending
- ✅ Complete voice workflow

**Expected output:**
```
🧪 Voice Flow Integration Test
============================================================
✅ Configuration Check
✅ TTS Generation (1234ms)
✅ WhatsApp Messaging (567ms)
✅ Telegram Voice Send (891ms)
✅ Full Orchestration (45678ms)

🎉 All tests passed!
```

## 🗣️ Step 3: Test with Real Voice Input

### Test 1: Simple Voice Request

1. Open Telegram and find your bot
2. Hold the microphone button and say:
   ```
   "Create a simple counter app with increment and decrement buttons"
   ```
3. Release and send

**What should happen:**
1. Bot replies with voice: "Got your voice message! Processing..."
2. Bot processes for 30-60 seconds
3. Bot sends a **voice message** with the summary
4. Bot sends a **text message** with full details
5. Bot sends a **screenshot** of the generated app

### Test 2: Different Request Types

Try these voice commands:

**App Generation:**
```
"Create a todo list with React"
"Build a weather dashboard"
"Make a calculator app"
```

**Question Answering:**
```
"What is React hooks?"
"Explain async await in JavaScript"
"How does the useState hook work?"
```

**Translation:**
```
"Translate 'hello world' to Spanish"
"Como se dice 'good morning' in English?"
```

**Image Generation:**
```
"Generate an image of a sunset over mountains"
"Create a picture of a futuristic city"
```

## 📱 Step 4: Check Multi-Channel Output

If you have WhatsApp/Discord admin notifications enabled:

### Telegram (Customer Channel)
- Voice acknowledgment
- Voice response with summary
- Text message with details
- Screenshot attachment

### WhatsApp (Admin Channel)
- Initial notification: "🔔 NEW REQUEST..."
- Completion notification: "✅ REQUEST COMPLETED..."
- Error notifications (if any)

### Discord (Admin Channel)
- Rich embed with request details
- Color-coded status indicators
- Detailed metadata fields

## 🔍 Verify Everything Works

Use this checklist:

```bash
# 1. Voice Input → Voice Output (Telegram)
[ ] Send voice message to bot
[ ] Receive voice acknowledgment
[ ] Receive voice response with summary
[ ] Receive text message with details
[ ] Receive screenshot (if applicable)

# 2. Multi-Channel Notifications
[ ] WhatsApp admin gets "NEW REQUEST" notification
[ ] WhatsApp admin gets "REQUEST COMPLETED" notification
[ ] Discord admin gets rich embed notification

# 3. Different Intent Categories
[ ] App generation works
[ ] Q&A works  
[ ] Translation works
[ ] Image generation works

# 4. Error Handling
[ ] Invalid requests show clear errors
[ ] Errors notify admin channels
[ ] System recovers gracefully
```

## 🐛 Troubleshooting

### Problem: No voice response

**Check:**
```bash
# Verify ElevenLabs API key
grep ELEVENLABS_API_KEY .env

# Check TTS logs
tail -f logs/server.log | grep -i "tts"
```

**Fix:** Make sure `ELEVENLABS_API_KEY` is set in `.env`

### Problem: No WhatsApp notifications

**Check:**
```bash
# Verify Vonage credentials
grep VONAGE .env

# Check WhatsApp logs
tail -f logs/server.log | grep -i "whatsapp"
```

**Fix:** 
- Set `ENABLE_WHATSAPP_ADMIN=true`
- Add Vonage credentials
- Check rate limits (1 msg/10s on sandbox)

### Problem: Bot doesn't respond to voice

**Check:**
```bash
# Verify webhook
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo"

# Check STT logs
tail -f logs/server.log | grep -i "stt\|transcription"
```

**Fix:**
- Restart webhook: `bun run hookdeck`
- Check STT provider: `STT_PROVIDER=elevenlabs`

### Problem: Voice is transcribed but not processed

**Check:**
```bash
# Check router logs
tail -f logs/server.log | grep -i "router\|intent"
```

**Fix:** Check your LLM provider credentials (OpenAI, Groq, or Anthropic)

## 📊 Monitor Your Tests

Watch logs in real-time:

```bash
# All logs
tail -f logs/server.log

# Voice-specific logs
tail -f logs/server.log | grep -i "voice\|tts\|stt"

# WhatsApp logs
tail -f logs/server.log | grep -i "whatsapp\|vonage"

# Webhook logs
tail -f logs/telegram-tunnel.log
```

## 🎯 Success Criteria

Your system is working correctly if:

1. ✅ Voice input is transcribed correctly
2. ✅ Voice output is generated and sent
3. ✅ Text fallback works when voice fails
4. ✅ WhatsApp admin notifications arrive
5. ✅ Discord admin notifications arrive
6. ✅ All intent categories route correctly
7. ✅ Error messages are clear and helpful
8. ✅ Screenshots are generated for apps

## 📚 Next Steps

Once testing is complete:

1. **Production Setup**: See `docs/QUICKSTART.md`
2. **Provider Configuration**: See `docs/PROVIDERS.md`
3. **Admin Notifications**: See `docs/ADMIN_NOTIFICATIONS.md`
4. **Full Testing Guide**: See `docs/VOICE_TESTING.md`

## 🆘 Need Help?

If you're still having issues:

1. Run diagnostics: `bun run test:voice`
2. Check configuration: `bun run test-setup`
3. Review full guide: `docs/VOICE_TESTING.md`
4. Check logs: `logs/server.log`
5. Verify API keys are valid
6. Ensure rate limits aren't exceeded

## 🎉 You're Ready!

Your voice2app system is now fully tested and ready to use!

Try different voice commands, experiment with various request types, and see how the AI router intelligently handles each category.

