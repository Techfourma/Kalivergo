"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import { FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InformationPost {
  id: string;
  title: string;
  content: string;
  type: string;
  mediaUrl: string | null;
  createdAt: Date | string;
  user?: {
    name: string;
  };
}

interface HomeInfoCardProps {
  post: InformationPost | null;
  tenantPath: string;
}

const MAX_CONTENT_LENGTH = 120;

export default function HomeInfoCard({ post, tenantPath }: HomeInfoCardProps) {
  if (!post) return null;

  const truncatedContent =
    post.content.length > MAX_CONTENT_LENGTH
      ? post.content.slice(0, MAX_CONTENT_LENGTH).trimEnd() + "..."
      : post.content;

  const isImage = post.type === "IMAGE";
  const createdAt = new Date(post.createdAt);
  const timeAgo = getTimeAgo(createdAt);

  return (
    <Link href={`${tenantPath}/information`} className="block">
      <Card
        padding="none"
        className={cn(
          "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer border-l-4",
          isImage ? "border-l-blue-500" : "border-l-primary-500"
        )}
      >
        <div className="flex items-start gap-4 p-4 sm:p-5">
          {isImage && post.mediaUrl ? (
            <div className="relative h-16 w-20 sm:h-20 sm:w-24 shrink-0 overflow-hidden rounded-xl">
              <img
                src={post.mediaUrl}
                alt={post.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              <FileText className="h-6 w-6" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700 dark:bg-primary-500/15 dark:text-primary-300 mb-2">
              Informasi
            </span>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm sm:text-base font-bold text-dark-900 dark:text-white truncate group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                {post.title}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-dark-500 dark:text-dark-400 line-clamp-2 leading-relaxed">
              {truncatedContent}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] sm:text-xs text-dark-400 dark:text-dark-500 font-medium">
                {timeAgo}
              </span>
              {post.user?.name && (
                <>
                  <span className="text-[10px] sm:text-xs text-dark-300 dark:text-dark-600">·</span>
                  <span className="text-[10px] sm:text-xs text-dark-400 dark:text-dark-500 truncate">
                    {post.user.name}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="shrink-0 pt-1">
            <span className="text-[10px] sm:text-xs font-medium text-primary-600 dark:text-primary-400 group-hover:underline">
              Lihat semua
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
