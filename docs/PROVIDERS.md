# 🔌 Provider Configuration Guide

Voice2App supports multiple AI providers for flexibility and cost optimization. You can mix and match different providers for STT, LLM, and TTS.

## 📋 Table of Contents

- [Overview](#overview)
- [STT Providers](#stt-providers)
- [LLM Providers](#llm-providers)
- [Configuration](#configuration)
- [Cost Comparison](#cost-comparison)
- [Troubleshooting](#troubleshooting)

---

## Overview

Voice2App uses three types of AI services:

1. **STT (Speech-to-Text)** - Transcribes voice messages
2. **LLM (Large Language Model)** - Generates code and analyzes results
3. **TTS (Text-to-Speech)** - Converts text to voice (coming soon)

You can configure which provider to use for each service independently.

---

## STT Providers

### OpenAI Whisper

**✅ Pros:**
- Very accurate
- Supports 99+ languages
- Good with accents and background noise

**❌ Cons:**
- Costs $0.006 per minute
- Requires OpenAI API key

**Configuration:**
```env
STT_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

### ElevenLabs

**✅ Pros:**
- Fast processing
- Good accuracy
- Free tier available

**❌ Cons:**
- Character limits on free tier
- Fewer supported languages

**Configuration:**
```env
STT_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=your_key_here
```

**Get API Key:**
1. Sign up at https://elevenlabs.io/
2. Go to Profile → API Keys
3. Create a new API key

---

## LLM Providers

### OpenAI GPT

**Models:**
- `gpt-4o-mini` (recommended, fast & cheap)
- `gpt-4o` (more capable, slower)
- `gpt-4-turbo`

**✅ Pros:**
- Most capable for code generation
- Good at following instructions
- Reliable

**❌ Cons:**
- Can be expensive
- Rate limits on free tier

**Configuration:**
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```

**Pricing:**
- GPT-4o-mini: $0.150 / 1M input, $0.600 / 1M output
- GPT-4o: $2.50 / 1M input, $10.00 / 1M output

### Anthropic Claude

**Models:**
- `claude-3-5-sonnet-20241022` (recommended)
- `claude-3-opus-20240229` (most capable)
- `claude-3-haiku-20240307` (fastest)

**✅ Pros:**
- Excellent code generation
- Long context window (200k tokens)
- Fast and reliable

**❌ Cons:**
- No free tier
- Different API format

**Configuration:**
```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
LLM_MODEL=claude-3-5-sonnet-20241022
```

**Get API Key:**
1. Sign up at https://console.anthropic.com/
2. Go to API Keys
3. Create a new key
4. Add credits: https://console.anthropic.com/account/billing

**Pricing:**
- Claude 3.5 Sonnet: $3.00 / 1M input, $15.00 / 1M output

### Groq (⚡ Recommended for Free Usage)

**Models:**
- `llama-3.3-70b-versatile` (recommended)
- `mixtral-8x7b-32768`
- `llama-3.1-70b-versatile`

**✅ Pros:**
- **FREE!** (with generous limits)
- **Extremely fast** (tokens/sec)
- Good quality
- OpenAI-compatible API

**❌ Cons:**
- Slightly less capable than GPT-4 or Claude
- Rate limits (but generous)

**Configuration:**
```env
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
LLM_MODEL=llama-3.3-70b-versatile
```

**Get API Key:**
1. Sign up at https://console.groq.com/
2. Go to API Keys
3. Create a new key
4. **FREE** - No credit card required!

**Pricing:**
- **FREE!** Up to 14,400 requests/day
- Rate limits: 30 req/min, 6,000 tokens/min

---

## Configuration

### Recommended Setups

#### 💰 Free / Low Cost
```env
STT_PROVIDER=elevenlabs
LLM_PROVIDER=groq
ELEVENLABS_API_KEY=your_key
GROQ_API_KEY=your_key
```

#### ⚡ Fastest
```env
STT_PROVIDER=openai
LLM_PROVIDER=groq
OPENAI_API_KEY=your_key
GROQ_API_KEY=your_key
```

#### 🎯 Best Quality
```env
STT_PROVIDER=openai
LLM_PROVIDER=anthropic
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
LLM_MODEL=claude-3-5-sonnet-20241022
```

#### 🔄 Fallback Configuration
```env
# Primary providers
STT_PROVIDER=elevenlabs
LLM_PROVIDER=groq

# But have all keys for fallback
ELEVENLABS_API_KEY=your_key
GROQ_API_KEY=your_key
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
```

---

## Cost Comparison

### Example: 1 Voice Message → App Generation

**Voice Message:**
- 30 seconds of speech
- ~50 words transcribed

**LLM Usage:**
- Task planning: ~500 tokens
- Code generation: ~2,000 tokens
- Result analysis: ~200 tokens
- Total: ~2,700 tokens

#### Cost per Request

| Provider Combo | STT Cost | LLM Cost | Total Cost |
|----------------|----------|----------|------------|
| **ElevenLabs + Groq** | $0.000 | $0.000 | **FREE** ✨ |
| OpenAI + Groq | $0.003 | $0.000 | **$0.003** |
| ElevenLabs + OpenAI (GPT-4o-mini) | $0.000 | $0.002 | **$0.002** |
| OpenAI + OpenAI (GPT-4o-mini) | $0.003 | $0.002 | **$0.005** |
| OpenAI + Anthropic (Claude 3.5 Sonnet) | $0.003 | $0.04 | **$0.043** |

**💡 Recommendation:** Use **ElevenLabs + Groq** for completely free operation!

---

## Troubleshooting

### "Missing API key for STT provider"

**Solution:** Make sure you have the API key for your selected provider:
```bash
# Check your .env file
grep STT_PROVIDER .env
grep ELEVENLABS_API_KEY .env  # or OPENAI_API_KEY
```

### "Invalid API key"

**Solution:**
1. Verify key is copied correctly (no spaces, no quotes)
2. Check if key is active on provider dashboard
3. For OpenAI: Check billing at https://platform.openai.com/account/billing
4. For Groq: Verify at https://console.groq.com/

### Rate Limits

**Groq:**
- Free tier: 30 requests/min, 6,000 tokens/min
- If you hit limits, wait 60 seconds or upgrade

**OpenAI:**
- Varies by tier
- Check: https://platform.openai.com/account/limits

**ElevenLabs:**
- Free: 10,000 characters/month
- Check: https://elevenlabs.io/subscription

### Switch Providers Dynamically

Edit `.env` and restart:
```bash
nano .env
# Change STT_PROVIDER or LLM_PROVIDER
bun run dev
```

---

## Testing Providers

Test your provider configuration:

```bash
# Test overall setup
bun run test-setup

# Test specific provider
bun run scripts/test-openai-key.ts
```

---

## Future: Multiple Provider Support

Coming soon:
- Automatic fallback between providers
- Load balancing
- Cost optimization
- Provider selection per user

---

**Need help?** Check [QUICKSTART.md](../QUICKSTART.md) or open an issue!

