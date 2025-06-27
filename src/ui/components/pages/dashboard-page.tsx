'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export function DashboardPage() {
  const router = useRouter()

  const handleCreateTemplate = () => {
    router.push('/create')
  }

  const handleViewTemplates = () => {
    router.push('/templates')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to Email<span style={{ color: 'rgb(29, 168, 87)' }}>Makers</span>
        </h1>
        <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
          AI-powered email template generation platform with premium glass UI design.
          Create professional email templates with intelligent content generation and cross-client compatibility.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            className="px-6 py-3 text-base font-medium text-white rounded-lg border transition-all duration-300"
            style={{ 
              backgroundColor: 'rgba(29, 168, 87, 0.2)', 
              borderColor: 'rgba(29, 168, 87, 0.5)',
              color: 'rgb(29, 168, 87)'
            }}
            onClick={handleCreateTemplate}
          >
            Create New Template
          </button>
          <button 
            className="px-6 py-3 text-base font-medium text-white rounded-lg border transition-all duration-300"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
              borderColor: 'rgba(255, 255, 255, 0.2)'
            }}
            onClick={handleViewTemplates}
          >
            View Templates
          </button>
        </div>
      </div>

      {/* Project Status */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Project Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 1, title: 'Foundation', description: 'Authentication system and database setup', status: 'complete' },
            { id: 2, title: 'Creative Exploration', description: 'AI services and template processing', status: 'complete' },
            { id: 3, title: 'Core Services', description: 'Service orchestration and integration', status: 'complete' },
            { id: 4, title: 'Frontend Development', description: 'Premium glass UI implementation', status: 'complete' },
            { id: 5, title: 'Quality Assurance', description: 'Testing and validation systems', status: 'pending' },
            { id: 6, title: 'Optimization & Deployment', description: 'Performance tuning and production setup', status: 'pending' }
          ].map((phase) => (
            <div 
              key={phase.id} 
              className="p-6 rounded-xl border backdrop-blur-md transition-all duration-300"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                borderColor: 'rgba(255, 255, 255, 0.2)' 
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">
                  Phase {phase.id}: {phase.title}
                </h3>
                <div 
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: phase.status === 'complete' ? 'rgba(29, 168, 87, 0.2)' : 'rgba(255, 200, 0, 0.2)',
                    color: phase.status === 'complete' ? 'rgb(29, 168, 87)' : 'rgb(255, 200, 0)'
                  }}
                >
                  {phase.status === 'complete' ? 'Complete' : 'Pending'}
                </div>
              </div>
              
              <p className="text-white/70 mb-4 text-sm">
                {phase.description}
              </p>
              
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: phase.status === 'complete' ? '100%' : '0%',
                    backgroundColor: phase.status === 'complete' ? 'rgb(29, 168, 87)' : 'rgb(255, 200, 0)'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="text-center">
        <p className="text-white/60">
          Email-Makers is ready for development. All core systems are operational.
        </p>
      </div>
    </div>
  )
} 