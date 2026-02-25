'use client';

import { Settings, Users, Key, Bell } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your organization settings, users, and preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Organization */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Organization
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Organization Name
              </label>
              <input type="text" className="input-field max-w-md" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Plan
              </label>
              <p className="text-sm text-gray-600">
                Free tier &middot;{' '}
                <a href="/pricing" className="text-primary-600 hover:text-primary-500">
                  Upgrade
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Team Members
              </h2>
            </div>
            <button className="btn-secondary text-sm">Invite Member</button>
          </div>
          <div className="flex h-24 items-center justify-center text-sm text-gray-400">
            Team management will be available here.
          </div>
        </div>

        {/* API Keys */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
            </div>
            <button className="btn-secondary text-sm">Generate Key</button>
          </div>
          <div className="flex h-24 items-center justify-center text-sm text-gray-400">
            API key management will be available here.
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Notifications
            </h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600" />
              <span className="text-sm text-gray-700">
                Budget alerts when costs exceed threshold
              </span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600" />
              <span className="text-sm text-gray-700">
                Connector failure notifications
              </span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600" />
              <span className="text-sm text-gray-700">
                Weekly usage summary email
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

