# 🎨 Image Generation with HuggingFace

## Overview

Voice2App now supports **AI image generation** using HuggingFace's Stable Diffusion XL model!

Send an image request via Telegram and receive a high-quality AI-generated image.

---

## Setup (5 minutes)

### 1. Get HuggingFace API Key

1. Go to: https://huggingface.co
2. Sign up for a free account
3. Go to **Settings** → **Access Tokens**
4. Click **New token**
5. Name: `Voice2App`
6. Type: **Read**
7. Copy the token

### 2. Add to Environment

Add to your `.env` file:

```env
HUGGINGFACE_API_KEY=hf_your_api_key_here
```

### 3. Restart Server

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

Generated with: Stable Diffusion XL
Time: 15.2s

[Image attached]
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

**Ready to generate images?** 

Add your HuggingFace API key and try:
> 📝 "Generate a logo for a tech startup"

You'll receive a beautiful AI-generated image! 🎨

