'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const steps = [
  { id: 'basics', name: 'Basic Info' },
  { id: 'connection', name: 'Connection' },
  { id: 'auth', name: 'Authentication' },
  { id: 'tools', name: 'Define Tools' },
  { id: 'review', name: 'Review & Test' },
];

export default function NewConnectorPage() {
  const params = useParams();
  const router = useRouter();
  const assistantId = params.id as string;
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/assistants/${assistantId}/connectors`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Connectors
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Data Connector</h1>
        <p className="mt-1 text-sm text-gray-600">
          Connect an external API to your assistant step by step.
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8">
        <nav className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  index <= currentStep
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`ml-2 text-sm ${
                  index <= currentStep
                    ? 'font-medium text-gray-900'
                    : 'text-gray-500'
                }`}
              >
                {step.name}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`mx-4 h-0.5 w-12 ${
                    index < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Step content */}
      <div className="card">
        {currentStep === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Connector Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., VCOM Debt Collection API"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Describe what this connector does..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Type
              </label>
              <select className="input-field">
                <option value="rest_api">REST API</option>
                <option value="graphql">GraphQL</option>
                <option value="database">Database</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Connection Settings</h2>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Base URL
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="https://api.example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Timeout (ms)
              </label>
              <input
                type="number"
                className="input-field"
                defaultValue={15000}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Max Calls Per Conversation
              </label>
              <input
                type="number"
                className="input-field"
                defaultValue={10}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Authentication</h2>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Auth Type
              </label>
              <select className="input-field">
                <option value="none">None</option>
                <option value="api_key">API Key</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="oauth2">OAuth 2.0</option>
                <option value="custom_headers">Custom Headers</option>
              </select>
            </div>
            <p className="text-sm text-gray-500">
              Credentials are encrypted at rest using AWS KMS and never stored in
              plain text.
            </p>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Define Tools</h2>
            <p className="text-sm text-gray-600">
              Define the API endpoints your assistant can call. Each tool
              represents an action the AI can take.
            </p>
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
              <p className="text-sm text-gray-500">
                Tool definition builder will be implemented here.
              </p>
              <button className="btn-secondary mt-4">Add Tool</button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Review & Test</h2>
            <p className="text-sm text-gray-600">
              Review your connector configuration and test it before activating.
            </p>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Configuration summary will appear here.
              </p>
            </div>
            <button className="btn-secondary">Run Test</button>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 flex items-center justify-between">
        <button
          className="btn-secondary"
          disabled={currentStep === 0}
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
        >
          Previous
        </button>
        {currentStep < steps.length - 1 ? (
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() =>
              setCurrentStep((s) => Math.min(steps.length - 1, s + 1))
            }
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={() =>
              router.push(`/assistants/${assistantId}/connectors`)
            }
          >
            Create Connector
          </button>
        )}
      </div>
    </div>
  );
}

