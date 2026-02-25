'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  FileText,
  BookOpen,
  Database,
  MessageSquare,
  Settings,
  ArrowLeft,
  Trash2,
  Loader2,
} from 'lucide-react';

const sections = [
  { name: 'Prompts', description: 'Manage system prompts and prompt versions.', href: 'prompts', icon: FileText },
  { name: 'Knowledge Base', description: 'Upload documents and manage RAG knowledge bases.', href: 'knowledge-base', icon: BookOpen },
  { name: 'Data Connectors', description: 'Connect external APIs and data sources.', href: 'connectors', icon: Database },
  { name: 'Testing', description: 'Test your assistant in a chat sandbox.', href: 'testing', icon: MessageSquare },
  { name: 'Configuration', description: 'Model selection, temperature, and advanced settings.', href: 'configuration', icon: Settings },
];

export default function AssistantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assistantId = params.id as string;

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/assistants/${assistantId}`)
      .then((r) => r.json())
      .then((data) => { if (data.name) setName(data.name); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [assistantId]);

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/assistants/${assistantId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to delete assistant');
        setConfirmDelete(false);
        return;
      }
      router.push('/assistants');
    } catch {
      setError('Network error. Please try again.');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {loading ? <Loader2 className="inline h-6 w-6 animate-spin text-gray-400" /> : (name || 'Assistant')}
            </h1>
            <p className="mt-1 text-sm text-gray-500 font-mono">{assistantId}</p>
          </div>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {confirmDelete && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            Delete &ldquo;{name || assistantId}&rdquo;? This cannot be undone.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting && <Loader2 className="h-3 w-3 animate-spin" />}
              {deleting ? 'Deleting...' : 'Yes, delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.name}
            href={`/assistants/${assistantId}/${section.href}`}
            className="card group transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 transition-colors group-hover:bg-primary-100">
                <section.icon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{section.name}</h3>
                <p className="text-sm text-gray-500">{section.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
