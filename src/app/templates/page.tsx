// Icons
const SearchIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const MailIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const EyeIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const EditIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const mockTemplates = [
  {
    id: '1',
    name: 'Welcome Email Series',
    category: 'Onboarding',
    description: 'A beautiful welcome email template for new subscribers with personalized greeting and company introduction',
    createdAt: 'January 27, 2025',
    status: 'published',
    openRate: 85.2,
    clickRate: 12.4
  },
  {
    id: '2',
    name: 'Product Launch Announcement',
    category: 'Marketing',
    description: 'Eye-catching template for product launches and announcements with compelling visuals and clear CTAs',
    createdAt: 'January 26, 2025',
    status: 'published',
    openRate: 78.9,
    clickRate: 15.6
  },
  {
    id: '3',
    name: 'Monthly Newsletter',
    category: 'Newsletter',
    description: 'Clean and professional monthly newsletter template featuring company updates, industry news, and insights',
    createdAt: 'January 25, 2025',
    status: 'draft'
  }
]

export default function Templates() {
  const categories = ['all', 'Onboarding', 'Marketing', 'Newsletter', 'Sales']

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
              <a href="/templates" className="px-3 py-2 rounded-md text-sm font-medium text-white hover:text-accent transition-colors">
                Templates
              </a>
              <a href="/create" className="px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-accent transition-colors">
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
          <h2 className="text-3xl font-bold text-white mb-2">Email Templates</h2>
          <p className="text-white/70">Manage and browse your professional email templates</p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockTemplates.map((template) => (
            <div key={template.id} className="rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-primary border-glass-border shadow-glass hover:shadow-glass-lg hover:scale-[1.02] hover:border-glass-border overflow-hidden">
              {/* Template Preview */}
              <div className="aspect-[3/2] bg-background-light/20 relative">
                <div className="absolute inset-0 flex items-center justify-center text-white/60">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-accent/20 rounded-lg flex items-center justify-center">
                      <MailIcon />
                    </div>
                    <p className="text-sm font-medium">Email Template</p>
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    template.status === 'published' 
                      ? 'bg-primary/20 text-primary border-primary/30' 
                      : 'bg-warning/20 text-warning border-warning/30'
                  }`}>
                    {template.status}
                  </span>
                </div>
              </div>
              
              {/* Template Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white line-clamp-1">{template.name}</h3>
                  <span className="text-xs text-accent bg-accent/10 px-2 py-1 rounded ml-2 whitespace-nowrap">
                    {template.category}
                  </span>
                </div>
                
                <p className="text-white/70 text-sm mb-4 line-clamp-2">{template.description}</p>
                
                {/* Metrics */}
                {template.openRate && (
                  <div className="flex gap-4 mb-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                      <span className="text-white/60">Open:</span>
                      <span className="text-primary ml-1 font-medium">{template.openRate}%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-accent rounded-full mr-2"></div>
                      <span className="text-white/60">Click:</span>
                      <span className="text-accent ml-1 font-medium">{template.clickRate}%</span>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-white/50 mb-4">
                  Created {template.createdAt}
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <button className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 ease-in-out backdrop-blur-md border focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary/20 border-primary/30 text-primary hover:bg-primary/30 hover:border-primary/50 focus:ring-primary/50 shadow-glass hover:shadow-glow-primary px-3 py-1.5 text-sm gap-1.5 flex-1 hover:scale-105 active:scale-95">
                    <EyeIcon />
                    Preview
                  </button>
                  <button className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 ease-in-out backdrop-blur-md border focus:outline-none focus:ring-2 focus:ring-offset-2 bg-white/5 border-white/10 text-white hover:bg-accent/10 hover:border-accent/20 focus:ring-accent/50 shadow-glass-sm hover:shadow-glow-accent px-3 py-1.5 text-sm gap-1.5 flex-1 hover:scale-105 active:scale-95">
                    <EditIcon />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create New Template CTA */}
        <div className="mt-12 text-center">
          <div className="rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-secondary border-glass-border shadow-glass-sm hover:shadow-glass inline-block p-8">
            <h3 className="text-xl font-semibold text-white mb-2">Ready to create something amazing?</h3>
            <p className="text-white/70 mb-6">Generate professional email templates with AI-powered content creation.</p>
            <a 
              href="/create"
              className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 ease-in-out backdrop-blur-md border focus:outline-none focus:ring-2 focus:ring-offset-2 bg-accent/20 border-accent/30 text-accent hover:bg-accent/30 hover:border-accent/50 focus:ring-accent/50 shadow-glass hover:shadow-glow-accent animate-glow-pulse px-8 py-4 text-lg gap-3 hover:scale-105 active:scale-95"
            >
              Create New Template
            </a>
          </div>
        </div>
      </main>
    </div>
  )
} 