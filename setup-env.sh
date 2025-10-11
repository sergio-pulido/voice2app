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
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret_here

# Hookdeck Configuration  
HOOKDECK_URL=https://hkdk.events/k6dddf8z54fd7q

# Lovable API Configuration
LOVABLE_API_KEY=your_lovable_api_key_here

# Server Configuration
PORT_GATEWAY=3020
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
echo "• TELEGRAM_BOT_TOKEN: From @BotFather"
echo "• LOVABLE_API_KEY: From lovable.dev dashboard"
echo ""
