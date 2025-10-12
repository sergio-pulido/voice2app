# HuggingFace Model Upgrade Guide

## TL;DR - You're Now Using a Better Model! 🚀

Your image generation has been upgraded from **Stable Diffusion XL** to **Playground v2.5** - a much better model!

## What Changed

✅ **Model is now configurable** via `IMAGE_MODEL` in your `.env`  
✅ **Default upgraded** to `playgroundai/playground-v2.5-1024px-aesthetic`  
✅ **Better quality** images with same HuggingFace API  
✅ **No breaking changes** - everything just works better!

## Quick Start

### Option 1: Use the New Default (Recommended)

Just restart your server - you're already using Playground v2.5!

```bash
make clean && make dev
```

### Option 2: Choose a Different Model

Add to your `.env` file:

```bash
IMAGE_MODEL=black-forest-labs/FLUX.1-dev
```

Then restart:

```bash
make clean && make dev
```

## Available Models (Best to Worst)

### 🌟 Playground v2.5 (NEW DEFAULT - BEST CHOICE)

```bash
IMAGE_MODEL=playgroundai/playground-v2.5-1024px-aesthetic
```

**Pros:**
- ⭐⭐⭐⭐⭐ Excellent quality
- 🚀 Fast generation (5-10s)
- 🎨 Great aesthetics
- 🎯 Understands prompts well
- ✅ Works reliably on HuggingFace

**Best for:** General use, artistic images, quality results

---

### 🔥 Flux.1 Dev (HIGHEST QUALITY)

```bash
IMAGE_MODEL=black-forest-labs/FLUX.1-dev
```

**Pros:**
- ⭐⭐⭐⭐⭐ Best quality available
- 🎨 Photorealistic results
- 🧠 Excellent prompt understanding
- 🏆 State-of-the-art model

**Cons:**
- ⏱️ Slower (15-30s)
- 🔄 May have longer cold starts

**Best for:** When you need the absolute best quality

---

### ⚡ Stable Diffusion 3 Medium

```bash
IMAGE_MODEL=stabilityai/stable-diffusion-3-medium-diffusers
```

**Pros:**
- ⭐⭐⭐⭐ Very good quality
- 🆕 Newer than SDXL
- ⚡ Good speed

**Cons:**
- 🔄 May not be available on all HF endpoints yet

**Best for:** General use, balanced speed/quality

---

### 📦 Stable Diffusion XL (OLD DEFAULT)

```bash
IMAGE_MODEL=stabilityai/stable-diffusion-xl-base-1.0
```

**Pros:**
- ⭐⭐⭐ Good quality
- ✅ Very reliable
- 🌐 Always available

**Cons:**
- ⏰ Older model (2023)
- 🐢 Slower (10-30s)
- 📉 Lower quality than newer models

**Best for:** Fallback if other models don't work

---

## Comparison Table

| Model | Quality | Speed | Availability | Recommended |
|-------|---------|-------|--------------|-------------|
| **Playground v2.5** | ⭐⭐⭐⭐⭐ | 🚀 Fast | ✅ High | ✅ **YES** |
| **Flux.1 Dev** | ⭐⭐⭐⭐⭐ | 🐢 Slower | ⚠️ Medium | 🎨 For best quality |
| **SD3 Medium** | ⭐⭐⭐⭐ | ⚡ Good | ⚠️ Medium | 🆕 If available |
| **SDXL** | ⭐⭐⭐ | 🐢 Slow | ✅ High | ⚠️ Fallback only |

## How to Switch Models

### 1. Edit Your `.env`

```bash
# Add or update this line:
IMAGE_MODEL=playgroundai/playground-v2.5-1024px-aesthetic
```

### 2. Restart Server

```bash
make clean && make dev
```

### 3. Test It Out

Send a message to your bot:
> "Generate an image of a dragon programming"

You'll see the new model name in the response!

## What You'll See

### Before (SDXL):
```
Generated with: Stable Diffusion XL • 18.5s
```

### After (Playground v2.5):
```
Generated with: Playground v2.5 • 6.2s
```

## Tips for Each Model

### Playground v2.5 Tips
- Great for artistic and aesthetic images
- Works well with descriptive prompts
- Fast and reliable

**Example prompts:**
- "A serene landscape with mountains at sunset, cinematic lighting"
- "Portrait of a friendly robot, digital art style"
- "Modern minimalist logo for a tech company"

### Flux.1 Tips
- Best for photorealistic images
- Excellent with complex prompts
- Use detailed descriptions for best results

**Example prompts:**
- "Professional photograph of a cozy coffee shop interior, warm lighting, shallow depth of field"
- "Hyperrealistic portrait of a wise old wizard, detailed textures"
- "Photorealistic rendering of a futuristic city skyline at night"

### SD3 Tips
- Good balance of speed and quality
- Works well with clear, specific prompts
- Reliable for most use cases

### SDXL Tips (Fallback)
- Keep prompts simple and clear
- May need to wait 20-30s for first image (cold start)
- Use as fallback if newer models fail

## Troubleshooting

### "Model is loading" Error

Some models have cold starts. Wait 20-30 seconds and try again.

### Model Not Available

If a model doesn't work, try another:

1. **Playground v2.5** (should always work)
2. **SDXL** (fallback, very reliable)
3. **Flux.1** (best quality if available)

### Slow Generation

- **Playground v2.5**: Usually 5-10s
- **Flux.1**: May take 15-30s (worth the wait!)
- **SDXL**: 10-30s depending on cold start

## Advanced: Custom Models

You can use ANY HuggingFace text-to-image model!

```bash
IMAGE_MODEL=username/model-name
```

**Requirements:**
- Model must support HuggingFace Inference API
- Must be a text-to-image model
- Must be publicly accessible or you need access

**Popular choices:**
- `runwayml/stable-diffusion-v1-5` (classic)
- `prompthero/openjourney` (Midjourney-style)
- `stablediffusionapi/realistic-vision-v51` (photorealistic)

## Performance Comparison

Based on typical generation times:

```
Playground v2.5:  ████████░░ (5-10s)  ⭐⭐⭐⭐⭐
Flux.1 Dev:       ████████████████ (15-30s)  ⭐⭐⭐⭐⭐
SD3 Medium:       ██████████ (8-15s)  ⭐⭐⭐⭐
SDXL:            ████████████ (10-30s)  ⭐⭐⭐
```

## Cost

All models use the same HuggingFace API:

- ✅ **Free tier**: Same for all models
- ✅ **Rate limits**: Same for all models
- ✅ **API key**: One key works for all

**No additional cost to use better models!**

## Recommendations by Use Case

### General Use / Production
→ **Playground v2.5** (default)
- Fast, reliable, great quality

### Best Quality Possible
→ **Flux.1 Dev**
- Highest quality, worth the wait

### Fast Prototyping
→ **Playground v2.5**
- Quick iterations, good results

### Artistic Images
→ **Playground v2.5** or **Flux.1**
- Both excel at artistic styles

### Photorealistic
→ **Flux.1 Dev**
- Best for realistic images

### Maximum Reliability
→ **SDXL**
- Always available, proven stable

## Summary

✅ **Default upgraded** to Playground v2.5  
✅ **Better quality** images automatically  
✅ **Faster generation** than before  
✅ **Easy to switch** models anytime  
✅ **No extra cost** - same API key

## Questions?

See also:
- [IMAGE_GENERATION.md](./IMAGE_GENERATION.md) - General image generation guide
- [PROVIDERS.md](./PROVIDERS.md) - Provider configuration

---

**Enjoy your upgraded image generation!** 🎨✨

**Current Best Choice:** Playground v2.5 (already set as default!)

