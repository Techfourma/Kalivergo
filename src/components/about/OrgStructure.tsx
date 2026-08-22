"use client";

import Card from "@/components/ui/Card";
import Image from "next/image";
import {
  Crown,
  Users,
  FileText,
  Wallet,
  User,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrgMember } from "@/data/orgMembers";
import { useMemo, memo } from "react";

interface OrgStructureProps {
  members: OrgMember[];
}

const roleConfig: Record<string, { label: string; icon: any; color: string }> = {
  PRESIDENT: { label: "Ketua Kelas", icon: Crown, color: "from-amber-400 to-orange-500" },
  VICE_PRESIDENT: { label: "Wakil Ketua", icon: Users, color: "from-blue-400 to-indigo-500" },
  SECRETARY: { label: "Sekretaris", icon: FileText, color: "from-emerald-400 to-teal-500" },
  TREASURER: { label: "Bendahara", icon: Wallet, color: "from-purple-400 to-pink-500" },
  VICE_TREASURER: { label: "Wakil Bendahara", icon: Wallet, color: "from-pink-400 to-rose-500" },
  MEMBER: { label: "Anggota", icon: User, color: "from-dark-400 to-dark-600" },
};

  const MemberCard = memo(({ member, isLarge = false }: { member: OrgMember; isLarge?: boolean }) => {
  const config = roleConfig[member.role] || roleConfig.MEMBER;
  const Icon = config.icon;

  return (
    <a
      href={`mailto:${member.email}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block no-underline"
      )}
    >
      <Card
        hover
        className={cn(
          "text-center",
          isLarge ? "p-6" : "p-4"
        )}
      >
        <div
          className={cn(
            "mx-auto rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shadow-lg relative overflow-hidden",
            isLarge ? "h-20 w-20 text-2xl" : "h-14 w-14 text-lg",
            config.color
          )}
        >
          {member.image ? (
            <Image
              src={member.image}
              alt={member.name}
              fill
              className="object-cover"
              sizes={isLarge ? "80px" : "56px"}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span>{member.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <h3
          className={cn(
            "font-bold text-dark-900 mt-3",
            isLarge ? "text-lg" : "text-sm"
          )}
        >
          {member.name}
        </h3>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <Icon className={cn("h-3.5 w-3.5", isLarge ? "text-dark-500" : "text-dark-400")} />
          <span
            className={cn(
              "font-medium",
              isLarge ? "text-sm text-dark-600" : "text-xs text-dark-500"
            )}
          >
            {config.label}
          </span>
        </div>
        <div className="flex items-center justify-center gap-1 mt-2 text-dark-400">
          <Mail className="h-3 w-3" />
          <span className="text-xs truncate">{member.email}</span>
        </div>
      </Card>
    </a>
  );
});

MemberCard.displayName = "MemberCard";

export default function OrgStructure({ members }: OrgStructureProps) {
  const leadership = useMemo(() =>
    members.filter(
      (m) =>
        m.role === "PRESIDENT" ||
        m.role === "VICE_PRESIDENT" ||
        m.role === "SECRETARY" ||
        m.role === "TREASURER" ||
        m.role === "VICE_TREASURER"
    ),
    [members]
  );

  const regularMembers = useMemo(() =>
    members.filter((m) => m.role === "MEMBER"),
    [members]
  );

  const president = useMemo(() =>
    leadership.filter((m) => m.role === "OWNER" || m.role === "PRESIDENT"),
    [leadership]
  );

  const vicePresident = useMemo(() =>
    leadership.filter((m) => m.role === "VICE_PRESIDENT"),
    [leadership]
  );

  const otherLeadership = useMemo(() =>
    leadership.filter(
      (m) =>
        m.role === "SECRETARY" ||
        m.role === "TREASURER" ||
        m.role === "VICE_TREASURER"
    ),
    [leadership]
  );

  return (
    <div className="space-y-8">
      {}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Struktur Organisasi</h2>
            <p className="text-sm text-white">Pengurus Kelas Kalivergo</p>
          </div>
        </div>

        <div className="grid gap-4">
          {}
          {president.map((m) => (
            <MemberCard key={m.id} member={m} isLarge={true} />
          ))}

          {}
          {vicePresident.map((m) => (
            <MemberCard key={m.id} member={m} isLarge={true} />
          ))}

          {}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {otherLeadership.map((m) => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>
        </div>
      </div>

      {}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Anggota Kelas</h2>
            <p className="text-sm text-white">
              {regularMembers.length} anggota aktif
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {regularMembers.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      </div>
    </div>
  );
}