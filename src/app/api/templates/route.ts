import { NextResponse } from 'next/server';

// Моковые данные шаблонов для демонстрации
const mockTemplates = [
  {
    id: '1',
    name: 'Welcome Email',
    description: 'Приветственное письмо для новых пользователей',
    category: 'onboarding',
    preview: '/templates/welcome-preview.png',
    createdAt: '2024-01-15',
    tags: ['welcome', 'onboarding', 'travel']
  },
  {
    id: '2', 
    name: 'Booking Confirmation',
    description: 'Подтверждение бронирования билетов',
    category: 'transactional',
    preview: '/templates/booking-preview.png',
    createdAt: '2024-01-20',
    tags: ['booking', 'confirmation', 'travel']
  },
  {
    id: '3',
    name: 'Flight Deals Newsletter',
    description: 'Рассылка с горячими предложениями',
    category: 'marketing',
    preview: '/templates/deals-preview.png',
    createdAt: '2024-01-25',
    tags: ['deals', 'newsletter', 'marketing']
  },
  {
    id: '4',
    name: 'Travel Tips',
    description: 'Полезные советы для путешественников',
    category: 'content',
    preview: '/templates/tips-preview.png',
    createdAt: '2024-02-01',
    tags: ['tips', 'content', 'travel']
  }
];

export async function GET() {
  try {
    // Имитация задержки API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json({
      success: true,
      templates: mockTemplates,
      total: mockTemplates.length
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch templates' 
      },
      { status: 500 }
    );
  }
} 