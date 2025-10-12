# Voice Input/Output Testing Guide

This guide helps you test the complete voice flow in your voice2app system, including Telegram input/output and WhatsApp notifications.

## Prerequisites

Before testing, ensure you have:

1. **Telegram Bot configured** with your bot token
2. **ElevenLabs API Key** for Text-to-Speech (TTS)
3. **Vonage API credentials** (optional, for WhatsApp)
4. **Test Chat ID** (your Telegram chat ID)

## Configuration

### 1. Get Your Telegram Chat ID

First, you need your Telegram chat ID:

```bash
# Start the server
bun run dev

# In another terminal, send a message to your bot on Telegram
# Check the logs for your chat ID:
tail -f logs/server.log | grep "chat_id"
```

The logs will show something like:
```
"chat": { "id": 123456789, ...
```

### 2. Configure Test Environment

Add these to your `.env` file:

```bash
# Required for testing
TEST_CHAT_ID=123456789  # Your Telegram chat ID from step 1
TELEGRAM_BOT_TOKEN=your_bot_token_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here

# Optional: for WhatsApp notifications
TEST_WHATSAPP=34622035636  # Your WhatsApp number
VONAGE_API_KEY=your_vonage_key_here
VONAGE_API_SECRET=your_vonage_secret_here
ENABLE_WHATSAPP_ADMIN=true

# Optional: for Discord notifications
ENABLE_DISCORD_ADMIN=true
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

## Automated Testing

### Run the Complete Test Suite

```bash
bun run test:voice
```

This will test:
1. ✅ Text-to-Speech (TTS) generation
2. ✅ WhatsApp message sending
3. ✅ Telegram voice message sending
4. ✅ Full orchestration flow (voice in → AI processing → voice out)

### Test Output

The script will:
- Generate a test voice file (`test-voice.mp3`)
- Send a test message to WhatsApp (if configured)
- Send a test voice message to your Telegram
- Run a full orchestration (create an app from voice input)
- Print a summary of all tests

Example output:
```
🧪 Voice Flow Integration Test
============================================================
⚙️  Testing Configuration...
   ✅ Telegram Bot Token: ✓
   ✅ ElevenLabs API Key: ✓
   ✅ TEST_CHAT_ID: ✓
   
🎤 Testing Text-to-Speech (TTS)...
✅ TTS Generation (1234ms)
   Generated 45678 bytes of audio
   
📱 Testing WhatsApp Messaging...
✅ WhatsApp Messaging (567ms)
   Message UUID: abc-123-def
   
📤 Testing Telegram Voice Message Send...
✅ Telegram Voice Send (891ms)
   
🎭 Testing Full Orchestration Flow...
✅ Full Orchestration (45678ms)
   
📊 TEST SUMMARY
============================================================
✅ Configuration Check
✅ TTS Generation (1234ms)
✅ WhatsApp Messaging (567ms)
✅ Telegram Voice Send (891ms)
✅ Full Orchestration (45678ms)
Total: 5 | Passed: 5 | Failed: 0
🎉 All tests passed!
```

## Manual Testing

### Test 1: Voice Input → Voice Output (Telegram only)

1. **Start your server:**
   ```bash
   bun run dev
   ```

2. **Set up webhook** (if not already done):
   ```bash
   # Using Hookdeck CLI
   bun run hookdeck
   ```

3. **Send a voice message to your bot on Telegram**
   - Open Telegram and find your bot
   - Record and send a voice message like:
     - "Create a simple calculator app"
     - "Build a todo list with React"
     - "Make a weather dashboard"

4. **Expected behavior:**
   - Bot sends acknowledgment: "🎤 Got your voice message! Processing..."
   - Bot processes your request (30-60 seconds)
   - Bot sends back:
     - A **voice message** with the summary
     - A text message with full details
     - A screenshot (if app was generated)

### Test 2: Voice Input → Multi-Channel Output

1. **Enable multi-channel output in `.env`:**
   ```bash
   ENABLE_WHATSAPP_ADMIN=true
   ENABLE_DISCORD_ADMIN=true
   VONAGE_WHATSAPP_TO=your_number_here
   DISCORD_WEBHOOK_URL=your_webhook_here
   ```

2. **Send a voice message to your Telegram bot**

3. **Expected behavior:**
   - **Telegram** (customer receives):
     - Voice acknowledgment
     - Voice reply with summary
     - Text message with details
     - Screenshot (if applicable)
   
   - **WhatsApp** (admin receives):
     - Initial notification: "🔔 NEW REQUEST..."
     - Completion notification: "✅ REQUEST COMPLETED..."
   
   - **Discord** (admin receives):
     - Rich embed with request details
     - Completion embed with results

### Test 3: Text Input → Voice Output

1. **Send a text message to your bot** (instead of voice):
   ```
   Create a simple counter app with increment and decrement buttons
   ```

2. **Expected behavior:**
   - Bot sends text acknowledgment: "📝 Got your message! Processing..."
   - Bot processes request
   - Bot sends back **text** reply (no voice, since input was text)
   - Screenshot attached

### Test 4: Different Intent Categories

Test various types of requests to see different routing:

```bash
# App Generation (default)
Voice: "Create a weather app"

# Q&A
Voice: "What is React hooks?"
Text: "Explain how async/await works"

# Translation
Voice: "Translate 'hello world' to Spanish"
Text: "Como se dice 'good morning' en francés"

# Image Generation
Voice: "Generate an image of a sunset over mountains"
Text: "Create a picture of a futuristic city"

# Help
Voice: "What can you do?"
Text: "Help me understand your features"
```

## Troubleshooting

### No voice output received

**Problem:** Bot sends text but no voice message

**Solutions:**
1. Check ElevenLabs API key is valid:
   ```bash
   bun run scripts/test-openai-key.ts
   ```

2. Check TTS configuration in `.env`:
   ```bash
   ELEVENLABS_API_KEY=your_key_here
   STT_PROVIDER=elevenlabs
   ```

3. Check logs for TTS errors:
   ```bash
   tail -f logs/server.log | grep -i "tts\|elevenlabs"
   ```

### WhatsApp notifications not received

**Problem:** No WhatsApp messages arriving

**Solutions:**
1. Check rate limits:
   - Vonage sandbox has rate limits (1 msg/10s)
   - Wait 10 seconds between messages
   
2. Check Vonage credentials:
   ```bash
   # Verify in .env
   VONAGE_API_KEY=...
   VONAGE_API_SECRET=...
   VONAGE_WHATSAPP_TO=34622035636  # Your number with country code
   ```

3. Check WhatsApp sandbox setup:
   - Visit Vonage Dashboard → Messages & Dispatch → Sandbox
   - Ensure you've joined the sandbox with your number

4. Check logs:
   ```bash
   tail -f logs/server.log | grep -i "whatsapp\|vonage"
   ```

### Voice input not recognized

**Problem:** Bot doesn't understand voice messages

**Solutions:**
1. Check STT provider configuration:
   ```bash
   STT_PROVIDER=elevenlabs  # or 'openai'
   ```

2. Check API key for your STT provider

3. Try with clearer audio:
   - Speak slowly and clearly
   - Reduce background noise
   - Keep messages short (< 30 seconds)

4. Check logs:
   ```bash
   tail -f logs/server.log | grep -i "stt\|transcription"
   ```

### Telegram webhook not working

**Problem:** Bot doesn't receive messages

**Solutions:**
1. Check webhook is set:
   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
   ```

2. Restart webhook:
   ```bash
   # Kill existing Hookdeck
   pkill hookdeck
   
   # Restart
   bun run hookdeck
   ```

3. Check Telegram connectivity:
   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"
   ```

## Testing Checklist

- [ ] Configuration is complete (`.env` file)
- [ ] Server is running (`bun run dev`)
- [ ] Webhook is set up (`bun run hookdeck`)
- [ ] Can send/receive text messages
- [ ] Can send/receive voice messages
- [ ] Voice output is generated (TTS works)
- [ ] Voice input is transcribed (STT works)
- [ ] WhatsApp notifications arrive (if enabled)
- [ ] Discord notifications arrive (if enabled)
- [ ] All intent categories work correctly
- [ ] Error messages are clear and helpful

## Advanced Testing

### Test with Different Languages

If you have Lingo translation configured:

```bash
# Spanish
Voice: "Crea una aplicación de calculadora simple"

# French  
Voice: "Créer une application de liste de tâches"

# German
Voice: "Erstelle eine Wetter-App"
```

### Load Testing

To test system performance:

```bash
# Send multiple requests in sequence
for i in {1..5}; do
  echo "Request $i"
  # Send voice message via Telegram
  sleep 60  # Wait for processing
done
```

### Monitor System Resources

```bash
# Watch logs in real-time
tail -f logs/server.log

# Monitor memory/CPU
top | grep node

# Check webhook activity
tail -f logs/telegram-tunnel.log
```

## Next Steps

After testing:

1. **Production deployment**: See `docs/QUICKSTART.md`
2. **Configure providers**: See `docs/PROVIDERS.md`
3. **Admin notifications**: See `docs/ADMIN_NOTIFICATIONS.md`
4. **Discord setup**: See `docs/DISCORD_BOT_SETUP.md`

## Support

If you encounter issues:

1. Check logs: `logs/server.log`
2. Review configuration: `.env` file
3. Test individual components: `bun run test:voice`
4. Check API credentials are valid
5. Ensure rate limits aren't exceeded

