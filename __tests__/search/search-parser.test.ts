/**
 * Search Parser Unit Tests
 * Тестирование поискового парсера и функций релевантности
 */

import {
  parseSearchQuery,
  calculateRelevanceScore,
  highlightSearchTerms,
  createSearchSnippet,
  validateSearchQuery,
  defaultSearchWeights
} from '@/shared/utils/search-parser'

describe('🔍 Search Parser Tests', () => {
  describe('parseSearchQuery', () => {
    test('should parse simple terms', () => {
      const result = parseSearchQuery('париж отдых')
      
      expect(result.terms).toEqual(['париж', 'отдых'])
      expect(result.exactPhrases).toEqual([])
      expect(result.excludedTerms).toEqual([])
      expect(result.fieldQueries).toEqual([])
      expect(result.orQueries).toEqual([])
      expect(result.originalQuery).toBe('париж отдых')
    })

    test('should parse exact phrases', () => {
      const result = parseSearchQuery('купибилет "парк горького" москва')
      
      expect(result.terms).toEqual(['купибилет', 'москва'])
      expect(result.exactPhrases).toEqual(['парк горького'])
      expect(result.excludedTerms).toEqual([])
    })

    test('should parse excluded terms', () => {
      const result = parseSearchQuery('отдых -дорого -бюджет')
      
      expect(result.terms).toEqual(['отдых'])
      expect(result.excludedTerms).toEqual(['дорого', 'бюджет'])
      expect(result.exactPhrases).toEqual([])
    })

    test('should parse field queries', () => {
      const result = parseSearchQuery('name:париж status:published description:отдых')
      
      expect(result.fieldQueries).toEqual([
        { field: 'name', value: 'париж' },
        { field: 'status', value: 'published' },
        { field: 'description', value: 'отдых' }
      ])
      expect(result.terms).toEqual([])
    })

    test('should parse OR queries', () => {
      const result = parseSearchQuery('москва OR спб OR питер')
      
      expect(result.orQueries).toEqual([
        ['москва'],
        ['спб'],
        ['питер']
      ])
      expect(result.terms).toEqual([])
    })

    test('should parse complex mixed query', () => {
      const result = parseSearchQuery('отдых "горящие авиабилеты" -дорого name:париж скидка OR акция')
      
      expect(result.terms).toEqual([])  // Все термы теперь в OR группах
              expect(result.exactPhrases).toEqual(['горящие авиабилеты'])
      expect(result.excludedTerms).toEqual(['дорого'])
      expect(result.fieldQueries).toEqual([
        { field: 'name', value: 'париж' }
      ])
      expect(result.orQueries).toEqual([
        ['отдых'], // Первая часть тоже становится OR группой
        ['скидка'],
        ['акция']
      ])
    })

    test('should handle empty query', () => {
      const result = parseSearchQuery('')
      
      expect(result.terms).toEqual([])
      expect(result.exactPhrases).toEqual([])
      expect(result.excludedTerms).toEqual([])
      expect(result.fieldQueries).toEqual([])
      expect(result.orQueries).toEqual([])
      expect(result.originalQuery).toBe('')
    })

    test('should handle query with only spaces', () => {
      const result = parseSearchQuery('   ')
      
      expect(result.terms).toEqual([])
      expect(result.originalQuery).toBe('')
    })
  })

  describe('calculateRelevanceScore', () => {
    test('should calculate score for simple terms', () => {
      const query = parseSearchQuery('париж отдых')
      const text = 'Отдых в Париже - это незабываемые впечатления'
      
      const score = calculateRelevanceScore(text, query, 1.0)
      
      expect(score).toBeGreaterThan(0)
      expect(score).toBe(5 + 5) // 'париж' (5 chars) + 'отдых' (5 chars)
    })

    test('should give higher score for exact phrases', () => {
      const query = parseSearchQuery('"горящие авиабилеты"')
      const text = 'Горящие авиабилеты от Купибилет - лучшие предложения'
      
      const score = calculateRelevanceScore(text, query, 1.0)
      
              expect(score).toBe(30) // 'горящие авиабилеты' (18 chars) * 2 (exact phrase multiplier)
    })

    test('should apply weight multipliers', () => {
      const query = parseSearchQuery('париж')
      const text = 'Париж - город любви'
      
      const score1 = calculateRelevanceScore(text, query, 1.0)
      const score2 = calculateRelevanceScore(text, query, 3.0)
      
      expect(score2).toBe(score1 * 3)
    })

    test('should reduce score for excluded terms', () => {
      const query = parseSearchQuery('отдых -дорого')
      const text1 = 'Отдых в Париже'
      const text2 = 'Отдых в Париже, но дорого'
      
      const score1 = calculateRelevanceScore(text1, query, 1.0)
      const score2 = calculateRelevanceScore(text2, query, 1.0)
      
      expect(score1).toBeGreaterThan(score2)
    })

    test('should handle OR queries correctly', () => {
      const query = parseSearchQuery('москва OR спб')
      const text1 = 'Путешествие в Москву'
      const text2 = 'Путешествие в СПб'
      const text3 = 'Путешествие в Казань'
      
      const score1 = calculateRelevanceScore(text1, query, 1.0)
      const score2 = calculateRelevanceScore(text2, query, 1.0)
      const score3 = calculateRelevanceScore(text3, query, 1.0)
      
      expect(score1).toBeGreaterThan(0)
      expect(score2).toBeGreaterThan(0)
      expect(score3).toBe(0)
    })

    test('should return 0 for no matches', () => {
      const query = parseSearchQuery('париж')
      const text = 'Отдых в Лондоне'
      
      const score = calculateRelevanceScore(text, query, 1.0)
      
      expect(score).toBe(0)
    })
  })

  describe('highlightSearchTerms', () => {
    test('should highlight simple terms', () => {
      const query = parseSearchQuery('париж отдых')
      const text = 'Отдых в Париж это замечательно'
      
      const highlighted = highlightSearchTerms(text, query)
      
      expect(highlighted).toContain('<mark>Отдых</mark>')
      expect(highlighted).toContain('<mark>Париж</mark>')
    })

    test('should highlight exact phrases', () => {
      const query = parseSearchQuery('"горящие авиабилеты"')
      const text = 'Горящие авиабилеты от Купибилет'
      
      const highlighted = highlightSearchTerms(text, query)
      
              expect(highlighted).toContain('<mark>Горящие авиабилеты</mark>')
    })

    test('should use custom highlight tag', () => {
      const query = parseSearchQuery('париж')
      const text = 'Париж - город мечты'
      
      const highlighted = highlightSearchTerms(text, query, 'strong')
      
      expect(highlighted).toContain('<strong>Париж</strong>')
    })

    test('should handle case insensitive highlighting', () => {
      const query = parseSearchQuery('ПАРИЖ')
      const text = 'париж - красивый город'
      
      const highlighted = highlightSearchTerms(text, query)
      
      expect(highlighted).toContain('<mark>париж</mark>')
    })

    test('should handle overlapping matches correctly', () => {
      const query = parseSearchQuery('город "париж город"')
      const text = 'Париж город любви'
      
      const highlighted = highlightSearchTerms(text, query)
      
      // Longer phrases should take precedence
      expect(highlighted).toContain('<mark>Париж город</mark>')
    })
  })

  describe('createSearchSnippet', () => {
    test('should create snippet with context', () => {
      const query = parseSearchQuery('париж')
      const text = 'Это очень длинный текст про путешествия. Париж является одним из самых красивых городов мира. Здесь много достопримечательностей.'
      
      const snippet = createSearchSnippet(text, query, 50)
      
      expect(snippet).toContain('Париж')
      expect(snippet.length).toBeLessThanOrEqual(53) // 50 + ellipsis
      expect(snippet).toContain('Париж')
      // Should have some form of context indication
      expect(snippet.includes('...') || snippet.length <= 50).toBe(true)
    })

    test('should return beginning if no matches', () => {
      const query = parseSearchQuery('лондон')
      const text = 'Париж является красивым городом с множеством достопримечательностей'
      
      const snippet = createSearchSnippet(text, query, 30)
      
      expect(snippet).toBe('Париж является красивым городом...')
    })

    test('should handle short text correctly', () => {
      const query = parseSearchQuery('париж')
      const text = 'Париж красив'
      
      const snippet = createSearchSnippet(text, query, 50)
      
      expect(snippet).toBe('Париж красив')
    })

    test('should find first match in long text', () => {
      const query = parseSearchQuery('второй')
      const text = 'Первый абзац текста не содержит ключевого слова. Второй абзац содержит нужное слово. Третий абзац тоже.'
      
      const snippet = createSearchSnippet(text, query, 50)
      
      expect(snippet).toContain('Второй')
      expect(snippet).not.toContain('Первый')
    })
  })

  describe('validateSearchQuery', () => {
    test('should validate correct queries', () => {
      const result = validateSearchQuery('париж "горящие авиабилеты" -дорого name:отель')
      
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    test('should reject empty queries', () => {
      const result = validateSearchQuery('')
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Search query cannot be empty')
    })

    test('should reject too long queries', () => {
      const longQuery = 'a'.repeat(501)
      const result = validateSearchQuery(longQuery)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Search query too long (maximum 500 characters)')
    })

    test('should detect unmatched quotes', () => {
      const result = validateSearchQuery('париж "незакрытая кавычка')
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Unmatched quotes in search query')
    })

    test('should validate field names', () => {
      const result = validateSearchQuery('invalidfield:value')
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid field "invalidfield" in field:value query')
    })

    test('should accept valid field names', () => {
      const result = validateSearchQuery('name:value description:test status:published')
      
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })
  })

  describe('Edge Cases', () => {
    test('should handle special characters in search', () => {
      const query = parseSearchQuery('user@example.com +7(999)123-45-67')
      
      expect(query.terms).toContain('user@example.com')
      expect(query.terms).toContain('+7(999)123-45-67')
    })

    test('should handle unicode characters', () => {
      const query = parseSearchQuery('😊 эмодзи тест')
      
      expect(query.terms).toContain('😊')
      expect(query.terms).toContain('эмодзи')
      expect(query.terms).toContain('тест')
    })

    test('should handle mixed language search', () => {
      const query = parseSearchQuery('Paris париж English русский')
      
      expect(query.terms).toContain('paris')
      expect(query.terms).toContain('париж')
      expect(query.terms).toContain('english')
      expect(query.terms).toContain('русский')
    })

    test('should handle HTML in text for highlighting', () => {
      const query = parseSearchQuery('test')
      const text = '<p>This is a test</p>'
      
      const highlighted = highlightSearchTerms(text, query)
      
      expect(highlighted).toBe('<p>This is a <mark>test</mark></p>')
    })
  })
})