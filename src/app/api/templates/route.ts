import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/connection';
import { email_templates, users } from '@/shared/infrastructure/database/schema';
import { eq, like, and, desc, asc, count, or, ilike, sql, gte, lte, between } from 'drizzle-orm';

/**
 * GET /api/templates
 * Retrieve email templates with filtering, searching, and pagination
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
  // Database-specific fields
  briefText?: string;
  generatedContent?: any;
  mjmlCode?: string;
  htmlOutput?: string;
  designTokens?: any;
}

interface TemplatesResponse {
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
    filters: {
      categories: Array<{ value: string; label: string; count: number }>;
      tags: string[];
    };
  };
  metadata?: {
    query_time: number;
    cache_status: string;
  };
}

// Enhanced mock templates with more realistic data
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

// Force dynamic behavior for API route with query parameters
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50); // Max 50 per page
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const status = searchParams.get('status') as 'published' | 'draft' | null;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const userId = searchParams.get('userId');
    
    // Advanced filtering parameters
    const qualityMin = searchParams.get('qualityMin');
    const qualityMax = searchParams.get('qualityMax');
    const agentGenerated = searchParams.get('agentGenerated');
    const dateStart = searchParams.get('dateStart');
    const dateEnd = searchParams.get('dateEnd');

    // Validate parameters
    if (page < 1 || limit < 1) {
      return NextResponse.json({
        success: false,
        error: 'Invalid pagination parameters',
        message: 'Page and limit must be positive integers'
      }, { status: 400 });
    }

    const validSortFields = ['createdAt', 'updatedAt', 'name', 'openRate', 'clickRate', 'qualityScore'];
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid sort field',
        message: `Sort field must be one of: ${validSortFields.join(', ')}`
      }, { status: 400 });
    }

    // Validate quality score range
    if (qualityMin && (isNaN(Number(qualityMin)) || Number(qualityMin) < 0 || Number(qualityMin) > 100)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid quality score minimum value'
      }, { status: 400 });
    }

    if (qualityMax && (isNaN(Number(qualityMax)) || Number(qualityMax) < 0 || Number(qualityMax) > 100)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid quality score maximum value'
      }, { status: 400 });
    }

    // Validate status enum
    if (status && !['published', 'draft'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status value'
      }, { status: 400 });
    }

    // Validate boolean parameters
    if (agentGenerated && !['true', 'false'].includes(agentGenerated)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid boolean value for agentGenerated'
      }, { status: 400 });
    }

    // Validate date format
    if (dateStart && isNaN(Date.parse(dateStart))) {
      return NextResponse.json({
        success: false,
        error: 'Invalid date format for dateStart'
      }, { status: 400 });
    }

    if (dateEnd && isNaN(Date.parse(dateEnd))) {
      return NextResponse.json({
        success: false,
        error: 'Invalid date format for dateEnd'
      }, { status: 400 });
    }

    // Build database query conditions
    const conditions = [];

    // Apply filters
    if (category && category !== 'all') {
      // Note: Using mock data approach since database schema doesn't have category field
      // In real scenario, would need to add category field to email_templates table
      conditions.push(sql`1=0`); // Temporary placeholder - no real category filtering yet
    }

    if (status) {
      conditions.push(eq(email_templates.status, status));
    }

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(email_templates.name, searchPattern),
          ilike(email_templates.description, searchPattern),
          ilike(email_templates.brief_text, searchPattern)
        )
      );
    }

    if (userId) {
      conditions.push(eq(email_templates.user_id, userId));
    }

    // Quality score filtering
    if (qualityMin) {
      conditions.push(gte(email_templates.quality_score, Number(qualityMin)));
    }

    if (qualityMax) {
      conditions.push(lte(email_templates.quality_score, Number(qualityMax)));
    }

    // Agent generation filtering
    if (agentGenerated !== null && agentGenerated !== undefined) {
      // For now, we'll assume all database templates are agent-generated
      // In a real scenario, you'd add an agent_generated column to the schema
      if (agentGenerated === 'false') {
        // If looking for non-AI templates, return no results from DB (fallback to mock)
        conditions.push(sql`1=0`);
      }
    }

    // Date range filtering
    if (dateStart) {
      conditions.push(gte(email_templates.created_at, new Date(dateStart)));
    }

    if (dateEnd) {
      conditions.push(lte(email_templates.created_at, new Date(dateEnd)));
    }

    // Tag filtering (simplified for mock - in real scenario would need proper tags table)
    if (tags && tags.length > 0) {
      // Since we don't have a tags table yet, fall back to mock filtering
      conditions.push(sql`1=0`);
    }

    // Build WHERE clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build ORDER BY clause
    let orderByClause;
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

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(email_templates)
      .where(whereClause);
    
    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Query templates with pagination
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

    // Transform database results to Template interface
    const paginatedTemplates: Template[] = dbTemplates.map(dbTemplate => ({
      id: dbTemplate.id,
      name: dbTemplate.name,
      category: 'general', // Default category since not in schema yet
      description: dbTemplate.description || '',
      thumbnail: '/api/placeholder/400/300',
      createdAt: dbTemplate.created_at.toISOString(),
      updatedAt: dbTemplate.updated_at?.toISOString(),
      status: (dbTemplate.status as 'published' | 'draft') || 'draft',
      qualityScore: dbTemplate.quality_score || undefined,
      agentGenerated: true, // Default for now
      userId: dbTemplate.user_id,
      // Include database-specific fields
      briefText: dbTemplate.brief_text,
      generatedContent: dbTemplate.generated_content,
      mjmlCode: dbTemplate.mjml_code,
      htmlOutput: dbTemplate.html_output,
      designTokens: dbTemplate.design_tokens,
      // Mock additional fields for now
      openRate: Math.random() * 100,
      clickRate: Math.random() * 50,
      tags: ['database', 'generated'],
    }));

    // If no database results, fall back to mock data for development
    let finalTemplates = paginatedTemplates;
    let finalTotal = total;
    let isUsingFallback = false;

    if (finalTemplates.length === 0 && total === 0) {
      // Fall back to mock data if database is empty
      let filteredMockTemplates = [...mockTemplates];
      
      // Apply all filters to mock data
      if (category && category !== 'all') {
        filteredMockTemplates = filteredMockTemplates.filter(t => t.category === category);
      }
      if (status) {
        filteredMockTemplates = filteredMockTemplates.filter(t => t.status === status);
      }
      if (search) {
        const searchLower = search.toLowerCase();
        filteredMockTemplates = filteredMockTemplates.filter(t => 
          t.name.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower)
        );
      }
      if (qualityMin) {
        filteredMockTemplates = filteredMockTemplates.filter(t => 
          (t.qualityScore || 0) >= Number(qualityMin)
        );
      }
      if (qualityMax) {
        filteredMockTemplates = filteredMockTemplates.filter(t => 
          (t.qualityScore || 0) <= Number(qualityMax)
        );
      }
      if (agentGenerated !== null && agentGenerated !== undefined) {
        const isAI = agentGenerated === 'true';
        filteredMockTemplates = filteredMockTemplates.filter(t => t.agentGenerated === isAI);
      }
      if (dateStart) {
        const startDate = new Date(dateStart);
        filteredMockTemplates = filteredMockTemplates.filter(t => 
          new Date(t.createdAt) >= startDate
        );
      }
      if (dateEnd) {
        const endDate = new Date(dateEnd);
        filteredMockTemplates = filteredMockTemplates.filter(t => 
          new Date(t.createdAt) <= endDate
        );
      }
      if (tags && tags.length > 0) {
        filteredMockTemplates = filteredMockTemplates.filter(t => 
          tags.some(tag => t.tags?.includes(tag))
        );
      }
      
      // Apply sorting to mock data
      filteredMockTemplates.sort((a, b) => {
        let aVal, bVal;
        switch (sortBy) {
          case 'name':
            aVal = a.name; bVal = b.name;
            break;
          case 'qualityScore':
            aVal = a.qualityScore || 0; bVal = b.qualityScore || 0;
            break;
          case 'openRate':
            aVal = a.openRate || 0; bVal = b.openRate || 0;
            break;
          case 'clickRate':
            aVal = a.clickRate || 0; bVal = b.clickRate || 0;
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
      
      finalTotal = filteredMockTemplates.length;
      const mockOffset = (page - 1) * limit;
      finalTemplates = filteredMockTemplates.slice(mockOffset, mockOffset + limit);
      isUsingFallback = true;
    }

    // Generate filter options (combining database and mock data)
    const categories = [
      { value: 'general', label: 'General', count: finalTotal },
      { value: 'promotional', label: 'Promotional', count: 2 },
      { value: 'transactional', label: 'Transactional', count: 2 },
      { value: 'welcome', label: 'Welcome', count: 1 },
      { value: 'newsletter', label: 'Newsletter', count: 1 },
      { value: 'announcement', label: 'Announcement', count: 1 }
    ];

    const allTags = ['database', 'generated', 'париж', 'скидка', 'выходные', 'романтика'];

    const queryTime = Date.now() - startTime;

    const finalTotalPages = Math.ceil(finalTotal / limit);

    const response: TemplatesResponse = {
      success: true,
      data: {
        templates: finalTemplates,
        pagination: {
          total: finalTotal,
          page,
          limit,
          totalPages: finalTotalPages,
          hasNext: page < finalTotalPages,
          hasPrev: page > 1
        },
        filters: {
          categories: [
            { value: 'all', label: 'All Templates', count: finalTotal },
            ...categories
          ],
          tags: allTags
        }
      },
      metadata: {
        query_time: queryTime,
        cache_status: isUsingFallback ? 'fallback' : 'database'
      }
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'X-Total-Count': finalTotal.toString(),
        'X-Page': page.toString(),
        'X-Per-Page': limit.toString(),
        'X-Data-Source': isUsingFallback ? 'fallback' : 'database'
      }
    });

  } catch (error) {
    console.error('❌ Templates API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch templates',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'TEMPLATES_FETCH_ERROR',
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? {
        stack: error instanceof Error ? error.stack : null,
        type: error instanceof Error ? error.constructor.name : 'Unknown'
      } : undefined
    }, { status: 500 });
  }
} 