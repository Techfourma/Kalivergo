'use client';

import { useState, useEffect, useRef } from 'react';
import { createInformation } from '@/actions/cms/information';
import { InformationType } from '@prisma/client';
import Avatar from '@/components/ui/Avatar';

interface CreatePostFormProps {
  tenantId: string;
  currentUser: {
    id: string;
    name: string;
    image?: string | null;
  };
  onSuccess?: () => void;
}

const MAX_CONTENT_LENGTH = 5000;

export default function CreatePostForm({ tenantId, currentUser, onSuccess }: CreatePostFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<InformationType>(InformationType.TEXT);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isMediaMode = type !== InformationType.TEXT;
  const remainingChars = MAX_CONTENT_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;
  const isNearLimit = remainingChars <= 200 && remainingChars >= 0;

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    autoResize();
  }, [content, isMediaMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !file) return;
    if (isOverLimit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('tenantId', tenantId);
      formData.append('title', title || content.substring(0, 50));
      formData.append('content', content);
      formData.append('type', type);
      if (file) {
        formData.append('file', file);
      }

      const result = await createInformation(formData);

      if (result.success) {
        setTitle('');
        setContent('');
        setType(InformationType.TEXT);
        setFile(null);
        setIsExpanded(false);
        onSuccess?.();
      } else {
        setError(result.error || 'Failed to create post');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);

      if (selectedFile.type.startsWith('image/')) {
        setType(InformationType.IMAGE);
      } else if (selectedFile.type.startsWith('video/')) {
        setType(InformationType.VIDEO);
      } else if (selectedFile.type === 'application/pdf') {
        setType(InformationType.PDF);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      {!isExpanded ? (
        <div className="p-3">
          <div className="flex items-center gap-3">
            <Avatar
              src={currentUser.image}
              name={currentUser.name}
              id={currentUser.id}
              size="md"
            />
            <button
              onClick={() => setIsExpanded(true)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-500 px-4 py-2.5 rounded-full text-left transition-colors text-sm"
            >
              What&apos;s on your mind?
            </button>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => { setType(InformationType.TEXT); setIsExpanded(true); }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-green-500 text-lg">📝</span>
                <span className="text-sm text-gray-600 font-medium">Text</span>
              </button>
              <button
                type="button"
                onClick={() => { setType(InformationType.IMAGE); setIsExpanded(true); }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-green-500 text-lg">📷</span>
                <span className="text-sm text-gray-600 font-medium">Photo</span>
              </button>
              <button
                type="button"
                onClick={() => { setType(InformationType.VIDEO); setIsExpanded(true); }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-blue-500 text-lg">🎥</span>
                <span className="text-sm text-gray-600 font-medium">Video</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar
              src={currentUser.image}
              name={currentUser.name}
              id={currentUser.id}
              size="md"
            />
            <h3 className="font-semibold text-gray-900 text-base">Create Post</h3>
          </div>

          {error && (
            <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:outline-none focus:ring-0 focus:border-blue-500 text-lg font-semibold text-gray-900 placeholder:text-gray-400"
                placeholder="Post title"
              />
            </div>

            <div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required={!file}
                rows={isMediaMode ? 2 : 4}
                maxLength={MAX_CONTENT_LENGTH + 100}
                className={`w-full px-0 py-2 border-0 border-b focus:outline-none focus:ring-0 focus:border-blue-500 resize-none text-base text-gray-800 placeholder:text-gray-400 leading-relaxed ${
                  isOverLimit ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="What's on your mind?"
                autoFocus
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-400">
                  Be kind and respectful
                </span>
                <span className={`text-xs font-medium ${
                  isOverLimit
                    ? 'text-red-600'
                    : isNearLimit
                    ? 'text-amber-600'
                    : 'text-gray-400'
                }`}>
                  {remainingChars}
                </span>
              </div>
            </div>

            {isMediaMode && (
              <div>
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="file"
                    accept={
                      type === InformationType.IMAGE
                        ? 'image/*'
                        : type === InformationType.VIDEO
                        ? 'video/*'
                        : 'application/pdf'
                    }
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {file && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      {file.name}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setType(InformationType.TEXT);
                    setFile(null);
                  }}
                  className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${!isMediaMode ? 'bg-gray-200' : ''}`}
                  title="Text"
                >
                  <span className="text-xl">📝</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType(InformationType.IMAGE);
                    setFile(null);
                  }}
                  className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${type === InformationType.IMAGE ? 'bg-gray-200' : ''}`}
                  title="Photo"
                >
                  <span className="text-xl">📷</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType(InformationType.VIDEO);
                    setFile(null);
                  }}
                  className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${type === InformationType.VIDEO ? 'bg-gray-200' : ''}`}
                  title="Video"
                >
                  <span className="text-xl">🎥</span>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (!content.trim() && !file) || isOverLimit}
                  className="px-6 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
