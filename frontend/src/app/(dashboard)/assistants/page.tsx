'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  Plus,
  Bot,
  MoreVertical,
  Loader2,
  Settings,
  FileText,
  BookOpen,
  Database,
  MessageSquare,
  ExternalLink,
  Trash2,
  ChevronRight,
} from 'lucide-react';

const QUICK_ACTIONS = [
  { label: 'Open', href: (id: string) => `/assistants/${id}`, icon: ExternalLink },
  { label: 'Configuration', href: (id: string) => `/assistants/${id}/configuration`, icon: Settings },
  { label: 'Prompts', href: (id: string) => `/assistants/${id}/prompts`, icon: FileText },
  { label: 'Knowledge Base', href: (id: string) => `/assistants/${id}/knowledge-base`, icon: BookOpen },
  { label: 'Data Connectors', href: (id: string) => `/assistants/${id}/connectors`, icon: Database },
  { label: 'Testing', href: (id: string) => `/assistants/${id}/testing`, icon: MessageSquare },
] as const;

export default function AssistantsPage() {
  const router = useRouter();
  const [assistants, setAssistants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/assistants')
      .then((r) => r.json())
      .then((data) => setAssistants(Array.isArray(data.assistants) ? data.assistants : []))
      .catch(() => setError('Failed to load assistants'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (openMenuId === null) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const handleDelete = async (assistantId: string, name: string) => {
    setDeletingId(assistantId);
    setOpenMenuId(null);
    try {
      const res = await fetch(`/api/assistants/${assistantId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to delete assistant');
        setConfirmDeleteId(null);
        return;
      }
      setAssistants((prev) => prev.filter((a) => a.assistantId !== assistantId));
      setConfirmDeleteId(null);
      setError('');
    } catch {
      setError('Network error. Please try again.');
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assistants</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your AI assistants and their configurations.
          </p>
        </div>
        <Link href="/assistants/new" className="btn-primary inline-flex items-center gap-2">
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
          <Link href="/assistants/new" className="btn-primary mt-6 inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Assistant
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {assistants.map((assistant) => (
            <div
              key={assistant.assistantId}
              ref={openMenuId === assistant.assistantId ? menuRef : null}
              className="card group relative flex flex-col border-gray-200 bg-white transition-all hover:border-gray-300 hover:shadow-md"
            >
              {/* Main clickable area: links to overview */}
              <Link
                href={`/assistants/${assistant.assistantId}`}
                className="flex flex-1 flex-col focus:outline-none focus:ring-0"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 transition-colors group-hover:bg-primary-100">
                    <Bot className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate pr-8">
                      {assistant.name}
                    </h3>
                    <p className="mt-0.5 text-xs font-medium text-gray-500 font-mono truncate">
                      {assistant.modelId?.split('/').pop() ?? assistant.modelId ?? '—'}
                    </p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-gray-600 leading-snug">
                  {assistant.description || 'No description'}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      assistant.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {assistant.status ?? 'draft'}
                  </span>
                  <span className="flex items-center text-xs text-gray-400 group-hover:text-primary-600 transition-colors">
                    View details
                    <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>

              {/* Actions menu button — does not navigate */}
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenMenuId((id) => (id === assistant.assistantId ? null : assistant.assistantId));
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label="Assistant actions"
                  aria-expanded={openMenuId === assistant.assistantId}
                >
                  <MoreVertical className="h-5 w-5" />
                </button>

                {/* Dropdown */}
                {openMenuId === assistant.assistantId && (
                  <div
                    className="absolute right-0 top-full z-20 mt-1 w-56 origin-top-right rounded-lg border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none"
                    role="menu"
                  >
                    {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
                      <Link
                        key={label}
                        href={href(assistant.assistantId)}
                        onClick={() => setOpenMenuId(null)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        role="menuitem"
                      >
                        <Icon className="h-4 w-4 text-gray-400" />
                        {label}
                      </Link>
                    ))}
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(assistant.assistantId)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      role="menuitem"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline delete confirmation modal */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !deletingId && setConfirmDeleteId(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div
            className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-dialog-title" className="text-lg font-semibold text-gray-900">
              Delete assistant?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {assistants.find((a) => a.assistantId === confirmDeleteId)?.name ?? 'This assistant'}{' '}
              will be permanently removed. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId, '')}
                disabled={!!deletingId}
                className="btn-danger flex flex-1 items-center justify-center gap-2"
              >
                {deletingId ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  'Delete'
                )}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                disabled={!!deletingId}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
