# Email-Makers Docker Development Environment

Этот документ описывает, как запустить полное окружение разработки с использованием Docker контейнеров для Redis, Prometheus и Grafana.

## 🚀 Быстрый старт

```bash
# Запуск всех сервисов
./scripts/dev-start.sh

# Запуск Next.js приложения
npm run dev
```

## 📦 Сервисы

### Redis (Кэширование)
- **Порт**: 6380
- **Контейнер**: `email-makers-redis`
- **Данные**: Сохраняются в Docker volume `redis_data`

### Prometheus (Мониторинг)
- **Порт**: 9091
- **URL**: http://localhost:9091
- **Конфигурация**: `docker/prometheus/prometheus.yml`
- **Данные**: Сохраняются в Docker volume `prometheus_data`

### Grafana (Визуализация)
- **Порт**: 3002
- **URL**: http://localhost:3002
- **Логин**: admin / admin
- **Данные**: Сохраняются в Docker volume `grafana_data`

## 📊 Метрики

Приложение экспортирует метрики в формате Prometheus по адресу:
```
http://localhost:3000/api/metrics
```

### Доступные метрики:
- `tool_success_total` - Количество успешных выполнений инструментов
- `tool_failure_total` - Количество неуспешных выполнений инструментов

## 🔧 Конфигурация

### Переменные окружения

```bash
# Redis (автоматически настроен для Docker)
REDIS_URL=redis://localhost:6379

# Prometheus (включен по умолчанию)
PROMETHEUS_ENABLED=true

# Логирование
LOG_LEVEL=info
```

### Структура файлов

```
docker/
├── prometheus/
│   └── prometheus.yml          # Конфигурация Prometheus
└── grafana/
    └── provisioning/
        ├── datasources/
        │   └── prometheus.yml  # Настройка источника данных
        └── dashboards/
            └── dashboard.yml   # Настройка дашбордов
```

## 🛠 Команды управления

```bash
# Запуск сервисов
docker-compose -f docker-compose.dev.yml up -d

# Просмотр логов
docker-compose -f docker-compose.dev.yml logs -f

# Остановка сервисов
docker-compose -f docker-compose.dev.yml down

# Остановка с удалением данных
docker-compose -f docker-compose.dev.yml down -v

# Перезапуск отдельного сервиса
docker-compose -f docker-compose.dev.yml restart redis
```

## 🔍 Мониторинг

### Prometheus Targets
- `email-makers-agent` - Основное приложение (localhost:3000)
- `prometheus` - Сам Prometheus (localhost:9090)
- `redis` - Redis сервер (redis:6379)

### Grafana Dashboards
После запуска Grafana автоматически настроится с Prometheus как источником данных. Вы можете создать дашборды для мониторинга:

- Производительность инструментов агента
- Использование Redis
- Системные метрики

## 🐛 Диагностика

### Проверка состояния сервисов

```bash
# Redis
docker exec email-makers-redis redis-cli ping

# Prometheus
curl http://localhost:9090/-/healthy

# Grafana
curl http://localhost:3001/api/health
```

### Просмотр логов

```bash
# Все сервисы
docker-compose -f docker-compose.dev.yml logs

# Конкретный сервис
docker-compose -f docker-compose.dev.yml logs redis
docker-compose -f docker-compose.dev.yml logs prometheus
docker-compose -f docker-compose.dev.yml logs grafana
```

## 🔄 Обновление

Для обновления образов Docker:

```bash
docker-compose -f docker-compose.dev.yml pull
docker-compose -f docker-compose.dev.yml up -d
```

## 📝 Примечания

- Данные Redis, Prometheus и Grafana сохраняются в Docker volumes
- При первом запуске Grafana создаст административного пользователя admin/admin
- Prometheus автоматически обнаружит метрики приложения по адресу `/api/metrics`
- Все сервисы включают health checks для проверки готовности 