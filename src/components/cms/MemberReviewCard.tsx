"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Eye, X } from 'lucide-react';
import { acceptUser, rejectUser } from '@/actions/cms/people';

type MemberReview = {
  id: string;
  userId: string;
  fullName: string;
  nim: string | null;
  email: string | null;
  profilePhotoUrl: string | null;
  ktmPhotoUrl: string | null;
  createdAt: string;
};

type MemberReviewCardProps = {
  review: MemberReview;
  tenantId: string;
};

export default function MemberReviewCard({ review, tenantId }: MemberReviewCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <article className="overflow-hidden rounded-2xl border border-dark-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md">
        <button
          type="button"
          onClick={() => setShowDetails(true)}
          className="block w-full text-left"
        >
          <div className="flex items-center gap-4 p-5">
            {review.profilePhotoUrl ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-dark-200 bg-dark-50">
                <Image
                  src={review.profilePhotoUrl}
                  alt={`Foto profil ${review.fullName}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-dark-100 text-sm text-dark-400">
                Foto
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h3 className="truncate font-bold text-dark-900">{review.fullName}</h3>
                <span className="shrink-0 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                  Pending
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-dark-500">{review.email || '-'}</p>
              <p className="mt-1 text-xs text-dark-400">NIM: {review.nim || '-'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-dark-100 px-5 py-3 text-sm">
            <span className="text-dark-400">
              Didaftarkan {new Date(review.createdAt).toLocaleDateString('id-ID')}
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-primary-600">
              <Eye className="h-4 w-4" /> Detail
            </span>
          </div>
        </button>
      </article>

      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-dark-200 px-4 py-3 sm:px-6">
              <div>
                <h3 className="text-lg font-bold text-dark-900">Detail Pendaftaran Anggota</h3>
                <p className="text-sm text-dark-500">{review.fullName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="rounded-lg p-2 text-dark-500 hover:bg-dark-100 hover:text-dark-900"
                aria-label="Tutup detail"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-dark-400">Nama lengkap</dt>
                  <dd className="font-medium text-dark-900">{review.fullName}</dd>
                </div>
                <div>
                  <dt className="text-dark-400">NIM</dt>
                  <dd className="font-medium text-dark-900">{review.nim || '-'}</dd>
                </div>
                <div>
                  <dt className="text-dark-400">Email</dt>
                  <dd className="break-all font-medium text-dark-900">{review.email || '-'}</dd>
                </div>
                <div>
                  <dt className="text-dark-400">Waktu pendaftaran</dt>
                  <dd className="font-medium text-dark-900">{new Date(review.createdAt).toLocaleString('id-ID')}</dd>
                </div>
              </dl>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['Foto profil', review.profilePhotoUrl, `Foto profil ${review.fullName}`],
                  ['Foto KTM', review.ktmPhotoUrl, `KTM ${review.fullName}`],
                ].map(([label, url, alt]) => (
                  <div key={label}>
                    <p className="mb-2 text-sm font-medium text-dark-700">{label}</p>
                    {url ? (
                      <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-dark-200 bg-dark-50">
                        <Image src={url} alt={alt} fill className="object-contain" sizes="(max-width: 640px) 100vw, 320px" />
                      </div>
                    ) : (
                      <div className="flex aspect-[4/5] items-center justify-center rounded-lg border border-dashed border-dark-200 text-sm text-dark-400">
                        Foto tidak tersedia
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 border-t border-dark-100 pt-5">
                <form action={acceptUser} className="flex-1">
                  <input type="hidden" name="userId" value={review.userId} />
                  <input type="hidden" name="tenantId" value={tenantId} />
                  <button type="submit" className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700">
                    Approve
                  </button>
                </form>
                <form action={rejectUser} className="flex-1">
                  <input type="hidden" name="userId" value={review.userId} />
                  <input type="hidden" name="tenantId" value={tenantId} />
                  <button type="submit" className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700">
                    Reject
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
