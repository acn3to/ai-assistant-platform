'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';

interface Assistant {
  assistantId: string;
  name: string;
}

interface Conversation {
  conversationId: string;
  phoneNumber?: string;
  channel: string;
  status: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function ConversationsPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedAssistantId, setSelectedAssistantId] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingAssistants, setLoadingAssistants] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/assistants')
      .then((r) => r.json())
      .then((data) => {
        const list: Assistant[] = Array.isArray(data.assistants) ? data.assistants : [];
        setAssistants(list);
        if (list.length > 0) setSelectedAssistantId(list[0].assistantId);
      })
      .catch(() => setError('Failed to load assistants'))
      .finally(() => setLoadingAssistants(false));
  }, []);

  useEffect(() => {
    if (!selectedAssistantId) return;
    setLoadingConversations(true);
    setError('');
    fetch(`/api/conversations?assistantId=${selectedAssistantId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setConversations(Array.isArray(data.conversations) ? data.conversations : []);
      })
      .catch(() => setError('Failed to load conversations'))
      .finally(() => setLoadingConversations(false));
  }, [selectedAssistantId]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and manage all conversations across your assistants.
        </p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        {loadingAssistants ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : (
          <select
            className="input-field w-56"
            value={selectedAssistantId}
            onChange={(e) => setSelectedAssistantId(e.target.value)}
          >
            {assistants.length === 0 && <option value="">No assistants</option>}
            {assistants.map((a) => (
              <option key={a.assistantId} value={a.assistantId}>{a.name}</option>
            ))}
          </select>
        )}
        <select className="input-field w-40">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loadingConversations ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16">
          <MessageSquare className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No conversations yet</h3>
          <p className="mt-2 text-sm text-gray-600">
            Conversations will appear here once your assistant starts receiving messages.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <div key={conv.conversationId} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {conv.phoneNumber || conv.channel}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {conv.messageCount} messages &middot; {conv.channel}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    conv.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {conv.status}
                  </span>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
