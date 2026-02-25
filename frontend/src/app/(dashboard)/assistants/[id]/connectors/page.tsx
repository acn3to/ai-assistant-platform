'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Database, Activity, Loader2 } from 'lucide-react';

interface Connector {
  connectorId: string;
  name: string;
  type: string;
  enabled: boolean;
  tools: { name: string }[];
}

export default function ConnectorsPage() {
  const params = useParams();
  const assistantId = params.id as string;

  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/connectors?assistantId=${assistantId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setConnectors(Array.isArray(data.connectors) ? data.connectors : []);
      })
      .catch(() => setError('Failed to load connectors'))
      .finally(() => setLoading(false));
  }, [assistantId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/assistants/${assistantId}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assistant
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Connectors</h1>
            <p className="mt-1 text-sm text-gray-600">
              Connect external APIs and data sources for live data access.
            </p>
          </div>
          <Link href={`/assistants/${assistantId}/connectors/new`} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Connector
          </Link>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {connectors.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16">
          <Database className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No connectors yet</h3>
          <p className="mt-2 max-w-sm text-center text-sm text-gray-600">
            Add data connectors to let your assistant fetch live data from external APIs during conversations.
          </p>
          <Link href={`/assistants/${assistantId}/connectors/new`} className="btn-primary mt-6 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Connector
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {connectors.map((connector) => (
            <div key={connector.connectorId} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                    <Database className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{connector.name}</h3>
                    <p className="text-sm text-gray-500">
                      {connector.type} &middot; {connector.tools?.length || 0} tools
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  connector.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Activity className="h-3 w-3" />
                  {connector.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
