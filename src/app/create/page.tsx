'use client';

import { useState } from 'react';

// Icons
const TemplateIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const SparklesIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
)

interface FormData {
  templateName: string;
  contentBrief: string;
  campaignType: string;
  tone: string;
  targetAudience: string;
}

interface GenerationResult {
  jobId: string;
  template: {
    id: string;
    subject: string;
    preheader: string;
    html: string;
    metadata: {
      generatedAt: string;
      fileSize: number;
      wordCount: number;
      estimatedReadTime: number;
    };
  };
  qualityReport: {
    overallScore: number;
    crossClientCompatibility: {
      score: number;
      supportedClients: string[];
    };
    accessibility: {
      score: number;
    };
    performance: {
      score: number;
      metrics: {
        fileSize: number;
        loadTime: number;
      };
    };
  };
}

export default function Create() {
  const [formData, setFormData] = useState<FormData>({
    templateName: '',
    contentBrief: '',
    campaignType: '',
    tone: '',
    targetAudience: ''
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerate = async () => {
    if (!formData.contentBrief.trim()) {
      setError('Please provide a content brief');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/templates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_name: formData.templateName,
          content_brief: formData.contentBrief,
          campaign_type: formData.campaignType || 'promotional',
          tone: formData.tone || 'friendly',
          target_audience: formData.targetAudience || 'general audience',
          language: 'ru'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate template');
      }

      if (data.success) {
        setResult(data.data);
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = () => {
    // Save form data to localStorage
    localStorage.setItem('emailDraft', JSON.stringify(formData));
    alert('Draft saved locally!');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Glass Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg border-b border-glass-border bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-3xl font-bold text-white">
              Email<span className="text-primary">Makers</span>
            </h1>
            <nav className="hidden md:flex space-x-4">
              <a href="/" className="px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-accent transition-colors">
                Dashboard
              </a>
              <a href="/templates" className="px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-accent transition-colors">
                Templates
              </a>
              <a href="/create" className="px-3 py-2 rounded-md text-sm font-medium text-white hover:text-accent transition-colors">
                Create
              </a>
            </nav>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Create Email Template</h2>
          <p className="text-white/70">Generate professional email templates with AI-powered content creation</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-6">
            {/* Template Name */}
            <div className="rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-primary border-glass-border shadow-glass p-6">
              <label className="block text-sm font-medium text-white mb-2">
                Template Name
              </label>
              <input
                type="text"
                placeholder="Enter template name..."
                value={formData.templateName}
                onChange={(e) => handleInputChange('templateName', e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Content Brief */}
            <div className="rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-primary border-glass-border shadow-glass p-6">
              <label className="block text-sm font-medium text-white mb-2">
                Content Brief
              </label>
              <textarea
                placeholder="Describe your email content..."
                rows={4}
                value={formData.contentBrief}
                onChange={(e) => handleInputChange('contentBrief', e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-vertical"
              />
            </div>

            {/* Campaign Type */}
            <div className="rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-primary border-glass-border shadow-glass p-6">
              <label className="block text-sm font-medium text-white mb-2">
                Campaign Type
              </label>
              <select 
                value={formData.campaignType}
                onChange={(e) => handleInputChange('campaignType', e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="">Select type</option>
                <option value="newsletter">Newsletter</option>
                <option value="promotional">Promotional</option>
                <option value="transactional">Transactional</option>
                <option value="welcome">Welcome</option>
                <option value="abandoned_cart">Abandoned Cart</option>
              </select>
            </div>

            {/* Tone */}
            <div className="rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-primary border-glass-border shadow-glass p-6">
              <label className="block text-sm font-medium text-white mb-2">
                Tone
              </label>
              <select 
                value={formData.tone}
                onChange={(e) => handleInputChange('tone', e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="">Select tone</option>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
                <option value="urgent">Urgent</option>
                <option value="formal">Formal</option>
              </select>
            </div>

            {/* Target Audience */}
            <div className="rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-primary border-glass-border shadow-glass p-6">
              <label className="block text-sm font-medium text-white mb-2">
                Target Audience
              </label>
              <input
                type="text"
                placeholder="e.g., Young professionals, Parents, etc."
                value={formData.targetAudience}
                onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 ease-in-out backdrop-blur-md border focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary/20 border-primary/30 text-primary hover:bg-primary/30 hover:border-primary/50 focus:ring-primary/50 shadow-glass hover:shadow-glow-primary px-6 py-3 text-base gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <SparklesIcon />
                {isGenerating ? 'Generating...' : 'Generate Template'}
              </button>
              <button 
                onClick={handleSaveDraft}
                className="px-6 py-3 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all font-medium"
              >
                Save Draft
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="rounded-xl border backdrop-blur bg-red-500/10 border-red-500/30 p-4">
                <div className="text-red-400 text-sm">{error}</div>
              </div>
            )}
          </div>

          {/* Preview/Results */}
          <div className="space-y-6">
            {result ? (
              <div className="rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-secondary border-glass-border shadow-glass-sm p-8">
                <div className="text-white">
                  <h3 className="text-xl font-semibold mb-4 text-green-400">✅ Template Generated Successfully!</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-white/90 mb-2">Template Details:</h4>
                      <div className="text-sm text-white/70 space-y-1">
                        <div>Subject: {result.template.subject}</div>
                        <div>Job ID: {result.jobId}</div>
                        <div>File Size: {Math.round(result.template.metadata.fileSize / 1024)} KB</div>
                        <div>Word Count: {result.template.metadata.wordCount}</div>
                        <div>Estimated Read Time: {result.template.metadata.estimatedReadTime} min</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-white/90 mb-2">Quality Report:</h4>
                      <div className="text-sm text-white/70 space-y-1">
                        <div>Overall Score: {Math.round(result.qualityReport.overallScore * 100)}%</div>
                        <div>Cross-Client Compatibility: {Math.round(result.qualityReport.crossClientCompatibility.score * 100)}%</div>
                        <div>Accessibility Score: {Math.round(result.qualityReport.accessibility.score * 100)}%</div>
                        <div>Performance Score: {Math.round(result.qualityReport.performance.score * 100)}%</div>
                        <div>Supported Clients: {result.qualityReport.crossClientCompatibility.supportedClients.join(', ')}</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <button 
                        onClick={() => {
                          const blob = new Blob([result.template.html], { type: 'text/html' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${result.template.subject || 'email-template'}.html`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="inline-flex items-center px-4 py-2 bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30 transition-all text-sm"
                      >
                        Download HTML
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-secondary border-glass-border shadow-glass-sm p-8">
                <div className="text-center text-white/60">
                  <div className="w-16 h-16 mx-auto mb-4 bg-accent/20 rounded-lg flex items-center justify-center">
                    <TemplateIcon />
                  </div>
                  <div className="text-lg font-medium mb-2 text-white">
                    {isGenerating ? 'Generating Template...' : 'Ready to Generate'}
                  </div>
                  <div>
                    {isGenerating 
                      ? 'Please wait while we create your email template' 
                      : 'Fill out the form and click "Generate Template" to create your email'
                    }
                  </div>
                  {isGenerating && (
                    <div className="mt-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-12">
          <div className="rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-secondary border-glass-border shadow-glass-sm p-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <SparklesIcon />
              Pro Tips for Better Templates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white/70">
              <div>
                <h4 className="font-medium text-white mb-2">Content Brief</h4>
                <p className="text-sm">Be specific about your message, goals, and key points. Include any special offers or deadlines.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">Target Audience</h4>
                <p className="text-sm">Define your audience clearly - age, interests, profession. This helps AI tailor the tone and content.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">Campaign Type</h4>
                <p className="text-sm">Choose the right type for optimal structure and call-to-action placement.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">Tone Selection</h4>
                <p className="text-sm">Match the tone to your brand voice and audience expectations for better engagement.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}