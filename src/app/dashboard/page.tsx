import DashboardContentV2 from './dashboard-content-v2'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard с предотвращением hydration errors */}
        <DashboardContentV2 />
      </div>
    </div>
  )
}