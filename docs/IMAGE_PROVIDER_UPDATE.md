# Image Provider Update - Multi-Provider Support

## Summary

The image generation system has been updated to support multiple providers, with infrastructure ready for Google's Gemini (Nano Banana / Imagen 3) and continued support for HuggingFace (Stable Diffusion XL).

## Changes Made

### 1. New Files Created

- **`packages/router/services/gemini-image-service.ts`**
  - Implements Google Gemini image generation
  - Includes retry logic and error handling
  - Attempts to use Gemini 2.0 Flash for image generation
  - Provides helpful error messages if image generation isn't supported

### 2. Modified Files

- **`packages/router/adapters/image-adapter.ts`**
  - Now supports multiple image providers
  - Dynamically selects provider based on configuration
  - Enhanced error messages for each provider
  - Updated metadata to include provider information

- **`packages/shared/config.ts`**
  - Added `geminiApiKey` configuration
  - Added `imageProvider` selection (gemini | huggingface)
  - Default: `huggingface` (more straightforward to set up)

- **`packages/shared/providers.ts`**
  - Added `ImageProvider` type definition
  - Supports 'gemini' and 'huggingface' options

- **`env.template`**
  - Added `GEMINI_API_KEY` configuration option
  - Added `IMAGE_PROVIDER` selection
  - Documented setup for both providers

### 3. Documentation

- **`docs/GEMINI_IMAGE_GENERATION.md`** (NEW)
  - Comprehensive guide for Gemini image generation
  - Current status: Experimental
  - Setup instructions for both Gemini and HuggingFace
  - Explains why Gemini is currently experimental

- **`docs/IMAGE_GENERATION.md`** (UPDATED)
  - Updated to reflect multi-provider support
  - Added comparison table between providers
  - Recommends Gemini when fully available
  - Clear setup instructions for both options

## How to Use

### Option A: HuggingFace (Recommended for Now)

```bash
# In your .env file
IMAGE_PROVIDER=huggingface
HUGGINGFACE_API_KEY=your_key_here
```

**Pros:**
- ✅ Works out of the box
- ✅ Simple API key setup
- ✅ Free tier available
- ✅ Proven and stable

**Cons:**
- ⚠️ Slower (10-30s generation)
- ⚠️ Cold start delays (20-30s first time)
- ⚠️ Lower quality than Gemini

### Option B: Google Gemini (Experimental)

```bash
# In your .env file
IMAGE_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
```

**Status:**
- 🔄 Experimental - may not work yet
- ⚠️ Requires testing with actual API
- 💡 Code attempts to use Gemini 2.0 Flash API
- 📋 Provides helpful error if not supported

**When it works, you'll get:**
- ⭐ Better image quality
- ⚡ Faster generation (3-5s)
- 🎯 Better prompt understanding
- 🎨 Subject consistency across images

## Why Gemini is Experimental

Google's "Nano Banana" (Gemini 2.5 Flash Image / Imagen 3) is an incredible model, but:

1. **Vertex AI Requirement**: The official way to use it requires Vertex AI, not the simple Google AI Studio API
2. **Complex Setup**: Vertex AI needs GCP project, service account, OAuth2
3. **API Limitations**: The standard Gemini API (generativelanguage.googleapis.com) may not support image *generation* yet (it can analyze images, but generating them is different)

## Implementation Details

### Architecture

```
User Request
    ↓
Intent Router (detects image generation intent)
    ↓
Image Adapter
    ↓
Provider Selection (based on IMAGE_PROVIDER config)
    ↓
    ├─→ Gemini Service (experimental)
    │   └─→ Tries Gemini 2.0 Flash API
    │       └─→ Falls back with helpful error if not supported
    │
    └─→ HuggingFace Service (stable)
        └─→ Uses Stable Diffusion XL
```

### Error Handling

The system provides context-aware error messages:

- **Gemini not configured**: Suggests adding API key or switching to HuggingFace
- **Image generation not supported**: Explains that Gemini image gen may not be available yet
- **API errors**: Provides specific guidance based on error type (quota, auth, etc.)
- **Retry logic**: Automatically retries failed generations

### Graceful Degradation

1. Try selected provider
2. If fails, provide helpful error message
3. Suggest alternative provider
4. Never crash - always return user-friendly response

## Testing

### Test HuggingFace (Should Work)

```bash
# 1. Set up HuggingFace
IMAGE_PROVIDER=huggingface
HUGGINGFACE_API_KEY=your_hf_key

# 2. Restart server
make clean && make dev

# 3. Send message to bot
"Generate an image of a sunset over mountains"
```

### Test Gemini (Experimental)

```bash
# 1. Set up Gemini
IMAGE_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key

# 2. Restart server
make clean && make dev

# 3. Send message to bot
"Generate an image of a cute robot"

# 4. Check response
# - If successful: You'll get an image! 🎉
# - If not: You'll get a clear error explaining the limitation
```

## Future Improvements

### Short Term
- [x] Multi-provider architecture
- [x] Gemini service implementation
- [ ] Test with actual Gemini API
- [ ] Handle Gemini-specific features

### Medium Term
- [ ] Add Vertex AI support for full Imagen 3 access
- [ ] Support for image editing (Gemini's strength)
- [ ] Multi-image fusion capabilities
- [ ] Aspect ratio selection

### Long Term
- [ ] Add more providers (DALL-E, Midjourney API)
- [ ] Image upscaling support
- [ ] Style transfer capabilities
- [ ] User preferences for default provider

## Migration Guide

### For Existing Users

No changes required! Your existing `HUGGINGFACE_API_KEY` will continue to work.

The system defaults to HuggingFace if no `IMAGE_PROVIDER` is specified.

### To Try Gemini

1. Get API key from https://ai.google.dev
2. Add to `.env`:
   ```bash
   IMAGE_PROVIDER=gemini
   GEMINI_API_KEY=your_key
   ```
3. Restart server
4. Test image generation
5. If it doesn't work, you'll get a helpful error - just switch back to HuggingFace

## Technical Notes

### Why Not Vertex AI Yet?

Vertex AI provides the most reliable access to Imagen 3, but requires:

```typescript
// Complex setup required:
- Google Cloud Project
- Service Account JSON
- OAuth2 authentication flow
- Vertex AI API enabled
- Billing account linked
```

This is more complex than our goal of "simple API key setup."

We may add Vertex AI support in the future for users who want the best quality and are willing to do the setup.

### API Endpoint Used

Currently attempting:
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent
```

This is the standard Gemini API endpoint. We're attempting to get image output from it, but this feature may not be available yet through this endpoint.

## Questions?

See:
- [GEMINI_IMAGE_GENERATION.md](./GEMINI_IMAGE_GENERATION.md) - Detailed Gemini guide
- [IMAGE_GENERATION.md](./IMAGE_GENERATION.md) - General image generation guide
- [PROVIDERS.md](./PROVIDERS.md) - Provider configuration guide

## Summary

✅ **What Works Now:**
- HuggingFace image generation (stable, tested)
- Multi-provider architecture (ready for expansion)
- Graceful error handling
- Easy provider switching

🔄 **What's Experimental:**
- Gemini image generation (needs testing)
- May require Vertex AI for full functionality

💡 **Recommendation:**
- Use `IMAGE_PROVIDER=huggingface` for production
- Try `IMAGE_PROVIDER=gemini` if you're feeling adventurous
- Expect Gemini to improve as Google's APIs evolve

---

**Happy Image Generating!** 🎨

