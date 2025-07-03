'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/ui/components/layout/dashboard-layout'
import { GlassCard } from '@/ui/components/glass/glass-card'
import { GlassButton } from '@/ui/components/glass/glass-button'
import Link from 'next/link'

export default function Dashboard() {
  const [optimizationStatus, setOptimizationStatus] = useState<any>(null);

  // Fetch optimization system status
  useEffect(() => {
    const fetchOptimizationStatus = async () => {
      try {
        const response = await fetch('/api/optimization/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'analyze_system' })
        });
        const data = await response.json();
        if (data.success) {
          setOptimizationStatus(data.analysis);
        }
      } catch (error) {
        console.error('Failed to fetch optimization status:', error);
      }
    };

    fetchOptimizationStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchOptimizationStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Stats for the top cards
  const stats = [
    {
      label: 'Templates Created',
      value: '1,247',
      change: '+12.5%',
      trend: 'up',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'text-primary'
    },
    {
      label: 'Active Campaigns',
      value: '43',
      change: '+8.2%',
      trend: 'up',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'text-accent'
    },
    {
      label: 'Open Rate',
      value: '24.8%',
      change: '+3.1%',
      trend: 'up',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: 'text-secondary'
    },
    {
      label: 'Click Rate',
      value: '8.4%',
      change: '+5.7%',
      trend: 'up',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ),
      color: 'text-primary'
    },
    // Optimization System Status
    {
      label: 'System Health',
      value: optimizationStatus ? `${optimizationStatus.current_state.health_score}%` : '...',
      change: optimizationStatus ? `${optimizationStatus.insights.trends_detected} trends` : '',
      trend: optimizationStatus && optimizationStatus.current_state.health_score > 80 ? 'up' : 'neutral',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: optimizationStatus && optimizationStatus.current_state.health_score > 80 ? 'text-green-400' : 'text-accent',
      isOptimization: true
    }
  ]

  // Recent templates
  const recentTemplates = [
    {
      id: 1,
      name: 'Black Friday Campaign',
      type: 'Promotional',
      created: '2 hours ago',
      status: 'published',
      performance: '89%'
    },
    {
      id: 2,
      name: 'Newsletter November',
      type: 'Newsletter',
      created: '1 day ago',
      status: 'draft',
      performance: '76%'
    },
    {
      id: 3,
      name: 'Product Launch Announcement',
      type: 'Product',
      created: '3 days ago',
      status: 'published',
      performance: '92%'
    },
    {
      id: 4,
      name: 'Welcome Series Email 2',
      type: 'Automation',
      created: '5 days ago',
      status: 'published',
      performance: '84%'
    }
  ]

  // AI suggestions
  const aiSuggestions = [
    {
      type: 'optimization',
      title: 'Improve Subject Lines',
      description: 'Your open rates could increase by ~15% with more engaging subject lines.',
      action: 'View Suggestions',
      priority: 'high'
    },
    {
      type: 'design',
      title: 'Update Color Scheme',
      description: 'Consider updating your brand colors to match latest trends.',
      action: 'Apply Changes',
      priority: 'medium'
    },
    {
      type: 'content',
      title: 'Content Refresh',
      description: 'Your newsletter template could benefit from fresh content sections.',
      action: 'Generate Ideas',
      priority: 'low'
    }
  ]

  // Quick actions
  const quickActions = [
    {
      title: 'Create New Template',
      description: 'Start with AI assistance',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      href: '/create',
      color: 'primary'
    },
    {
      title: 'Browse Templates',
      description: 'Explore our library',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      href: '/templates',
      color: 'secondary'
    },
    {
      title: 'View Analytics',
      description: 'Check performance',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/analytics',
      color: 'accent'
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-heading font-primary text-white mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-white/70">
              Here's what's happening with your email campaigns today.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <GlassButton variant="primary" glow>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Template
            </GlassButton>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {stats.map((stat, index) => {
            const CardContent = (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 glass-primary rounded-lg ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-400' : stat.trend === 'neutral' ? 'text-blue-400' : 'text-red-400'}`}>
                    {stat.change}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-white/70">{stat.label}</p>
                  {(stat as any).isOptimization && (
                    <p className="text-xs text-white/50 mt-2">Click to view details →</p>
                  )}
                </div>
              </>
            );

            if ((stat as any).isOptimization) {
              return (
                <Link key={index} href="/optimization-dashboard">
                  <GlassCard className="p-6 hover cursor-pointer transition-all duration-200 hover:scale-105" hover>
                    {CardContent}
                  </GlassCard>
                </Link>
              );
            }

            return (
              <GlassCard key={index} className="p-6 hover" hover>
                {CardContent}
              </GlassCard>
            );
          })}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Templates */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Recent Templates</h2>
                <GlassButton variant="ghost" size="sm">
                  View All
                </GlassButton>
              </div>
              
              <div className="space-y-4">
                {recentTemplates.map((template) => (
                  <div key={template.id} className="glass-card p-4 hover:bg-white/15 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-white">{template.name}</h3>
                          <span className="text-xs px-2 py-1 bg-primary-200 text-primary rounded-full">
                            {template.type}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            template.status === 'published' 
                              ? 'bg-green-400/20 text-green-400' 
                              : 'bg-yellow-400/20 text-yellow-400'
                          }`}>
                            {template.status}
                          </span>
                        </div>
                        <p className="text-sm text-white/60">{template.created}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {template.performance}
                        </div>
                        <div className="text-xs text-white/60">Performance</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <GlassCard className="p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <GlassButton
                    key={index}
                    variant={action.color as any}
                    size="sm"
                    className="w-full justify-start"
                    leftIcon={action.icon}
                  >
                    <div className="text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-xs opacity-80">{action.description}</div>
                    </div>
                  </GlassButton>
                ))}
              </div>
            </GlassCard>

            {/* AI Suggestions */}
            <GlassCard className="p-6" variant="accent">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h2 className="text-lg font-semibold text-white">AI Suggestions</h2>
              </div>
              
              <div className="space-y-4">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="glass-card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-white text-sm">{suggestion.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        suggestion.priority === 'high' 
                          ? 'bg-red-400/20 text-red-400'
                          : suggestion.priority === 'medium'
                          ? 'bg-yellow-400/20 text-yellow-400'
                          : 'bg-blue-400/20 text-blue-400'
                      }`}>
                        {suggestion.priority}
                      </span>
                    </div>
                    <p className="text-xs text-white/70 mb-3">{suggestion.description}</p>
                    <GlassButton variant="ghost" size="sm" className="text-xs">
                      {suggestion.action}
                    </GlassButton>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Performance Overview</h2>
            <div className="flex gap-2">
              <GlassButton variant="ghost" size="sm">7 Days</GlassButton>
              <GlassButton variant="ghost" size="sm">30 Days</GlassButton>
              <GlassButton variant="outline" size="sm">90 Days</GlassButton>
            </div>
          </div>
          
          {/* Placeholder for chart */}
          <div className="h-64 glass-card rounded-lg flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-primary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-white/70">Performance chart will be displayed here</p>
              <p className="text-sm text-white/50 mt-2">Interactive analytics coming soon</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  )
} 