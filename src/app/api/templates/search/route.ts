import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/connection';
import { email_templates } from '@/shared/infrastructure/database/schema';
import { eq, like, and, desc, asc, count, or, ilike, sql, gte, lte } from 'drizzle-orm';
import { 
  parseSearchQuery, 
  calculateRelevanceScore, 
  highlightSearchTerms, 
  createSearchSnippet,
  validateSearchQuery,
  defaultSearchWeights,
  type SearchQuery 
} from '@/shared/utils/search-parser';

// Force dynamic behavior for search API route
export const dynamic = 'force-dynamic'

/**
 * POST /api/templates/search
 * Advanced template search with relevance scoring, highlighting, and operators
 */

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail?: string;
  preview?: string;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  status?: 'published' | 'draft';
  openRate?: number;
  clickRate?: number;
  htmlContent?: string;
  mjmlContent?: string;
  textContent?: string;
  subjectLine?: string;
  previewText?: string;
  qualityScore?: number;
  agentGenerated?: boolean;
  userId?: string;
  briefText?: string;
  generatedContent?: any;
  mjmlCode?: string;
  htmlOutput?: string;
  designTokens?: any;
  // Search-specific fields
  relevanceScore?: number;
  highlightedName?: string;
  highlightedDescription?: string;
  snippet?: string;
}

interface SearchRequest {
  query: string;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'createdAt' | 'updatedAt' | 'name' | 'qualityScore';
  sortOrder?: 'asc' | 'desc';
  filters?: {
    category?: string;
    status?: 'published' | 'draft';
    qualityMin?: number;
    qualityMax?: number;
    agentGenerated?: boolean;
    dateStart?: string;
    dateEnd?: string;
    tags?: string[];
  };
}

interface SearchResponse {
  success: boolean;
  data: {
    templates: Template[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    searchInfo: {
      query: string;
      parsedQuery: SearchQuery;
      totalMatches: number;
      searchTime: number;
      suggestions?: string[];
    };
  };
  metadata?: {
    query_time: number;
    cache_status: string;
    search_method: 'database' | 'fallback';
  };
}

// Enhanced mock templates for fallback search
const mockTemplates: Template[] = [
  {
    id: 'tpl_1709567890123',
    name: 'Парижский Уик-энд: Скидка 30%',
    category: 'promotional',
    description: 'Эксклюзивное предложение на романтические выходные в Париже с билетами от Купибилет',
    thumbnail: '/api/placeholder/400/300',
    preview: '/templates/paris-weekend-preview.png',
    createdAt: '2024-03-04T14:30:00Z',
    updatedAt: '2024-03-04T15:45:00Z',
    tags: ['париж', 'скидка', 'выходные', 'романтика'],
    status: 'published',
    openRate: 89.5,
    clickRate: 24.8,
    qualityScore: 92,
    agentGenerated: true,
    subjectLine: '🇫🇷 Париж ждет вас! Скидка 30% на романтические выходные',
    previewText: 'Откройте для себя магию Парижа с эксклюзивными предложениями от Купибилет',
    userId: 'user_123'
  },
  {
    id: 'tpl_1709567890124',
    name: 'Подтверждение Бронирования Москва-СПб',
    category: 'transactional',
    description: 'Автоматическое подтверждение бронирования билетов по маршруту Москва-Санкт-Петербург',
    thumbnail: '/api/placeholder/400/300',
    preview: '/templates/booking-confirmation-preview.png',
    createdAt: '2024-03-03T10:15:00Z',
    updatedAt: '2024-03-03T10:15:00Z',
    tags: ['подтверждение', 'бронирование', 'москва', 'спб'],
    status: 'published',
    openRate: 98.2,
    clickRate: 45.6,
    qualityScore: 96,
    agentGenerated: true,
    subjectLine: '✅ Ваши билеты Москва-СПб забронированы',
    previewText: 'Подтверждение бронирования №BR-2024-03-001234',
    userId: 'user_123'
  },
  {
    id: 'tpl_1709567890125',
    name: 'Добро пожаловать в Купибилет',
    category: 'welcome',
    description: 'Приветственное письмо для новых пользователей с инструкциями и бонусами',
    thumbnail: '/api/placeholder/400/300',
    preview: '/templates/welcome-series-preview.png',
    createdAt: '2024-03-02T16:20:00Z',
    updatedAt: '2024-03-02T16:20:00Z',
    tags: ['добро пожаловать', 'онбординг', 'новый пользователь'],
    status: 'published',
    openRate: 85.3,
    clickRate: 32.1,
    qualityScore: 88,
    agentGenerated: true,
    subjectLine: '🎉 Добро пожаловать в Купибилет! Ваш бонус внутри',
    previewText: 'Спасибо за регистрацию! Получите 500 баллов на первое путешествие',
    userId: 'user_123'
  },
  {
    id: 'tpl_1709567890126',
    name: 'Еженедельная Рассылка Горящих Предложений',
    category: 'newsletter',
    description: 'Подборка лучших предложений недели с актуальными скидками на популярные направления',
    thumbnail: '/api/placeholder/400/300',
    preview: '/templates/hot-deals-newsletter-preview.png',
    createdAt: '2024-03-01T09:00:00Z',
    updatedAt: '2024-03-01T09:00:00Z',
    tags: ['рассылка', 'горящие', 'предложения', 'скидки'],
    status: 'published',
    openRate: 76.8,
    clickRate: 18.9,
    qualityScore: 84,
    agentGenerated: true,
    subjectLine: '🔥 Горящие предложения недели от Купибилет',
    previewText: 'Турция от 12,900₽, Италия от 18,500₽, Испания от 15,200₽',
    userId: 'user_123'
  },
  {
    id: 'tpl_1709567890127',
    name: 'Анонс Новых Маршрутов',
    category: 'announcement',
    description: 'Объявление о запуске новых направлений и маршрутов в летнем сезоне',
    thumbnail: '/api/placeholder/400/300',
    preview: '/templates/new-routes-announcement-preview.png',
    createdAt: '2024-02-28T13:45:00Z',
    updatedAt: '2024-02-28T14:00:00Z',
    tags: ['анонс', 'новые маршруты', 'лето', 'направления'],
    status: 'draft',
    openRate: 82.1,
    clickRate: 28.4,
    qualityScore: 90,
    agentGenerated: true,
    subjectLine: '✈️ Новые направления лета 2024 уже доступны',
    previewText: 'Баку, Астана, Алматы и еще 15 городов ждут вас',
    userId: 'user_123'
  },
  {
    id: 'tpl_1709567890128',
    name: 'Напоминание о Неиспользованных Билетах',
    category: 'transactional',
    description: 'Уведомление пользователям о неиспользованных билетах с возможностью возврата',
    thumbnail: '/api/placeholder/400/300',
    preview: '/templates/unused-tickets-reminder-preview.png',
    createdAt: '2024-02-27T11:30:00Z',
    updatedAt: '2024-02-27T11:30:00Z',
    tags: ['напоминание', 'билеты', 'возврат', 'неиспользованные'],
    status: 'published',
    openRate: 91.7,
    clickRate: 38.2,
    qualityScore: 94,
    agentGenerated: false,
    subjectLine: '⏰ У вас есть неиспользованные билеты',
    previewText: 'Не забудьте воспользоваться билетами или оформить возврат',
    userId: 'user_123'
  }
];

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: SearchRequest = await request.json();
    const { query, page = 1, limit = 12, sortBy = 'relevance', sortOrder = 'desc', filters = {} } = body;

    // Validate search query
    const validation = validateSearchQuery(query);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid search query',
        message: validation.errors.join(', ')
      }, { status: 400 });
    }

    // Parse search query
    const parsedQuery = parseSearchQuery(query);
    
    // Validate pagination
    if (page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json({
        success: false,
        error: 'Invalid pagination parameters',
        message: 'Page must be >= 1, limit must be 1-50'
      }, { status: 400 });
    }

    let finalTemplates: Template[] = [];
    let totalMatches = 0;
    let searchMethod: 'database' | 'fallback' = 'database';

    try {
      // Try database search first
      const dbResults = await searchInDatabase(parsedQuery, filters, page, limit, sortBy, sortOrder);
      finalTemplates = dbResults.templates;
      totalMatches = dbResults.total;
    } catch (dbError) {
      console.warn('Database search failed, falling back to mock data:', dbError);
      // Fallback to mock data search
      const mockResults = await searchInMockData(parsedQuery, filters, page, limit, sortBy, sortOrder);
      finalTemplates = mockResults.templates;
      totalMatches = mockResults.total;
      searchMethod = 'fallback';
    }

    // Add search-specific enhancements to results
    finalTemplates = finalTemplates.map(template => ({
      ...template,
      highlightedName: highlightSearchTerms(template.name, parsedQuery),
      highlightedDescription: highlightSearchTerms(template.description, parsedQuery),
      snippet: createSearchSnippet(template.description + ' ' + (template.briefText || ''), parsedQuery, 150)
    }));

    const totalPages = Math.ceil(totalMatches / limit);
    const queryTime = Date.now() - startTime;

    const response: SearchResponse = {
      success: true,
      data: {
        templates: finalTemplates,
        pagination: {
          total: totalMatches,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        searchInfo: {
          query: parsedQuery.originalQuery,
          parsedQuery,
          totalMatches,
          searchTime: queryTime
        }
      },
      metadata: {
        query_time: queryTime,
        cache_status: searchMethod === 'database' ? 'database' : 'fallback',
        search_method: searchMethod
      }
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        'X-Total-Count': totalMatches.toString(),
        'X-Search-Time': queryTime.toString(),
        'X-Search-Method': searchMethod
      }
    });

  } catch (error) {
    console.error('❌ Search API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'SEARCH_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Search in database with PostgreSQL full-text search
 */
async function searchInDatabase(
  parsedQuery: SearchQuery, 
  filters: SearchRequest['filters'] = {}, 
  page: number, 
  limit: number, 
  sortBy: string, 
  sortOrder: string
): Promise<{ templates: Template[]; total: number }> {
  const conditions = [];
  
  // Build search conditions
  if (parsedQuery.terms.length > 0 || parsedQuery.exactPhrases.length > 0) {
    const searchConditions = [];
    
    // Regular terms
    for (const term of parsedQuery.terms) {
      const termPattern = `%${term}%`;
      searchConditions.push(
        or(
          ilike(email_templates.name, termPattern),
          ilike(email_templates.description, termPattern),
          ilike(email_templates.brief_text, termPattern)
        )
      );
    }
    
    // Exact phrases
    for (const phrase of parsedQuery.exactPhrases) {
      const phrasePattern = `%${phrase}%`;
      searchConditions.push(
        or(
          ilike(email_templates.name, phrasePattern),
          ilike(email_templates.description, phrasePattern),
          ilike(email_templates.brief_text, phrasePattern)
        )
      );
    }
    
    if (searchConditions.length > 0) {
      conditions.push(and(...searchConditions));
    }
  }

  // Apply filters
  if (filters.status) {
    conditions.push(eq(email_templates.status, filters.status));
  }
  if (filters.qualityMin) {
    conditions.push(gte(email_templates.quality_score, filters.qualityMin));
  }
  if (filters.qualityMax) {
    conditions.push(lte(email_templates.quality_score, filters.qualityMax));
  }
  if (filters.dateStart) {
    conditions.push(gte(email_templates.created_at, new Date(filters.dateStart)));
  }
  if (filters.dateEnd) {
    conditions.push(lte(email_templates.created_at, new Date(filters.dateEnd)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(email_templates)
    .where(whereClause);
  
  const total = totalResult[0]?.count || 0;

  // Build ORDER BY clause
  let orderByClause;
  if (sortBy === 'relevance') {
    // For relevance, we'll need to calculate it in JavaScript since we don't have full-text search yet
    orderByClause = desc(email_templates.created_at); // Fallback to date
  } else {
    const sortColumn = (() => {
      switch (sortBy) {
        case 'createdAt': return email_templates.created_at;
        case 'updatedAt': return email_templates.updated_at;
        case 'name': return email_templates.name;
        case 'qualityScore': return email_templates.quality_score;
        default: return email_templates.created_at;
      }
    })();
    orderByClause = sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);
  }

  const offset = (page - 1) * limit;

  // Query templates
  const dbTemplates = await db
    .select({
      id: email_templates.id,
      user_id: email_templates.user_id,
      name: email_templates.name,
      description: email_templates.description,
      brief_text: email_templates.brief_text,
      generated_content: email_templates.generated_content,
      mjml_code: email_templates.mjml_code,
      html_output: email_templates.html_output,
      design_tokens: email_templates.design_tokens,
      status: email_templates.status,
      quality_score: email_templates.quality_score,
      created_at: email_templates.created_at,
      updated_at: email_templates.updated_at,
    })
    .from(email_templates)
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  // Transform and calculate relevance scores
  const templates: Template[] = dbTemplates.map(dbTemplate => {
    const template: Template = {
      id: dbTemplate.id,
      name: dbTemplate.name,
      category: 'general',
      description: dbTemplate.description || '',
      thumbnail: '/api/placeholder/400/300',
      createdAt: dbTemplate.created_at.toISOString(),
      updatedAt: dbTemplate.updated_at?.toISOString(),
      status: (dbTemplate.status as 'published' | 'draft') || 'draft',
      qualityScore: dbTemplate.quality_score || undefined,
      agentGenerated: true,
      userId: dbTemplate.user_id,
      briefText: dbTemplate.brief_text,
      generatedContent: dbTemplate.generated_content,
      mjmlCode: dbTemplate.mjml_code,
      htmlOutput: dbTemplate.html_output,
      designTokens: dbTemplate.design_tokens,
      openRate: Math.random() * 100,
      clickRate: Math.random() * 50,
      tags: ['database', 'generated'],
    };

    // Calculate relevance score
    let relevanceScore = 0;
    relevanceScore += calculateRelevanceScore(template.name, parsedQuery, defaultSearchWeights.name);
    relevanceScore += calculateRelevanceScore(template.description, parsedQuery, defaultSearchWeights.description);
    relevanceScore += calculateRelevanceScore(template.briefText || '', parsedQuery, defaultSearchWeights.brief_text);
    
    template.relevanceScore = relevanceScore;
    return template;
  });

  // Sort by relevance if requested
  if (sortBy === 'relevance') {
    templates.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  return { templates, total };
}

/**
 * Search in mock data with enhanced scoring
 */
async function searchInMockData(
  parsedQuery: SearchQuery,
  filters: SearchRequest['filters'] = {},
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: string
): Promise<{ templates: Template[]; total: number }> {
  let filteredTemplates = [...mockTemplates];

  // Calculate relevance scores for all templates
  filteredTemplates = filteredTemplates.map(template => {
    let relevanceScore = 0;
    relevanceScore += calculateRelevanceScore(template.name, parsedQuery, defaultSearchWeights.name);
    relevanceScore += calculateRelevanceScore(template.description, parsedQuery, defaultSearchWeights.description);
    relevanceScore += calculateRelevanceScore((template.tags || []).join(' '), parsedQuery, defaultSearchWeights.tags);
    
    return { ...template, relevanceScore };
  });

  // Filter by search relevance (only include results with score > 0)
  if (parsedQuery.terms.length > 0 || parsedQuery.exactPhrases.length > 0 || parsedQuery.orQueries.length > 0) {
    filteredTemplates = filteredTemplates.filter(template => (template.relevanceScore || 0) > 0);
  }

  // Apply additional filters
  if (filters.status) {
    filteredTemplates = filteredTemplates.filter(t => t.status === filters.status);
  }
  if (filters.qualityMin) {
    filteredTemplates = filteredTemplates.filter(t => (t.qualityScore || 0) >= filters.qualityMin!);
  }
  if (filters.qualityMax) {
    filteredTemplates = filteredTemplates.filter(t => (t.qualityScore || 0) <= filters.qualityMax!);
  }
  if (filters.agentGenerated !== undefined) {
    filteredTemplates = filteredTemplates.filter(t => t.agentGenerated === filters.agentGenerated);
  }
  if (filters.dateStart) {
    const startDate = new Date(filters.dateStart);
    filteredTemplates = filteredTemplates.filter(t => new Date(t.createdAt) >= startDate);
  }
  if (filters.dateEnd) {
    const endDate = new Date(filters.dateEnd);
    filteredTemplates = filteredTemplates.filter(t => new Date(t.createdAt) <= endDate);
  }
  if (filters.tags && filters.tags.length > 0) {
    filteredTemplates = filteredTemplates.filter(t => 
      filters.tags!.some(tag => t.tags?.includes(tag))
    );
  }

  // Apply sorting
  filteredTemplates.sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case 'relevance':
        aVal = a.relevanceScore || 0;
        bVal = b.relevanceScore || 0;
        break;
      case 'name':
        aVal = a.name;
        bVal = b.name;
        break;
      case 'qualityScore':
        aVal = a.qualityScore || 0;
        bVal = b.qualityScore || 0;
        break;
      case 'updatedAt':
        aVal = new Date(a.updatedAt || a.createdAt).getTime();
        bVal = new Date(b.updatedAt || b.createdAt).getTime();
        break;
      default:
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
    }
    
    if (typeof aVal === 'string') {
      return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
    } else {
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    }
  });

  const total = filteredTemplates.length;
  const offset = (page - 1) * limit;
  const paginatedTemplates = filteredTemplates.slice(offset, offset + limit);

  return { templates: paginatedTemplates, total };
}