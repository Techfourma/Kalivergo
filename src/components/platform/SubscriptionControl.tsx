"use client";

import { updateTenantSubscription } from "@/actions/subscription";

export default function SubscriptionControl({ tenantId, plan, endsAt }: { tenantId: string; plan: string; endsAt: string | null }) {
  return <form action={updateTenantSubscription} className="flex min-w-[260px] items-end gap-2">
    <input type="hidden" name="tenantId" value={tenantId} />
    <label className="text-xs">Plan<select name="plan" defaultValue={plan} className="mt-1 block rounded border px-2 py-1 text-sm"><option value="FREE">Free</option><option value="PAID">Paid</option></select></label>
    <label className="text-xs">Berakhir<input name="subscriptionEndsAt" type="date" defaultValue={endsAt ? endsAt.slice(0, 10) : ""} className="mt-1 block rounded border px-2 py-1 text-sm" /></label>
    <button className="rounded bg-primary-600 px-3 py-2 text-xs font-semibold text-white">Simpan</button>
  </form>;
}