"use client";

import { updateTenantSubscription } from "@/actions/subscription";

export default function SubscriptionControl({ tenantId, plan, endsAt }: { tenantId: string; plan: string; endsAt: string | null }) {
  return <form action={updateTenantSubscription} className="flex min-w-[260px] items-end gap-2">
    <input type="hidden" name="tenantId" value={tenantId} />
    <label className="text-xs font-semibold text-dark-700 dark:text-dark-700">Plan<select name="plan" defaultValue={plan} className="mt-1 block rounded border border-dark-300 bg-white px-2 py-1 text-sm text-dark-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"><option value="FREE" className="bg-white text-dark-900">Free</option><option value="PAID" className="bg-white text-dark-900">Paid</option></select></label>
    <label className="text-xs font-semibold text-dark-700 dark:text-dark-700">Berakhir<input name="subscriptionEndsAt" type="date" defaultValue={endsAt ? endsAt.slice(0, 10) : ""} className="mt-1 block rounded border border-dark-300 bg-white px-2 py-1 text-sm text-dark-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500" /></label>
    <button className="rounded bg-primary-600 px-3 py-2 text-xs font-semibold text-white">Simpan</button>
  </form>;
}