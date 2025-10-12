# 🎬 Video Generation with fal.ai Fabric 1.0

## Overview

The Voice2App system now supports video generation using **fal.ai's Fabric 1.0** API, an image-to-video technology that creates talking/animated videos from static images and audio.

## What is Fabric 1.0?

Fabric 1.0 by VEED is a powerful image-to-video API that:
- Takes a static image as input
- Takes an audio file as input
- Generates a talking/animated video where the image appears to "speak" the audio
- Supports 480p and 720p resolutions
- Produces high-quality MP4 videos

**Use Cases**:
- Create talking avatars from photos
- Animate static images with voice-over
- Generate presentation videos with narration
- Create video content from images and podcasts

## Setup

### 1. Get Your fal.ai API Key

1. Visit [https://fal.ai](https://fal.ai)
2. Sign up for an account
3. Navigate to your dashboard
4. Generate an API key
5. Copy the API key

### 2. Configure Environment

Add your API key to `.env`:

```env
# Video Generation (optional)
FAL_API_KEY=your_fal_api_key_here
```

### 3. Verify Configuration

Check that your key is loaded:

```bash
# Run this in your terminal
echo $FAL_API_KEY
```

Or use the test script:

```bash
bun run scripts/test-setup.ts
```

## How It Works

### Current Implementation

The video adapter follows this flow:

1. **Check API Configuration**
   - Verifies FAL_API_KEY is set
   - Returns helpful error message if not configured

2. **Generate Image** (if not provided)
   - Uses Gemini Imagen 3 to generate image from text prompt
   - Saves image to `artifacts/` directory

3. **Check Audio Availability**
   - Currently requires audio URL to be provided
   - Future enhancement: Use voice message audio automatically

4. **Generate Video**
   - Calls fal.ai Fabric 1.0 API with image + audio
   - Downloads generated video
   - Saves to `artifacts/video_[timestamp].mp4`
   - Returns video path

5. **Error Handling**
   - Automatic retry logic (2 attempts with 5s delay)
   - User-friendly error messages
   - Detailed logging for debugging

### API Request Format

```typescript
{
  image_url: string,    // URL or path to image
  audio_url: string,    // URL or path to audio file
  resolution: '480p' | '720p'  // Video resolution
}
```

### API Response Format

```typescript
{
  video: {
    url: string,         // URL to download the video
    content_type: string // 'video/mp4'
  }
}
```

## Usage

### Via Telegram Bot

**Note**: Current implementation generates an image but requires audio URL integration for full video generation.

Send a message to your Telegram bot:

```
"Generate a video of a person talking about AI"
```

**What happens**:
1. AI Router classifies intent as `video_gen`
2. System generates an image from the prompt
3. If audio URL is available, generates video
4. Returns video file or partial result with image

### Programmatic Usage

```typescript
import { generateVideoWithFabricRetry } from './packages/router/services/fal-video-service'

// Generate video
const videoPath = await generateVideoWithFabricRetry({
  imageUrl: 'https://example.com/image.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  resolution: '720p'
})

console.log('Video saved to:', videoPath)
```

## Pricing

fal.ai Fabric 1.0 pricing is based on video duration:

- **480p**: $0.08 per second
- **720p**: $0.15 per second

**Examples**:
- 10-second video at 480p: $0.80
- 10-second video at 720p: $1.50
- 30-second video at 480p: $2.40
- 30-second video at 720p: $4.50

**Tip**: Use 480p for testing and prototypes, 720p for production.

## Technical Details

### File Structure

```
packages/router/
├── adapters/
│   └── video-adapter.ts         # Video generation adapter
└── services/
    └── fal-video-service.ts     # fal.ai Fabric 1.0 API integration
```

### Dependencies

- `fal-video-service.ts`: Handles API communication with fal.ai
- `gemini-image-service.ts`: Generates images for video input
- `video-adapter.ts`: Orchestrates the video generation flow

### Retry Logic

The service includes automatic retry logic:
- **Max Retries**: 2 attempts (total 3 tries)
- **Delay**: 5 seconds between retries
- **Reason**: Video generation may take longer, API might be busy

### Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `FAL_API_KEY not configured` | Missing API key | Add `FAL_API_KEY` to `.env` |
| `Invalid fal.ai API key` | Wrong/expired key | Check key at fal.ai dashboard |
| `fal.ai API quota exceeded` | Usage limit reached | Wait or upgrade plan |
| `Failed to download video` | Network issue | Retry request |
| `No audio URL provided` | Audio not available | Currently requires audio URL integration |

## Supported Formats

### Input

**Image**:
- JPEG/JPG
- PNG
- WebP
- GIF
- AVIF

**Audio**:
- MP3
- OGG
- WAV
- M4A
- AAC

### Output

**Video**:
- Format: MP4
- Codec: H.264
- Resolution: 480p (854×480) or 720p (1280×720)
- Container: MP4

## Limitations

### Current Limitations

1. **Audio URL Required**: Currently requires audio URL to be provided in `AdapterInput`
2. **No Direct Voice Integration**: Voice messages from Telegram need to be downloaded and converted to URLs
3. **Image Generation Dependency**: Requires Gemini API key for image generation from text prompts

### Future Enhancements

1. **Auto Voice-to-Audio**: Automatically use voice message audio for video generation
2. **Direct Image Upload**: Support uploading images directly for video generation
3. **Custom Avatar Support**: Allow users to upload custom avatars
4. **Video Templates**: Pre-defined templates for common use cases
5. **Batch Processing**: Generate multiple videos in one request

## Examples

### Example 1: Basic Video Generation

**Input**:
```typescript
const videoPath = await generateVideoWithFabric({
  imageUrl: 'https://example.com/person.jpg',
  audioUrl: 'https://example.com/speech.mp3',
  resolution: '720p'
})
```

**Output**:
```
🎬 Generating video with fal.ai Fabric 1.0...
📹 Video generated, downloading from: https://v3.fal.media/files/...
✅ Video generated and saved: video_1760225000000.mp4 (2.3MB)
```

### Example 2: With Retry Logic

```typescript
const videoPath = await generateVideoWithFabricRetry({
  imageUrl: 'https://example.com/person.jpg',
  audioUrl: 'https://example.com/speech.mp3',
  resolution: '480p'
}, 3) // 3 max retries

if (videoPath) {
  console.log('Success:', videoPath)
} else {
  console.error('Failed after retries')
}
```

### Example 3: Integration with Image Generation

```typescript
import { generateImageWithGeminiRetry } from './gemini-image-service'
import { generateVideoWithFabricRetry } from './fal-video-service'

// Generate image
const imagePath = await generateImageWithGeminiRetry('A professional presenter')

// Generate video
const videoPath = await generateVideoWithFabricRetry({
  imageUrl: imagePath,
  audioUrl: 'https://example.com/presentation.mp3',
  resolution: '720p'
})

console.log('Video:', videoPath)
```

## Testing

### Manual Testing

1. **Configure API Key**:
   ```bash
   echo "FAL_API_KEY=your_key_here" >> .env
   ```

2. **Start Server**:
   ```bash
   make dev
   ```

3. **Send Test Message** (via Telegram):
   ```
   Generate a video of a person talking about technology
   ```

### Test Script

Create `scripts/test-video-gen.ts`:

```typescript
import { generateVideoWithFabricRetry } from '../packages/router/services/fal-video-service'

async function test() {
  try {
    const videoPath = await generateVideoWithFabricRetry({
      imageUrl: 'https://example.com/test-image.jpg',
      audioUrl: 'https://example.com/test-audio.mp3',
      resolution: '480p'
    })
    
    console.log('✅ Test passed:', videoPath)
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

test()
```

Run:
```bash
bun run scripts/test-video-gen.ts
```

## Troubleshooting

### Video Generation Fails

**Check API Key**:
```bash
# Verify key is set
echo $FAL_API_KEY

# Test with curl
curl -X POST https://fal.run/fal-ai/veed/fabric-1.0 \
  -H "Authorization: Key $FAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"image_url":"...","audio_url":"...","resolution":"480p"}'
```

**Check Logs**:
```bash
make logs
# Look for "🎬 Generating video with fal.ai..."
# Check for error messages
```

**Verify Files**:
```bash
ls -lh artifacts/video_*.mp4
```

### "No audio URL provided" Error

This means the audio URL is not available in the input. To fix:

1. **Future Enhancement**: Modify `telegram-gateway/orchestrator.ts` to:
   - Download voice message from Telegram
   - Upload to temporary storage (S3, etc.)
   - Pass audio URL to video adapter

2. **Workaround**: Manually provide audio URL in the request

### API Rate Limits

If you hit rate limits:
- Wait before retrying
- Check your fal.ai dashboard for usage
- Consider upgrading your plan
- Use 480p instead of 720p to conserve quota

## API Reference

### `generateVideoWithFabric(options)`

Generate a video using fal.ai Fabric 1.0.

**Parameters**:
- `options.imageUrl` (string): URL or path to image
- `options.audioUrl` (string): URL or path to audio
- `options.resolution` ('480p' | '720p'): Video resolution

**Returns**: `Promise<string>` - Path to saved video file

**Throws**: Error if generation fails

### `generateVideoWithFabricRetry(options, maxRetries?)`

Generate video with automatic retry logic.

**Parameters**:
- `options`: Same as `generateVideoWithFabric()`
- `maxRetries` (number, default: 2): Maximum retry attempts

**Returns**: `Promise<string | null>` - Path to video file or null if failed

## Additional Resources

- **fal.ai Documentation**: [https://fal.ai/models/veed/fabric-1.0](https://fal.ai/models/veed/fabric-1.0)
- **fal.ai Dashboard**: [https://fal.ai/dashboard](https://fal.ai/dashboard)
- **API Pricing**: [https://fal.ai/pricing](https://fal.ai/pricing)
- **Support**: Contact fal.ai support for API issues

## Contributing

To improve video generation:

1. **Add Voice Integration**: Connect Telegram voice messages to audio URLs
2. **Optimize Costs**: Implement smart resolution selection
3. **Add Templates**: Create pre-defined video templates
4. **Batch Processing**: Support multiple video generation
5. **Progress Tracking**: Add progress callbacks for long videos

## License

This feature is part of the Voice2App project and follows the same MIT license.

