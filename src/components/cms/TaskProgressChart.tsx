"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface UserStat {
  name: string;
  total: number;
  submitted: number;
  pending: number;
  completionRate: number;
}

interface TaskProgressChartProps {
  userStats: UserStat[];
}

export default function TaskProgressChart({ userStats }: TaskProgressChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 dark:bg-dark-900 dark:border-dark-800">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M3 3v18h18" />
            <path d="M7 16l4-8 4 4 4-8" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Progress Pengerjaan Tugas
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Persentase pengerjaan tugas per anggota
          </p>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={userStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis
              label={{ value: 'Persentase (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'completionRate') return [`${value}%`, 'Completion'];
                return [value, name];
              }}
              labelFormatter={(label) => `Anggota: ${label}`}
            />
            <Legend />
            <Bar dataKey="completionRate" name="Completion %" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-4 font-medium text-gray-600 dark:text-gray-400">Nama</th>
              <th className="text-center py-2 px-4 font-medium text-gray-600 dark:text-gray-400">Total</th>
              <th className="text-center py-2 px-4 font-medium text-gray-600 dark:text-gray-400">Dikirim</th>
              <th className="text-center py-2 px-4 font-medium text-gray-600 dark:text-gray-400">Belum</th>
              <th className="text-center py-2 px-4 font-medium text-gray-600 dark:text-gray-400">Progress</th>
            </tr>
          </thead>
          <tbody>
            {userStats.map((stat) => (
              <tr key={stat.name} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 px-4 text-gray-900 dark:text-gray-100">{stat.name}</td>
                <td className="text-center py-2 px-4 text-gray-900 dark:text-gray-100">{stat.total}</td>
                <td className="text-center py-2 px-4 text-green-600 dark:text-green-400">{stat.submitted}</td>
                <td className="text-center py-2 px-4 text-red-600 dark:text-red-400">{stat.pending}</td>
                <td className="text-center py-2 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${stat.completionRate === 100 ? 'bg-green-500' : stat.completionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${stat.completionRate}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-10">{stat.completionRate}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
