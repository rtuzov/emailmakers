'use client';

import { useState } from 'react';

export default function Create() {
  const [activeTab, setActiveTab] = useState('content');
  const [formData, setFormData] = useState({
    subject: '',
    preheader: '',
    content: '',
    tone: 'friendly',
    audience: 'general',
    cta: '',
    figmaUrl: '',
    images: []
  });

  const tabs = [
    { 
      id: 'content', 
      label: 'Контент', 
      icon: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      id: 'design', 
      label: 'Дизайн', 
      icon: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: 'settings', 
      label: 'Настройки', 
      icon: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  const toneOptions = [
    { value: 'friendly', label: 'Дружелюбный', color: 'text-kupibilet-primary' },
    { value: 'professional', label: 'Профессиональный', color: 'text-kupibilet-secondary' },
    { value: 'urgent', label: 'Срочный', color: 'text-kupibilet-accent' },
    { value: 'casual', label: 'Неформальный', color: 'text-kupibilet-primary' }
  ];

  const audienceOptions = [
    { value: 'general', label: 'Общая аудитория' },
    { value: 'business', label: 'Бизнес-клиенты' },
    { value: 'travelers', label: 'Путешественники' },
    { value: 'vip', label: 'VIP клиенты' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    // TODO: Implement template generation
    console.log('Generating template with data:', formData);
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium text-white/20 mb-6" style={{backgroundColor: 'rgba(75, 255, 126, 0.2)'}}>
            <span>🎨</span>
            <span>AI-Powered Email Generator</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Создать <span style={{color: '#4BFF7E'}}>Email-шаблон</span>
          </h1>
          
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Создайте профессиональный email-шаблон с помощью ИИ за несколько минут
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/20 overflow-hidden" style={{backgroundColor: 'rgba(255, 255, 255, 0.05)'}}>
              {/* Tabs */}
              <div className="flex border-b border-white/10">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                        activeTab === tab.id ? 'bg-white/10 text-white border-2' : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                      }`}
                      style={activeTab === tab.id ? {borderBottomColor: '#4BFF7E', backgroundColor: 'rgba(75, 255, 126, 0.1)'} : {}}
                    >
                      <Icon />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="p-8">
                {activeTab === 'content' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Тема письма
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        placeholder="Введите тему письма..."
                        className="w-full px-4 py-3 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{backgroundColor: 'rgba(255, 255, 255, 0.1)', '--tw-ring-color': '#4BFF7E'} as any}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Предзаголовок
                      </label>
                      <input
                        type="text"
                        value={formData.preheader}
                        onChange={(e) => handleInputChange('preheader', e.target.value)}
                        placeholder="Краткое описание содержания..."
                        className="w-full px-4 py-3 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{backgroundColor: 'rgba(255, 255, 255, 0.1)', '--tw-ring-color': '#4BFF7E'} as any}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Основной контент
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => handleInputChange('content', e.target.value)}
                        placeholder="Опишите содержание письма или вставьте готовый текст..."
                        rows={8}
                        className="w-full px-4 py-3 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                        style={{backgroundColor: 'rgba(255, 255, 255, 0.1)', '--tw-ring-color': '#4BFF7E'} as any}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Call-to-Action
                      </label>
                      <input
                        type="text"
                        value={formData.cta}
                        onChange={(e) => handleInputChange('cta', e.target.value)}
                        placeholder="Например: Забронировать билет"
                        className="w-full px-4 py-3 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{backgroundColor: 'rgba(255, 255, 255, 0.1)', '--tw-ring-color': '#4BFF7E'} as any}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'design' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Figma URL (опционально)
                      </label>
                      <input
                        type="url"
                        value={formData.figmaUrl}
                        onChange={(e) => handleInputChange('figmaUrl', e.target.value)}
                        placeholder="https://figma.com/file/..."
                        className="w-full px-4 py-3 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{backgroundColor: 'rgba(255, 255, 255, 0.1)', '--tw-ring-color': '#4BFF7E'} as any}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Загрузить изображения
                      </label>
                      <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-opacity-50 transition-colors" style={{'--hover-border-color': '#4BFF7E'} as any}>
                        <svg className="w-8 h-8 text-white/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-white/70 mb-2">Перетащите изображения сюда</p>
                        <p className="text-sm text-white/50">или нажмите для выбора файлов</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Тон сообщения
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {toneOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleInputChange('tone', option.value)}
                            className={`p-3 rounded-xl border transition-all duration-200 ${
                              formData.tone === option.value
                                ? 'text-white'
                                : 'text-white/70 hover:text-white hover:border-white/30'
                            }`}
                            style={formData.tone === option.value ? 
                              {backgroundColor: 'rgba(75, 255, 126, 0.2)', borderColor: '#4BFF7E'} : 
                              {backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)'}
                            }
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Целевая аудитория
                      </label>
                      <select
                        value={formData.audience}
                        onChange={(e) => handleInputChange('audience', e.target.value)}
                        className="w-full px-4 py-3 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{backgroundColor: 'rgba(255, 255, 255, 0.1)', '--tw-ring-color': '#4BFF7E'} as any}
                      >
                        {audienceOptions.map((option) => (
                          <option key={option.value} value={option.value} className="bg-gray-800">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview */}
            <div className="rounded-2xl border border-white/20 p-6" style={{backgroundColor: 'rgba(255, 255, 255, 0.05)'}}>
              <div className="flex items-center space-x-2 mb-4">
                <svg className="w-5 h-5" style={{color: '#4BFF7E'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <h3 className="text-lg font-semibold text-white">Предпросмотр</h3>
              </div>
              <div className="bg-white rounded-lg p-4 min-h-[200px]">
                <p className="text-gray-500 text-sm">Предпросмотр появится после заполнения формы</p>
              </div>
            </div>

            {/* Generation Controls */}
            <div className="rounded-2xl border border-white/20 p-6" style={{backgroundColor: 'rgba(255, 255, 255, 0.05)'}}>
              <div className="flex items-center space-x-2 mb-4">
                <svg className="w-5 h-5" style={{color: '#4BFF7E'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-lg font-semibold text-white">Генерация</h3>
              </div>
              
              <button
                onClick={handleGenerate}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 hover:shadow-lg"
                style={{backgroundColor: '#4BFF7E'}}
              >
                Создать шаблон
              </button>
              
              <p className="text-xs text-white/50 mt-3 text-center">
                Генерация займет 10-30 секунд
              </p>
            </div>

            {/* Tips */}
            <div className="rounded-2xl border border-white/20 p-6" style={{backgroundColor: 'rgba(255, 255, 255, 0.05)'}}>
              <h3 className="text-lg font-semibold text-white mb-4">Советы</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li>• Используйте четкие и понятные заголовки</li>
                <li>• Добавьте персональные элементы</li>
                <li>• Укажите конкретный призыв к действию</li>
                <li>• Тестируйте на разных устройствах</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}