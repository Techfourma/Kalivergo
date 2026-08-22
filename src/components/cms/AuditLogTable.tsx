"use client";

import { FileText, Plus, Trash2, Users, Calendar, GraduationCap, Wallet, ClipboardList } from "lucide-react";

interface AuditLog {
  id: string;
  module: string;
  action: string;
  description: string;
  userId: string | null;
  userName: string | null;
  metadata: any;
  createdAt: Date;
}

interface AuditLogTableProps {
  logs: AuditLog[];
}

const getModuleIcon = (module: string) => {
  switch (module) {
    case 'FINANCE':
      return <Wallet className="h-4 w-4" />;
    case 'TASKS':
      return <ClipboardList className="h-4 w-4" />;
    case 'PEOPLE':
      return <Users className="h-4 w-4" />;
    case 'SCHEDULE':
      return <Calendar className="h-4 w-4" />;
    case 'SEMINAR':
      return <GraduationCap className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getModuleColor = (module: string) => {
  switch (module) {
    case 'FINANCE':
      return 'bg-green-100 text-green-700';
    case 'TASKS':
      return 'bg-blue-100 text-blue-700';
    case 'PEOPLE':
      return 'bg-purple-100 text-purple-700';
    case 'SCHEDULE':
      return 'bg-orange-100 text-orange-700';
    case 'SEMINAR':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'CREATE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'UPDATE':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'DELETE':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export default function AuditLogTable({ logs }: AuditLogTableProps) {
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-dark-100 overflow-hidden">
      <div className="p-6 border-b border-dark-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Riwayat Audit ({logs.length})</h2>
      </div>

      {logs.length === 0 ? (
        <div className="p-12 text-center">
          <FileText className="h-12 w-12 text-dark-300 mx-auto mb-4" />
          <p className="text-dark-500">Belum ada riwayat audit</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-100">
            <thead className="bg-dark-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Tanggal & Waktu
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Module
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Aksi
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  User
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-dark-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-dark-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-dark-600">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getModuleColor(log.module)}`}>
                      {getModuleIcon(log.module)}
                      {log.module}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                      {log.action === 'CREATE' && <Plus className="h-3 w-3 mr-1" />}
                      {log.action === 'DELETE' && <Trash2 className="h-3 w-3 mr-1" />}
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-dark-900">{log.description}</p>
                    {log.metadata && (
                      <pre className="text-xs text-dark-500 mt-1 font-mono">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-dark-600">
                      {log.userName || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}