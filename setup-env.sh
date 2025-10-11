#!/bin/bash

echo "🔧 Voice2App Environment Setup"
echo "=================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
# TELEGRAM_WEBHOOK_SECRET=your_webhook_secret_here  # Disable for Hookdeck CLI

# Primary LLM Provider
GROQ_API_KEY=your_groq_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Provider Selection
STT_PROVIDER=elevenlabs
LLM_PROVIDER=groq

# Vonage WhatsApp Configuration (optional)
VONAGE_API_KEY=your_vonage_api_key_here
VONAGE_API_SECRET=your_vonage_api_secret_here
VONAGE_WHATSAPP_TO=your_whatsapp_number_here
VONAGE_WHATSAPP_FROM=14157386102

# Admin Notification Settings
ENABLE_WHATSAPP_ADMIN=false  # Disabled by default (has rate limits)
ENABLE_DISCORD_ADMIN=false   # Set to 'true' and add webhook URL to enable

# Discord Admin (recommended - free & unlimited!)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook_url_here

# Server Configuration
PORT=3020
NODE_ENV=development
EOF
    echo "✅ .env file created!"
else
    echo "📄 .env file already exists"
fi

echo ""
echo "🔑 Next Steps:"
echo "1. Get your Lovable API key from: https://lovable.dev/"
echo "2. Edit the .env file with your actual API keys"
echo "3. Run: source .env && bun run server.ts"
echo ""
echo "📋 Required API Keys:"
echo "• TELEGRAM_BOT_TOKEN: From @BotFather on Telegram"
echo "• GROQ_API_KEY: From console.groq.com (free tier available)"
echo "• ELEVENLABS_API_KEY: From elevenlabs.io (for voice features)"
echo ""
echo "📋 Optional (Admin Notifications):"
echo "• DISCORD_WEBHOOK_URL: Discord Server Settings → Integrations → Webhooks (FREE!)"
echo "• VONAGE credentials: Only if you want WhatsApp admin notifications (has costs)"
echo ""
echo "💡 Recommendation: Use Discord for admin notifications (free & unlimited)"
echo ""
