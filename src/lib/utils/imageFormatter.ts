export function getOptimizedImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Extract ID from any Google Drive link format
  let fileId: string | null = null;

  // Format 1: drive.google.com/file/d/FILE_ID/view
  if (url.includes('/file/d/')) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) fileId = match[1];
  }
  // Format 2: drive.google.com/open?id=FILE_ID
  else if (url.includes('open?id=')) {
    const match = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) fileId = match[1];
  }
  // Format 3: drive.google.com/uc?id=FILE_ID or export=view&id=FILE_ID
  else if (url.includes('/uc?')) {
    const match = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) fileId = match[1];
  }

  // If we found a file ID, return the highly reliable googleusercontent link
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // Fallback to original URL
  return url;
}
