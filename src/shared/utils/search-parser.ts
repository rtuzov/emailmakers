/**
 * Advanced Search Query Parser
 * Парсер для расширенных поисковых запросов с операторами
 */

export interface SearchQuery {
  terms: string[]
  exactPhrases: string[]
  excludedTerms: string[]
  fieldQueries: { field: string; value: string }[]
  orQueries: string[][]
  originalQuery: string
}

export interface SearchWeights {
  name: number
  description: number
  brief_text: number
  tags: number
}

export const defaultSearchWeights: SearchWeights = {
  name: 3.0,
  description: 2.0,
  brief_text: 1.5,
  tags: 1.0
}

/**
 * Парсит поисковый запрос с поддержкой операторов:
 * - "exact phrase" - точная фраза в кавычках
 * - -exclusion - исключение слов с минусом
 * - field:value - поиск в конкретном поле
 * - OR operator - альтернативы (term1 OR term2)
 */
export function parseSearchQuery(query: string): SearchQuery {
  const result: SearchQuery = {
    terms: [],
    exactPhrases: [],
    excludedTerms: [],
    fieldQueries: [],
    orQueries: [],
    originalQuery: query.trim()
  }

  if (!query.trim()) {
    return result
  }

  // Извлекаем точные фразы в кавычках
  const phraseRegex = /"([^"]+)"/g
  let match
  while ((match = phraseRegex.exec(query)) !== null) {
    if (match && match[1]) {
      result.exactPhrases.push(match[1].toLowerCase())
      query = query.replace(match[0], '') // Удаляем из основного запроса
    }
  }

  // Извлекаем field:value запросы
  const fieldRegex = /(\w+):(\S+)/g
  let originalQuery = query
  while ((match = fieldRegex.exec(originalQuery)) !== null) {
    if (match && match[1] && match[2]) {
      result.fieldQueries.push({
        field: match[1].toLowerCase(),
        value: match[2].toLowerCase()
      })
      query = query.replace(match[0], '') // Удаляем из основного запроса
    }
  }

  // Обрабатываем OR операторы (группы слов)
  const orParts = query.split(/\s+OR\s+/i)
  if (orParts.length > 1) {
    // Когда есть OR, каждый терм становится отдельной OR группой
    for (const part of orParts) {
      const words = part.trim().split(/\s+/).filter(term => term.length > 0)
      
      for (const word of words) {
        const cleanWord = word.trim()
        if (cleanWord.startsWith('-') && cleanWord.length > 1) {
          // Исключение в OR группе
          result.excludedTerms.push(cleanWord.substring(1).toLowerCase())
        } else if (cleanWord.length > 0) {
          // Каждое слово в отдельной OR группе
          result.orQueries.push([cleanWord.toLowerCase()])
        }
      }
    }
    return result
  }

  // Обрабатываем обычные слова и исключения
  const words = query.split(/\s+/).filter(word => word.trim().length > 0)
  
  for (const word of words) {
    const cleanWord = word.trim()
    if (cleanWord.startsWith('-') && cleanWord.length > 1) {
      // Исключение
      result.excludedTerms.push(cleanWord.substring(1).toLowerCase())
    } else if (cleanWord.length > 0) {
      // Обычное слово
      result.terms.push(cleanWord.toLowerCase())
    }
  }

  return result
}

/**
 * Вычисляет релевантность текста относительно поискового запроса
 */
export function calculateRelevanceScore(
  text: string, 
  query: SearchQuery, 
  weight: number = 1.0
): number {
  if (!text || (!query.terms.length && !query.exactPhrases.length && !query.orQueries.length)) {
    return 0
  }

  const lowerText = text.toLowerCase()
  let score = 0

  // Точные фразы (высший приоритет)
  for (const phrase of query.exactPhrases) {
    if (lowerText.includes(phrase)) {
      score += phrase.length * 2 * weight // Длинные фразы ценнее
    }
  }

  // Обычные термы
  for (const term of query.terms) {
    if (lowerText.includes(term)) {
      score += term.length * weight
    }
  }

  // OR группы (засчитывается если хотя бы один терм найден)
  for (const orGroup of query.orQueries) {
    if (orGroup.length > 0) {
      const foundTerms = orGroup.filter(term => {
        // Проверяем прямое включение
        if (lowerText.includes(term)) return true
        
        // Для русского языка: проверяем частичное совпадение корней слов
        const words = lowerText.split(/\s+/)
        return words.some(word => {
          // Сравниваем корни слов (первые 4-5 символов для русского языка)
          const minLen = Math.min(4, Math.min(word.length, term.length))
          if (minLen >= 3) {
            return word.substring(0, minLen) === term.substring(0, minLen)
          }
          return false
        })
      })
      if (foundTerms.length > 0) {
        // Берем максимальную длину найденных терминов в группе
        score += Math.max(...foundTerms.map(term => term.length)) * weight
      }
    }
  }

  // Исключения снижают релевантность
  for (const excludedTerm of query.excludedTerms) {
    if (lowerText.includes(excludedTerm)) {
      score -= excludedTerm.length * weight * 0.5
    }
  }

  return Math.max(0, score) // Не может быть отрицательной
}

/**
 * Подсвечивает найденные термы в тексте
 */
export function highlightSearchTerms(
  text: string, 
  query: SearchQuery, 
  highlightTag: string = 'mark'
): string {
  if (!text || (!query.terms.length && !query.exactPhrases.length && !query.orQueries.length)) {
    return text
  }

  const allTerms = [
    ...query.exactPhrases,
    ...query.terms,
    ...query.orQueries.flat()
  ]

  // Сортируем по длине (сначала длинные, чтобы избежать конфликтов)
  allTerms.sort((a, b) => b.length - a.length)

  // Создаем список всех позиций для подсветки
  const highlights: Array<{start: number, end: number, term: string}> = []
  
  for (const term of allTerms) {
    const regex = new RegExp(escapeRegExp(term), 'gi')
    let match
    while ((match = regex.exec(text)) !== null) {
      const start = match.index
      const end = start + term.length
      
      // Проверяем, не пересекается ли с существующими выделениями
      const overlaps = highlights.some(h => 
        (start >= h.start && start < h.end) || 
        (end > h.start && end <= h.end) ||
        (start <= h.start && end >= h.end)
      )
      
      if (!overlaps) {
        highlights.push({start, end, term})
      }
    }
  }

  // Сортируем по позиции
  highlights.sort((a, b) => (a?.start || 0) - (b?.start || 0))

  // Применяем подсветку с конца текста, чтобы не сбить позиции
  let result = text
  for (let i = highlights.length - 1; i >= 0; i--) {
    const highlight = highlights[i]
    if (!highlight) continue
    const {start, end} = highlight
    const before = result.substring(0, start)
    const highlighted = result.substring(start, end)
    const after = result.substring(end)
    result = before + `<${highlightTag}>${highlighted}</${highlightTag}>` + after
  }

  return result
}

/**
 * Создает snippet (краткий отрывок) с контекстом вокруг найденных терминов
 */
export function createSearchSnippet(
  text: string, 
  query: SearchQuery, 
  maxLength: number = 150
): string {
  if (!text || (!query.terms.length && !query.exactPhrases.length && !query.orQueries.length)) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const lowerText = text.toLowerCase()
  const allTerms = [
    ...query.exactPhrases,
    ...query.terms,
    ...query.orQueries.flat()
  ]

  // Находим первое вхождение любого терма
  let firstMatchIndex = -1
  let matchLength = 0

  for (const term of allTerms) {
    const index = lowerText.indexOf(term.toLowerCase())
    if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
      firstMatchIndex = index
      matchLength = term.length
    }
  }

  if (firstMatchIndex === -1) {
    // Если ничего не найдено, возвращаем начало текста
    if (text.length <= maxLength) {
      return text
    }
    // Пытаемся найти хорошую границу слова, допуская небольшое превышение лимита
    let truncated = text.substring(0, maxLength)
    let lastSpace = truncated.lastIndexOf(' ')
    
    // Попробуем взять на одно слово больше, если это не превысит лимит значительно
    const nextSpace = text.indexOf(' ', maxLength)
    if (nextSpace !== -1 && nextSpace - maxLength <= 10) { // Не более 10 символов превышения
      truncated = text.substring(0, nextSpace)
    } else {
      // Если обрезание по границе слова не убирает слишком много текста
      if (lastSpace > truncated.length * 0.6) {
        truncated = truncated.substring(0, lastSpace)
      } else {
        // Обрезаем жестко, но по границе слова если возможно
        truncated = text.substring(0, maxLength - 3)
        lastSpace = truncated.lastIndexOf(' ')
        if (lastSpace > truncated.length * 0.7) {
          truncated = truncated.substring(0, lastSpace)
        }
      }
    }
    
    return truncated + '...'
  }

  // Вычисляем границы snippet с контекстом
  const ellipsisLength = 3
  const needsStartEllipsis = firstMatchIndex > 0
  const needsEndEllipsis = firstMatchIndex + matchLength < text.length
  
  // Учитываем длину многоточий в расчете доступного места
  const reservedLength = (needsStartEllipsis ? ellipsisLength : 0) + (needsEndEllipsis ? ellipsisLength : 0)
  const availableLength = maxLength - reservedLength
  const contextLength = Math.floor((availableLength - matchLength) / 2)
  
  const startPos = Math.max(0, firstMatchIndex - contextLength)
  const endPos = Math.min(text.length, startPos + availableLength)

  let snippet = text.substring(startPos, endPos)

  // Добавляем многоточия если обрезали
  if (startPos > 0) snippet = '...' + snippet
  if (endPos < text.length) snippet = snippet + '...'

  return snippet
}

/**
 * Экранирует специальные символы для регулярных выражений
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Валидирует поисковый запрос
 */
export function validateSearchQuery(query: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!query || query.trim().length === 0) {
    errors.push('Search query cannot be empty')
  }
  
  if (query.length > 500) {
    errors.push('Search query too long (maximum 500 characters)')
  }

  // Проверяем сбалансированность кавычек
  const quoteCount = (query.match(/"/g) || []).length
  if (quoteCount % 2 !== 0) {
    errors.push('Unmatched quotes in search query')
  }

  // Проверяем корректность field:value синтаксиса
  const fieldQueries = query.match(/\w+:\S+/g) || []
  for (const fieldQuery of fieldQueries) {
    const [field] = fieldQuery.split(':')
    const validFields = ['name', 'description', 'brief_text', 'tags', 'status']
    if (field && !validFields.includes(field.toLowerCase())) {
      errors.push(`Invalid field "${field}" in field:value query`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}