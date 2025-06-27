'use client';

import { useState } from 'react';
import { GlassButton } from '@/ui/components/glass/glass-button';
import { GlassCard } from '@/ui/components/glass/glass-card';

interface TestResult {
  originalName: string;
  shortName: string;
  allTagsCount: number;
  selectedTagsCount: number;
  allTags: string[];
  selectedTags: string[];
  confidence: number;
  emotionalTone: string;
}

interface TestResponse {
  success: boolean;
  data?: {
    processedFiles: number;
    totalTags: number;
    totalFiles: number;
    results: TestResult[];
    outputDirectory: string;
    files: string[];
    dictionary: {
      jsonPath: string;
      csvPath: string;
      agentPath: string;
    };
  };
  message?: string;
  error?: string;
}

export default function TestTagSystemPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResponse | null>(null);

  const runTest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-tag-system', {
        method: 'POST',
      });
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatus = async () => {
    try {
      const response = await fetch('/api/test-tag-system');
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🧪 Тестирование Системы Тегов
          </h1>
          <p className="text-blue-200 text-lg">
            Проверка работы системы генерации тегов и словаря файлов
          </p>
        </div>

        <div className="flex gap-4 justify-center mb-8">
          <GlassButton
            onClick={runTest}
            disabled={isLoading}
            className="px-6 py-3"
          >
            {isLoading ? '⏳ Обработка...' : '🚀 Запустить Тест'}
          </GlassButton>
          
          <GlassButton
            onClick={getStatus}
            variant="outline"
            className="px-6 py-3"
          >
            📊 Проверить Статус
          </GlassButton>
        </div>

        {testResults && (
          <div className="space-y-6">
            {testResults.success ? (
              <div className="space-y-6">
                {/* Общая статистика */}
                <GlassCard className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    📈 Результаты Обработки
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">
                        {testResults.data?.processedFiles || 0}
                      </div>
                      <div className="text-blue-200">Обработано файлов</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">
                        {testResults.data?.totalTags || 0}
                      </div>
                      <div className="text-blue-200">Уникальных тегов</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-400">
                        {testResults.data?.totalFiles || 0}
                      </div>
                      <div className="text-blue-200">Файлов в словаре</div>
                    </div>
                  </div>
                  {testResults.message && (
                    <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <p className="text-green-200">{testResults.message}</p>
                    </div>
                  )}
                </GlassCard>

                {/* Детальные результаты */}
                {testResults.data?.results && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white">
                      📋 Детализация по файлам
                    </h3>
                    {testResults.data.results.map((result, index) => (
                      <GlassCard key={index} className="p-6">
                        <div className="space-y-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <h4 className="text-lg font-semibold text-white">
                                📄 {result.originalName}
                              </h4>
                              <p className="text-blue-200 text-sm">
                                Короткое имя: {result.shortName}.png
                              </p>
                            </div>
                            <div className="flex gap-4 text-sm">
                              <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-200">
                                {result.emotionalTone}
                              </span>
                              <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-200">
                                {Math.round(result.confidence * 100)}% уверенность
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-semibold text-white mb-2">
                                🏷️ Использованные теги ({result.selectedTagsCount})
                              </h5>
                              <div className="flex flex-wrap gap-1">
                                {result.selectedTags.map((tag, tagIndex) => (
                                  <span
                                    key={tagIndex}
                                    className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-200"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h5 className="font-semibold text-white mb-2">
                                📚 Все теги от GPT-4 ({result.allTagsCount})
                              </h5>
                              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                                {result.allTags.map((tag, tagIndex) => (
                                  <span
                                    key={tagIndex}
                                    className={`px-2 py-1 rounded text-xs ${
                                      result.selectedTags.includes(tag)
                                        ? 'bg-green-500/20 border border-green-500/30 text-green-200'
                                        : 'bg-gray-500/20 border border-gray-500/30 text-gray-300'
                                    }`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="text-sm text-blue-200">
                            Эффективность использования тегов: {' '}
                            <span className="font-semibold">
                              {Math.round((result.selectedTagsCount / result.allTagsCount) * 100)}%
                            </span>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                )}

                {/* Информация о файлах */}
                {testResults.data?.files && (
                  <GlassCard className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      📁 Созданные файлы
                    </h3>
                    <div className="space-y-2">
                      {testResults.data.files.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-blue-200">
                          <span className="text-blue-400">
                            {file.endsWith('.json') ? '📋' : 
                             file.endsWith('.csv') ? '📊' : 
                             file.endsWith('.png') ? '🖼️' : '📄'}
                          </span>
                          <span className="font-mono text-sm">{file}</span>
                        </div>
                      ))}
                    </div>
                    
                    {testResults.data.dictionary && (
                      <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                        <p className="text-blue-200 text-sm">
                          💾 Словарь сохранен в: {testResults.data.outputDirectory}
                        </p>
                      </div>
                    )}
                  </GlassCard>
                )}
              </div>
            ) : (
              <GlassCard className="p-6">
                <div className="text-center">
                  <div className="text-red-400 text-xl mb-2">❌ Ошибка</div>
                  <p className="text-red-200">{testResults.error}</p>
                </div>
              </GlassCard>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-blue-200 text-sm">
            💡 Система автоматически сохраняет словарь после каждого обработанного файла
          </p>
        </div>
      </div>
    </div>
  );
} 