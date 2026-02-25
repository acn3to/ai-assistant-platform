'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, FormEvent } from 'react';
import { ArrowLeft, Plus, FileText, Loader2, X } from 'lucide-react';

interface Prompt {
  promptId: string;
  name: string;
  content: string;
  version: number;
  isActive: boolean;
  variables: string[];
  updatedAt: string;
}

export default function PromptsPage() {
  const params = useParams();
  const assistantId = params.id as string;

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({ name: '', content: '' });

  useEffect(() => {
    fetch(`/api/assistants/${assistantId}/prompts`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setPrompts(Array.isArray(data.prompts) ? data.prompts : []);
      })
      .catch(() => setError('Failed to load prompts'))
      .finally(() => setLoading(false));
  }, [assistantId]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);

    try {
      const res = await fetch(`/api/assistants/${assistantId}/prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || 'Failed to create prompt'); return; }
      setPrompts((prev) => [data, ...prev]);
      setForm({ name: '', content: '' });
      setShowForm(false);
    } catch {
      setCreateError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Prompts</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage system prompts and their versions for this assistant.
            </p>
          </div>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => { setShowForm(true); setCreateError(''); }}
          >
            <Plus className="h-4 w-4" />
            New Prompt
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {showForm && (
        <div className="card mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">New Prompt</h2>
            <button onClick={() => setShowForm(false)} className="rounded p-1 hover:bg-gray-100">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {createError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{createError}</div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="input-field"
                placeholder="e.g. Customer Support v1"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Content</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                className="input-field font-mono text-sm"
                rows={6}
                placeholder="You are a helpful assistant..."
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Use {'{{variable}}'} syntax for dynamic variables.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary flex items-center gap-2" disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {creating ? 'Creating...' : 'Create Prompt'}
              </button>
            </div>
          </form>
        </div>
      )}

      {prompts.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No prompts yet</h3>
          <p className="mt-2 text-sm text-gray-600">
            Create your first prompt to define assistant behavior.
          </p>
          <button
            className="btn-primary mt-6 flex items-center gap-2"
            onClick={() => { setShowForm(true); setCreateError(''); }}
          >
            <Plus className="h-4 w-4" />
            Create Prompt
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {prompts.map((prompt) => (
            <div key={prompt.promptId} className="card">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900">{prompt.name}</h3>
                  <p className="text-sm text-gray-500">
                    Version {prompt.version} &middot; Updated{' '}
                    {new Date(prompt.updatedAt).toLocaleDateString()}
                  </p>
                  {prompt.variables.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {prompt.variables.map((v) => (
                        <span key={v} className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600">
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 line-clamp-2 text-sm text-gray-500 font-mono">{prompt.content}</p>
                </div>
                <span
                  className={`ml-4 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    prompt.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {prompt.isActive ? 'Active' : 'Draft'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
