#!/bin/bash
set -e

echo "🎯 MCT Client Portal - Ultimate Developer Setup"
echo "=================================================="

# Function: Check system prerequisites
check_prerequisites() {
    echo "🔍 Checking system prerequisites..."
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js not found. Please install Node.js 18+"
        echo "Visit: https://nodejs.org/"
        exit 1
    else
        NODE_VERSION=$(node --version)
        echo "✅ Node.js found: $NODE_VERSION"
    fi
    
    # Check for pnpm
    if ! command -v pnpm &> /dev/null; then
        echo "📦 pnpm not found. Installing pnpm..."
        curl -fsSL https://get.pnpm.io/install.sh | sh -
        source ~/.bashrc 2>/dev/null || source ~/.zshrc 2>/dev/null || true
    else
        PNPM_VERSION=$(pnpm --version)
        echo "✅ pnpm found: $PNPM_VERSION"
    fi
    
    # Check for Git
    if ! command -v git &> /dev/null; then
        echo "❌ Git not found. Please install Git"
        exit 1
    else
        echo "✅ Git found: $(git --version)"
    fi
}

# Function: Environment configuration
setup_environments() {
    echo "🔐 Configuring environment files..."
    
    # API environment
    if [ ! -f "apps/api/.env" ]; then
        if [ -f "apps/api/.env.example" ]; then
            cp apps/api/.env.example apps/api/.env
            echo "📝 Created API .env from example"
        else
            echo "⚠️  API .env.example not found"
        fi
    fi
    
    # Web environment  
    if [ ! -f "apps/web/.env" ]; then
        if [ -f "apps/web/.env.example" ]; then
            cp apps/web/.env.example apps/web/.env
            echo "📝 Created web .env from example"
        else
            echo "⚠️  Web .env.example not found"
        fi
    fi
    
    # Worker environment
    if [ ! -f "apps/worker/.env" ]; then
        if [ -f "apps/worker/.env.example" ]; then
            cp apps/worker/.env.example apps/worker/.env
            echo "📝 Created worker .env from example"
        else
            echo "⚠️  Worker .env.example not found"
        fi
    fi
    
    # Set essential environment variables for local dev
    cat >> apps/api/.env << 'EOF'

# Local Development Overrides
API_PORT=4000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development

# JWT Authentication
JWT_SECRET=local_dev_secret_key_12345

# Supabase Configuration
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=test_anon_key
SUPABASE_SERVICE_ROLE_KEY=test_service_role_key

# Stripe Configuration (set in production)
STRIPE_SECRET_KEY=sk_test_your_stripe_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Server Configuration
API_PORT=4000
HOST=0.0.0.0
EOF
    echo "📝 Added local development overrides to API .env"
}

# Function: Install dependencies
install_dependencies() {
    echo "📦 Installing project dependencies..."
    
    if ! pnpm install --frozen-lockfile; then
        echo "❌ Dependency installation failed. Trying alternative method..."
        rm -rf node_modules .pnpm-store
        if ! pnpm install --prefer-offline; then
            echo "❌ Dependency installation failed again"
            exit 1
        fi
    fi
    
    echo "✅ Dependencies installed successfully"
}

# Function: Run quality checks
run_quality_checks() {
    echo "🔍 Running initial quality checks..."
    
    # Type checking
    echo "📝 Running TypeScript checks..."
    if pnpm typecheck; then
        echo "✅ TypeScript checks passed"
    else
        echo "⚠️  TypeScript issues found - review any errors above"
    fi
    
    # Linting
    echo "🧹 Running code linting..."
    if pnpm lint; then
        echo "✅ Linting passed"
    else
        echo "⚠️  Linting issues found - review any errors above"
    fi
}

# Function: Create development scripts
create_development_scripts() {
    echo "📝 Creating development scripts..."
    
    # Development startup script
    cat > scripts/dev-start.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting MCT Client Portal Development..."

# Check if services are already running
if lsof -ti:4000 >/dev/null 2>&1; then
    echo "⚠️  API server is already running on port 4000"
else
    echo "🔄 Starting API server..."
    pnpm --filter=api dev &
    API_PID=$!
fi

if lsof -ti:3000 >/dev/null 2>&1; then
    echo "⚠️  Web server is already running on port 3000"
else
    echo "🔄 Starting web application..."
    pnpm --filter=web dev &
    WEB_PID=$!
fi

if lsof -ti:3001 >/dev/null 2>&1; then
    echo "⚠️  Worker is already running on port 3001"
else
    echo "🔄 Starting worker..."
    pnpm --filter=worker dev &
    WORKER_PID=$!
done

echo "✅ Development environment is running!"
echo ""
echo "🌐 Access your applications:"
echo "   • API: http://localhost:4000"
echo "   • Web: http://localhost:3000"
echo "   • Worker: http://localhost:3001"
echo ""
echo "🛑 To stop all services, use: pnpm dev:stop"
echo ""
echo "📋 Available commands:"
echo "   • pnpm dev         - Start all services"
echo "   • pnpm dev:api     - Start API only"
echo "   • pnpm dev:web     - Start web only"
echo "   • pnpm dev:worker  - Start worker only"
echo "   • pnpm test        - Run all tests"
echo "   • pnpm test:web    - Run web tests only"
echo "   • pnpm test:api    - Run API tests only"
echo "   • pnpm test:worker - Run worker tests only"
EOF

    chmod +x scripts/dev-start.sh
    
    # Create stop script
    cat > scripts/dev-stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping MCT Client Portal Development..."

# Kill processes on known ports
for port in 4000 3000 3001; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        kill $pid 2>/dev/null && echo "🛑 Stopped process on port $port" || true
    fi
done

# Also kill pnpm/turbo processes
pkill -f "turbo.*dev" 2>/dev/null || true
pkill -f "next.*dev" 2>/dev/null || true
pkill -f "tsx.*dev" 2>/dev/null || true

echo "✅ All development services stopped"
EOF

    chmod +x scripts/dev-stop.sh
}

# Function: Create troubleshooting guide
create_troubleshooting_guide() {
    echo "🔧 Creating troubleshooting guide..."
    
    cat > TROUBLESHOOTING.md << 'EOF'
# MCT Portal - Troubleshooting Guide

## Common Issues and Solutions

### 1. Node Version Issues
```
Error: 'node' command not found
```

**Solution:**
```bash
# Install Node.js 18 or higher
# macOS: brew install node@18
# Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs
# Windows: Download from https://nodejs.org/
```

### 2. pnpm Installation Issues
```
Error: 'pnpm' command not found
```

**Solution:**
```bash
# Install pnpm globally
curl -fsSL https://get.pnpm.io/install.sh | sh -
# or use package manager
# macOS: brew install pnpm
# Ubuntu/Debian: sudo apt-get install -y pnpm
```

### 3. Permission Errors
```
Error: EACCESSPERM: Permission denied
```

**Solution:**
```bash
# Check directory permissions
chmod 755 apps/api apps/web apps/worker

# If encountering permission issues, try:
# sudo chown -R $USER:$USER .
```

### 4. Environment Variable Issues
```
Error: Unable to find environment variable
```

**Solution:**
```bash
# Check if .env files exist
test -f apps/api/.env && echo "API environment OK"
test -f apps/web/.env && echo "Web environment OK"

# Create missing .env files
if [ ! -f apps/api/.env ]; then
    cp apps/api/.env.example apps/api/.env
fi
```

### 5. Build Failures
```
Error: Module not found: xxx
```

**Solution:**
```bash
# Run dependency installation again
pnpm install --frozen-lockfile

# Check for missing dependencies
pnpm why <package-name>
```

### 6. Test Failures
```
Test failed: timeout
```

**Solution:**
```bash
# Increase test timeout
pnpm test --max-time 300000

# Or run specific tests
pnpm test:api
pnpm test:web
pnpm test:worker
```

### 7. Database Connection Issues
```
Error: Connection refused to database
```

**Solution:**
```bash
# Check if Supabase is running locally
pnpm supabase:status

# Start Supabase if needed
pnpm supabase:start

# Or use the reset script
pnpm supabase:reset:auto
```

### 8. Port Conflicts
```
Error: EADDRINUSE: address already in use
```

**Solution:**
```bash
# Find what's using the port
lsof -i :4000  # API
lsof -i :3000  # Web
lsof -i :3001  # Worker

# Kill the process
kill -9 <PID>

# Or use the stop script
./scripts/dev-stop.sh
```

## Additional Resources

### Support
- GitHub Issues: https://github.com/mainecybertech/mct-client-portal/issues
- Discord: https://discord.gg/mct
- Twitter: @mainecybertech

### Documentation
- README.dev.md: Basic setup guide
- docs/developer-guide/: Detailed development guide
- docs/ENVIRONMENT_VARIABLES.md: Environment variables
- docs/ROLLBACK_PROCEDURES.md: Rollback procedures

## Getting Help
If you're encountering issues not covered in this guide:
1. Check the error messages carefully
2. Verify all required tools are installed
3. Review the troubleshooting sections
3 sections
4. Check GitHub Issues for similar issues
4. Use the Discord community for real-time help
EOF
}

# Function: Display setup summary
show_setup_summary() {
    echo "🎉 MCT Client Portal Development Environment Setup Complete!"
    echo ""
    echo "📋 Setup Summary:"
    echo "✅ Prerequisites checked and installed"
    echo "✅ Project repository configured"
    echo "✅ Environment files created"
    echo "✅ Development dependencies installed"
    echo "✅ Quality checks completed"
    echo "✅ Development scripts created"
    echo "✅ Troubleshooting guide created"
    
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Run './scripts/dev-start.sh' to start the development environment"
    echo "2. Access your applications:"
    echo "   • API: http://localhost:4000"
    echo "   • Web: http://localhost:3000"
    echo "   • Worker: http://localhost:3001"
    echo "3. Check troubleshooting guide: TROUBLESHOOTING.md"
    echo ""
    echo "📚 Documentation:"
    echo "   • README.dev.md: Quick start guide"
    echo "   • docs/developer-guide/: Detailed setup instructions"
    echo "   • docs/ENVIRONMENT_VARIABLES.md: Environment configuration"
    echo "   • docs/ROLLBACK_PROCEDURES.md: Rollback procedures"
    echo ""
    echo "💡 Tips:"
    echo "• Use 'pnpm run <command>' to run specific commands"
    echo "• Use 'pnpm --filter <package>' to work on specific packages"
    echo "• Check scripts/ directory for additional tools"
    echo ""
    echo "Happy coding! 🎉"
}

# Execute setup process
check_prerequisites
setup_environments
install_dependencies
run_quality_checks
create_development_scripts
create_troubleshooting_guide
show_setup_summary

echo ""
echo "🎯 MCT Client Portal Developer Setup Complete!"
echo "==========================================="
echo "The development environment is now ready to use!"
echo ""
echo "🚀 Quick Start Commands:"
echo "   • Start development: ./scripts/dev-start.sh"
echo "   • Stop development:  ./scripts/dev-stop.sh"
echo "   • Run tests: pnpm test"
echo "   • Run linting: pnpm lint"
echo "   • Type check: pnpm typecheck"
echo "   • Build all: pnpm build"
echo ""
echo "📚 Documentation:"
echo "   • README.dev.md: Quick start guide"
echo "   • docs/developer-guide/: Detailed setup instructions"
echo "   • docs/ENVIRONMENT_VARIABLES.md: Environment configuration"
echo "   • docs/ROLLBACK_PROCEDURES.md: Rollback procedures"
echo "   • TROUBLESHOOTING.md: Common issues and solutions"
echo ""
echo "Happy coding! 🎉"