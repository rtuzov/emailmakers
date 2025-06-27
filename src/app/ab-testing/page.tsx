import React from 'react'
// import { ABTestingDashboard } from '../ui/components/ab-testing-dashboard' // DISABLED

export default function ABTestingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8 bg-white rounded-lg shadow-lg">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          A/B Testing Disabled
        </h1>
        <p className="text-gray-600 mb-6">
          The A/B testing framework has been temporarily disabled as requested.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Status:</strong> Framework is disabled<br/>
            <strong>Reason:</strong> User request<br/>
            <strong>Impact:</strong> Default configurations will be used
          </p>
        </div>
        <div className="mt-6">
          <a 
            href="/create" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Email Creator
          </a>
        </div>
      </div>
    </div>
  )
} 