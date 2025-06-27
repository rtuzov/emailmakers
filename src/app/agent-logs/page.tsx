'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/ui/card';
import { Button } from '@/ui/components/ui/button';
import { Badge } from '@/ui/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/components/ui/select';
import { Input } from '@/ui/components/ui/input';
import { RefreshCw, Download, Trash2, Settings, Search, Filter } from 'lucide-react';

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  msg: string;
  timestamp: string;
  tool?: string;
  error?: string;
  [key: string]: any;
}

interface TraceEntry {
  traceId: string;
  startTime: number;
  startTimestamp: string;
  endTime?: number;
  endTimestamp?: string;
  duration?: number;
  status: 'active' | 'completed' | 'failed';
  context: any;
  steps: Array<{
    tool: string;
    action: string;
    timestamp: string;
    stepId: number;
    params?: any;
    result?: any;
    error?: any;
    duration?: number;
  }>;
  result?: any;
  error?: any;
  file?: string;
  lastModified?: string;
}

interface LogsData {
  logs: LogEntry[];
  metrics: Record<string, any>;
  traces: TraceEntry[];
  summary: {
    total_logs: number;
    log_levels: Record<string, number>;
    time_range: {
      start: string;
      end: string;
      duration: number;
    } | null;
    active_traces: number;
  };
}

export default function AgentLogsPage() {
  const [logsData, setLogsData] = useState<LogsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    level: 'info',
    limit: 100,
    since: '',
    tool: ''
  });
  const [selectedTrace, setSelectedTrace] = useState<TraceEntry | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters.level !== 'all') params.append('level', filters.level);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.since) params.append('since', filters.since);
      if (filters.tool) params.append('tool', filters.tool);

      const response = await fetch(`/api/agent/logs?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch logs');
      }

      setLogsData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs?')) return;
    
    try {
      const response = await fetch('/api/agent/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchLogs();
      } else {
        throw new Error(data.error || 'Failed to clear logs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const exportLogs = async (format: 'json' | 'text') => {
    try {
      const response = await fetch('/api/agent/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export', format })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`Logs exported to ${data.result.filename}`);
      } else {
        throw new Error(data.error || 'Failed to export logs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Auto-refresh logs every 5 seconds
    const interval = setInterval(() => {
      fetchLogs();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800';
      case 'warn': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'debug': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Agent Logs & Traces</h1>
        <div className="flex gap-2">
          <Button onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => exportLogs('json')}>
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button variant="outline" onClick={() => exportLogs('text')}>
            <Download className="w-4 h-4 mr-2" />
            Export Text
          </Button>
          <Button variant="destructive" onClick={clearLogs}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Logs
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Log Level</label>
              <Select value={filters.level} onValueChange={(value) => setFilters({...filters, level: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Limit</label>
              <Input
                type="number"
                value={filters.limit}
                onChange={(e) => setFilters({...filters, limit: parseInt(e.target.value) || 100})}
                min="1"
                max="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Since</label>
              <Input
                type="datetime-local"
                value={filters.since}
                onChange={(e) => setFilters({...filters, since: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tool Filter</label>
              <Input
                placeholder="e.g., get_prices, render_mjml"
                value={filters.tool}
                onChange={(e) => setFilters({...filters, tool: e.target.value})}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={fetchLogs} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {logsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{logsData.summary.total_logs}</div>
              <div className="text-sm text-gray-600">Total Logs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{logsData.summary.active_traces}</div>
              <div className="text-sm text-gray-600">Active Traces</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{logsData.summary.log_levels.error || 0}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{logsData.summary.log_levels.warn || 0}</div>
              <div className="text-sm text-gray-600">Warnings</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="traces">Traces</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Recent Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading logs...</div>
              ) : logsData?.logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No logs found</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logsData?.logs.map((log, index) => (
                    <div key={index} className="border rounded-md p-3 text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getLevelColor(log.level)}>
                            {log.level.toUpperCase()}
                          </Badge>
                          {log.tool && (
                            <Badge variant="outline">{log.tool}</Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <div className="text-gray-900">{log.msg}</div>
                      {log.error && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-red-800 text-xs">
                          {log.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traces">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Execution Traces</CardTitle>
              </CardHeader>
              <CardContent>
                {logsData?.traces.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No traces found</div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {logsData?.traces.map((trace, index) => (
                      <div
                        key={index}
                        className={`border rounded-md p-3 cursor-pointer hover:bg-gray-50 ${
                          selectedTrace?.traceId === trace.traceId ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedTrace(trace)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(trace.status)}>
                              {trace.status}
                            </Badge>
                            <span className="font-mono text-xs">{trace.traceId}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDuration(trace.duration)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {trace.context.topic} • {trace.steps.length} steps
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(trace.startTimestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedTrace && (
              <Card>
                <CardHeader>
                  <CardTitle>Trace Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Context</h4>
                      <div className="bg-gray-50 rounded p-3 text-sm">
                        <div><strong>Topic:</strong> {selectedTrace.context.topic}</div>
                        <div><strong>Destination:</strong> {selectedTrace.context.destination}</div>
                        <div><strong>Origin:</strong> {selectedTrace.context.origin}</div>
                        <div><strong>Duration:</strong> {formatDuration(selectedTrace.duration)}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Steps ({selectedTrace.steps.length})</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedTrace.steps.map((step, index) => (
                          <div key={index} className="border-l-4 border-blue-200 pl-3 py-2">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-sm">
                                {step.stepId}. {step.tool} - {step.action}
                              </div>
                              <span className="text-xs text-gray-500">
                                {formatDuration(step.duration)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatTimestamp(step.timestamp)}
                            </div>
                            {step.error && (
                              <div className="mt-1 p-2 bg-red-50 rounded text-red-800 text-xs">
                                {step.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedTrace.error && (
                      <div>
                        <h4 className="font-semibold mb-2 text-red-600">Error</h4>
                        <div className="bg-red-50 rounded p-3 text-sm text-red-800">
                          {selectedTrace.error.message || selectedTrace.error}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>System Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {logsData?.metrics && Object.keys(logsData.metrics).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(logsData.metrics).map(([metricName, values]) => (
                    <div key={metricName} className="border rounded-md p-4">
                      <h4 className="font-semibold mb-2">{metricName}</h4>
                      <div className="space-y-1">
                        {Array.isArray(values) ? values.map((value, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{JSON.stringify(value.labels)}</span>
                            <span className="font-mono">{value.value}</span>
                          </div>
                        )) : (
                          <div className="text-sm font-mono">{values}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No metrics available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 