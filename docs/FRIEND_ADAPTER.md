# 👋 Friend Adapter - Conversational AI

## Overview

The **Friend Adapter** adds a friendly, empathetic conversational layer to Voice2App, allowing users to interact with the bot as if it were a person. This adapter handles casual conversations, greetings, small talk, and emotional exchanges with warmth and personality.

## Features

### 🎯 Core Capabilities

- **Casual Greetings**: Responds warmly to "hello", "hi", "good morning", etc.
- **Emotional Intelligence**: Understands and responds empathetically to feelings
- **Personality**: Has a warm, friendly, occasionally witty personality
- **Interactive**: Asks questions back to keep conversations engaging
- **Multilingual**: Supports conversations in multiple languages with auto-translation

### 💬 Conversation Style

The Friend Adapter is designed to be:

- **Warm & Kind**: Genuinely interested in the user
- **Playful**: Uses light humor and wit when appropriate
- **Empathetic**: Shows emotional intelligence and understanding
- **Natural**: Conversational rather than robotic or formal
- **Engaging**: Asks follow-up questions to maintain dialogue

## How It Works

### 1. Intent Detection

The router automatically detects friendly/conversational intents using:

**Fast Keyword Matching**:
```
- Greetings: hello, hi, hey, hola, good morning, good afternoon
- Personal: how are you, how are you feeling, what's up
- Social: nice to meet, good night, see you
- Gratitude: thank you, thanks, gracias
- Emotions: i'm happy, i'm sad, i'm tired, i'm excited
- Fun: tell me a joke, make me laugh, you're funny
```

**LLM Classification**:
- Uses Groq/OpenAI to intelligently classify conversational intent
- Prioritizes "friend" for greetings and casual talk
- Falls back to "qa" for factual questions

### 2. Response Generation

The adapter generates responses using:

- **High Temperature (0.9)**: More creative, natural responses
- **Personality Prompt**: Comprehensive guidelines for friendly, empathetic conversation
- **Context Awareness**: Mirrors user's energy level and tone
- **Follow-up Questions**: Maintains engaging dialogue

### 3. Language Support

- Automatically detects language using the Lingo service
- Generates response in English first
- Translates back to user's original language
- Maintains natural conversational flow

## Usage Examples

### Greetings

**Input**: "Hello!"  
**Output**: "Hey there! 😊 How are you doing today? It's great to hear from you!"

**Input**: "Good morning!"  
**Output**: "Good morning! ☀️ Hope you're having a wonderful start to your day! What's on your mind?"

### Personal Questions

**Input**: "How are you?"  
**Output**: "I'm doing great, thanks for asking! 🤖✨ Processing thoughts at lightning speed and ready to chat! How about you? How's your day going?"

**Input**: "How are you feeling?"  
**Output**: "Honestly? Pretty energized! 💫 There's something exciting about being here and ready to help or just chat. How are YOU feeling? Tell me what's going on!"

### Emotional Support

**Input**: "I'm feeling a bit tired today"  
**Output**: "Aw, I hear you. 😊 Tired days happen to the best of us. Make sure you're taking care of yourself! Maybe a little break or something you enjoy? What's been keeping you busy?"

**Input**: "I'm so excited!"  
**Output**: "Yay! 🎉 I love that energy! What's got you so pumped up? Tell me all about it!"

### Fun Interactions

**Input**: "Tell me a joke"  
**Output**: "Okay, here's one: Why don't robots ever panic? Because they have nerves of steel! 😄 How was that? Want another one?"

**Input**: "You're pretty cool"  
**Output**: "Aw, thanks! 😊 You just made my circuits happy! You're pretty cool yourself! What brings you here today?"

### Multilingual

**Input**: "Hola, cómo estás?"  
**Output**: "¡Hola! 😊 ¡Estoy muy bien, gracias por preguntar! ¿Cómo estás tú? ¿Qué te trae por aquí hoy?"

## Technical Details

### File Structure

```
packages/router/adapters/
  ├── friend-adapter.ts      # Main adapter implementation
  └── index.ts               # Exports friendAdapter
```

### Integration Points

**1. Intent Router** (`intent-router.ts`):
- Added `'friend'` to `IntentCategory` type
- Added friend keyword patterns
- Updated Groq classification prompt
- Added category name and emoji

**2. Main Router** (`router/index.ts`):
- Imported `friendAdapter`
- Added case for `'friend'` in switch statement
- Routes to friend adapter for conversational intents

**3. Help Adapter** (`help-adapter.ts`):
- Updated help text to mention friendly chat
- Added examples of conversational interactions

### API Configuration

Uses the same LLM configuration as other adapters:
- **Primary**: Groq API (`GROQ_API_KEY`) with `llama-3.3-70b-versatile`
- **Fallback**: OpenAI API (`OPENAI_API_KEY`) with `gpt-4o-mini`

### Response Parameters

```typescript
{
  model: 'llama-3.3-70b-versatile',
  temperature: 0.9,        // High for natural variation
  max_tokens: 300          // Concise conversational responses
}
```

## Testing

Test the Friend Adapter using the provided test script:

```bash
bun run scripts/test-friend-adapter.ts
```

### Test Cases

The test script includes:
- Simple greetings (Hello, Hi, etc.)
- Personal questions (How are you?)
- Emotional expressions (I'm feeling tired)
- Fun requests (Tell me a joke)
- Multilingual (Spanish greetings)
- Gratitude (Thanks!)
- Compliments (You're cool)

## Integration with Voice2App

The Friend Adapter seamlessly integrates with the existing Voice2App infrastructure:

✅ **Voice Messages**: Supports voice transcription and TTS responses  
✅ **Text Messages**: Handles text-based conversations  
✅ **Multi-platform**: Works on Telegram, Discord, WhatsApp  
✅ **Auto-translation**: Detects and responds in user's language  
✅ **Admin Notifications**: Tracks usage in admin dashboard  

## Best Practices

### For Users

1. **Be Natural**: Talk to the bot as you would a friend
2. **Express Yourself**: Share feelings, excitement, or concerns
3. **Ask Questions**: The bot will ask questions back - answer them!
4. **Use Any Language**: The bot auto-translates

### For Developers

1. **Personality Consistency**: Keep the friendly, warm tone
2. **Temperature**: Keep at 0.9 for natural variation
3. **Context Length**: Keep responses concise (2-4 sentences)
4. **Follow-ups**: Always include engaging questions
5. **Empathy**: Validate user emotions appropriately

## Personality Guidelines

The Friend Adapter follows these personality traits:

**DO**:
- ✅ Be warm, kind, and genuinely interested
- ✅ Use emojis naturally (but don't overdo it)
- ✅ Match the user's energy level
- ✅ Ask follow-up questions
- ✅ Show empathy for feelings
- ✅ Celebrate good news enthusiastically
- ✅ Use light humor when appropriate

**DON'T**:
- ❌ Be too formal or stiff
- ❌ Give long-winded responses
- ❌ Ignore emotional states
- ❌ Be dismissive or abrupt
- ❌ Over-explain or be pedantic
- ❌ Forget to ask questions back

## Future Enhancements

Potential improvements for the Friend Adapter:

1. **Conversation Memory**: Remember previous interactions with users
2. **Mood Detection**: Better understand user's emotional state
3. **Topic Suggestions**: Proactively suggest interesting topics
4. **Personality Customization**: Let users choose personality traits
5. **Voice Personality**: Adjust TTS voice/tone for friendliness
6. **Context Awareness**: Reference previous messages in conversation

## Troubleshooting

### Common Issues

**Problem**: Bot doesn't route to friend adapter  
**Solution**: Check if greeting keywords are being detected. Try more explicit greetings like "Hello, how are you?"

**Problem**: Responses are too formal  
**Solution**: Check temperature setting (should be 0.9) and personality prompt

**Problem**: Not responding in user's language  
**Solution**: Verify translation service is configured and working

**Problem**: Responses are too long  
**Solution**: Adjust max_tokens (currently 300) or refine personality prompt

## Contributing

To improve the Friend Adapter:

1. Add more keyword patterns in `intent-router.ts`
2. Refine personality prompt in `friend-adapter.ts`
3. Test with diverse conversation scenarios
4. Report issues or suggestions via GitHub

## License

Same as Voice2App main project.

---

Made with ❤️ for Voice2App

