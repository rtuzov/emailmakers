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

export default function Create() {
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
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-vertical"
              />
            </div>

            {/* Campaign Type */}
            <div className="rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-primary border-glass-border shadow-glass p-6">
              <label className="block text-sm font-medium text-white mb-2">
                Campaign Type
              </label>
              <select className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
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
              <select className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
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
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button className="flex-1 inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 ease-in-out backdrop-blur-md border focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary/20 border-primary/30 text-primary hover:bg-primary/30 hover:border-primary/50 focus:ring-primary/50 shadow-glass hover:shadow-glow-primary px-6 py-3 text-base gap-2 hover:scale-105 active:scale-95">
                <SparklesIcon />
                Generate Template
              </button>
              <button className="px-6 py-3 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all font-medium">
                Save Draft
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <div className="rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-secondary border-glass-border shadow-glass-sm p-8">
              <div className="text-center text-white/60">
                <div className="w-16 h-16 mx-auto mb-4 bg-accent/20 rounded-lg flex items-center justify-center">
                  <TemplateIcon />
                </div>
                <div className="text-lg font-medium mb-2 text-white">Ready to Generate</div>
                <div>Fill out the form and click "Generate Template" to create your email</div>
              </div>
            </div>
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