import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/config/env';

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
});

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  options: {
    folder?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
    publicId?: string;
    accessMode?: 'public' | 'authenticated' | 'private';
    timeout?: number;
  } = {}
) => {
  const {
    folder = 'kalivergo/profiles',
    resourceType = 'image',
    publicId,
    accessMode,
    timeout = 120000,
  } = options;

  return new Promise<any>((resolve, reject) => {
    const uploadOptions: any = {
      folder,
      resource_type: resourceType,
      timeout,
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    if (accessMode) {
      uploadOptions.access_mode = accessMode;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
) => {
  return await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
};

export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

export default cloudinary;