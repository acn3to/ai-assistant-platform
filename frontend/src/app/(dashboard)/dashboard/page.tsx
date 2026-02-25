'use client';

import { Bot, MessageSquare, DollarSign, TrendingUp } from 'lucide-react';

const stats = [
  {
    name: 'Active Assistants',
    value: '0',
    icon: Bot,
    change: '--',
    changeType: 'neutral' as const,
  },
  {
    name: 'Conversations (30d)',
    value: '0',
    icon: MessageSquare,
    change: '--',
    changeType: 'neutral' as const,
  },
  {
    name: 'Total Cost (MTD)',
    value: '$0.00',
    icon: DollarSign,
    change: '--',
    changeType: 'neutral' as const,
  },
  {
    name: 'Avg Cost / Conversation',
    value: '$0.00',
    icon: TrendingUp,
    change: '--',
    changeType: 'neutral' as const,
  },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview of your AI assistant platform usage and costs.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
                <stat.icon className="h-6 w-6 text-primary-600" />
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              <span>{stat.change}</span> vs last period
            </p>
          </div>
        ))}
      </div>

      {/* Recent activity placeholder */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Conversations
          </h2>
          <div className="mt-4 flex h-48 items-center justify-center text-sm text-gray-400">
            No conversations yet. Deploy an assistant to get started.
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">
            Cost Trend (7 days)
          </h2>
          <div className="mt-4 flex h-48 items-center justify-center text-sm text-gray-400">
            Cost data will appear once your assistants are active.
          </div>
        </div>
      </div>
    </div>
  );
}

