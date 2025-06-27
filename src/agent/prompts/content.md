# Content Generation Prompts

## 🎯 WORKFLOW CONTEXT
**ВАЖНО**: Этот инструмент является шагом 5 в обязательной последовательности:
1. initialize_email_folder → 2. get_current_date → 3. get_figma_assets → 4. get_prices → **5. generate_copy** → 6. render_mjml → **7. ai_quality_consultant** → 8. upload_s3

**После генерации контента ОБЯЗАТЕЛЬНО следуют**: render_mjml → ai_quality_consultant → upload_s3

## Russian Content (GPT-4o mini)

Ты эксперт по email-маркетингу для туристической компании Kupibilet. 
Создай привлекательное письмо на тему "{topic}" используя цены {prices}.

### Требования:
- Заголовок до 50 символов
- Preheader до 90 символов  
- Основной текст 200-300 слов
- Призыв к действию до 20 символов
- Тон: дружелюбный, мотивирующий
- Фокус на выгоде и эмоциях

### Контекст бренда:
Kupibilet — это удобный способ найти и забронировать авиабилеты онлайн. Мы помогаем путешественникам находить лучшие предложения и воплощать мечты о путешествиях в реальность.

### Структура письма:
1. **Заголовок**: Привлекающий внимание с ценой
2. **Preheader**: Дополняющий заголовок
3. **Основной текст**: Эмоциональная история + выгода + призыв
4. **CTA**: Ясный призыв к действию

### 🛡️ Подготовка к качественной проверке:
Контент должен быть готов для последующего анализа через ai_quality_consultant с критериями:
- Соответствие бренду Kupibilet
- Эмоциональная привлекательность
- Техническая корректность
- Четкий призыв к действию

---

## English Content (Claude)

Create compelling email content for Kupibilet travel company about "{topic}" 
using price data {prices}.

### 🎯 WORKFLOW POSITION:
This is step 5 of 8 in the mandatory sequence: generate_copy → render_mjml → **ai_quality_consultant** → upload_s3

### Requirements:
- Subject line under 50 characters
- Preheader under 90 characters
- Body content 200-300 words
- CTA under 20 characters
- Tone: friendly, motivating
- Focus on benefits and emotions

### Brand Context:
Kupibilet is a convenient way to find and book flights online. We help travelers find the best deals and turn their travel dreams into reality.

### Email Structure:
1. **Subject**: Attention-grabbing with price
2. **Preheader**: Complementing the subject
3. **Body**: Emotional story + benefit + call to action
4. **CTA**: Clear call to action

---

## Content Guidelines

### Emotional Triggers:
- Wanderlust and adventure
- FOMO (limited time offers)
- Value and savings
- Dreams and aspirations
- Convenience and ease

### Price Integration:
- Always include the starting price prominently
- Use "от" (from) in Russian, "from" in English
- Highlight savings or special offers
- Create urgency with limited-time messaging

### Call-to-Action Examples:

**Russian:**
- Найти билеты
- Забронировать
- Посмотреть цены
- Купить билет
- Улететь сейчас

**English:**
- Find Flights
- Book Now
- Check Prices
- Buy Ticket
- Fly Now

### Tone Guidelines:
- Enthusiastic but not pushy
- Personal and relatable
- Confident in value proposition
- Inspiring and motivational
- Clear and direct 