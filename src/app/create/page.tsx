'use client';

import React from 'react';

export default function Create() {
  return (
    <div className="container mx-auto px-6 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-6">
          Создать Email-шаблон
        </h1>
        <p className="text-lg text-white/80 mb-8">
          Используйте силу ИИ для создания профессиональных email-шаблонов
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold text-white mb-2">AI-генерация</h3>
            <p className="text-white/70">Умный контент на основе вашего брифа</p>
          </div>
          
          <div className="glass-card p-6">
            <div className="text-3xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold text-white mb-2">Figma интеграция</h3>
            <p className="text-white/70">Автоматическое извлечение дизайн-токенов</p>
          </div>
        </div>
        
        <div className="flex gap-4 justify-center">
          <button className="glass-button px-6 py-3 bg-kupibilet-primary text-white font-semibold rounded-lg">
            Начать создание
          </button>
        </div>
      </div>
    </div>
  );
}
