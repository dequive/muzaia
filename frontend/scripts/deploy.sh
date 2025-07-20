
#!/bin/bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
ENVIRONMENT=${1:-production}
BUILD_DIR=".next"
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"

log_info "🚀 Starting deployment for $ENVIRONMENT environment..."

# Pre-deployment checks
log_info "📋 Running pre-deployment checks..."

# Check if required environment variables are set
if [ "$ENVIRONMENT" = "production" ]; then
    if [ -z "${NEXT_PUBLIC_APP_URL:-}" ]; then
        log_error "NEXT_PUBLIC_APP_URL is not set"
        exit 1
    fi
fi

# Install dependencies
log_info "📦 Installing dependencies..."
npm ci --production=false

# Run tests
log_info "🧪 Running tests..."
npm run lint
npm run type-check

# Build application
log_info "🏗️ Building application..."
npm run build

# Check build output
if [ ! -d "$BUILD_DIR" ]; then
    log_error "Build failed - $BUILD_DIR directory not found"
    exit 1
fi

log_success "✅ Build completed successfully"

# Generate build report
log_info "📊 Generating build report..."
echo "Build completed at: $(date)" > build-report.txt
echo "Environment: $ENVIRONMENT" >> build-report.txt
echo "Build size: $(du -sh $BUILD_DIR)" >> build-report.txt

log_success "🎉 Deployment preparation completed successfully!"
log_info "📄 Build report saved to build-report.txt"

if [ "$ENVIRONMENT" = "production" ]; then
    log_warning "⚠️  Remember to:"
    log_warning "   - Update environment variables"
    log_warning "   - Test the application thoroughly"
    log_warning "   - Monitor logs after deployment"
fi
