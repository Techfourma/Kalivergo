"use client";

import { FileText, CheckCircle, XCircle, Clock, UserCheck } from "lucide-react";

interface KycAuditLog {
  id: string;
  action: string;
  description: string;
  applicationId: string | null;
  applicantName: string | null;
  adminName: string | null;
  metadata: any;
  createdAt: Date;
}

interface KycAuditLogTableProps {
  logs: KycAuditLog[];
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'APPROVE':
      return <CheckCircle className="h-4 w-4" />;
    case 'REJECT':
      return <XCircle className="h-4 w-4" />;
    case 'SUBMIT':
      return <Clock className="h-4 w-4" />;
    case 'CANCEL':
      return <FileText className="h-4 w-4" />;
    default:
      return <UserCheck className="h-4 w-4" />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'APPROVE':
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
    case 'REJECT':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
    case 'SUBMIT':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
    case 'CANCEL':
      return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    default:
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
  }
};

export default function KycAuditLogTable({ logs }: KycAuditLogTableProps) {
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
    <div className="bg-white rounded-xl shadow-sm border border-dark-100 overflow-hidden dark:bg-dark-800 dark:border-dark-700">
      <div className="p-6 border-b border-dark-100 flex items-center justify-between dark:border-dark-700">
        <h2 className="text-lg font-semibold">Riwayat Audit KYC ({logs.length})</h2>
      </div>

      {logs.length === 0 ? (
        <div className="p-12 text-center">
          <FileText className="h-12 w-12 text-dark-300 mx-auto mb-4" />
          <p className="text-dark-500 dark:text-dark-400">Belum ada riwayat audit KYC</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-100 dark:divide-dark-700">
            <thead className="bg-dark-50 dark:bg-dark-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider dark:text-dark-400">
                  Tanggal & Waktu
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider dark:text-dark-400">
                  Aksi
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider dark:text-dark-400">
                  Deskripsi
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider dark:text-dark-400">
                  Pemohon
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider dark:text-dark-400">
                  Admin Reviewer
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-dark-100 dark:bg-dark-800 dark:divide-dark-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-dark-50 transition-colors dark:hover:bg-dark-900/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-dark-600 dark:text-dark-300">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-dark-900 dark:text-dark-100">{log.description}</p>
                    {log.metadata && (
                      <pre className="text-xs text-dark-500 mt-1 font-mono dark:text-dark-400">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-dark-600 dark:text-dark-300">
                      {log.applicantName || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-dark-600 dark:text-dark-300">
                      {log.adminName || '-'}
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