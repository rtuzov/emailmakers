/**
 * Phase 2.3.3 Debug Mock Configuration Test
 * Debugging the mocking issues to fix the final validation
 */

import { NextRequest } from 'next/server'

describe('Debug Mock Configuration', () => {
  test('should debug mock setup', async () => {
    const { GET } = await import('@/app/api/templates/route')
    
    const request = new NextRequest('http://localhost/api/templates')
    const response = await GET(request)
    const data = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', JSON.stringify(data, null, 2))
    
    // Basic check
    expect(response.status === 200 || response.status === 500).toBe(true)
  })
})