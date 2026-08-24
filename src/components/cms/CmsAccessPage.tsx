"use client";

import { useState, useEffect } from "react";
import { CmsRole } from "@prisma/client";
import { Check, X, Shield, Save } from "lucide-react";

interface CmsAccessPageProps {
  university: string;
  program: string;
  className: string;
}

const CMS_MODULES = [
  { id: "tasks", label: "Tasks", description: "Manage class tasks and submissions" },
  { id: "people", label: "People", description: "Manage class members" },
  { id: "finance", label: "Finance", description: "Manage class finances and transactions" },
  { id: "schedule", label: "Schedule", description: "Manage class schedules and events" },
  { id: "seminar", label: "Seminar", description: "Manage seminar activities" },
  { id: "audit", label: "Audit", description: "View audit logs" },
];

const CMS_ROLES: { value: CmsRole; label: string }[] = [
  { value: "PRESIDENT", label: "Ketua Kelas" },
  { value: "VICE_PRESIDENT", label: "Wakil Ketua" },
  { value: "TREASURER", label: "Bendahara" },
  { value: "VICE_TREASURER", label: "Wakil Bendahara" },
  { value: "SECRETARY", label: "Sekretaris" },
];

export default function CmsAccessPage({
  university,
  program,
  className,
}: CmsAccessPageProps) {
  const [accessData, setAccessData] = useState<Record<CmsRole, string[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [localAccess, setLocalAccess] = useState<Record<CmsRole, string[]>>({
    PRESIDENT: [],
    VICE_PRESIDENT: [],
    TREASURER: [],
    VICE_TREASURER: [],
    SECRETARY: [],
  });

  useEffect(() => {
    loadAccessData();
  }, []);

  const loadAccessData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/access`
      );
      const result = await response.json();

      if (result.success && result.data) {
        setAccessData(result.data);
        setLocalAccess(result.data);
      } else {
        setError(result.error || "Failed to load access data");
      }
    } catch (err) {
      setError("Failed to load access data");
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (role: CmsRole, moduleId: string) => {
    setLocalAccess((prev) => {
      const current = prev[role] || [];
      const updated = current.includes(moduleId)
        ? current.filter((m) => m !== moduleId)
        : [...current, moduleId];
      return { ...prev, [role]: updated };
    });
    setSuccess(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const updates = CMS_ROLES.map((roleConfig) => ({
        role: roleConfig.value,
        modules: localAccess[roleConfig.value] || [],
      }));

      const response = await fetch(
        `/api/access`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        loadAccessData();
      } else {
        setError(result.error || "Failed to save access settings");
      }
    } catch (err) {
      setError("Failed to save access settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading access settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CMS Access Control</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage which roles can access specific CMS modules
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <X className="h-5 w-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="h-5 w-5" />
          Access settings saved successfully!
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                  Role / Position
                </th>
                {CMS_MODULES.map((module) => (
                  <th
                    key={module.id}
                    className="px-4 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{module.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {CMS_ROLES.map((roleConfig) => (
                <tr
                  key={roleConfig.value}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {roleConfig.label}
                        </p>
                        <p className="text-xs text-gray-500">{roleConfig.value}</p>
                      </div>
                    </div>
                  </td>
                  {CMS_MODULES.map((module) => {
                    const hasAccess = (localAccess[roleConfig.value] || []).includes(
                      module.id
                    );
                    return (
                      <td key={module.id} className="px-4 py-4 text-center">
                        <button
                          onClick={() => toggleModule(roleConfig.value, module.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            hasAccess
                              ? "bg-primary-600"
                              : "bg-gray-200 hover:bg-gray-300"
                          }`}
                          title={`${hasAccess ? "Revoke" : "Grant"} access to ${module.label}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              hasAccess ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Toggle switches to grant or revoke access for each role</li>
              <li>Only the tenant owner can modify these settings</li>
              <li>Members with MEMBER role cannot access any CMS pages</li>
              <li>Click "Save Changes" to apply your modifications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
