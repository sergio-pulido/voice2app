# Discord Gateway

Discord bot gateway for Voice2App. Receives Discord interactions (slash commands) and processes them through the shared orchestrator.

## Overview

This package provides a Discord bot interface for Voice2App, allowing users to generate applications using slash commands in Discord servers.

## Architecture

```
Discord User
    ↓
/generate command with prompt
    ↓
Discord Gateway (this package)
    ↓
Shared Orchestrator
    ↓
AI Router → Adapters → Response
    ↓
Discord Notifier → User
```

## Files

- **`index.ts`** - Main gateway that handles Discord interactions
- **`discord-client.ts`** - Discord API client utilities
- **`discord-notifier.ts`** - Notification system for sending responses
- **`README.md`** - This file

## Features

✅ **Slash Commands** - `/generate`, `/create`, `/build`, `/help`  
✅ **Deferred Responses** - Handles long-running operations  
✅ **File Attachments** - Screenshots, voice replies, generated code  
✅ **Rich Formatting** - Markdown support in messages  
✅ **Request Verification** - Ed25519 signature verification  
🚧 **Voice Input** - Coming soon  
🚧 **Button Interactions** - Coming soon  

## Setup

See [DISCORD_BOT_SETUP.md](../../docs/DISCORD_BOT_SETUP.md) for detailed setup instructions.

### Quick Start

1. Create a Discord application at https://discord.com/developers/applications
2. Add the bot credentials to your `.env`:
   ```env
   DISCORD_BOT_TOKEN=your_bot_token
   DISCORD_APPLICATION_ID=your_app_id
   DISCORD_PUBLIC_KEY=your_public_key
   ```
3. Register slash commands (see setup guide)
4. Set up interactions endpoint URL
5. Invite bot to your server
6. Start using `/generate` command!

## Usage

### Commands

**Generate an app:**
```
/generate prompt: Create a todo list with dark mode
```

**Get help:**
```
/help
```

### Response Flow

1. User sends `/generate` command
2. Gateway defers response (Discord requires response within 3s)
3. Request is processed through the orchestrator
4. Result is sent via `editInteractionResponse`
5. User receives the completed response with attachments

## Implementation Details

### Discord Interaction Types

- **Type 1 (PING)** - Verification ping from Discord
- **Type 2 (APPLICATION_COMMAND)** - Slash commands
- **Type 3 (MESSAGE_COMPONENT)** - Button clicks, select menus (future)
- **Type 4 (AUTOCOMPLETE)** - Command autocomplete (future)
- **Type 5 (MODAL_SUBMIT)** - Modal form submissions (future)

### Security

All requests are verified using Ed25519 signature verification to ensure they come from Discord.

### Deferred Responses

Discord requires a response within 3 seconds. Since AI processing takes longer:
1. We immediately defer the response (`type: 5`)
2. Process the request asynchronously
3. Edit the deferred response with the final result

## DRY & SOLID Principles

### Shared Components

- **Orchestrator** - Shared between Telegram and Discord (`packages/shared/orchestrator.ts`)
- **Types** - Common types in `packages/shared/types.ts`
- **Config** - Centralized configuration in `packages/shared/config.ts`

### Single Responsibility

- `discord-client.ts` - Only handles Discord API communication
- `discord-notifier.ts` - Only handles sending notifications
- `index.ts` - Only handles routing interactions

### Dependency Inversion

The orchestrator doesn't depend on Discord or Telegram specifics. It depends on abstractions:
- Platform type: `'telegram' | 'discord'`
- Generic notification interface
- Common data types

## Extending

To add new slash commands:

1. Register the command with Discord API
2. Add a case in `processCommand()` in `index.ts`
3. Implement the handler function

Example:
```typescript
case 'mycommand':
  await handleMyCommand(interaction, userId, username, channelId)
  break
```

## Testing

Test the gateway:
```bash
# Start the server
bun run dev

# Send a test interaction (requires ngrok/hookdeck)
# Use Discord's developer portal to test
```

## Troubleshooting

**Commands not showing up**
- Commands can take up to 1 hour to sync globally
- Use guild commands for instant testing (register to specific server)

**"Invalid signature" errors**
- Verify your `DISCORD_PUBLIC_KEY` is correct
- Ensure you're using the public key, not the bot token

**"Unknown interaction" errors**
- The interaction token expires after 15 minutes
- Make sure to respond within this timeframe

**No response from bot**
- Check server logs for errors
- Verify your AI provider keys are configured
- Test the `/health` endpoint

## Related Packages

- `packages/telegram-gateway` - Telegram bot gateway
- `packages/shared/orchestrator.ts` - Shared orchestration logic
- `packages/router` - AI-powered intent routing
- `packages/notifier` - Telegram notifications (Telegram-specific)

## API Endpoints

- `POST /discord` - Discord interactions webhook
- `GET /health` - Health check endpoint

## Resources

- [Discord Interactions](https://discord.com/developers/docs/interactions/overview)
- [Slash Commands Guide](https://discord.com/developers/docs/interactions/application-commands)
- [Discord API Reference](https://discord.com/developers/docs/reference)

