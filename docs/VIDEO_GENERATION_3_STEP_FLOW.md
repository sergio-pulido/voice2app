# 🎬 3-Step Video Generation Flow

## Overview

The video generation feature now uses a **conversational 3-step flow** that guides users through creating videos with fal.ai Fabric 1.0.

## How It Works

### Step 1: Request Video Generation
User sends a message like:
- "Generate a video of a man walking and thinking about programming"
- "Create a talking video about AI"
- "Make a video for me"

**Bot responds:**
```
🎬 Let's Create a Video! (3-Step Process)

📋 Your request: "generate a video of..."

Step 1/3: Please provide an image for your video.

You can either:
• 📸 Send a photo - Upload an image from your gallery
• 📝 Describe it - Send a text description and I'll generate an image

💡 Example: "A professional presenter in a suit" or send a photo of yourself
```

### Step 2a: User Sends Photo
User uploads a photo from their device.

**Bot responds:**
```
✅ Image received!

🎤 Step 2/3: Now please send me a voice message with the audio for your video.

This will be the audio that plays in the video (e.g., narration, speech, etc.)
```

### Step 2b: User Sends Text Description
User sends: "A professional businessman in an office"

**Bot generates image and responds:**
```
🎨 Generating image from your description...

[Sends the generated image]

✅ Image generated!

🎤 Step 2/3: Now please send me a voice message with the audio for your video.

This will be the audio that plays in the video (e.g., narration, speech, etc.)
```

### Step 3: User Sends Voice Message
User records and sends a voice message with the narration/speech.

**Bot responds:**
```
🎬 Generating your video... This may take 20-40 seconds.

🎉 Video Generated Successfully!

📋 Prompt: "generate a video of..."

✅ Your talking video has been created using fal.ai Fabric 1.0!
🎬 The video combines your image with your audio.

📹 Sending video...

[Sends the MP4 video file]

✨ Video generation complete! Want to create another video? Just ask!
```

## Complete Flow Diagram

```
User: "Generate a video"
    ↓
Bot: "Step 1/3: Send photo or describe image"
    ↓
User: [Photo] OR [Text description]
    ↓
Bot: [Saves/generates image] "Step 2/3: Send voice message"
    ↓
User: [Voice message]
    ↓
Bot: "Generating video..." → [Sends MP4 video]
```

## State Management

The system maintains conversation state for each user:
- **State 1: awaiting_image** - Waiting for photo or text description
- **State 2: awaiting_audio** - Waiting for voice message
- **State 3: complete** - Video generated, session closed

**Session timeout:** 10 minutes (auto-cleanup)

## Testing Instructions

### Test 1: Photo + Voice
1. Send: "generate a video"
2. Upload a photo of a person
3. Record a voice message (5-10 seconds)
4. Receive generated video

### Test 2: Text Description + Voice
1. Send: "create a talking video"
2. Send: "A professional presenter in a blue suit"
3. Wait for image generation
4. Record a voice message
5. Receive generated video

### Test 3: Cancel and Restart
1. Send: "generate a video"
2. Send: "A businessman"
3. Wait 11 minutes (session expires)
4. Send: "generate another video" (starts new session)

## Files Modified

### New Files
1. **`packages/shared/video-state-manager.ts`**
   - State management for video sessions
   - Functions: `startVideoSession()`, `getVideoSession()`, `setVideoSessionImage()`, `setVideoSessionAudio()`, `completeVideoSession()`

### Modified Files
1. **`packages/telegram-gateway/index.ts`**
   - Added `handleVideoSessionMessage()` - Handles 3-step flow
   - Added `sendPhotoMessage()` - Sends images back to user
   - Added `sendVideoMessage()` - Sends generated videos
   - Modified `processMessage()` - Checks for active video sessions

2. **`packages/telegram-gateway/telegram-client.ts`**
   - Added `downloadPhotoFile()` - Downloads photos from Telegram

3. **`packages/router/adapters/video-adapter.ts`**
   - Changed to initiate 3-step flow instead of immediate generation
   - Starts video session
   - Returns instructions for Step 1

4. **`packages/shared/index.ts`**
   - Exports video-state-manager

## Technical Details

### Image Handling
- **Photos**: Downloaded from Telegram, saved to `artifacts/video_image_[timestamp].jpg`
- **Text descriptions**: Generated using Gemini Imagen 3, saved to `artifacts/image_[timestamp].png`

### Audio Handling
- Voice messages downloaded from Telegram
- Saved to `artifacts/video_audio_[timestamp].ogg`
- Passed to fal.ai as local file path

### Video Generation
- Uses fal.ai Fabric 1.0 API
- Combines image + audio
- Resolution: 720p (configurable)
- Output: `artifacts/video_[timestamp].mp4`

## Error Handling

### Common Errors

**Session Expired:**
```
The system will automatically clean up expired sessions after 10 minutes.
User can simply start a new video request.
```

**Image Generation Failed:**
```
❌ Video generation failed: Failed to generate image

Please try again by asking me to "generate a video"
```

**Video Generation Failed:**
```
❌ Video generation failed: Failed to generate video with fal.ai

Please try again by asking me to "generate a video"
```

**Photo Upload Failed:**
```
Failed to download photo
[Session canceled, user needs to restart]
```

## Session Management

### Storage
- In-memory Map (development)
- For production: Use Redis or database

### Cleanup
- Automatic timeout: 10 minutes
- Manual cleanup on completion or error
- No persistent storage (stateless after timeout)

### User Experience
- Only one active session per user
- Clear progress indicators (Step 1/3, 2/3, 3/3)
- Helpful examples and instructions
- Error messages guide user to restart

## API Usage

### fal.ai Credits
- **Resolution**: 720p (default)
- **Cost**: ~$0.15 per second of video
- **Example**: 10-second video = $1.50

### Gemini API
- Used for image generation from text
- Only called when user sends text description (not photo)

## Advantages of 3-Step Flow

1. **User Control**: Users choose their own image
2. **Flexibility**: Photo upload OR AI generation
3. **Clear Progress**: Step indicators guide users
4. **Natural Audio**: Users record their own voice/narration
5. **Stateful**: System remembers context between messages
6. **Error Recovery**: Sessions expire, users can restart

## Example Conversation

**User:** "generate a video of a teacher explaining math"

**Bot:** 
```
🎬 Let's Create a Video! (3-Step Process)

📋 Your request: "generate a video of a teacher explaining math"

Step 1/3: Please provide an image for your video.

You can either:
• 📸 Send a photo
• 📝 Describe it

💡 Example: "A professional presenter in a suit"
```

**User:** "A female teacher standing in front of a whiteboard"

**Bot:**
```
🎨 Generating image from your description...

[Image of teacher at whiteboard]

✅ Image generated!

🎤 Step 2/3: Now please send me a voice message with the audio for your video.
```

**User:** [Voice: "Today we'll learn about fractions..."]

**Bot:**
```
🎬 Generating your video... This may take 20-40 seconds.

🎉 Video Generated Successfully!

[Sends video showing teacher "speaking" the narration]

✨ Video generation complete!
```

## Future Enhancements

1. **Progress Indicators**: Real-time progress for video generation
2. **Video Preview**: Thumbnail preview before final generation
3. **Resolution Choice**: Let users choose 480p vs 720p
4. **Batch Generation**: Generate multiple videos in one session
5. **Video Editing**: Trim, crop, or adjust generated videos
6. **Templates**: Pre-defined styles (news anchor, tutorial, presentation)
7. **Multiple Voices**: Support multiple speakers in one video
8. **Background Music**: Add background audio tracks

## Troubleshooting

### Video Session Not Starting
- Check server logs: `make logs`
- Verify FAL_API_KEY is set
- Restart server: `make dev`

### Session State Not Persisting
- Sessions are in-memory only
- Restarting server clears all sessions
- Normal behavior for development

### Video Not Sending
- Check video file size (<20MB for Telegram)
- Check server logs for errors
- Verify video file was created in artifacts/

## Monitoring

Check server logs for:
```
🎬 Starting 3-step video generation for user [ID]
📸 Photo received for video generation
🎨 Generating image from your description...
🎤 Voice message received for video generation
🎬 Starting video generation with fal.ai...
🎬 Video generated: [path]
```

## Support

If you encounter issues:
1. Check server logs: `make logs`
2. Verify API keys in `.env`
3. Restart server: `make dev`
4. Check session state in logs
5. Verify fal.ai credits/quota

---

**Status**: ✅ Fully implemented and ready to test!  
**Version**: v2.7  
**Date**: October 2025

