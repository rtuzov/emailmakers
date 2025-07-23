#!/bin/bash

echo "🔍 Monitoring campaign logs for Guatemala autumn campaign..."
echo "📅 Test started at: $(date)"
echo "⏱️  Monitoring every 45 seconds for minimum 6 minutes"
echo ""

# Создаем файл для сбора ошибок
ERROR_LOG="guatemala-test-errors.log"
echo "🚨 GUATEMALA AUTUMN CAMPAIGN - ERROR COLLECTION" > $ERROR_LOG
echo "Started: $(date)" >> $ERROR_LOG
echo "=========================================" >> $ERROR_LOG

# Счетчик итераций
iteration=0
max_iterations=8  # 8 * 45 секунд = 6 минут

while [ $iteration -lt $max_iterations ]; do
  iteration=$((iteration + 1))
  echo "📊 Iteration $iteration/8 - $(date)"
  
  # Находим самую новую папку кампании (последняю созданную)
  LATEST_CAMPAIGN=$(ls -1t campaigns/ | grep "campaign_" | head -1)
  
  if [ -n "$LATEST_CAMPAIGN" ]; then
    echo "📁 Checking campaign: $LATEST_CAMPAIGN"
    
    # Проверяем логи кампании
    if [ -d "campaigns/$LATEST_CAMPAIGN/logs" ]; then
      echo "📋 Checking logs in campaigns/$LATEST_CAMPAIGN/logs/"
      
      # Поиск ошибок в логах
      find "campaigns/$LATEST_CAMPAIGN/logs" -name "*.log" -type f -exec grep -l -i "error\|fail\|exception\|timeout\|width.*16\|width.*50" {} \; 2>/dev/null | while read logfile; do
        echo "🚨 Found errors in: $logfile" | tee -a $ERROR_LOG
        echo "--- Errors from $logfile ---" >> $ERROR_LOG
        grep -i "error\|fail\|exception\|timeout\|width.*16\|width.*50" "$logfile" >> $ERROR_LOG 2>/dev/null
        echo "" >> $ERROR_LOG
      done
      
      # Проверяем статус кампании
      if [ -f "campaigns/$LATEST_CAMPAIGN/campaign-metadata.json" ]; then
        STATUS=$(cat "campaigns/$LATEST_CAMPAIGN/campaign-metadata.json" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null)
        echo "📌 Campaign status: $STATUS"
        
        if [ "$STATUS" = "failed" ] || [ "$STATUS" = "error" ]; then
          echo "❌ Campaign failed! Logging details..." | tee -a $ERROR_LOG
          echo "CAMPAIGN FAILED: $LATEST_CAMPAIGN at $(date)" >> $ERROR_LOG
        fi
      fi
      
      # Проверяем размеры изображений в сгенерированных шаблонах
      if [ -d "campaigns/$LATEST_CAMPAIGN/templates" ]; then
        echo "🖼️  Checking image sizes in templates..."
        find "campaigns/$LATEST_CAMPAIGN/templates" -name "*.html" -exec grep -l 'width="16\|width="50\|width="20' {} \; 2>/dev/null | while read template; do
          echo "🚨 TINY IMAGES FOUND in: $template" | tee -a $ERROR_LOG
          echo "--- Tiny images in $template ---" >> $ERROR_LOG
          grep 'width="[1-9][0-9]\?\|width="[1-4][0-9]"' "$template" >> $ERROR_LOG 2>/dev/null
          echo "" >> $ERROR_LOG
        done
      fi
      
    else
      echo "⚠️  No logs directory found yet"
    fi
  else
    echo "⚠️  No campaign directory found yet"
  fi
  
  echo "⏳ Waiting 45 seconds..."
  echo "----------------------------------------"
  
  # Ждем 45 секунд, если это не последняя итерация
  if [ $iteration -lt $max_iterations ]; then
    sleep 45
  fi
done

echo ""
echo "✅ Monitoring completed after 6+ minutes"
echo "📊 Check $ERROR_LOG for collected errors"
echo ""

# Показываем краткий отчет об ошибках
if [ -s $ERROR_LOG ]; then
  echo "🚨 ERRORS SUMMARY:"
  error_count=$(grep -c "🚨" $ERROR_LOG)
  echo "Found $error_count error instances"
  echo ""
  echo "📋 Error types found:"
  grep "🚨" $ERROR_LOG | sort | uniq -c | sort -rn
else
  echo "✅ No errors found during monitoring!"
fi 