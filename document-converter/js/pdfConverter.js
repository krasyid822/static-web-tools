export const PDF_WORKER_SRC =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const MAX_CANVAS_DIMENSION = 16384;
const MAX_CANVAS_AREA = 268435456; // 16384 * 16384

function getPdfJsLib() {
  if (typeof window === 'undefined' || !window.pdfjsLib) {
    throw new Error('PDF.js library is not loaded.');
  }
  if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
  }
  return window.pdfjsLib;
}

/**
 * Validates that a File is a PDF by checking MIME/extension and %PDF- magic bytes.
 * @param {File} file
 */
export async function validatePdfFile(file) {
  if (!file) {
    throw new Error('No file selected.');
  }

  const hasPdfMime = file.type === 'application/pdf';
  const hasPdfExt = /\.pdf$/i.test(file.name || '');
  if (!hasPdfMime && !(file.type === '' && hasPdfExt)) {
    throw new Error('Invalid file type. Please select a PDF document.');
  }

  const headerBuffer = await file.slice(0, 5).arrayBuffer();
  const bytes = new Uint8Array(headerBuffer);
  const isPdfMagic =
    bytes.length === 5 &&
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 && // F
    bytes[4] === 0x2d; // -

  if (!isPdfMagic) {
    throw new Error('Invalid PDF file: missing %PDF- header.');
  }
}

/**
 * Loads a PDFDocumentProxy from a File, translating PDF.js errors to user-friendly messages.
 * @param {File} file
 */
export async function loadPdfDocument(file) {
  const pdfjsLib = getPdfJsLib();
  const arrayBuffer = await file.arrayBuffer();

  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    return await loadingTask.promise;
  } catch (err) {
    if (err?.name === 'PasswordException') {
      throw new Error('This PDF is password-protected or encrypted and cannot be opened.');
    }
    if (err?.name === 'InvalidPDFException') {
      throw new Error('The PDF file appears to be corrupted or invalid.');
    }
    throw new Error(err?.message || 'Failed to load PDF document.');
  }
}

/**
 * Parses a page range string (e.g. "1-3, 5, 8-10") into a sorted, deduplicated array of 1-based page numbers.
 * @param {string} rangeStr
 * @param {number} totalPages
 * @returns {number[]}
 */
export function parsePageRange(rangeStr, totalPages) {
  if (typeof rangeStr !== 'string' || rangeStr.trim() === '') {
    throw new Error('Please enter a page range (e.g., 1-3, 5).');
  }

  const pages = new Set();
  const tokens = rangeStr.split(',');

  for (const rawToken of tokens) {
    const token = rawToken.trim();
    if (!token) {
      throw new Error('Invalid page range syntax: empty segment.');
    }

    if (token.includes('-')) {
      const parts = token.split('-');
      if (parts.length !== 2 || !/^\d+$/.test(parts[0].trim()) || !/^\d+$/.test(parts[1].trim())) {
        throw new Error(`Invalid range "${token}". Use format like 1-3.`);
      }
      const start = Number(parts[0].trim());
      const end = Number(parts[1].trim());
      if (start < 1 || end > totalPages || start > end) {
        throw new Error(`Range "${token}" is out of bounds (1-${totalPages}).`);
      }
      for (let p = start; p <= end; p++) {
        pages.add(p);
      }
    } else {
      if (!/^\d+$/.test(token)) {
        throw new Error(`Invalid page number "${token}".`);
      }
      const page = Number(token);
      if (page < 1 || page > totalPages) {
        throw new Error(`Page ${page} is out of bounds (1-${totalPages}).`);
      }
      pages.add(page);
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Formats a zero-padded page/slide filename (e.g., page_001.png or slide_001.png).
 * @param {number} pageNum
 * @param {number} totalPages
 * @param {string} extension
 * @param {string} [prefix='page']
 * @returns {string}
 */
export function formatPageFilename(pageNum, totalPages, extension, prefix = 'page') {
  const padLength = Math.max(3, String(totalPages).length);
  const padded = String(pageNum).padStart(padLength, '0');
  return `${prefix}_${padded}.${extension}`;
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Failed to encode image as ${mimeType}.`));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

/**
 * Sequentially renders PDF pages to an offscreen canvas and emits Blobs.
 * Resets canvas dimensions after each page to prevent OOM on large PDFs.
 * @param {object} pdfDoc
 * @param {{ pages: number[], scale: number, mimeType: string, quality?: number, signal?: AbortSignal }} options
 * @param {{ onPageComplete: (pageNum: number, blob: Blob, index: number, total: number) => void }} callbacks
 */
export async function convertPagesToBlobs(pdfDoc, options, callbacks) {
  const { pages, scale, mimeType, quality, signal } = options;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context.');
  }

  try {
    for (let i = 0; i < pages.length; i++) {
      if (signal?.aborted) {
        throw new DOMException('Conversion cancelled', 'AbortError');
      }

      const pageNum = pages[i];
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const width = Math.floor(viewport.width);
      const height = Math.floor(viewport.height);

      if (width > MAX_CANVAS_DIMENSION || height > MAX_CANVAS_DIMENSION || width * height > MAX_CANVAS_AREA) {
        page.cleanup();
        throw new Error(
          `Page ${pageNum} exceeds browser canvas memory limits (${width}x${height}px). Try a lower DPI scale.`
        );
      }

      canvas.width = width;
      canvas.height = height;

      if (mimeType === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      await page.render({ canvasContext: ctx, viewport }).promise;

      if (signal?.aborted) {
        page.cleanup();
        throw new DOMException('Conversion cancelled', 'AbortError');
      }

      const blob = await canvasToBlob(canvas, mimeType, quality);

      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();

      callbacks.onPageComplete(pageNum, blob, i + 1, pages.length);

      // Yield to main thread so progress UI and Cancel button stay responsive.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}
