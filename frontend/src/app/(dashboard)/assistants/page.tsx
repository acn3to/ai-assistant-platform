'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Plus, Bot, MoreVertical, Loader2 } from 'lucide-react';

export default function AssistantsPage() {
  const [assistants, setAssistants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/assistants')
      .then((r) => r.json())
      .then((data) => setAssistants(Array.isArray(data.assistants) ? data.assistants : []))
      .catch(() => setError('Failed to load assistants'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assistants</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your AI assistants and their configurations.
          </p>
        </div>
        <Link href="/assistants/new" className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Assistant
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {assistants.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
            <Bot className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No assistants yet</h3>
          <p className="mt-2 text-sm text-gray-600">
            Create your first AI assistant to get started.
          </p>
          <Link href="/assistants/new" className="btn-primary mt-6 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Assistant
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assistants.map((assistant) => (
            <Link
              key={assistant.assistantId}
              href={`/assistants/${assistant.assistantId}`}
              className="card group transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                    <Bot className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{assistant.name}</h3>
                    <p className="text-xs text-gray-400">{assistant.modelId}</p>
                  </div>
                </div>
                <button className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100">
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                {assistant.description || 'No description'}
              </p>
              <div className="mt-4">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  assistant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {assistant.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
