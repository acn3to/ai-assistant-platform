'use client';

import { DollarSign, TrendingDown, TrendingUp, Download } from 'lucide-react';

export default function CostsPage() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cost Intelligence</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track LLM usage, monitor costs, and manage budgets.
          </p>
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Period selector */}
      <div className="mb-6 flex items-center gap-2">
        {['7d', '30d', 'MTD', 'Last Month'].map((period) => (
          <button
            key={period}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              period === '30d'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Cost summary cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Total Cost</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">$0.00</p>
          <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
            <TrendingDown className="h-4 w-4 text-green-500" />
            <span>-- vs previous period</span>
          </div>
        </div>

        <div className="card">
          <p className="text-sm font-medium text-gray-600">Input Tokens</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
          <p className="mt-2 text-sm text-gray-500">$0.00 estimated</p>
        </div>

        <div className="card">
          <p className="text-sm font-medium text-gray-600">Output Tokens</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
          <p className="mt-2 text-sm text-gray-500">$0.00 estimated</p>
        </div>

        <div className="card">
          <p className="text-sm font-medium text-gray-600">Conversations</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
          <p className="mt-2 text-sm text-gray-500">$0.00 avg/conversation</p>
        </div>
      </div>

      {/* Charts area */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">
            Daily Cost Trend
          </h2>
          <div className="mt-4 flex h-64 items-center justify-center text-sm text-gray-400">
            Chart will be rendered here when cost data is available.
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">
            Cost by Model
          </h2>
          <div className="mt-4 flex h-64 items-center justify-center text-sm text-gray-400">
            Model breakdown chart will appear here.
          </div>
        </div>
      </div>

      {/* Budget alerts */}
      <div className="mt-8 card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Budget Alerts</h2>
          <button className="btn-secondary text-sm">Configure Alerts</button>
        </div>
        <div className="mt-4 flex h-24 items-center justify-center text-sm text-gray-400">
          No budget alerts configured. Set up alerts to get notified when costs
          exceed thresholds.
        </div>
      </div>
    </div>
  );
}

