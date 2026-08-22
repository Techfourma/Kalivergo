"use client";

import OrgStructure from "@/components/about/OrgStructure";
import { type OrgMember } from "@/data/orgMembers";
import { useState, useEffect } from "react";

export default function AboutPage() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/member');
        if (response.ok) {
          const result = await response.json();
          if (result.success && Array.isArray(result.data)) {
            const { convertUserToOrgMember } = await import('@/data/orgMembers');
            const convertedMembers = result.data.map((user: any) => 
              convertUserToOrgMember(user)
            );
            setMembers(convertedMembers);
          }
        }
      } catch (error) {
        console.error('Error fetching members:', error);
        setMembers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-50">
        <p className="text-white">Memuat data anggota...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark-50">
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-dark-900 font-display">Tentang Kami</h1>
            <p className="text-dark-500 mt-2">Struktur organisasi kelas Kalivergo</p>
          </div>
          <OrgStructure members={members} />
        </div>
      </main>
    </div>
  );
}