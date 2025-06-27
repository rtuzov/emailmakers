export default function Home() {
  return (
    <main className="relative">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Welcome to Email Template Generator
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
              AI-powered email template generation with premium glass UI design and cross-client compatibility.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/create"
                className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 ease-in-out backdrop-blur-md border focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary/20 border-primary/30 text-primary hover:bg-primary/30 hover:border-primary/50 focus:ring-primary/50 shadow-glass hover:shadow-glow-primary px-6 py-3 text-base gap-2 min-w-[200px] hover:scale-105 active:scale-95"
              >
                Create Template
              </a>
              <a 
                href="/templates"
                className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 ease-in-out backdrop-blur-md border focus:outline-none focus:ring-2 focus:ring-offset-2 bg-white/5 border-white/10 text-white hover:bg-accent/10 hover:border-accent/20 focus:ring-accent/50 shadow-glass-sm hover:shadow-glow-accent px-6 py-3 text-base gap-2 min-w-[200px] hover:scale-105 active:scale-95"
              >
                View Templates
              </a>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              { 
                title: 'Foundation', 
                description: 'Authentication system and database setup',
                status: 'Complete', 
                progress: 100,
                color: 'primary' 
              },
              { 
                title: 'Core Services', 
                description: 'AI services and template processing',
                status: 'Complete', 
                progress: 100,
                color: 'primary' 
              },
              { 
                title: 'Frontend', 
                description: 'Premium glass UI implementation',
                status: 'Complete', 
                progress: 100,
                color: 'primary' 
              },
              { 
                title: 'Quality Assurance', 
                description: 'Testing and validation systems',
                status: 'Pending', 
                progress: 60,
                color: 'warning' 
              },
              { 
                title: 'Deployment', 
                description: 'Performance tuning and production setup',
                status: 'Pending', 
                progress: 30,
                color: 'warning' 
              },
              { 
                title: 'Testing', 
                description: 'Cross-client compatibility testing',
                status: 'Pending', 
                progress: 20,
                color: 'warning' 
              }
            ].map((item, index) => (
              <div 
                key={index}
                className="rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-primary border-glass-border shadow-glass hover:shadow-glass-lg hover:scale-[1.02] hover:border-glass-border p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <span 
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.color === 'primary' 
                        ? 'bg-primary/20 text-primary border border-primary/30' 
                        : 'bg-warning/20 text-warning border border-warning/30'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                
                <p className="text-white/70 mb-4 text-sm">
                  {item.description}
                </p>
                
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      item.color === 'primary' ? 'bg-primary' : 'bg-warning'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-secondary border-glass-border shadow-glass-sm hover:shadow-glass p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">AI-Powered Generation</h3>
              </div>
              <p className="text-white/70">
                Advanced AI algorithms create professional email templates tailored to your brand and audience.
              </p>
            </div>

            <div className="rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-secondary border-glass-border shadow-glass-sm hover:shadow-glass p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">Cross-Client Compatible</h3>
              </div>
              <p className="text-white/70">
                Templates work perfectly across all major email clients including Gmail, Outlook, and Apple Mail.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-white/5 border-white/10 shadow-glass-sm hover:bg-white/10 inline-block px-8 py-4">
              <p className="text-accent font-medium">
                ✨ All systems operational. Ready for email template generation.
              </p>
            </div>
          </div>
        </div>
      </main>
  )
}
