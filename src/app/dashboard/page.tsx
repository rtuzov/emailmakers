export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Dashboard</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-2">Templates Created</h3>
            <p className="text-3xl font-bold text-green-400">127</p>
            <p className="text-green-400 text-sm">12 recent</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-2">Success Rate</h3>
            <p className="text-3xl font-bold text-blue-400">92%</p>
            <p className="text-blue-400 text-sm">1 failed</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-2">Active Agents</h3>
            <p className="text-3xl font-bold text-purple-400">4</p>
            <p className="text-purple-400 text-sm">1543 requests</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-yellow-400">167</p>
            <p className="text-yellow-400 text-sm">Quality: 89%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">System Performance</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/80">Average Response Time</span>
                <span className="text-green-400 font-semibold">850ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">Error Rate</span>
                <span className="text-red-400 font-semibold">2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">System Health</span>
                <span className="text-blue-400 font-semibold">Healthy</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-white/80 text-sm">Template generation completed</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-white/80 text-sm">System health check passed</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-white/80 text-sm">New user registered</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-white/80 text-sm">Agent optimization completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}