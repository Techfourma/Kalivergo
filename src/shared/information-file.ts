export const MAX_INFORMATION_FILE_SIZE = 50 * 1024 * 1024;

export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

export function isSupportedInformationFile(file: File, type: string): boolean {
  if (type === 'VIDEO') {
    return SUPPORTED_VIDEO_TYPES.includes(file.type.toLowerCase());
  }

  if (type === 'IMAGE') {
    return file.type.startsWith('image/');
  }

  return type === 'PDF' && file.type === 'application/pdf';
}