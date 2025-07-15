'use client'

import React, { useState } from 'react'
import { GlassCard, GlassButton, GlassInput } from '../glass'

// Icons
const _SparklesIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
)

const _UploadIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
)

const _LinkIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
)

const _CodeIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
)

const _EyeIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const _SettingsIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

interface CreateTemplateForm {
  templateName: string
  contentBrief: string
  figmaUrl: string
  campaignType: string
  tone: string
  audience: string
  primaryColor: string
  secondaryColor: string
  includeImages: boolean
  darkModeSupport: boolean
}

const tabs = [
  { id: 'brief', label: 'Content Brief', icon: '📝' },
  { id: 'design', label: 'Design System', icon: '🎨' },
  { id: 'options', label: 'Options', icon: '⚙️' },
];

const campaignTypes = ['Welcome Email', 'Newsletter', 'Promotional', 'Transactional'];
const toneOptions = ['Professional', 'Friendly', 'Casual', 'Urgent', 'Playful'];
const audienceOptions = ['New Customers', 'Existing Customers', 'VIP Members', 'Prospects', 'General Audience'];

export function CreateTemplatePage() {
  const [activeTab, setActiveTab] = useState('brief');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<any>(null);
  const [formData, setFormData] = useState<CreateTemplateForm>({
    templateName: '',
    contentBrief: '',
    figmaUrl: '',
    campaignType: '',
    tone: '',
    audience: '',
         primaryColor: '#3B82F6',
     secondaryColor: '#8B5CF6',
     includeImages: true,
     darkModeSupport: true,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    console.log('Generating template with data:', formData);
    
    try {
      const response = await fetch('/api/templates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: (() => {
          const requestBody = {
            content: formData.contentBrief,
            type: 'text',
            title: formData.templateName,
            options: {
                          campaignType: formData.campaignType.toLowerCase().replace(' email', '').trim(),
              ...(formData.figmaUrl ? { figmaUrl: formData.figmaUrl } : {}),
              targetAudience: formData.audience.toLowerCase().replace(' ', '-'),
              brandGuidelines: {
                tone: formData.tone.toLowerCase(),
                voice: 'conversational',
                preferredLanguage: 'ru'
              }
            }
          };
          return JSON.stringify(requestBody);
        })(),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Template generated successfully:', result);
        const templateData = {
          subject: result.data.template.subject,
          preheader: result.data.template.preheader,
          htmlContent: result.data.template.html,
          wordCount: result.data.template.metadata.wordCount,
          fileSize: result.data.template.metadata.fileSize
        };
        setGeneratedTemplate(templateData);
        alert(`Template generated successfully!\n\nSubject: ${templateData.subject}\nPreheader: ${templateData.preheader}\n\nHTML template has been created with your specifications.`);
      } else {
        console.error('Generation failed:', result.error);
        alert(`Generation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating template:', error);
      alert('Error generating template. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'brief':
        return (
          <div className="space-y-6">
            <GlassInput
              label="Template Name"
              placeholder="Enter a descriptive name for your template"
              value={formData.templateName}
              onChange={(e) => handleInputChange('templateName', e.target.value)}
            />
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Content Brief
              </label>
              <textarea
                className="w-full h-32 px-4 py-3 bg-glass-primary border border-glass-border rounded-lg text-white placeholder-white/60 focus:bg-glass-primary focus:border-primary-400/50 focus:ring-2 focus:ring-primary-500/50 focus:outline-none backdrop-blur-md transition-all duration-300"
                placeholder="Describe your email content, target audience, key messages, and any specific requirements..."
                value={formData.contentBrief}
                onChange={(e) => handleInputChange('contentBrief', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Campaign Type
                </label>
                <select
                  className="w-full px-4 py-3 bg-glass-primary border border-glass-border rounded-lg text-white focus:bg-glass-primary focus:border-primary-400/50 focus:ring-2 focus:ring-primary-500/50 focus:outline-none backdrop-blur-md transition-all duration-300"
                  value={formData.campaignType}
                  onChange={(e) => handleInputChange('campaignType', e.target.value)}
                >
                  <option value="">Select campaign type</option>
                  {campaignTypes.map((type) => (
                    <option key={type} value={type} className="bg-slate-800">
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Tone
                </label>
                <select
                  className="w-full px-4 py-3 bg-glass-primary border border-glass-border rounded-lg text-white focus:bg-glass-primary focus:border-primary-400/50 focus:ring-2 focus:ring-primary-500/50 focus:outline-none backdrop-blur-md transition-all duration-300"
                  value={formData.tone}
                  onChange={(e) => handleInputChange('tone', e.target.value)}
                >
                  <option value="">Select tone</option>
                  {toneOptions.map((tone) => (
                    <option key={tone} value={tone} className="bg-slate-800">
                      {tone}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Target Audience
              </label>
              <select
                className="w-full px-4 py-3 bg-glass-primary border border-glass-border rounded-lg text-white focus:bg-glass-primary focus:border-primary-400/50 focus:ring-2 focus:ring-primary-500/50 focus:outline-none backdrop-blur-md transition-all duration-300"
                value={formData.audience}
                onChange={(e) => handleInputChange('audience', e.target.value)}
              >
                <option value="">Select target audience</option>
                {audienceOptions.map((audience) => (
                  <option key={audience} value={audience} className="bg-slate-800">
                    {audience}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'design':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <GlassInput
                label="Figma URL (Optional)"
                placeholder="https://figma.com/file/..."
                value={formData.figmaUrl}
                onChange={(e) => handleInputChange('figmaUrl', e.target.value)}
              />
              <p className="text-sm text-white/60">
                Paste your Figma design URL to extract design tokens automatically
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Primary Color
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="w-12 h-12 rounded-lg border border-glass-border bg-transparent cursor-pointer"
                  />
                  <GlassInput
                    value={formData.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Secondary Color
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    className="w-12 h-12 rounded-lg border border-glass-border bg-transparent cursor-pointer"
                  />
                  <GlassInput
                    value={formData.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-4">
                Brand Assets
              </label>
              <div className="border-2 border-dashed border-glass-border rounded-lg p-8 text-center">
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-white/60 mb-2">Upload your brand assets</p>
                <p className="text-white/40 text-sm">Logo, images, or other brand elements</p>
                <GlassButton variant="ghost" size="sm" className="mt-4">
                  Choose Files
                </GlassButton>
              </div>
            </div>
          </div>
        );

      case 'options':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Template Options</h3>
              
              <div className="flex items-center justify-between p-4 bg-glass-secondary rounded-lg border border-glass-border">
                <div>
                  <div className="text-white font-medium">Include Images</div>
                  <div className="text-white/60 text-sm">Add relevant images to enhance the template</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.includeImages}
                    onChange={(e) => handleInputChange('includeImages', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-glass-secondary rounded-lg border border-glass-border">
                <div>
                  <div className="text-white font-medium">Dark Mode Support</div>
                  <div className="text-white/60 text-sm">Optimize template for dark mode email clients</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.darkModeSupport}
                    onChange={(e) => handleInputChange('darkModeSupport', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Tips for Better Results</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-glass-secondary rounded-lg border border-glass-border">
                  <div className="w-2 h-2 bg-accent-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="text-white/70 text-sm">
                    Provide detailed content briefs for more accurate AI-generated content
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-glass-secondary rounded-lg border border-glass-border">
                  <div className="w-2 h-2 bg-accent-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="text-white/70 text-sm">
                    Include your brand colors and Figma URLs for consistent design
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-glass-secondary rounded-lg border border-glass-border">
                  <div className="w-2 h-2 bg-accent-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="text-white/70 text-sm">
                    Specify your target audience for personalized messaging
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create Email Template</h1>
            <p className="text-white/70">Use AI to generate professional email templates</p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-400/30'
                    : 'text-white/60 hover:text-white hover:bg-glass-primary'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <GlassCard variant="primary" className="p-6">
            {renderTabContent()}
          </GlassCard>

          {/* Generate Button */}
          <div className="mt-6">
            <GlassButton
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleGenerate}
              loading={isGenerating}
              disabled={!formData.templateName || !formData.contentBrief}
            >
              {isGenerating ? 'Generating Template...' : 'Generate Email Template'}
            </GlassButton>
          </div>
        </div>

        {/* Preview Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <h2 className="text-xl font-semibold text-white mb-4">Live Preview</h2>
            <GlassCard variant="secondary" className="p-6">
              <div className="aspect-[3/4] bg-white/5 rounded-lg border border-glass-border overflow-hidden">
                {generatedTemplate ? (
                  <div className="h-full p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg p-4 text-black text-sm">
                      <div className="border-b border-gray-200 pb-2 mb-3">
                        <div className="font-semibold text-xs text-gray-600 uppercase">Subject</div>
                        <div className="text-sm">{generatedTemplate.subject}</div>
                      </div>
                      <div className="border-b border-gray-200 pb-2 mb-3">
                        <div className="font-semibold text-xs text-gray-600 uppercase">Preheader</div>
                        <div className="text-xs text-gray-700">{generatedTemplate.preheader}</div>
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-gray-600 uppercase mb-1">Content Preview</div>
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ 
                            __html: generatedTemplate.htmlContent?.substring(0, 500) + '...' || 'Content generated successfully'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <p className="text-white/60 text-sm">
                        Template preview will appear here after generation
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Template Info */}
            <GlassCard variant="secondary" className="p-4 mt-4">
              <h3 className="text-lg font-semibold text-white mb-3">Template Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Name:</span>
                  <span className="text-white">{formData.templateName || 'Untitled'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Type:</span>
                  <span className="text-white">{formData.campaignType || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Tone:</span>
                  <span className="text-white">{formData.tone || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Audience:</span>
                  <span className="text-white">{formData.audience || 'Not set'}</span>
                </div>
                {generatedTemplate && (
                  <>
                    <div className="border-t border-glass-border pt-2 mt-3">
                      <div className="flex justify-between">
                        <span className="text-white/60">Status:</span>
                        <span className="text-green-400">✓ Generated</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Size:</span>
                        <span className="text-white">{Math.round((generatedTemplate.htmlContent?.length || 0) / 1024)}KB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Word Count:</span>
                        <span className="text-white">{generatedTemplate.wordCount || 'N/A'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
} 