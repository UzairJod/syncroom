/**
 * Convert SRT subtitle content to WebVTT format
 */
export function srtToVtt(srtContent: string): string {
  let vtt = 'WEBVTT\n\n';

  // Normalize line endings
  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into subtitle blocks
  const blocks = normalized.trim().split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 2) continue;

    // Find the timestamp line (contains -->)
    let timestampLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        timestampLineIndex = i;
        break;
      }
    }

    if (timestampLineIndex === -1) continue;

    // Convert SRT timestamps (00:00:00,000) to VTT (00:00:00.000)
    const timestamp = lines[timestampLineIndex].replace(/,/g, '.');

    // Get text content (everything after the timestamp line)
    const text = lines.slice(timestampLineIndex + 1).join('\n');

    if (text.trim()) {
      vtt += `${timestamp}\n${text}\n\n`;
    }
  }

  return vtt;
}

/**
 * Create a blob URL from subtitle content
 */
export function createSubtitleBlobUrl(content: string, format: 'srt' | 'vtt'): string {
  let vttContent = content;

  if (format === 'srt') {
    vttContent = srtToVtt(content);
  }

  const blob = new Blob([vttContent], { type: 'text/vtt' });
  return URL.createObjectURL(blob);
}

/**
 * Revoke a previously created subtitle blob URL
 */
export function revokeSubtitleUrl(url: string): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Detect subtitle format from filename extension
 */
export function getSubtitleFormat(filename: string): 'srt' | 'vtt' | null {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'srt') return 'srt';
  if (ext === 'vtt') return 'vtt';
  return null;
}
