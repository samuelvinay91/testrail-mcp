#!/bin/bash

# TestRail MCP Server Installation Script
# This script automates the installation and setup of TestRail MCP Server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_NAME="TestRail MCP Server Installer"
VERSION="1.0.0"
INSTALL_DIR="/opt/testrail-mcp-server"
SERVICE_USER="testrail"

# Logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check OS
    if [[ ! -f /etc/os-release ]]; then
        error "Unable to determine OS version"
    fi
    
    source /etc/os-release
    info "Detected OS: $PRETTY_NAME"
    
    # Check architecture
    ARCH=$(uname -m)
    if [[ "$ARCH" != "x86_64" && "$ARCH" != "aarch64" ]]; then
        error "Unsupported architecture: $ARCH"
    fi
    info "Architecture: $ARCH"
    
    # Check available memory
    MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $MEMORY_GB -lt 1 ]]; then
        warn "Low memory detected (${MEMORY_GB}GB). Minimum 2GB recommended."
    fi
    info "Available memory: ${MEMORY_GB}GB"
    
    # Check disk space
    DISK_SPACE=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ $DISK_SPACE -lt 5 ]]; then
        error "Insufficient disk space. Minimum 5GB required, ${DISK_SPACE}GB available."
    fi
    info "Available disk space: ${DISK_SPACE}GB"
}

# Install dependencies
install_dependencies() {
    log "Installing system dependencies..."
    
    if command -v apt-get >/dev/null 2>&1; then
        # Debian/Ubuntu
        apt-get update
        apt-get install -y curl wget git build-essential software-properties-common
    elif command -v yum >/dev/null 2>&1; then
        # CentOS/RHEL
        yum update -y
        yum install -y curl wget git gcc gcc-c++ make
    elif command -v dnf >/dev/null 2>&1; then
        # Fedora
        dnf update -y
        dnf install -y curl wget git gcc gcc-c++ make
    else
        error "Unsupported package manager. Please install dependencies manually."
    fi
}

# Install Node.js
install_nodejs() {
    log "Installing Node.js..."
    
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version | sed 's/v//')
        if [[ "$(printf '%s\n' "16.0.0" "$NODE_VERSION" | sort -V | head -n1)" = "16.0.0" ]]; then
            info "Node.js $NODE_VERSION is already installed"
            return
        fi
    fi
    
    # Install Node.js 18 LTS
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    
    if command -v apt-get >/dev/null 2>&1; then
        apt-get install -y nodejs
    elif command -v yum >/dev/null 2>&1; then
        yum install -y nodejs
    elif command -v dnf >/dev/null 2>&1; then
        dnf install -y nodejs
    fi
    
    # Verify installation
    if ! command -v node >/dev/null 2>&1; then
        error "Failed to install Node.js"
    fi
    
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    info "Installed Node.js $NODE_VERSION and npm $NPM_VERSION"
}

# Install Docker (optional)
install_docker() {
    if [[ "$INSTALL_DOCKER" != "yes" ]]; then
        return
    fi
    
    log "Installing Docker..."
    
    if command -v docker >/dev/null 2>&1; then
        info "Docker is already installed"
        return
    fi
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Install Docker Compose
    DOCKER_COMPOSE_VERSION="2.20.0"
    curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Start Docker service
    systemctl enable docker
    systemctl start docker
    
    info "Docker and Docker Compose installed successfully"
}

# Create service user
create_user() {
    log "Creating service user..."
    
    if id "$SERVICE_USER" >/dev/null 2>&1; then
        info "User $SERVICE_USER already exists"
    else
        useradd --system --home-dir "$INSTALL_DIR" --shell /bin/bash "$SERVICE_USER"
        info "Created user $SERVICE_USER"
    fi
}

# Download and install TestRail MCP Server
install_server() {
    log "Installing TestRail MCP Server..."
    
    # Create installation directory
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    # Download source code
    if [[ "$INSTALL_METHOD" == "git" ]]; then
        if [[ -d .git ]]; then
            git pull origin main
        else
            git clone https://github.com/your-username/testrail-mcp-server.git .
        fi
    elif [[ "$INSTALL_METHOD" == "npm" ]]; then
        # Install via npm
        npm install -g testrail-mcp-server
        ln -sf "$(npm root -g)/testrail-mcp-server" "$INSTALL_DIR/app"
    else
        # Download release tarball
        LATEST_RELEASE=$(curl -s https://api.github.com/repos/your-username/testrail-mcp-server/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
        curl -L "https://github.com/your-username/testrail-mcp-server/archive/${LATEST_RELEASE}.tar.gz" | tar xz --strip-components=1
    fi
    
    # Install dependencies
    npm ci --only=production
    
    # Build the application
    npm run build
    
    # Set permissions
    chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
    chmod +x "$INSTALL_DIR/dist/index.js"
    
    info "TestRail MCP Server installed successfully"
}

# Configure environment
configure_environment() {
    log "Configuring environment..."
    
    # Create configuration file
    cat > "$INSTALL_DIR/.env" <<EOF
# TestRail MCP Server Configuration
NODE_ENV=production
LOG_LEVEL=info
PORT=3000

# TestRail Connection (Required)
TESTRAIL_BASE_URL=
TESTRAIL_USERNAME=
TESTRAIL_API_KEY=

# Optional Configuration
DEFAULT_PROJECT_ID=1
DEFAULT_SUITE_ID=1
RATE_LIMIT_REQUESTS_PER_MINUTE=60
CACHE_TTL=300

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Security
MCP_AUTH_TOKEN=

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
EOF
    
    chown "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/.env"
    chmod 600 "$INSTALL_DIR/.env"
    
    warn "Please edit $INSTALL_DIR/.env to configure your TestRail connection"
}

# Create systemd service
create_service() {
    log "Creating systemd service..."
    
    cat > /etc/systemd/system/testrail-mcp.service <<EOF
[Unit]
Description=TestRail MCP Server
Documentation=https://github.com/your-username/testrail-mcp-server
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
Environment=NODE_ENV=production
EnvironmentFile=$INSTALL_DIR/.env
ExecStart=/usr/bin/node $INSTALL_DIR/dist/index.js
ExecReload=/bin/kill -USR1 \$MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=testrail-mcp

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$INSTALL_DIR

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable testrail-mcp.service
    
    info "Systemd service created and enabled"
}

# Setup log rotation
setup_logging() {
    log "Setting up log rotation..."
    
    mkdir -p /var/log/testrail-mcp
    chown "$SERVICE_USER:$SERVICE_USER" /var/log/testrail-mcp
    
    cat > /etc/logrotate.d/testrail-mcp <<EOF
/var/log/testrail-mcp/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 $SERVICE_USER $SERVICE_USER
    postrotate
        systemctl reload testrail-mcp.service > /dev/null 2>&1 || true
    endscript
}
EOF
    
    info "Log rotation configured"
}

# Setup firewall
setup_firewall() {
    if [[ "$SETUP_FIREWALL" != "yes" ]]; then
        return
    fi
    
    log "Configuring firewall..."
    
    if command -v ufw >/dev/null 2>&1; then
        # Ubuntu/Debian
        ufw allow 3000/tcp comment 'TestRail MCP Server'
        ufw allow 9090/tcp comment 'TestRail MCP Metrics'
    elif command -v firewall-cmd >/dev/null 2>&1; then
        # CentOS/RHEL/Fedora
        firewall-cmd --permanent --add-port=3000/tcp
        firewall-cmd --permanent --add-port=9090/tcp
        firewall-cmd --reload
    fi
    
    info "Firewall configured"
}

# Main installation function
main() {
    echo "======================================"
    echo "  $SCRIPT_NAME v$VERSION"
    echo "======================================"
    echo
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --install-method)
                INSTALL_METHOD="$2"
                shift 2
                ;;
            --install-docker)
                INSTALL_DOCKER="yes"
                shift
                ;;
            --setup-firewall)
                SETUP_FIREWALL="yes"
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --install-method METHOD  Installation method: git, npm, or release (default: release)"
                echo "  --install-docker        Install Docker and Docker Compose"
                echo "  --setup-firewall        Configure firewall rules"
                echo "  --help                  Show this help message"
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
    
    # Set defaults
    INSTALL_METHOD=${INSTALL_METHOD:-release}
    INSTALL_DOCKER=${INSTALL_DOCKER:-no}
    SETUP_FIREWALL=${SETUP_FIREWALL:-no}
    
    # Run installation steps
    check_root
    check_requirements
    install_dependencies
    install_nodejs
    install_docker
    create_user
    install_server
    configure_environment
    create_service
    setup_logging
    setup_firewall
    
    echo
    log "Installation completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Edit the configuration file: $INSTALL_DIR/.env"
    echo "2. Start the service: systemctl start testrail-mcp.service"
    echo "3. Check the status: systemctl status testrail-mcp.service"
    echo "4. View logs: journalctl -u testrail-mcp.service -f"
    echo
    echo "For more information, visit: https://github.com/your-username/testrail-mcp-server"
}

# Run main function with all arguments
main "$@"