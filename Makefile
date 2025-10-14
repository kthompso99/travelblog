.PHONY: help install validate build watch serve add clean deploy

help:
	@echo "🌍 Travel Blog Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install    - Install dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make validate   - Validate config.json"
	@echo "  make build      - Build the site"
	@echo "  make watch      - Watch for changes and rebuild"
	@echo "  make serve      - Start local web server"
	@echo "  make dev        - Watch + Serve (in 2 terminals)"
	@echo "  make add        - Add new destination interactively"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy     - Build and show deployment files"
	@echo "  make clean      - Remove generated files"

install:
	@echo "📦 Installing dependencies..."
	npm install
	@echo "✅ Done!"

validate:
	@echo "🔍 Validating configuration..."
	npm run validate

build:
	@echo "🔨 Building site..."
	npm run build
	@echo "✅ Build complete!"

watch:
	@echo "👀 Watching for changes..."
	npm run watch

serve:
	@echo "🌐 Starting web server at http://localhost:8000"
	npm run serve

dev:
	@echo "💻 Development mode"
	@echo "   Terminal 1: make watch"
	@echo "   Terminal 2: make serve"

add:
	@echo "➕ Adding new destination..."
	npm run add

clean:
	@echo "🧹 Cleaning generated files..."
	rm -f config.built.json
	@echo "✅ Clean complete!"

deploy:
	@echo "🚀 Preparing for deployment..."
	@make build
	@npm run deploy-check
	@echo ""
	@echo "📦 Files ready to deploy:"
	@echo "   ✅ index.html"
	@echo "   ✅ config.built.json"
	@[ -d images ] && echo "   ✅ images/" || true
	@echo ""
	@echo "❌ Do NOT deploy:"
	@echo "   ❌ config.json, content/, *.js, package.json, node_modules/"
	@echo ""
	@echo "🌐 Quick deploy options:"
	@echo "   • Netlify: netlify deploy --prod"
	@echo "   • Vercel: vercel --prod"
	@echo "   • See DEPLOYMENT.md for more options"
	@echo ""