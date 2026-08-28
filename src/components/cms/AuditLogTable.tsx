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
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'TASKS':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'PEOPLE':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    case 'SCHEDULE':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    case 'SEMINAR':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-dark-300';
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'CREATE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/40';
    case 'UPDATE':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700/40';
    case 'DELETE':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700/40';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-dark-800 dark:text-dark-300 dark:border-dark-600';
  }
};

const getModuleLabel = (module: string) => {
  const labels: Record<string, string> = {
    FINANCE: 'Finance',
    PEOPLE: 'People Management',
    TASKS: 'Tasks',
    SEMINAR: 'Seminar',
    SCHEDULE: 'Schedule',
    ACCESS: 'Access Control',
  };
  return labels[module] || module;
};

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    CREATE: 'Menambahkan',
    UPDATE: 'Mengubah',
    UPDATE_ROLE: 'Mengubah jabatan',
    DELETE: 'Menghapus',
    APPROVE: 'Menyetujui',
  };
  return labels[action] || action;
};

const getMetadataLabel = (key: string) => {
  const labels: Record<string, string> = {
    amount: 'Jumlah',
    type: 'Jenis',
    title: 'Judul',
    name: 'Nama',
    location: 'Lokasi',
    date: 'Tanggal',
    deadline: 'Batas waktu',
    newRole: 'Jabatan baru',
    description: 'Keterangan',
  };
  return labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase());
};

const formatMetadataValue = (key: string, value: unknown) => {
  if (value === null || value === undefined || value === '') return '-';
  if (key === 'amount' && typeof value === 'number') {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
  }
  if ((key === 'date' || key === 'deadline') && typeof value === 'string') {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: key === 'deadline' ? 'short' : undefined,
    }).format(new Date(value));
  }
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const getVisibleMetadata = (metadata: AuditLog['metadata']) => {
  if (!metadata || typeof metadata !== 'object') return [];
  return Object.entries(metadata).filter(
    ([key]) => !['description', 'userName', 'tenantId'].includes(key) && !key.endsWith('Id')
  );
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
    <div className="relative rounded-xl border-2 border-dark-100 dark:border-dark-700/60 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/60 to-transparent" />
      <div className="p-6 border-b border-dark-100 dark:border-dark-700/60 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dark-900 dark:text-dark-50">Riwayat Audit ({logs.length})</h2>
      </div>

      {logs.length === 0 ? (
        <div className="p-12 text-center">
          <FileText className="h-12 w-12 text-dark-300 dark:text-dark-600 mx-auto mb-4" />
          <p className="text-dark-500 dark:text-dark-400">Tidak ada perubahan pada modul yang dipilih dalam rentang tanggal ini.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-100 dark:divide-dark-700/60">
            <thead className="bg-dark-50 dark:bg-dark-800/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-300 uppercase tracking-wider">
                  Tanggal & Waktu
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-300 uppercase tracking-wider">
                  Module
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-300 uppercase tracking-wider">
                  Aksi
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-300 uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-300 uppercase tracking-wider">
                  User
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100 dark:divide-dark-700/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-dark-50 dark:hover:bg-dark-800/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-dark-600 dark:text-dark-300">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getModuleColor(log.module)}`}>
                      {getModuleIcon(log.module)}
                      {getModuleLabel(log.module)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                      {log.action === 'CREATE' && <Plus className="h-3 w-3 mr-1" />}
                      {log.action === 'DELETE' && <Trash2 className="h-3 w-3 mr-1" />}
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-dark-900 dark:text-dark-50">{log.description}</p>
                    {getVisibleMetadata(log.metadata).length > 0 && (
                      <dl className="mt-2 space-y-1 text-xs text-dark-500 dark:text-dark-400">
                        {getVisibleMetadata(log.metadata).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <dt className="font-medium text-dark-600 dark:text-dark-300">{getMetadataLabel(key)}:</dt>
                            <dd>{formatMetadataValue(key, value)}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-dark-600 dark:text-dark-300">
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