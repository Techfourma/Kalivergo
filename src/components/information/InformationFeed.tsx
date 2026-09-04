'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getInformationFeed, markAsRead, addReaction, removeReaction, addComment } from '@/actions/cms/information';
import { InformationType } from '@prisma/client';
import Avatar from '@/components/ui/Avatar';
import {
  Angry,
  CircleHelp,
  Frown,
  Heart,
  Laugh,
  MessageCircle,
  Share2,
  ThumbsUp,
  type LucideIcon,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: User;
  replies?: Comment[];
}

interface InformationPost {
  id: string;
  title: string;
  content: string;
  type: InformationType;
  mediaUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  hasRead: boolean;
  userReaction: string | null;
  reactionCounts: Record<string, number>;
  _count: {
    comments: number;
    reactions: number;
  };
  comments: Comment[];
}

interface InformationFeedProps {
  tenantId: string;
  sharePostId?: string;
}

const REACTION_ICONS: Record<string, LucideIcon> = {
  LIKE: ThumbsUp,
  LOVE: Heart,
  LAUGH: Laugh,
  WOW: CircleHelp,
  SAD: Frown,
  ANGRY: Angry,
};
const REACTION_LABELS: Record<string, string> = {
  LIKE: 'Like',
  LOVE: 'Love',
  LAUGH: 'Funny',
  WOW: 'Wow',
  SAD: 'Sad',
  ANGRY: 'Angry',
};
const reactionEntries = Object.entries(REACTION_ICONS) as [string, LucideIcon][];

function formatJakartaTime(date: Date): string {
  const jakartaDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const now = new Date();
  const jakartaNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  
  const diffMs = jakartaNow.getTime() - jakartaDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return jakartaDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: jakartaDate.getFullYear() !== jakartaNow.getFullYear() ? 'numeric' : undefined,
      timeZone: 'Asia/Jakarta'
    });
  }
}

function formatJakartaDateTime(date: Date): string {
  return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Jakarta'
  });
}

export default function InformationFeed({ tenantId, sharePostId }: InformationFeedProps) {
  const [posts, setPosts] = useState<InformationPost[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [showAllComments, setShowAllComments] = useState<Record<string, boolean>>({});
  const [reactionPickerOpen, setReactionPickerOpen] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const reactionPickerRef = useRef<HTMLDivElement>(null);
  const sharedPostRef = useRef<string | undefined>(undefined);

  const fetchPosts = useCallback(async (isRefresh = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const result = await getInformationFeed(tenantId, isRefresh ? undefined : cursor, 20);
      if (result.success && result.data) {
        if (isRefresh) {
          setPosts(result.data);
        } else {
          setPosts((prev) => {
            const postsById = new Map(prev.map((post) => [post.id, post]));
            result.data.forEach((post) => postsById.set(post.id, post));
            return Array.from(postsById.values());
          });
        }
        setCursor(result.nextCursor);
        setHasMore(!!result.nextCursor);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, cursor, loading]);

  const handleRefresh = () => {
    setCursor(undefined);
    fetchPosts(true);
  };

  useEffect(() => {
    fetchPosts(true);
  }, []);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPosts(false);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, fetchPosts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) {
        setReactionPickerOpen(null);
      }
    };
    if (reactionPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [reactionPickerOpen]);

  useEffect(() => {
    if (sharePostId && sharePostId !== sharedPostRef.current && posts.some((post) => post.id === sharePostId)) {
      sharedPostRef.current = sharePostId;
      document.getElementById(`information-post-${sharePostId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [posts, sharePostId]);

  const handlePostClick = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (post && !post.hasRead) {
      await markAsRead(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, hasRead: true } : p))
      );
    }
  };

  const handleReaction = async (postId: string, type: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    if (post.userReaction === type) {
      await removeReaction(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                userReaction: null,
                reactionCounts: {
                  ...p.reactionCounts,
                  [type]: Math.max(0, (p.reactionCounts[type] || 0) - 1),
                },
              }
            : p
        )
      );
    } else {
      if (post.userReaction) {
        await removeReaction(postId);
      }
      await addReaction(postId, type);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                userReaction: type,
                reactionCounts: {
                  ...p.reactionCounts,
                  [type]: (p.reactionCounts[type] || 0) + 1,
                },
              }
            : p
        )
      );
    }
  };

  const handleShare = async (postId: string) => {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?post=${encodeURIComponent(postId)}`;
    const shareText = [post.title || 'Information post', shareUrl].join('\n\n');

    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title || 'Information post',
          text: shareText,
          url: shareUrl,
        });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
      }
    } catch {
      return;
    }
  };

  const handleAddComment = async (postId: string, parentId?: string) => {
    const content = parentId
      ? newComment[`${postId}-${parentId}`]
      : newComment[postId];

    if (!content?.trim()) return;

    const result = await addComment(postId, content, parentId);
    if (result.success && result.data) {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            if (parentId) {
              const updatedComments = p.comments.map((c) => {
                if (c.id === parentId) {
                  return {
                    ...c,
                    replies: [...(c.replies || []), result.data],
                  };
                }
                return c;
              });
              return { ...p, comments: updatedComments };
            } else {
              return {
                ...p,
                comments: [...p.comments, result.data],
                _count: { ...p._count, comments: p._count.comments + 1 },
              };
            }
          }
          return p;
        })
      );

      if (parentId) {
        setNewComment((prev) => ({ ...prev, [`${postId}-${parentId}`]: '' }));
      } else {
        setNewComment((prev) => ({ ...prev, [postId]: '' }));
      }
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleShowAllComments = (postId: string) => {
    setShowAllComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const renderMedia = (post: InformationPost) => {
    if (!post.mediaUrl) return null;

    switch (post.type) {
      case InformationType.IMAGE:
        return (
          <img
            src={post.mediaUrl}
            alt={post.title}
            className="w-full max-h-[500px] object-cover rounded-lg mt-3"
          />
        );
      case InformationType.VIDEO:
        return (
          <video controls className="w-full max-h-[500px] rounded-lg mt-3">
            <source src={post.mediaUrl} />
            Your browser does not support the video tag.
          </video>
        );
      case InformationType.PDF:
        return (
          <a
            href={post.mediaUrl}
            download
            rel="noopener noreferrer"
            className="block mt-3 p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
              </svg>
              <div>
                <span className="text-blue-600 font-medium block">Download PDF Document</span>
                <span className="text-xs text-gray-500">Klik untuk mengunduh file PDF</span>
              </div>
            </div>
          </a>
        );
      default:
        return null;
    }
  };

  const renderComment = (comment: Comment, postId: string, depth = 0) => {
    const isReply = depth > 0;
    const replyKey = `${postId}-${comment.id}`;

    return (
      <div key={comment.id} className={`${isReply ? 'ml-12 mt-2' : ''}`}>
        <div className="flex gap-2">
          <Avatar
            src={comment.user.image}
            name={comment.user.name}
            id={comment.user.id}
            size="sm"
          />
          <div className="flex-1">
            <div className="bg-gray-100 rounded-2xl px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{comment.user.name}</span>
                <span className="text-xs text-gray-500">
                  {formatJakartaTime(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm mt-1">{comment.content}</p>
            </div>
            <div className="flex items-center gap-3 mt-1 ml-2">
              <button
                onClick={() => setExpandedComments((prev) => ({ ...prev, [replyKey]: !prev[replyKey] }))}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                Reply
              </button>
            </div>
            {expandedComments[replyKey] && (
              <div className="flex gap-2 mt-2 ml-2">
                <input
                  type="text"
                  placeholder="Write a reply..."
                  value={newComment[replyKey] || ''}
                  onChange={(e) =>
                    setNewComment((prev) => ({ ...prev, [replyKey]: e.target.value }))
                  }
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddComment(postId, comment.id);
                    }
                  }}
                  className="flex-1 px-3 py-1.5 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleAddComment(postId, comment.id)}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600"
                >
                  Send
                </button>
              </div>
            )}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-1">
                {comment.replies.map((reply) => renderComment(reply, postId, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Refresh Button */}
      <div className="flex justify-between items-center mb-4 px-4">
        <h2 className="text-xl font-bold">Feed</h2>
        <button
          onClick={handleRefresh}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            id={`information-post-${post.id}`}
            className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
              !post.hasRead
                ? 'border-blue-200 dark:border-blue-800'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {/* Header */}
            <div className="p-4 flex items-center gap-3">
              <Avatar
                src={post.user.image}
                name={post.user.name}
                id={post.user.id}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm text-gray-900">{post.user.name}</h3>
                  {!post.hasRead && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">
                      New
                    </span>
                  )}
                  {post.hasRead && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
                      Read
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatJakartaTime(post.createdAt)}
                </p>
              </div>
            </div>

            {/* Content: Title → Text → Media */}
            <div className="px-4 pb-3">
              {post.title && (
                <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{post.title}</h2>
              )}
              {post.content && (
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base mb-3">{post.content}</p>
              )}
              {renderMedia(post)}
            </div>

            {/* Stats */}
            {post._count.reactions > 0 && (
              <div className="px-4 py-2 flex items-center gap-2 text-sm text-gray-500 border-b border-gray-100">
                <span className="flex items-center -space-x-1">
                  {reactionEntries
                    .filter(([type]) => (post.reactionCounts[type] || 0) > 0)
                    .slice(0, 3)
                    .map(([type, Icon]) => <Icon key={type} className="w-4 h-4 bg-white rounded-full" />)}
                </span>
                <span>{post._count.reactions}</span>
                {post._count.comments > 0 && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span>{post._count.comments} comments</span>
                  </>
                )}
              </div>
            )}

            {/* Reaction Buttons */}
            <div className="px-2 py-1 flex items-center justify-around border-b border-gray-100 relative">
              <div className="relative" ref={reactionPickerRef}>
                <button
                  onClick={() => setReactionPickerOpen(reactionPickerOpen === post.id ? null : post.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex-1 justify-center ${
                    post.userReaction ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  {(() => {
                    const Icon = post.userReaction ? REACTION_ICONS[post.userReaction] || ThumbsUp : ThumbsUp;
                    return <Icon className="w-5 h-5" />;
                  })()}
                  <span className="text-sm font-medium">
                    {post.userReaction ? REACTION_LABELS[post.userReaction] || 'Like' : 'Like'}
                  </span>
                </button>
                
                {reactionPickerOpen === post.id && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg border border-gray-200 p-1.5 flex gap-1 z-10">
                    {reactionEntries.map(([type, Icon]) => (
                      <button
                        key={type}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReaction(post.id, type);
                          setReactionPickerOpen(null);
                        }}
                        className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all hover:scale-110 ${
                          post.userReaction === type ? 'bg-blue-100' : ''
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => toggleComments(post.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex-1 justify-center text-gray-600"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Comment</span>
              </button>
              <button
                onClick={() => handleShare(post.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex-1 justify-center text-gray-600"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>

            {/* Comments Section */}
            {expandedComments[post.id] && (
              <div className="px-4 py-3 space-y-3">
                {post.comments.length > 0 && (
                  <div className="space-y-3">
                    {showAllComments[post.id] ? (
                      post.comments.map((comment) => renderComment(comment, post.id))
                    ) : (
                      post.comments.slice(0, 2).map((comment) => renderComment(comment, post.id))
                    )}
                    {post.comments.length > 2 && !showAllComments[post.id] && (
                      <button
                        onClick={() => toggleShowAllComments(post.id)}
                        className="text-gray-500 text-sm hover:text-gray-700 font-medium"
                      >
                        View all {post._count.comments} comments
                      </button>
                    )}
                  </div>
                )}

                {/* Add Comment */}
                <div className="flex gap-2 mt-3">
                  <Avatar
                    src={null}
                    name="You"
                    id="current-user"
                    size="sm"
                  />
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={newComment[post.id] || ''}
                      onChange={(e) =>
                        setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddComment(post.id);
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      disabled={!newComment[post.id]?.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="py-6 text-center">
        {loading && <p className="text-gray-500">Loading more posts...</p>}
        {!hasMore && posts.length > 0 && (
          <p className="text-gray-400">No more posts to load</p>
        )}
      </div>

      {posts.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No posts yet. Be the first to share something!</p>
        </div>
      )}
    </div>
  );
}
