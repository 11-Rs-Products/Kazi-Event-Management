export function getOptimizedImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Handle standard Google Drive /file/d/ ID /view links
  if (url.includes('drive.google.com/file/d/')) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }
  
  // Handle older Google Drive open?id= links
  if (url.includes('drive.google.com/open?id=')) {
    const match = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }

  // Handle Google Drive /view links with id param
  if (url.includes('drive.google.com/file/d/') && url.includes('id=')) {
      const match = url.match(/id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
          return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
  }

  return url;
}
