#!/bin/bash

# Email-Makers Development Environment Startup Script

echo "🚀 Starting Email-Makers development environment..."

# Проверяем, установлен ли Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Создаем необходимые директории
mkdir -p docker/prometheus
mkdir -p docker/grafana/provisioning/datasources
mkdir -p docker/grafana/provisioning/dashboards

# Запускаем Docker контейнеры
echo "📦 Starting Docker containers..."
docker-compose -f docker-compose.dev.yml up -d

# Ждем, пока сервисы будут готовы
echo "⏳ Waiting for services to be ready..."
sleep 10

# Проверяем статус сервисов
echo "🔍 Checking service health..."

# Redis
if docker exec email-makers-redis redis-cli ping | grep -q PONG; then
    echo "✅ Redis is ready"
else
    echo "❌ Redis is not responding"
fi

# Prometheus
if curl -s http://localhost:9091/-/healthy | grep -q "Prometheus is Healthy"; then
    echo "✅ Prometheus is ready"
else
    echo "❌ Prometheus is not responding"
fi

# Grafana
if curl -s http://localhost:3002/api/health | grep -q "ok"; then
    echo "✅ Grafana is ready"
else
    echo "❌ Grafana is not responding"
fi

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📊 Services available at:"
echo "   - Redis:      localhost:6380"
echo "   - Prometheus: http://localhost:9091"
echo "   - Grafana:    http://localhost:3002 (admin/admin)"
echo ""
echo "💡 To start the Next.js application:"
echo "   npm run dev"
echo ""
echo "📈 Metrics will be available at:"
echo "   http://localhost:3000/api/metrics"
echo ""
echo "🛑 To stop all services:"
echo "   docker-compose -f docker-compose.dev.yml down" 