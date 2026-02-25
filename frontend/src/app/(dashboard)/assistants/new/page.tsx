'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { ArrowLeft } from 'lucide-react';

const models = [
  {
    id: 'anthropic.claude-3-haiku-20240307-v1:0',
    name: 'Claude 3 Haiku',
    description: 'Fastest and most cost-effective — recommended',
  },
  {
    id: 'anthropic.claude-3-sonnet-20240229-v1:0',
    name: 'Claude 3 Sonnet',
    description: 'Best balance of intelligence and speed',
  },
  {
    id: 'anthropic.claude-3-opus-20240229-v1:0',
    name: 'Claude 3 Opus',
    description: 'Most powerful for complex tasks',
  },
];

export default function NewAssistantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    modelId: models[0].id,
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 2048,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'temperature' || name === 'maxTokens' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create assistant. Please try again.');
        return;
      }

      router.push(`/assistants/${data.assistantId}`);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/assistants"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assistants
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Assistant</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create a new AI assistant and configure its behavior.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>

          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              className="input-field"
              placeholder="Customer Support Bot"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              className="input-field"
              rows={3}
              placeholder="Describe what this assistant does..."
            />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Model Configuration</h2>

          <div>
            <label htmlFor="modelId" className="mb-1 block text-sm font-medium text-gray-700">
              Model
            </label>
            <select
              id="modelId"
              name="modelId"
              value={form.modelId}
              onChange={handleChange}
              className="input-field"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} — {model.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="temperature" className="mb-1 block text-sm font-medium text-gray-700">
              Temperature: {form.temperature}
            </label>
            <input
              id="temperature"
              name="temperature"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={form.temperature}
              onChange={handleChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          <div>
            <label htmlFor="maxTokens" className="mb-1 block text-sm font-medium text-gray-700">
              Max Tokens
            </label>
            <input
              id="maxTokens"
              name="maxTokens"
              type="number"
              value={form.maxTokens}
              onChange={handleChange}
              className="input-field"
              min={256}
              max={8192}
            />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">System Prompt</h2>
          <div>
            <textarea
              id="systemPrompt"
              name="systemPrompt"
              value={form.systemPrompt}
              onChange={handleChange}
              className="input-field font-mono text-sm"
              rows={8}
              placeholder="You are a helpful customer support assistant..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Use {'{{variable}}'} syntax for dynamic variables.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/assistants" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Assistant'}
          </button>
        </div>
      </form>
    </div>
  );
}
