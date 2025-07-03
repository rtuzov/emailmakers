'use client'

import dynamic from 'next/dynamic'

// Import the dashboard component dynamically with SSR disabled to prevent hydration issues
const DashboardContent = dynamic(() => import('./dashboard-content'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-white/20 rounded mb-2"></div>
                <div className="h-8 bg-white/20 rounded mb-2"></div>
                <div className="h-3 bg-white/20 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

export default function Dashboard() {
  return <DashboardContent />
}