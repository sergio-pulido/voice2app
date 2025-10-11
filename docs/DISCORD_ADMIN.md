# 📢 Discord Admin Notifications

## Why Discord?

Discord is a **better alternative to WhatsApp** for admin notifications:

✅ **Free** - No API costs, unlimited messages  
✅ **No rate limits** - Send as many notifications as you need  
✅ **Rich embeds** - Beautiful formatted messages with colors  
✅ **Persistent** - Messages stay in channel, easy to search  
✅ **Multi-admin** - Whole team can see notifications  
✅ **Fast** - Lower latency than WhatsApp  

---

## Setup (5 minutes)

### 1. Create a Discord Server (if you don't have one)

1. Open Discord
2. Click the `+` button on the left sidebar
3. Create a server (e.g., "Voice2App Admin")

### 2. Create a Webhook

1. Go to **Server Settings** → **Integrations**
2. Click **Webhooks** → **New Webhook**
3. Name it: `Voice2App Notifications`
4. Select a channel (e.g., `#admin-logs` or `#notifications`)
5. Click **Copy Webhook URL**

### 3. Configure Environment

Add to your `.env` file:

```env
# Enable Discord admin notifications
ENABLE_DISCORD_ADMIN=true

# Disable WhatsApp (to avoid rate limits)
ENABLE_WHATSAPP_ADMIN=false

# Your Discord webhook URL
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/123456789/abcdefg...
```

### 4. Restart Server

```bash
make clean
make dev
```

---

## What You'll See

### New Request Notification

Simple text message:
```
🔔 NEW REQUEST
👤 User: Sergio (6181465305)
📱 Type: 🎤 Voice
💬 Input: "Create a counter app"
⏰ Started: 4:27:36 PM
🔄 Status: Analyzing intent...
```

### Completion Notification (Rich Embed)

Beautiful embedded message with:

**Title**: ✅ Request Completed  
**Description**: Tool: 💻 App Builder

**Fields**:
- 👤 User: Sergio (6181465305)
- ⏱️ Time: 12.3s
- 📊 Status: SUCCESS
- 🎯 Tool: 💻 App Builder
- 📋 Task: Create a counter app
- 📦 Files: 8 generated
- 🎤 Transcription: "Create a counter app"

**Color**:
- 🟢 Green (success)
- 🟠 Orange (partial)
- 🔴 Red (error)

**Footer**: Status: SUCCESS  
**Timestamp**: Automatic

---

## Comparison: WhatsApp vs Discord

| Feature | WhatsApp (Vonage) | Discord |
|---------|-------------------|---------|
| **Cost** | $$ (paid after free tier) | Free |
| **Rate Limits** | Yes (strict) | No |
| **Rich Formatting** | No (plain text only) | Yes (embeds, colors) |
| **Message History** | Personal chat | Server channel |
| **Multi-Admin** | No (one number) | Yes (whole team) |
| **Search** | Limited | Full search |
| **Setup Time** | 15 min | 5 min |
| **Mobile Notifications** | Native push | Native push |

**Recommendation**: Use **Discord** for admin monitoring. It's free, unlimited, and has better formatting!

---

## Using Both Channels

You can enable **both** WhatsApp and Discord:

```env
ENABLE_WHATSAPP_ADMIN=true   # For mobile notifications
ENABLE_DISCORD_ADMIN=true    # For team monitoring
```

**Use Cases**:
- **WhatsApp**: Critical errors only (set up filtering later)
- **Discord**: All activity for the whole team
- **Both**: Full visibility across channels

---

## Disabling All Admin Notifications

To disable admin notifications completely:

```env
ENABLE_WHATSAPP_ADMIN=false
ENABLE_DISCORD_ADMIN=false
```

The system will:
- ✅ Still work normally
- ✅ Customers still get responses
- ℹ️ Admin notifications only logged to console

---

## Discord Webhook Examples

### Simple Message
```typescript
await sendDiscordAdminNotification("🎉 New user signed up!")
```

### Rich Embed
```typescript
await sendDiscordAdminNotification({
  embeds: [{
    title: "✅ Task Completed",
    description: "Counter app generated",
    color: 0x00ff00,
    fields: [
      { name: "User", value: "Sergio", inline: true },
      { name: "Time", value: "12.3s", inline: true }
    ]
  }]
})
```

---

## Troubleshooting

### Webhook Not Working

1. **Check URL format**:
   ```
   https://discord.com/api/webhooks/[ID]/[TOKEN]
   ```

2. **Verify webhook exists**:
   - Go to Discord Server Settings → Integrations → Webhooks
   - Make sure webhook is active

3. **Check logs**:
   ```bash
   make logs
   # Look for "Discord notification sent" or errors
   ```

### Not Receiving Notifications

1. **Check feature flag**:
   ```bash
   echo $ENABLE_DISCORD_ADMIN
   # Should output: true
   ```

2. **Restart server**:
   ```bash
   make clean
   make dev
   ```

3. **Test webhook manually**:
   ```bash
   curl -X POST YOUR_DISCORD_WEBHOOK_URL \
     -H "Content-Type: application/json" \
     -d '{"content": "Test from Voice2App!"}'
   ```

---

## Example Discord Channel Setup

Create a dedicated Discord server for monitoring:

**Channels**:
- `#admin-logs` - All request notifications
- `#errors` - Error alerts only (future)
- `#metrics` - Daily/weekly stats (future)

**Benefits**:
- Full team visibility
- Easy to search and review
- No personal phone needed
- Can @mention team members for urgent issues

---

## Migration from WhatsApp

If you're currently using WhatsApp:

1. **Create Discord webhook** (see setup above)
2. **Update .env**:
   ```env
   ENABLE_WHATSAPP_ADMIN=false
   ENABLE_DISCORD_ADMIN=true
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
   ```
3. **Restart server**: `make clean && make dev`
4. **Test**: Send a message to your Telegram bot
5. **Check Discord**: You should see notifications in your Discord channel!

---

## Cost Comparison

**WhatsApp (Vonage)**:
- Free tier: ~1000 messages/month
- After that: $0.005-0.01 per message
- Monthly cost with 10,000 notifications: **$50-100**

**Discord**:
- Free tier: Unlimited messages
- No paid tier needed for webhooks
- Monthly cost with 10,000 notifications: **$0**

**Savings**: 💰 **~$600-1200/year** by using Discord instead of WhatsApp!

---

**Recommendation**: **Disable WhatsApp**, **Enable Discord**. It's free, unlimited, and better for team monitoring!

To disable WhatsApp notifications right now, just set in your `.env`:
```env
ENABLE_WHATSAPP_ADMIN=false
```

No need to restart - it will take effect on the next request!

