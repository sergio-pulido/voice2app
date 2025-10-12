# 🎯 Voice Testing - Complete Summary

## What's Been Set Up

I've created a comprehensive testing suite for your voice input/output system with Telegram and WhatsApp integration.

### 📦 New Files Created

1. **`scripts/test-voice-flow.ts`** - Automated test suite
   - Tests TTS generation (ElevenLabs)
   - Tests WhatsApp messaging (Vonage)
   - Tests Telegram voice sending
   - Tests full orchestration flow
   - Generates detailed test reports

2. **`scripts/test-whatsapp.ts`** - Quick WhatsApp test
   - Isolated WhatsApp connectivity test
   - Verifies Vonage credentials
   - Sends test message
   - Provides troubleshooting guidance

3. **Documentation Files:**
   - `TEST_INSTRUCTIONS.md` - Complete step-by-step walkthrough
   - `TESTING_QUICK_REF.md` - Quick reference card
   - `docs/VOICE_TESTING.md` - Comprehensive testing guide
   - `docs/QUICK_VOICE_TEST.md` - 5-minute quick test

### 🔧 Updated Files

1. **`package.json`** - Added test commands:
   ```json
   "test:voice": "bun run scripts/test-voice-flow.ts"
   "test:whatsapp": "bun run scripts/test-whatsapp.ts"
   ```

2. **`env.template`** - Added testing variables:
   ```bash
   TEST_CHAT_ID=123456789
   TEST_WHATSAPP=34622035636
   ```

3. **`README.md`** - Added Testing Guides section with links to all docs

4. **`packages/telegram-gateway/orchestrator.ts`** - Fixed type consistency
   - Now uses shared `OrchestrateOptions` type
   - Platform-aware notifications

## 🚀 How to Use

### Quick Start (3 commands)

```bash
# 1. Get your chat ID (if you don't have it)
bun run dev
# → Send a message to your bot
# → Check logs for chat ID
# → Add to .env: TEST_CHAT_ID=123456789

# 2. Run automated tests
bun run test:voice

# 3. Test WhatsApp independently
bun run test:whatsapp
```

### What Gets Tested

#### Automated Test Suite (`bun run test:voice`)

✅ **Configuration Check**
- Telegram Bot Token
- ElevenLabs API Key  
- Vonage credentials
- Test variables

✅ **Text-to-Speech (TTS)**
- Generate voice from text
- Save audio file for inspection
- Measure generation time

✅ **WhatsApp Messaging**
- Send test notification
- Check rate limits
- Verify delivery

✅ **Telegram Voice Sending**
- Upload voice message
- Verify message delivery
- Check bot response

✅ **Full Orchestration Flow**
- Simulates real voice input
- Transcription → Processing → Response
- Voice output generation
- Multi-channel notifications

### Test Flow Visualization

```
┌─────────────────────────────────────────────────────────┐
│                   TEST VOICE FLOW                       │
└─────────────────────────────────────────────────────────┘

1. VOICE INPUT (Telegram)
   User: 🎤 "Create a counter app"
   ↓
2. ACKNOWLEDGMENT
   Bot: 🎤 "Got your voice message!" (voice)
   ↓
3. PROCESSING (30-60s)
   • Speech-to-Text (ElevenLabs/OpenAI)
   • AI Routing (Groq)
   • Code Generation
   • Build & Screenshot
   ↓
4. VOICE OUTPUT (Telegram)
   Bot: 🎤 Voice summary
   Bot: 📝 Text details
   Bot: 📸 Screenshot
   ↓
5. ADMIN NOTIFICATIONS
   WhatsApp: ✅ "REQUEST COMPLETED"
   Discord: 📊 Rich embed with details
```

## 📋 Testing Checklist

Use this to verify everything works:

### Initial Setup
- [ ] Server running (`bun run dev`)
- [ ] Webhook configured (`bun run hookdeck`)
- [ ] `.env` file configured
- [ ] `TEST_CHAT_ID` set
- [ ] API keys valid

### Automated Tests
- [ ] Run `bun run test:voice`
- [ ] All tests pass
- [ ] Audio file generated (`test-voice.mp3`)
- [ ] No errors in console

### Manual Voice Tests
- [ ] Send voice message to bot
- [ ] Receive voice acknowledgment
- [ ] Receive voice response
- [ ] Receive text details
- [ ] Receive screenshot (if app generated)

### Multi-Channel Tests
- [ ] Telegram receives customer messages
- [ ] WhatsApp receives admin notifications
- [ ] Discord receives rich embeds
- [ ] Notifications have correct content

### Intent Category Tests
- [ ] App generation works
- [ ] Q&A works
- [ ] Translation works
- [ ] Image generation works
- [ ] Help command works

## 🎯 Expected Results

### Successful Test Output

```bash
$ bun run test:voice

🧪 Voice Flow Integration Test
============================================================
⚙️  Testing Configuration...
   ✅ Telegram Bot Token: ✓
   ✅ ElevenLabs API Key: ✓
   ✅ Vonage API Key: ✓
   ✅ TEST_CHAT_ID: ✓
   
🎤 Testing Text-to-Speech (TTS)...
✅ TTS Generation (1234ms)
   Generated 45678 bytes of audio
   Saved to: /path/to/test-voice.mp3
   
📱 Testing WhatsApp Messaging...
✅ WhatsApp Messaging (567ms)
   Message UUID: abc-123-def
   Status: accepted
   
📤 Testing Telegram Voice Message Send...
✅ Telegram Voice Send (891ms)
   Message ID: 12345
   
🎭 Testing Full Orchestration Flow...
   Simulating voice message input...
   Text: "Create a simple hello world app with a button that says click me"
✅ Full Orchestration (45678ms)
   Check Telegram for voice response!
   Check WhatsApp for admin notification!
   
📊 TEST SUMMARY
============================================================
✅ Configuration Check
✅ TTS Generation (1234ms)
✅ WhatsApp Messaging (567ms)
✅ Telegram Voice Send (891ms)
✅ Full Orchestration (45678ms)
Total: 5 | Passed: 5 | Failed: 0
============================================================

🎉 All tests passed!

💡 Next steps:
   1. Check your Telegram for voice messages
   2. Check WhatsApp for admin notifications (if enabled)
   3. Try sending a real voice message to your bot
   4. Check logs/server.log for detailed output
```

### Successful Manual Test

**You send:**
🎤 Voice: "Create a todo list app with React"

**Bot responds:**
1. 🎤 Voice: "Got your voice message! Processing..."
2. ⏳ Processing... (30-60 seconds)
3. 🎤 Voice: "I've created a React todo list app with add, complete, and delete functionality..."
4. 📝 Text: Full details with file structure
5. 📸 Screenshot of the running app

**Admin receives (WhatsApp):**
```
✅ REQUEST COMPLETED
👤 User: YourName (123456789)
🎯 Tool: App Builder
📋 Task: Create a todo list app with React
⏱️ Time: 45.2s
📊 Status: SUCCESS
📦 Files: 5 generated
```

**Admin receives (Discord):**
Rich embed with:
- Color-coded status (green = success)
- User info
- Processing time
- Tool used
- Transcription
- File count

## 🐛 Troubleshooting

### Test Failures

| Test Failed | Likely Cause | Solution |
|-------------|--------------|----------|
| Configuration Check | Missing API keys | Add keys to `.env` file |
| TTS Generation | Invalid ElevenLabs key | Verify `ELEVENLABS_API_KEY` |
| WhatsApp Messaging | Rate limit or credentials | Check Vonage config, wait 10s |
| Telegram Voice Send | Invalid bot token | Check `TELEGRAM_BOT_TOKEN` |
| Full Orchestration | LLM provider issue | Check OpenAI/Groq/Anthropic keys |

### Common Issues

**Problem: No voice output**
```bash
# Solution:
echo "ELEVENLABS_API_KEY=your_key_here" >> .env
echo "STT_PROVIDER=elevenlabs" >> .env
```

**Problem: WhatsApp notifications not arriving**
```bash
# Solution:
echo "ENABLE_WHATSAPP_ADMIN=true" >> .env
# Verify Vonage sandbox setup
# Wait 10 seconds between messages (rate limit)
```

**Problem: Bot doesn't respond**
```bash
# Solution:
# Restart webhook
pkill hookdeck
bun run hookdeck

# Check logs
tail -f logs/server.log
```

## 📚 Documentation Hierarchy

**Just want to test quickly?**
→ Start with: `TESTING_QUICK_REF.md` (1 page)

**First time testing?**
→ Follow: `TEST_INSTRUCTIONS.md` (step-by-step)

**Need quick reference?**
→ Use: `docs/QUICK_VOICE_TEST.md` (5 min)

**Want comprehensive guide?**
→ Read: `docs/VOICE_TESTING.md` (complete)

## 🎉 Next Steps

After testing is complete:

1. **Deploy to Production**
   - See `docs/QUICKSTART.md` for deployment
   - Configure production webhooks
   - Set up monitoring

2. **Configure Providers**
   - See `docs/PROVIDERS.md`
   - Choose optimal LLM provider
   - Select best STT/TTS provider

3. **Set Up Admin Channels**
   - See `docs/ADMIN_NOTIFICATIONS.md`
   - Configure WhatsApp (optional)
   - Configure Discord (recommended)

4. **Explore Features**
   - See `docs/FEATURES_SUMMARY.md`
   - Test different intent categories
   - Try multi-language support

## 💡 Pro Tips

1. **Monitor in Real-Time**
   ```bash
   # Terminal 1: Server
   bun run dev
   
   # Terminal 2: Webhook
   bun run hookdeck
   
   # Terminal 3: Logs
   tail -f logs/server.log | grep -i "voice\|tts\|stt"
   ```

2. **Test Incrementally**
   - Start with `bun run test:whatsapp` (quick)
   - Then `bun run test:voice` (comprehensive)
   - Finally manual voice tests

3. **Keep Test Audio**
   - Review `test-voice.mp3` for quality
   - Adjust TTS settings if needed
   - Test different voices

4. **Use Discord for Admin**
   - Free unlimited notifications
   - Rich embeds with color coding
   - Better formatting than WhatsApp

5. **Check Rate Limits**
   - WhatsApp: 1 msg/10s (sandbox)
   - ElevenLabs: Check your plan
   - OpenAI: Monitor usage

## 🆘 Getting Help

If tests fail or you're stuck:

1. **Run diagnostics:**
   ```bash
   bun run test:voice     # Full test suite
   bun run test-setup     # Configuration check
   bun run test:whatsapp  # WhatsApp only
   ```

2. **Check logs:**
   ```bash
   tail -f logs/server.log
   ```

3. **Review docs:**
   - Full testing guide: `docs/VOICE_TESTING.md`
   - Setup guide: `docs/QUICKSTART.md`
   - Provider config: `docs/PROVIDERS.md`

4. **Verify environment:**
   - All required API keys set
   - Webhook running
   - Server accessible

## ✅ Success Criteria

Your system is fully working if:

- ✅ Automated tests pass (100%)
- ✅ Voice input → Voice output works
- ✅ Transcription is accurate
- ✅ All intent categories work
- ✅ Multi-channel notifications arrive
- ✅ Error handling is graceful
- ✅ Performance is acceptable (< 60s)

## 🎊 Congratulations!

You now have a complete voice testing suite for your voice2app system!

**You can:**
- Test voice input/output automatically
- Verify WhatsApp integration
- Monitor multi-channel notifications
- Debug issues quickly
- Ensure quality before deployment

**Start testing now:**
```bash
bun run test:voice
```

Happy coding! 🚀

