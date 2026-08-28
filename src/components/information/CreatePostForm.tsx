'use client';

import { useState } from 'react';
import { createInformation } from '@/actions/cms/information';
import { InformationType } from '@prisma/client';

interface CreatePostFormProps {
  tenantId: string;
  onSuccess?: () => void;
}

export default function CreatePostForm({ tenantId, onSuccess }: CreatePostFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<InformationType>(InformationType.TEXT);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('tenantId', tenantId);
      formData.append('title', title);
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

      // Auto-detect type based on file
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
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Create New Post</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter post title..."
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What's on your mind?"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Post Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as InformationType)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={InformationType.TEXT}>Text Only</option>
            <option value={InformationType.IMAGE}>Image</option>
            <option value={InformationType.VIDEO}>Video</option>
            <option value={InformationType.PDF}>PDF Document</option>
          </select>
        </div>

        {type !== InformationType.TEXT && (
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
              Upload {type.toLowerCase()}
            </label>
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
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {file && (
              <p className="mt-1 text-sm text-gray-500">Selected: {file.name}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
}
