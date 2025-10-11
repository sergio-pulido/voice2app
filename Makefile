.PHONY: help dev server tunnels tunnel-telegram tunnel-vonage setup-webhook clean kill-server kill-tunnels kill-all logs

# Default target
help:
	@echo "📱 Voice2App - Development Commands"
	@echo ""
	@echo "Usage:"
	@echo "  make dev              - Start server and both Hookdeck tunnels"
	@echo "  make server           - Start the server only"
	@echo "  make tunnels          - Start both Hookdeck tunnels"
	@echo "  make tunnel-telegram  - Start Telegram tunnel only"
	@echo "  make tunnel-vonage    - Start Vonage tunnel only"
	@echo "  make setup-webhook    - Configure Telegram webhook with current Hookdeck URL"
	@echo "  make logs             - Show server logs"
	@echo "  make clean            - Kill all processes and clean up"
	@echo "  make kill-server      - Kill the server only"
	@echo "  make kill-tunnels     - Kill all Hookdeck tunnels"
	@echo "  make kill-all         - Kill everything (server + tunnels)"
	@echo ""

# Start everything (server + tunnels)
dev:
	@echo "🚀 Starting Voice2App development environment..."
	@echo ""
	@echo "1️⃣ Starting server..."
	@make kill-server 2>/dev/null || true
	@bun run server.ts > logs/server.log 2>&1 &
	@echo "   ✅ Server started on http://localhost:3020"
	@sleep 2
	@echo ""
	@echo "2️⃣ Starting Hookdeck tunnels..."
	@make tunnels
	@echo ""
	@echo "🎉 Development environment ready!"
	@echo ""
	@echo "📊 Status:"
	@echo "   • Server: http://localhost:3020"
	@echo "   • Logs: make logs"
	@echo "   • Stop: make clean"
	@echo ""

# Start server only
server:
	@echo "🚀 Starting server..."
	@make kill-server 2>/dev/null || true
	@bun run server.ts

# Start both tunnels
tunnels:
	@echo "🔧 Starting Hookdeck tunnels..."
	@make kill-tunnels 2>/dev/null || true
	@sleep 1
	@echo ""
	@echo "   🔌 Starting Telegram tunnel..."
	@hookdeck listen 3020 telegram-bot --path /telegram > logs/telegram-tunnel.log 2>&1 &
	@sleep 2
	@echo "   ✅ Telegram tunnel started"
	@echo ""
	@echo "   🔌 Starting Vonage tunnel..."
	@hookdeck listen 3020 vonage-whatsapp --path /vonage > logs/vonage-tunnel.log 2>&1 &
	@sleep 2
	@echo "   ✅ Vonage tunnel started"
	@echo ""
	@echo "📡 Hookdeck URLs:"
	@grep -h "URL:" logs/telegram-tunnel.log logs/vonage-tunnel.log 2>/dev/null || echo "   ⚠️  URLs not yet available, check log files"
	@echo "   • Dashboard: https://dashboard.hookdeck.com/"
	@echo ""

# Start Telegram tunnel only
tunnel-telegram:
	@echo "🔌 Starting Telegram tunnel..."
	@pkill -f "hookdeck listen.*telegram-bot" 2>/dev/null || true
	@hookdeck listen 3020 telegram-bot --path /telegram

# Start Vonage tunnel only
tunnel-vonage:
	@echo "🔌 Starting Vonage tunnel..."
	@pkill -f "hookdeck listen.*vonage-whatsapp" 2>/dev/null || true
	@hookdeck listen 3020 vonage-whatsapp --path /vonage

# Set up Telegram webhook with current Hookdeck URL
setup-webhook:
	@echo "📡 Configuring Telegram webhook..."
	@bun run setup-telegram-webhook.ts

# Show server logs
logs:
	@echo "📋 Server logs (Ctrl+C to exit):"
	@echo ""
	@tail -f logs/server.log

# Kill server only
kill-server:
	@echo "🛑 Stopping server..."
	@pkill -f "bun run server.ts" 2>/dev/null || true
	@pkill -f "bun.*server.ts" 2>/dev/null || true
	@echo "   ✅ Server stopped"

# Kill all Hookdeck tunnels
kill-tunnels:
	@echo "🛑 Stopping Hookdeck tunnels..."
	@pkill -f "hookdeck listen.*telegram-bot" 2>/dev/null || true
	@pkill -f "hookdeck listen.*vonage-whatsapp" 2>/dev/null || true
	@echo "   ✅ Tunnels stopped"

# Kill everything
kill-all: kill-server kill-tunnels
	@echo ""
	@echo "✅ All processes stopped"

# Clean up everything
clean: kill-all
	@echo "🧹 Cleaning up..."
	@rm -f logs/server.log logs/telegram-tunnel.log logs/vonage-tunnel.log
	@echo "   ✅ Log files removed"
	@echo ""
	@echo "✨ Clean complete!"

