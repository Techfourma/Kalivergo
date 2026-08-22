import "server-only";

import { findTenantMembers } from "@/features/member/repositories/member.repository";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export async function getTenantMemberArrears(tenantId: string) {
  const members = await findTenantMembers(tenantId);
  const currentYear = new Date().getFullYear();
  const totalExpected = 12 * 20000;

  return members.map((member) => {
    const paidPayments = member.cashPayments.filter(
      (payment) => new Date(payment.date).getFullYear() === currentYear
    );
    const totalPaid = paidPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );
    const paidMonthNames = paidPayments.map(
      (payment) => MONTH_NAMES[new Date(payment.date).getMonth()]
    );
    const unpaidMonths = MONTH_NAMES.filter(
      (month) => !new Set(paidMonthNames).has(month)
    );

    return {
      ...member,
      tenantRole: member.tenantMemberships[0]?.role ?? null,
      cmsRole: member.tenantMemberships[0]?.cmsRole ?? null,
      tenantMemberships: undefined,
      totalPaid,
      totalExpected,
      arrears: Math.max(0, totalExpected - totalPaid),
      unpaidMonths,
    };
  });
}