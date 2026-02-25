'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, BookOpen, File } from 'lucide-react';

export default function KnowledgeBasePage() {
  const params = useParams();
  const assistantId = params.id as string;

  // TODO: Replace with RTK Query hook
  const documents: any[] = [];

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
            <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
            <p className="mt-1 text-sm text-gray-600">
              Upload documents and manage RAG knowledge bases.
            </p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Document
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16">
          <BookOpen className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No documents yet
          </h3>
          <p className="mt-2 max-w-sm text-center text-sm text-gray-600">
            Upload documents to create a knowledge base. Your assistant will use
            these to answer questions with relevant context.
          </p>
          <button className="btn-primary mt-6 flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload First Document
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.filename} className="card flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <File className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{doc.filename}</h3>
                <p className="text-sm text-gray-500">
                  {doc.category} &middot; {doc.sizeBytes} bytes &middot;{' '}
                  {doc.syncStatus}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

