# Discord Bot Setup Guide

This guide will help you set up the Discord bot gateway for Voice2App.

## Prerequisites

- A Discord account
- Administrator access to a Discord server (or ability to create one)

## Step 1: Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Give your application a name (e.g., "Voice2App")
4. Click **"Create"**

## Step 2: Get Your Application Credentials

### Application ID
1. In your application, go to **"General Information"**
2. Copy the **Application ID**
3. Add it to your `.env` file:
   ```
   DISCORD_APPLICATION_ID=your_application_id_here
   ```

### Public Key
1. Still in **"General Information"**
2. Copy the **Public Key**
3. Add it to your `.env` file:
   ```
   DISCORD_PUBLIC_KEY=your_public_key_here
   ```

## Step 3: Create a Bot

1. In your application, go to **"Bot"** in the left sidebar
2. Click **"Add Bot"** and confirm
3. Under the bot's username, click **"Reset Token"** and confirm
4. Copy the bot token (keep it secure!)
5. Add it to your `.env` file:
   ```
   DISCORD_BOT_TOKEN=your_bot_token_here
   ```

### Bot Permissions

Scroll down to **"Privileged Gateway Intents"** and enable:
- ✅ **Message Content Intent** (if you want to read message content)

Scroll down to **"Bot Permissions"** and select:
- ✅ **Send Messages**
- ✅ **Attach Files**
- ✅ **Use Slash Commands**

## Step 4: Configure Interactions Endpoint

1. Expose your local server to the internet using a tunnel service:

   **Option A: Using ngrok**
   ```bash
   ngrok http 3020
   ```
   
   **Option B: Using Hookdeck CLI**
   ```bash
   hookdeck listen 3020
   ```

2. Copy the public URL (e.g., `https://abc123.ngrok.io`)

3. In the Discord Developer Portal, go to **"General Information"**

4. Under **"Interactions Endpoint URL"**, enter:
   ```
   https://your-public-url.com/discord
   ```

5. Click **"Save Changes"**
   - Discord will send a PING request to verify your endpoint
   - The bot will automatically respond with a PONG

## Step 5: Register Slash Commands

You need to register slash commands with Discord. Create a script or use this curl command:

```bash
curl -X POST \
  "https://discord.com/api/v10/applications/YOUR_APP_ID/commands" \
  -H "Authorization: Bot YOUR_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "generate",
    "description": "Generate an app from a text description",
    "options": [
      {
        "name": "prompt",
        "description": "Describe the app you want to create",
        "type": 3,
        "required": true
      }
    ]
  }'
```

Replace `YOUR_APP_ID` and `YOUR_BOT_TOKEN` with your actual credentials.

You can register multiple commands:
- `/generate` - Main command for generating apps
- `/create` - Alias for generate
- `/build` - Another alias for generate
- `/help` - Show help information

## Step 6: Invite the Bot to Your Server

1. In the Discord Developer Portal, go to **"OAuth2"** → **"URL Generator"**

2. Select the following scopes:
   - ✅ **bot**
   - ✅ **applications.commands**

3. Select bot permissions:
   - ✅ **Send Messages**
   - ✅ **Attach Files**
   - ✅ **Use Slash Commands**

4. Copy the generated URL at the bottom

5. Open the URL in your browser and select the server to invite the bot to

6. Click **"Authorize"**

## Step 7: Test Your Bot

1. Start your Voice2App server:
   ```bash
   bun run dev
   ```

2. In Discord, type `/generate` in a channel where the bot has access

3. Enter a prompt like: "Create a todo list app"

4. The bot should respond with a deferred response and then process your request!

## Architecture

The Discord gateway follows the same pattern as the Telegram gateway:

```
Discord User
    ↓
Discord Interaction (Slash Command)
    ↓
Discord Gateway (/discord endpoint)
    ↓
Shared Orchestrator
    ↓
AI Router → Code Generator → Runner
    ↓
Discord Notifier → User receives response
```

## Slash Commands

The following commands are available:

- `/generate prompt: "your idea"` - Generate an app from description
- `/create prompt: "your idea"` - Same as /generate
- `/build prompt: "your idea"` - Same as /generate
- `/help` - Show help information

## Features

- ✅ Text-based app generation via slash commands
- ✅ Deferred responses (for long-running operations)
- ✅ File attachments (screenshots, generated files)
- ✅ Rich formatted responses with markdown
- 🚧 Voice message support (coming soon)
- 🚧 Button interactions (coming soon)

## Troubleshooting

### "Invalid Interactions Endpoint URL"
- Make sure your server is running
- Ensure your public URL is correct and accessible
- Check that the `/discord` endpoint is responding to POST requests
- Verify your public key is correct in the `.env` file

### "Unknown Application" or "Invalid Token"
- Verify your bot token is correct
- Make sure you copied the entire token
- Check that there are no extra spaces in your `.env` file

### "Missing Access" when bot joins
- Ensure the bot has proper permissions in your server
- Check that you selected the right permissions when generating the invite URL

### Commands not showing up
- Wait a few minutes for Discord to sync commands
- Try refreshing Discord (Ctrl+R or Cmd+R)
- Verify you registered the commands correctly using the API

### Bot not responding
- Check server logs for errors
- Ensure the orchestrator is working
- Verify your AI provider API keys are configured

## DRY and SOLID Principles

The Discord gateway implementation follows best practices:

### DRY (Don't Repeat Yourself)
- **Shared Orchestrator**: Both Telegram and Discord use the same `orchestrator.ts` from `packages/shared`
- **Shared Types**: Common types are defined in `packages/shared/types.ts`
- **Platform-Specific Notifiers**: Each platform has its own notifier, but they follow the same interface

### SOLID Principles

1. **Single Responsibility Principle**
   - `discord-client.ts` - Discord API communication
   - `discord-notifier.ts` - Sending notifications to Discord
   - `index.ts` - Handling Discord interactions
   - `orchestrator.ts` - Coordinating the workflow

2. **Open/Closed Principle**
   - The orchestrator is open for extension (new platforms) but closed for modification
   - New platforms can be added by creating a new gateway and notifier

3. **Liskov Substitution Principle**
   - Both Telegram and Discord notifiers can be used interchangeably by the orchestrator

4. **Interface Segregation Principle**
   - Each module has clear, focused interfaces
   - Notifiers only implement what they need

5. **Dependency Inversion Principle**
   - High-level orchestrator depends on abstractions (platform type)
   - Low-level implementations (Discord/Telegram) depend on the same abstractions

## Next Steps

- Configure Discord admin notifications (see `DISCORD_ADMIN.md`)
- Explore advanced features like button interactions
- Add custom slash commands for specific workflows
- Implement voice message support

## Resources

- [Discord Developer Portal](https://discord.com/developers/docs)
- [Discord Interactions](https://discord.com/developers/docs/interactions/overview)
- [Slash Commands](https://discord.com/developers/docs/interactions/application-commands)
- [Discord.js Guide](https://discordjs.guide/)

