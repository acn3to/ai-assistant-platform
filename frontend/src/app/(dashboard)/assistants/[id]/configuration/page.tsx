'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, FormEvent } from 'react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const models = [
  { id: 'anthropic.claude-3-haiku-20240307-v1:0', name: 'Claude 3 Haiku' },
  { id: 'anthropic.claude-3-sonnet-20240229-v1:0', name: 'Claude 3 Sonnet' },
  { id: 'anthropic.claude-3-opus-20240229-v1:0', name: 'Claude 3 Opus' },
];

export default function ConfigurationPage() {
  const params = useParams();
  const assistantId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    modelId: models[0].id,
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 2048,
    whatsappPhoneNumber: '',
  });

  useEffect(() => {
    fetch(`/api/assistants/${assistantId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setForm({
          name: data.name || '',
          description: data.description || '',
          modelId: data.modelId || models[0].id,
          systemPrompt: data.systemPrompt || '',
          temperature: data.temperature ?? 0.7,
          maxTokens: data.maxTokens ?? 2048,
          whatsappPhoneNumber: data.whatsappPhoneNumber || '',
        });
      })
      .catch(() => setError('Failed to load assistant'))
      .finally(() => setLoading(false));
  }, [assistantId]);

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
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch(`/api/assistants/${assistantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); return; }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
        <p className="mt-1 text-sm text-gray-600">Advanced settings for your assistant.</p>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">Changes saved successfully.</div>}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">General</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Assistant Name</label>
            <input name="name" type="text" value={form.name} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="input-field" rows={3} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">System Prompt</label>
            <textarea name="systemPrompt" value={form.systemPrompt} onChange={handleChange} className="input-field font-mono text-sm" rows={6} />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Model Settings</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Model</label>
            <select name="modelId" value={form.modelId} onChange={handleChange} className="input-field">
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Temperature: {form.temperature}</label>
            <input name="temperature" type="range" min="0" max="1" step="0.1" value={form.temperature} onChange={handleChange} className="w-full" />
            <div className="flex justify-between text-xs text-gray-400"><span>Precise</span><span>Creative</span></div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Max Tokens</label>
            <input name="maxTokens" type="number" value={form.maxTokens} onChange={handleChange} className="input-field" min={256} max={8192} />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">WhatsApp</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number</label>
            <input name="whatsappPhoneNumber" type="tel" value={form.whatsappPhoneNumber} onChange={handleChange} className="input-field" placeholder="+55 11 99999-9999" />
            <p className="mt-1 text-xs text-gray-500">The WhatsApp Business number linked to this assistant.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
