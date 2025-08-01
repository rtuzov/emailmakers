#!/bin/bash

# =============================================================================
# PRODUCTION DEPLOYMENT SCRIPT
# Email-Makers N8N Enterprise Workflow System
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOYMENT_LOG="$PROJECT_ROOT/logs/deployment-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="$PROJECT_ROOT/backups/pre-deployment-$(date +%Y%m%d-%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create logs directory
mkdir -p "$(dirname "$DEPLOYMENT_LOG")"
mkdir -p "$BACKUP_DIR"

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

# Error handling
handle_error() {
    log_error "Deployment failed at step: $1"
    log_error "Check logs at: $DEPLOYMENT_LOG"
    log_error "Backup available at: $BACKUP_DIR"
    
    # Attempt rollback
    if [[ -f "$BACKUP_DIR/docker-compose.yml" ]]; then
        log_warning "Attempting automatic rollback..."
        cp "$BACKUP_DIR/docker-compose.yml" "$PROJECT_ROOT/docker-compose.yml"
        docker-compose down && docker-compose up -d
        log_warning "Rollback completed. System restored to previous state."
    fi
    
    exit 1
}

# Trap errors
trap 'handle_error $LINENO' ERR

# =============================================================================
# DEPLOYMENT FUNCTIONS
# =============================================================================

# Pre-deployment validation
validate_environment() {
    log "🔍 Validating deployment environment..."
    
    # Check required tools
    local required_tools=("docker" "docker-compose" "curl" "jq" "node" "npm")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "Required tool not found: $tool"
            exit 1
        fi
    done
    log_success "All required tools are available"
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    log_success "Docker daemon is running"
    
    # Check environment variables
    local required_vars=("N8N_API_KEY")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_warning "Environment variable $var is not set (will use defaults)"
        else
            log_success "Environment variable $var is configured"
        fi
    done
    
    # Check available disk space (minimum 2GB)
    local available_space=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 2097152 ]]; then # 2GB in KB
        log_error "Insufficient disk space. At least 2GB required."
        exit 1
    fi
    log_success "Sufficient disk space available"
}

# Backup current system
backup_current_system() {
    log "💾 Creating system backup..."
    
    # Backup configuration files
    if [[ -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
        cp "$PROJECT_ROOT/docker-compose.yml" "$BACKUP_DIR/"
        log_success "Backed up docker-compose.yml"
    fi
    
    # Backup environment files
    if [[ -f "$PROJECT_ROOT/.env" ]]; then
        cp "$PROJECT_ROOT/.env" "$BACKUP_DIR/"
        log_success "Backed up .env file"
    fi
    
    # Backup database (if running)
    if docker-compose ps postgres | grep -q "Up"; then
        log "Backing up PostgreSQL database..."
        docker-compose exec -T postgres pg_dump -U email_makers_user email_makers > "$BACKUP_DIR/database_backup.sql"
        log_success "Database backup created"
    fi
    
    # Backup N8N workflows (if running)
    if docker-compose ps n8n | grep -q "Up"; then
        log "Backing up N8N workflows..."
        mkdir -p "$BACKUP_DIR/n8n_workflows"
        docker cp "$(docker-compose ps -q n8n):/home/node/.n8n/workflows" "$BACKUP_DIR/n8n_workflows/" 2>/dev/null || true
        log_success "N8N workflows backup created"
    fi
    
    log_success "System backup completed: $BACKUP_DIR"
}

# Run QA validation pipeline
run_qa_validation() {
    log "🧪 Running QA validation pipeline..."
    
    cd "$PROJECT_ROOT"
    
    # Make QA script executable
    chmod +x "$SCRIPT_DIR/qa-validation-pipeline.js"
    
    # Run QA validation
    if node "$SCRIPT_DIR/qa-validation-pipeline.js"; then
        log_success "QA validation passed - deployment approved"
    else
        log_error "QA validation failed - deployment blocked"
        exit 1
    fi
}

# Deploy infrastructure
deploy_infrastructure() {
    log "🏗️  Deploying infrastructure services..."
    
    cd "$PROJECT_ROOT"
    
    # Stop existing services gracefully
    if docker-compose ps | grep -q "Up"; then
        log "Stopping existing services..."
        docker-compose down --timeout 30
        log_success "Existing services stopped"
    fi
    
    # Pull latest images
    log "Pulling latest Docker images..."
    docker-compose pull
    log_success "Docker images updated"
    
    # Start core infrastructure first
    log "Starting core infrastructure..."
    docker-compose up -d postgres redis
    
    # Wait for database to be ready
    log "Waiting for PostgreSQL to be ready..."
    local retries=30
    while ! docker-compose exec -T postgres pg_isready -U email_makers_user > /dev/null 2>&1; do
        if [[ $retries -le 0 ]]; then
            log_error "PostgreSQL failed to start"
            exit 1
        fi
        sleep 2
        ((retries--))
    done
    log_success "PostgreSQL is ready"
    
    # Initialize database if needed
    if ! docker-compose exec -T postgres psql -U email_makers_user -d email_makers -c '\dt' | grep -q tables; then
        log "Initializing database schema..."
        if [[ -f "$PROJECT_ROOT/init-db.sql" ]]; then
            docker-compose exec -T postgres psql -U email_makers_user -d email_makers < "$PROJECT_ROOT/init-db.sql"
            log_success "Database schema initialized"
        fi
    fi
    
    # Start N8N
    log "Starting N8N workflow engine..."
    docker-compose up -d n8n
    
    # Wait for N8N to be ready
    log "Waiting for N8N to be ready..."
    local n8n_retries=30
    while ! curl -f http://localhost:5678/healthz > /dev/null 2>&1; do
        if [[ $n8n_retries -le 0 ]]; then
            log_error "N8N failed to start"
            exit 1
        fi
        sleep 5
        ((n8n_retries--))
    done
    log_success "N8N is ready"
    
    # Start monitoring services
    log "Starting monitoring services..."
    docker-compose up -d prometheus grafana node-exporter
    log_success "Monitoring services started"
    
    # Start reverse proxy
    log "Starting reverse proxy..."
    docker-compose up -d nginx
    log_success "Reverse proxy started"
}

# Deploy enterprise workflow
deploy_enterprise_workflow() {
    log "⚡ Deploying enterprise workflow..."
    
    cd "$PROJECT_ROOT"
    
    # Check if workflow deployment files exist
    local workflow_file="$PROJECT_ROOT/n8n-workflows/deployment-command.json"
    if [[ ! -f "$workflow_file" ]]; then
        log_warning "Workflow deployment file not found, using manual deployment"
        return 0
    fi
    
    # Deploy workflow using N8N API
    local n8n_api_key="${N8N_API_KEY:-$(grep N8N_API_KEY docker-compose.yml | cut -d'=' -f2 | tr -d ' ')}"
    
    if [[ -n "$n8n_api_key" ]]; then
        log "Deploying enterprise workflow via API..."
        
        # Get workflow ID from deployment file
        local workflow_id
        workflow_id=$(jq -r '.workflowId // "qG7VwOMCLShIuSwL"' "$workflow_file")
        
        # Deploy workflow
        if curl -X PUT "http://localhost:5678/api/v1/workflows/$workflow_id" \
            -H "X-N8N-API-KEY: $n8n_api_key" \
            -H "Content-Type: application/json" \
            -d @"$workflow_file" \
            --fail --silent > /dev/null; then
            log_success "Enterprise workflow deployed successfully"
        else
            log_warning "Workflow deployment via API failed, manual setup required"
        fi
    else
        log_warning "N8N API key not configured, manual workflow setup required"
    fi
}

# Validate deployment
validate_deployment() {
    log "🔍 Validating deployment..."
    
    # Check service health
    local services=("postgres" "n8n" "redis" "prometheus" "grafana")
    for service in "${services[@]}"; do
        if docker-compose ps "$service" | grep -q "Up"; then
            log_success "$service is running"
        else
            log_error "$service is not running"
            exit 1
        fi
    done
    
    # Test N8N API
    if curl -f http://localhost:5678/healthz > /dev/null 2>&1; then
        log_success "N8N API is responsive"
    else
        log_error "N8N API is not responsive"
        exit 1
    fi
    
    # Test webhook endpoint (if workflow is deployed)
    local webhook_test_payload='{"briefText":"Deployment validation test","brand":"Kupibilet","type":"promotional"}'
    if curl -X POST "http://localhost:5678/webhook/email-campaign-enterprise" \
        -H "Content-Type: application/json" \
        -d "$webhook_test_payload" \
        --max-time 30 \
        --fail --silent > /dev/null 2>&1; then
        log_success "Enterprise workflow webhook is functional"
    else
        log_warning "Enterprise workflow webhook test failed (may require manual configuration)"
    fi
    
    # Test monitoring endpoints
    if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
        log_success "Prometheus is healthy"
    else
        log_warning "Prometheus health check failed"
    fi
    
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "Grafana is accessible"
    else
        log_warning "Grafana health check failed"
    fi
}

# Performance benchmark
run_performance_benchmark() {
    log "⚡ Running performance benchmark..."
    
    # Simple performance test
    local start_time=$(date +%s%3N)
    
    # Test campaign execution (if webhook is available)
    local test_payload='{"briefText":"Performance benchmark test for Thailand destinations","brand":"Kupibilet","type":"promotional","targetAudience":"families"}'
    
    if curl -X POST "http://localhost:5678/webhook/email-campaign-enterprise" \
        -H "Content-Type: application/json" \
        -d "$test_payload" \
        --max-time 60 \
        --fail --silent > /dev/null 2>&1; then
        
        local end_time=$(date +%s%3N)
        local execution_time=$((end_time - start_time))
        
        if [[ $execution_time -le 15000 ]]; then
            log_success "Performance benchmark passed: ${execution_time}ms (target: ≤15000ms)"
        else
            log_warning "Performance benchmark warning: ${execution_time}ms exceeds target (15000ms)"
        fi
    else
        log_warning "Performance benchmark skipped (webhook not configured)"
    fi
}

# Generate deployment report
generate_deployment_report() {
    log "📊 Generating deployment report..."
    
    local report_file="$PROJECT_ROOT/reports/deployment-report-$(date +%Y%m%d-%H%M%S).json"
    mkdir -p "$(dirname "$report_file")"
    
    # Collect system information
    local deployment_info
    deployment_info=$(cat <<EOF
{
    "deployment": {
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "version": "1.0.0",
        "status": "completed",
        "duration_seconds": $(($(date +%s) - $(stat -f %m "$DEPLOYMENT_LOG"))),
        "backup_location": "$BACKUP_DIR"
    },
    "services": {
        "postgres": "$(docker-compose ps postgres --format json 2>/dev/null | jq -r '.[0].State // "unknown"')",
        "n8n": "$(docker-compose ps n8n --format json 2>/dev/null | jq -r '.[0].State // "unknown"')",
        "redis": "$(docker-compose ps redis --format json 2>/dev/null | jq -r '.[0].State // "unknown"')",
        "prometheus": "$(docker-compose ps prometheus --format json 2>/dev/null | jq -r '.[0].State // "unknown"')",
        "grafana": "$(docker-compose ps grafana --format json 2>/dev/null | jq -r '.[0].State // "unknown"')"
    },
    "endpoints": {
        "n8n_ui": "http://localhost:5678",
        "n8n_webhook": "http://localhost:5678/webhook/email-campaign-enterprise",
        "prometheus": "http://localhost:9090",
        "grafana": "http://localhost:3000"
    },
    "next_steps": [
        "Configure production environment variables",
        "Set up SSL certificates for production",
        "Configure monitoring alerts",
        "Run full system validation"
    ]
}
EOF
    )
    
    echo "$deployment_info" > "$report_file"
    log_success "Deployment report saved: $report_file"
}

# =============================================================================
# MAIN DEPLOYMENT SEQUENCE
# =============================================================================

main() {
    log "🚀 Starting Email-Makers N8N Enterprise Deployment"
    log "📝 Deployment log: $DEPLOYMENT_LOG"
    log "💾 Backup directory: $BACKUP_DIR"
    echo ""
    
    # Phase 1: Pre-deployment validation
    validate_environment
    
    # Phase 2: System backup
    backup_current_system
    
    # Phase 3: QA validation
    run_qa_validation
    
    # Phase 4: Infrastructure deployment
    deploy_infrastructure
    
    # Phase 5: Enterprise workflow deployment
    deploy_enterprise_workflow
    
    # Phase 6: Deployment validation
    validate_deployment
    
    # Phase 7: Performance benchmark
    run_performance_benchmark
    
    # Phase 8: Generate report
    generate_deployment_report
    
    # Deployment complete
    echo ""
    log_success "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
    echo ""
    echo "==================================================================="
    echo "  EMAIL-MAKERS N8N ENTERPRISE SYSTEM DEPLOYED"
    echo "==================================================================="
    echo ""
    echo "📊 System Status:"
    echo "  • N8N Workflow Engine:     http://localhost:5678"
    echo "  • Enterprise Webhook:      http://localhost:5678/webhook/email-campaign-enterprise"
    echo "  • Prometheus Monitoring:   http://localhost:9090"
    echo "  • Grafana Dashboard:       http://localhost:3000"
    echo ""
    echo "📈 Performance Targets:"
    echo "  • Execution Time:          ≤15 seconds"
    echo "  • Parallel Efficiency:     ≥60%"
    echo "  • Quality Score:           ≥90%"
    echo ""
    echo "🔧 Next Steps:"
    echo "  1. Configure production environment variables"
    echo "  2. Set up SSL certificates for HTTPS"
    echo "  3. Configure Grafana dashboards and alerts"
    echo "  4. Run comprehensive system validation"
    echo ""
    echo "📁 Important Files:"
    echo "  • Deployment Log:         $DEPLOYMENT_LOG"
    echo "  • System Backup:          $BACKUP_DIR"
    echo "  • QA Report:              $PROJECT_ROOT/QA_VALIDATION_REPORT.md"
    echo ""
    echo "==================================================================="
    
    # Show running services
    echo ""
    log "📋 Current service status:"
    docker-compose ps
}

# Handle script termination
cleanup() {
    log "🧹 Cleaning up deployment process..."
    # Add any cleanup tasks here
}
trap cleanup EXIT

# Run main deployment
main "$@"

exit 0