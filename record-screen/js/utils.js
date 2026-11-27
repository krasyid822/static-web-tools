/**
 * Format duration in seconds into MM:SS or HH:MM:SS.
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const pad = (val) => String(val).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Generate a timestamped recording filename.
 * @param {string} [mimeType='video/webm']
 * @returns {string}
 */
export function generateFilename(mimeType = 'video/webm') {
  const now = new Date();
  const pad = (val) => String(val).padStart(2, '0');

  const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';

  return `recording-${datePart}-${timePart}.${ext}`;
}

/**
 * Determine the best supported MediaRecorder MIME type in priority order.
 * @returns {string}
 */
export function getSupportedMimeType() {
  if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') {
    return '';
  }

  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];

  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return '';
}

/**
 * Validate browser support and secure context requirements.
 * @returns {{ supported: boolean, message: string }}
 */
export function checkBrowserSupport() {
  if (!window.isSecureContext) {
    return {
      supported: false,
      message: 'Aplikasi ini memerlukan Secure Context (HTTPS atau http://localhost) untuk mengakses perekaman layar.',
    };
  }

  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== 'function') {
    return {
      supported: false,
      message: 'Browser Anda tidak mendukung API perekaman layar (getDisplayMedia). Gunakan Chrome, Edge, atau Firefox versi terbaru.',
    };
  }

  if (typeof window.MediaRecorder === 'undefined') {
    return {
      supported: false,
      message: 'Browser Anda tidak mendukung MediaRecorder API.',
    };
  }

  return { supported: true, message: '' };
}

/**
 * Safely revoke an object URL if present.
 * @param {string | null | undefined} url
 */
export function revokeMediaUrl(url) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Format byte count into a human-readable file size string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}
