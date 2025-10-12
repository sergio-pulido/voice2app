# 🎨 AI Image Generation

## Overview

Voice2App supports **AI image generation** with multiple providers:

- **🌟 Google Gemini (Imagen 3)** - Also known as "Nano Banana" - **RECOMMENDED!**
- **HuggingFace (Stable Diffusion XL)** - Alternative option

Send an image request via Telegram and receive a high-quality AI-generated image!

---

## Setup (5 minutes)

### Option A: Google Gemini (Recommended) 🌟

#### 1. Get Gemini API Key

1. Go to: https://ai.google.dev
2. Sign in with your Google account
3. Click **Get API Key**
4. Create a new API key
5. Copy the token

#### 2. Add to Environment

Add to your `.env` file:

```env
IMAGE_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
```

#### 3. Restart Server

```bash
make clean
make dev
```

### Option B: HuggingFace (Alternative)

#### 1. Get HuggingFace API Key

1. Go to: https://huggingface.co
2. Sign up for a free account
3. Go to **Settings** → **Access Tokens**
4. Click **New token**
5. Name: `Voice2App`
6. Type: **Read**
7. Copy the token

#### 2. Add to Environment

Add to your `.env` file:

```env
IMAGE_PROVIDER=huggingface
HUGGINGFACE_API_KEY=hf_your_api_key_here
```

#### 3. Restart Server

```bash
make clean
make dev
```

---

## Usage

### Text Requests

Send a message like:

> 📝 "Generate a logo for a tech startup"

> 📝 "Create an image of a mountain at sunset"

> 📝 "Generate an illustration of a cute robot"

### Voice Requests

> 🎤 "Crea una imagen de un logo moderno"

> 🎤 "Generate a picture of a cat wearing a hat"

---

## What You'll Receive

### On Telegram

```
🎨 Image Generator

🎨 Image Generated!

Prompt: "Generate a logo for a tech startup"

Your AI-generated image is ready! ✨

Generated with: Google Gemini (Nano Banana / Imagen 3)
Time: 4.2s

[Image attached]
```

Or with HuggingFace:
```
Generated with: Stable Diffusion XL
Time: 15.2s
```

### On Discord/WhatsApp (Admin)

```
✅ REQUEST COMPLETED
👤 User: Sergio (6181465305)
🎯 Tool: 🎨 Image Generator
📋 Task: Generate a logo for a tech startup
⏱️  Time: 15.2s
📊 Status: SUCCESS
🎨 Model: stable-diffusion-xl-base-1.0
```

---

## Features

### Model

**Stable Diffusion XL Base 1.0**:
- High-quality images (1024x1024)
- Fast generation (10-20 seconds)
- Great for logos, illustrations, concepts
- Free tier available on HuggingFace

### Smart Routing

The AI router automatically detects image requests:

**Triggers**:
- "Generate image", "Create image", "Make image"
- "Generate logo", "Create logo"
- "Draw", "Illustration", "Picture"
- Spanish: "Crea imagen", "Genera imagen"

**Examples**:
- ✅ "Generate a logo" → 🎨 Image Generator
- ✅ "Create an illustration of a robot" → 🎨 Image Generator  
- ✅ "Make a picture of..." → 🎨 Image Generator

### Image Storage

Generated images are saved to:
```
artifacts/image_[timestamp].png
```

You can find all generated images in the `artifacts/` directory.

---

## Tips for Better Images

### Good Prompts

✅ "A modern minimalist logo for a tech startup, blue and white colors"  
✅ "A beautiful mountain landscape at sunset, realistic style"  
✅ "An illustration of a cute robot reading a book, cartoon style"  
✅ "A professional headshot of a business person, corporate style"

### Prompt Structure

**Best format**:
```
[Subject] + [Style] + [Details] + [Quality modifiers]
```

**Examples**:
- "A golden retriever puppy, watercolor painting style, soft colors, high quality"
- "Futuristic city skyline, cyberpunk style, neon lights, 4k resolution"
- "Abstract art with geometric shapes, vibrant colors, modern minimalist"

### What to Avoid

❌ Too vague: "Make something cool"  
❌ Conflicting: "Realistic cartoon"  
❌ Too complex: "A city with 50 specific buildings and..."

---

## Performance

**Typical Generation Times**:
- Simple images (logo, icon): 10-15 seconds
- Complex images (landscape, scene): 15-25 seconds
- Very detailed prompts: 20-30 seconds

**Image Quality**:
- Resolution: 1024x1024 (high quality)
- Format: PNG
- File size: 500KB - 2MB

---

## Limitations

### Free Tier

HuggingFace free tier has:
- ⚠️ Rate limits (a few images per minute)
- ⚠️ Model loading time (first request may be slow)
- ⚠️ Queue times during peak hours

**If you hit rate limits**: Wait 30-60 seconds and try again.

### Model Limitations

- Cannot generate photos of real people
- Cannot create NSFW content
- Works best with clear, specific prompts
- English prompts work best (but Spanish supported)

---

## Troubleshooting

### "HuggingFace API key not configured"

1. Make sure HUGGINGFACE_API_KEY is in your `.env`
2. Restart server: `make clean && make dev`
3. Check: `echo $HUGGINGFACE_API_KEY`

### "Model loading" or slow first request

HuggingFace loads models on-demand. First request may take 30-60 seconds.
Subsequent requests will be faster.

### "Failed to generate image"

- **Rate limit**: Wait 1 minute and try again
- **Invalid prompt**: Try a clearer, more specific description
- **Model timeout**: Try a simpler prompt

---

## Cost

**HuggingFace Free Tier**:
- ✅ Free API key
- ✅ Generous rate limits for testing
- ⚠️ Has queue times

**Paid Tier** (if needed):
- Pay-per-use pricing
- Faster generation
- No queue times
- Priority access

For most use cases, the **free tier is sufficient**!

---

## Examples

Try these prompts:

1. **Logo Design**:
   > "A minimalist logo for a coffee shop, brown and cream colors, modern style"

2. **Illustration**:
   > "A cute robot helping people, cartoon style, friendly and colorful"

3. **Landscape**:
   > "A serene lake surrounded by mountains at dawn, realistic photography style"

4. **Abstract**:
   > "Abstract geometric pattern with blue and purple gradients, modern digital art"

5. **Character**:
   > "A friendly alien character, cartoon style for kids, bright colors"

---

---

## Provider Comparison

| Feature | Google Gemini (Imagen 3) 🌟 | HuggingFace (SDXL) |
|---------|----------------------------|-------------------|
| **Quality** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Very Good |
| **Speed** | 🚀 Fast (3-5s) | 🐢 Slower (10-30s) |
| **Cold Start** | ✅ No delay | ⚠️ Yes (20-30s first time) |
| **Free Tier** | Limited daily requests | Yes, with rate limits |
| **Prompt Understanding** | 🧠 Excellent | Good |
| **Subject Consistency** | ✅ Maintains characters | ⚠️ Less consistent |
| **Setup** | Easy (Google account) | Easy (Free signup) |
| **Best For** | Production use | Testing & experimentation |

**Recommendation**: Use **Gemini** for better quality and faster generation! Fall back to HuggingFace if needed.

---

**Ready to generate images?** 

Add your Gemini API key and try:
> 📝 "Generate a logo for a tech startup"

You'll receive a beautiful AI-generated image in seconds! 🎨

For more details on Gemini image generation, see: [GEMINI_IMAGE_GENERATION.md](./GEMINI_IMAGE_GENERATION.md)

