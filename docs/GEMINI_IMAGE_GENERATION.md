# Google Gemini Image Generation (Experimental)

This project includes **experimental support** for Google's Gemini image generation capabilities.

## ⚠️ Current Status: Experimental

Google's "Nano Banana" (Gemini 2.5 Flash Image / Imagen 3) is an amazing model, but accessing it programmatically requires:

- **Vertex AI Setup** - More complex than simple API keys
- **GCP Project** - Requires Google Cloud Platform project
- **Service Account** - OAuth2 authentication needed

**Current Implementation Status:**
- ✅ Code structure ready for Gemini integration
- ⚠️ Requires Vertex AI setup (more complex than HuggingFace)
- 🔄 Testing in progress

**Recommendation:** For now, use `IMAGE_PROVIDER=huggingface` which works out of the box with a simple API key.

## Why Gemini Imagen 3 (When Available)?

When fully integrated, Gemini's Imagen 3 model ("Nano Banana") offers several advantages:

✅ **Better Quality** - More realistic and detailed images  
✅ **Faster Generation** - Typically generates images in 3-5 seconds  
✅ **Better Understanding** - Superior comprehension of complex prompts  
✅ **Subject Consistency** - Maintains character likeness across edits  
✅ **Multi-Image Fusion** - Can blend multiple concepts seamlessly  
✅ **Real-time Editing** - Advanced photo editing capabilities  

## Setup (Experimental)

### Option 1: Try the Simple Gemini API (May Not Work Yet)

The code attempts to use Gemini's standard API for image generation, but this feature may not be fully available yet.

1. Visit [Google AI Studio](https://ai.google.dev)
2. Sign in with your Google account
3. Click "Get API Key"
4. Copy your API key

Add to your `.env`:

```bash
IMAGE_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
```

**Note:** If this doesn't work (which is likely), you'll see a helpful error message suggesting to use HuggingFace instead.

### Option 2: Use HuggingFace (Recommended for Now)

Until Gemini image generation is fully integrated, use HuggingFace:

```bash
IMAGE_PROVIDER=huggingface
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

Get a free HuggingFace API key at: https://huggingface.co

## Usage

Once configured, simply ask for an image generation:

**Examples:**
- "Generate an image of a sunset over mountains"
- "Create a picture of a cute robot playing guitar"
- "Show me a cyberpunk city at night"

The system will automatically use Gemini to generate your images!

## Switching Providers

You can easily switch between image providers by changing the `IMAGE_PROVIDER` in your `.env`:

### Use Gemini (Recommended)
```bash
IMAGE_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
```

### Use HuggingFace (Stable Diffusion XL)
```bash
IMAGE_PROVIDER=huggingface
HUGGINGFACE_API_KEY=your_key_here
```

## Features

### What Gemini Imagen 3 Can Do:

1. **Text-to-Image Generation**
   - High-quality image generation from text descriptions
   - Understands complex prompts with multiple elements
   - Generates realistic humans, animals, objects, and scenes

2. **Subject Consistency**
   - Maintains character appearance across different prompts
   - Perfect for creating consistent character designs

3. **Advanced Editing**
   - Real-time photo modifications
   - Change lighting, colors, and content
   - Blend multiple images seamlessly

4. **Safety Features**
   - Built-in content filtering
   - Configurable safety levels
   - Respects content policies

## Pricing

Gemini Imagen 3 pricing is competitive and transparent:

- **Free Tier**: Limited requests per day (perfect for testing)
- **Paid Plans**: Pay-as-you-go pricing based on image count
- Check [Google AI Pricing](https://ai.google.dev/pricing) for current rates

## Troubleshooting

### "Gemini API key not configured"
- Make sure `GEMINI_API_KEY` is set in your `.env`
- Restart your server after adding the key

### "Permission denied" or 403 errors
- Verify your API key is correct
- Make sure you're using a valid Google account
- Check if you need to enable billing (for paid tier)

### "Model not found"
- The Imagen 3 API might not be available in your region yet
- Try switching to `IMAGE_PROVIDER=huggingface` as a fallback

### Images taking too long
- Gemini usually generates images in 3-5 seconds
- If it's slower, check your internet connection
- Retry logic is built-in and will attempt up to 2 times

## API Details

The integration uses:
- **Endpoint**: `generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict`
- **Model**: Imagen 3.0
- **Format**: PNG images
- **Aspect Ratio**: 1:1 (square)
- **Quality**: High
- **Safety Filter**: Block some (configurable)

## Comparison: Gemini vs HuggingFace

| Feature | Gemini (Imagen 3) | HuggingFace (SDXL) |
|---------|-------------------|-------------------|
| Quality | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Speed | Fast (3-5s) | Slower (10-30s) |
| Cold Start | No | Yes (20-30s) |
| Free Tier | Limited | Yes |
| Prompt Understanding | Excellent | Good |
| Subject Consistency | Excellent | Fair |
| Setup Complexity | Easy | Easy |

## Next Steps

1. **Try it out**: Generate your first image with Gemini!
2. **Experiment**: Test complex prompts and see the quality
3. **Compare**: Try both providers to see which you prefer
4. **Share**: Show off your AI-generated images!

## Resources

- [Google AI Studio](https://ai.google.dev)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Imagen 3 Blog Post](https://blog.google/products/gemini/)
- [Get Your API Key](https://ai.google.dev/tutorials/setup)

---

**Note**: Gemini Imagen 3 is also known as "Nano Banana" - a nickname that went viral due to its impressive image generation capabilities!

