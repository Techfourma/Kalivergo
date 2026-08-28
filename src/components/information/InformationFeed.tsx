'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getInformationFeed, markAsRead, addReaction, removeReaction, addComment } from '@/actions/cms/information';
import { InformationType } from '@prisma/client';

interface User {
  id: string;
  name: string;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
  replies: Comment[];
}

interface InformationPost {
  id: string;
  title: string;
  content: string;
  type: InformationType;
  mediaUrl: string | null;
  createdAt: string;
  updatedAt: string;
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
}

const REACTION_EMOJIS = {
  LIKE: '👍',
  LOVE: '❤️',
  LAUGH: '😂',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😠',
};

export default function InformationFeed({ tenantId }: InformationFeedProps) {
  const [posts, setPosts] = useState<InformationPost[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async (isRefresh = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const result = await getInformationFeed(tenantId, isRefresh ? undefined : cursor, 20);
      if (result.success && result.data) {
        if (isRefresh) {
          setPosts(result.data);
        } else {
          setPosts((prev) => [...prev, ...result.data]);
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
              // Add reply to existing comment
              const updatedComments = p.comments.map((c) => {
                if (c.id === parentId) {
                  return {
                    ...c,
                    replies: [...c.replies, result.data],
                  };
                }
                return c;
              });
              return { ...p, comments: updatedComments };
            } else {
              // Add new top-level comment
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

  const renderMedia = (post: InformationPost) => {
    if (!post.mediaUrl) return null;

    switch (post.type) {
      case InformationType.IMAGE:
        return (
          <img
            src={post.mediaUrl}
            alt={post.title}
            className="w-full max-h-96 object-cover rounded-lg mt-3"
          />
        );
      case InformationType.VIDEO:
        return (
          <video controls className="w-full max-h-96 rounded-lg mt-3">
            <source src={post.mediaUrl} />
            Your browser does not support the video tag.
          </video>
        );
      case InformationType.PDF:
        return (
          <a
            href={post.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
              </svg>
              <span className="text-blue-600 font-medium">View PDF Document</span>
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
      <div key={comment.id} className={`${isReply ? 'ml-8 mt-2' : ''}`}>
        <div className="flex gap-2">
          <img
            src={comment.user.image || '/default-avatar.png'}
            alt={comment.user.name}
            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{comment.user.name}</span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm mt-1">{comment.content}</p>
            </div>
            <button
              onClick={() => setExpandedComments((prev) => ({ ...prev, [replyKey]: !prev[replyKey] }))}
              className="text-xs text-gray-500 hover:text-gray-700 ml-2 mt-1"
            >
              Reply
            </button>
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
                  className="flex-1 px-3 py-1 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleAddComment(postId, comment.id)}
                  className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600"
                >
                  Send
                </button>
              </div>
            )}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2">
                {comment.replies.map((reply) => renderComment(reply, postId, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Refresh Button */}
      <button
        onClick={handleRefresh}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh Feed
      </button>

      {/* Posts */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => handlePostClick(post.id)}
            className={`bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
              !post.hasRead ? 'border-l-4 border-blue-500' : ''
            }`}
          >
            {/* Header */}
            <div className="p-4 flex items-center gap-3">
              <img
                src={post.user.image || '/default-avatar.png'}
                alt={post.user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{post.user.name}</h3>
                  {!post.hasRead && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                      New
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
              <h2 className="text-lg font-bold">{post.title}</h2>
              <p className="text-gray-700 mt-2 whitespace-pre-wrap">{post.content}</p>
              {renderMedia(post)}
            </div>

            {/* Reactions */}
            <div className="px-4 py-2 border-t border-b flex items-center justify-between">
              <div className="flex items-center gap-1">
                {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                  <button
                    key={type}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReaction(post.id, type);
                    }}
                    className={`px-2 py-1 rounded transition-all ${
                      post.userReaction === type
                        ? 'bg-blue-100 scale-110'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">{emoji}</span>
                    {post.reactionCounts[type] > 0 && (
                      <span className="text-xs ml-1">{post.reactionCounts[type]}</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="text-sm text-gray-500">
                {post._count.reactions} reactions
              </div>
            </div>

            {/* Comments Section */}
            <div className="px-4 py-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleComments(post.id);
                }}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                {expandedComments[post.id] ? 'Hide' : 'Show'} Comments ({post._count.comments})
              </button>

              {expandedComments[post.id] && (
                <div className="mt-4 space-y-3">
                  {post.comments.map((comment) => renderComment(comment, post.id))}

                  {/* Add Comment */}
                  <div className="flex gap-2 mt-4">
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
                      className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="py-4 text-center">
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
