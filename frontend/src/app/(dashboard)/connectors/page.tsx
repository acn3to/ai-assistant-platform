'use client';

import { Database } from 'lucide-react';

export default function GlobalConnectorsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Data Connectors</h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview of all data connectors across your assistants.
        </p>
      </div>

      <div className="card flex flex-col items-center justify-center py-16">
        <Database className="h-12 w-12 text-gray-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          No connectors configured
        </h3>
        <p className="mt-2 max-w-sm text-center text-sm text-gray-600">
          Data connectors are configured per assistant. Select an assistant to add
          connectors.
        </p>
      </div>
    </div>
  );
}

