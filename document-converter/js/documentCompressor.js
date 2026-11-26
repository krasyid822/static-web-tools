const PDF_SCALE_CANDIDATES = [1.5, 1.25, 1.0, 0.75, 0.55, 0.4];
const PPTX_PASSES = [
  { scale: 1.0, quality: 0.8 },
  { scale: 0.85, quality: 0.65 },
  { scale: 0.7, quality: 0.5 },
  { scale: 0.55, quality: 0.35 },
  { scale: 0.4, quality: 0.22 },
  { scale: 0.3, quality: 0.15 },
];

/**
 * Builds the output filename for a compressed document.
 * @param {string} originalName
 * @returns {string}
 */
export function buildCompressedFilename(originalName) {
  const name = originalName || 'document.pdf';
  const match = name.match(/^(.*?)(\.(pdf|pptx))$/i);
  if (match) {
    return `${match[1]}_compressed${match[2]}`;
  }
  return `${name}_compressed.pdf`;
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

function yieldToMainThread() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Builds a valid PDF 1.4 Blob from an array of JPEG-encoded pages.
 * @param {Array<{ jpegBytes: Uint8Array, widthPx: number, heightPx: number, widthPt: number, heightPt: number }>} pages
 * @returns {Blob}
 */
export function buildPdfFromJpegs(pages) {
  const encoder = new TextEncoder();
  const chunks = [];
  let offset = 0;

  const pushBytes = (bytes) => {
    chunks.push(bytes);
    offset += bytes.length;
  };

  const pushStr = (str) => {
    pushBytes(encoder.encode(str));
  };

  // PDF 1.4 header with binary comment bytes
  pushBytes(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xff, 0xff, 0xff, 0xff, 0x0a]));

  const totalObjects = 2 + pages.length * 3;
  const offsets = new Array(totalObjects + 1).fill(0);

  const pageObjIds = pages.map((_, idx) => 3 + idx * 3);
  const kidsStr = pageObjIds.map((id) => `${id} 0 R`).join(' ');

  // Obj 1: Catalog
  offsets[1] = offset;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Obj 2: Pages
  offsets[2] = offset;
  pushStr(`2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${pages.length} >>\nendobj\n`);

  // Per-page objects
  for (let i = 0; i < pages.length; i++) {
    const { jpegBytes, widthPx, heightPx, widthPt, heightPt } = pages[i];
    const pageObjId = 3 + i * 3;
    const contentObjId = pageObjId + 1;
    const imgObjId = pageObjId + 2;

    const wPt = Number(widthPt.toFixed(2));
    const hPt = Number(heightPt.toFixed(2));

    // Page object
    offsets[pageObjId] = offset;
    pushStr(
      `${pageObjId} 0 obj\n` +
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt} ${hPt}] ` +
        `/Resources << /XObject << /Im0 ${imgObjId} 0 R >> >> ` +
        `/Contents ${contentObjId} 0 R >>\n` +
        `endobj\n`
    );

    // Content stream
    const contentStream = `q ${wPt} 0 0 ${hPt} 0 0 cm /Im0 Do Q\n`;
    const contentBytes = encoder.encode(contentStream);
    offsets[contentObjId] = offset;
    pushStr(`${contentObjId} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
    pushBytes(contentBytes);
    pushStr('endstream\nendobj\n');

    // Image XObject
    offsets[imgObjId] = offset;
    pushStr(
      `${imgObjId} 0 obj\n` +
        `<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\n` +
        `stream\n`
    );
    pushBytes(jpegBytes);
    pushStr('\nendstream\nendobj\n');
  }

  // Cross-reference table
  const xrefOffset = offset;
  pushStr(`xref\n0 ${totalObjects + 1}\n`);
  pushStr('0000000000 65535 f \n');
  for (let id = 1; id <= totalObjects; id++) {
    const paddedOffset = String(offsets[id]).padStart(10, '0');
    pushStr(`${paddedOffset} 00000 n \n`);
  }

  // Trailer
  pushStr(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  return new Blob(chunks, { type: 'application/pdf' });
}

function pickInitialScaleIndex(initialPageBudget) {
  if (initialPageBudget >= 120 * 1024) return 0; // 1.5x
  if (initialPageBudget >= 60 * 1024) return 1; // 1.25x
  if (initialPageBudget >= 30 * 1024) return 2; // 1.0x
  return 3; // 0.75x
}

async function renderPdfPageToCanvas(page, scale, canvas, ctx) {
  const viewport = page.getViewport({ scale });
  const width = Math.max(1, Math.floor(viewport.width));
  const height = Math.max(1, Math.floor(viewport.height));

  canvas.width = width;
  canvas.height = height;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  await page.render({ canvasContext: ctx, viewport }).promise;
  return { width, height };
}

async function findBestJpegForCanvas(canvas, pageBudget, signal) {
  let low = 0.15;
  let high = 0.92;
  let bestBlob = null;

  for (let iter = 0; iter < 6; iter++) {
    if (signal?.aborted) {
      throw new DOMException('Compression cancelled', 'AbortError');
    }
    const mid = (low + high) / 2;
    const blob = await canvasToBlob(canvas, 'image/jpeg', mid);
    if (blob.size <= pageBudget) {
      bestBlob = blob;
      low = mid;
    } else {
      high = mid;
    }
  }

  if (!bestBlob) {
    bestBlob = await canvasToBlob(canvas, 'image/jpeg', 0.15);
  }
  return bestBlob;
}

/**
 * Compresses a PDF document to fit within targetBytes by re-rendering pages as adaptive JPEG streams.
 * @param {object} pdfDoc
 * @param {{ targetBytes: number, signal?: AbortSignal }} options
 * @param {{ onProgress?: (percent: number, statusText: string) => void }} [callbacks]
 * @returns {Promise<{ blob: Blob, compressedSize: number, targetBytes: number, targetMet: boolean }>}
 */
export async function compressPdfToTargetSize(pdfDoc, options, callbacks = {}) {
  const { targetBytes, signal } = options;
  const { onProgress } = callbacks;
  const numPages = pdfDoc.numPages;
  const overhead = 600 + numPages * 450;
  const initialBudget = Math.max(4096, Math.floor((targetBytes - overhead) / numPages));

  let scaleIndex = pickInitialScaleIndex(initialBudget);
  let accumulatedBytes = 0;
  const encodedPages = [];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context.');
  }

  try {
    for (let i = 1; i <= numPages; i++) {
      if (signal?.aborted) {
        throw new DOMException('Compression cancelled', 'AbortError');
      }

      onProgress?.(((i - 1) / numPages) * 92, `Compressing page ${i} of ${numPages}...`);

      const page = await pdfDoc.getPage(i);
      const baseViewport = page.getViewport({ scale: 1.0 });
      const widthPt = baseViewport.width;
      const heightPt = baseViewport.height;

      const remainingPages = numPages - i + 1;
      const pageBudget = Math.max(
        4096,
        Math.floor((targetBytes - overhead - accumulatedBytes) / remainingPages)
      );

      let chosenBlob = null;
      let chosenWidth = 0;
      let chosenHeight = 0;

      while (true) {
        if (signal?.aborted) {
          page.cleanup();
          throw new DOMException('Compression cancelled', 'AbortError');
        }

        const scale = PDF_SCALE_CANDIDATES[scaleIndex];
        const dims = await renderPdfPageToCanvas(page, scale, canvas, ctx);
        chosenWidth = dims.width;
        chosenHeight = dims.height;

        chosenBlob = await findBestJpegForCanvas(canvas, pageBudget, signal);

        if (chosenBlob.size <= pageBudget * 1.05 || scaleIndex >= PDF_SCALE_CANDIDATES.length - 1) {
          break;
        }
        scaleIndex++;
      }

      const jpegBytes = new Uint8Array(await chosenBlob.arrayBuffer());
      accumulatedBytes += jpegBytes.length;

      encodedPages.push({
        jpegBytes,
        widthPx: chosenWidth,
        heightPx: chosenHeight,
        widthPt,
        heightPt,
      });

      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();

      onProgress?.((i / numPages) * 92, `Compressing page ${i} of ${numPages}...`);
      await yieldToMainThread();
    }

    onProgress?.(95, 'Assembling compressed PDF...');
    const finalBlob = buildPdfFromJpegs(encodedPages);
    onProgress?.(100, 'Done');

    return {
      blob: finalBlob,
      compressedSize: finalBlob.size,
      targetBytes,
      targetMet: finalBlob.size <= targetBytes,
    };
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

function getRasterMimeType(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.png')) return 'image/png';
  return null;
}

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode embedded PPTX image.'));
    };
    img.src = url;
  });
}

async function reencodeImageBytes(rawBytes, mimeType, scale, quality, canvas, ctx) {
  const srcBlob = new Blob([rawBytes], { type: mimeType });
  const img = await loadImageFromBlob(srcBlob);

  const targetW = Math.max(1, Math.round(img.naturalWidth * scale));
  const targetH = Math.max(1, Math.round(img.naturalHeight * scale));

  canvas.width = targetW;
  canvas.height = targetH;

  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
  }
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const outBlob = await canvasToBlob(canvas, mimeType, mimeType === 'image/png' ? undefined : quality);
  canvas.width = 0;
  canvas.height = 0;

  return new Uint8Array(await outBlob.arrayBuffer());
}

/**
 * Compresses a PPTX file by re-encoding embedded raster media and using DEFLATE level 9.
 * @param {File} file
 * @param {{ targetBytes: number, signal?: AbortSignal }} options
 * @param {{ onProgress?: (percent: number, statusText: string) => void }} [callbacks]
 * @returns {Promise<{ blob: Blob, compressedSize: number, targetBytes: number, targetMet: boolean }>}
 */
export async function compressPptxToTargetSize(file, options, callbacks = {}) {
  const { targetBytes, signal } = options;
  const { onProgress } = callbacks;

  if (typeof window === 'undefined' || typeof window.JSZip !== 'function') {
    throw new Error('JSZip library is not loaded.');
  }

  onProgress?.(5, 'Reading PPTX archive...');
  const zip = await window.JSZip.loadAsync(file);

  const mediaEntries = [];
  zip.forEach((relativePath, entry) => {
    if (!entry.dir && relativePath.startsWith('ppt/media/')) {
      const mimeType = getRasterMimeType(relativePath);
      if (mimeType) {
        mediaEntries.push({ path: relativePath, mimeType });
      }
    }
  });

  if (mediaEntries.length === 0) {
    onProgress?.(60, 'Re-packing PPTX with maximum DEFLATE compression...');
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });
    onProgress?.(100, 'Done');
    return {
      blob,
      compressedSize: blob.size,
      targetBytes,
      targetMet: blob.size <= targetBytes,
    };
  }

  // Cache original media bytes so each pass starts from crisp source images
  const originalMedia = new Map();
  for (const item of mediaEntries) {
    if (signal?.aborted) {
      throw new DOMException('Compression cancelled', 'AbortError');
    }
    originalMedia.set(item.path, await zip.file(item.path).async('uint8array'));
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context.');
  }

  let bestBlob = null;

  try {
    for (let passIdx = 0; passIdx < PPTX_PASSES.length; passIdx++) {
      if (signal?.aborted) {
        throw new DOMException('Compression cancelled', 'AbortError');
      }

      const { scale, quality } = PPTX_PASSES[passIdx];
      const basePct = (passIdx / PPTX_PASSES.length) * 90;
      onProgress?.(basePct, `Compressing media (pass ${passIdx + 1} of ${PPTX_PASSES.length})...`);

      for (const item of mediaEntries) {
        if (signal?.aborted) {
          throw new DOMException('Compression cancelled', 'AbortError');
        }
        const origBytes = originalMedia.get(item.path);
        const newBytes = await reencodeImageBytes(origBytes, item.mimeType, scale, quality, canvas, ctx);
        zip.file(item.path, newBytes);
        await yieldToMainThread();
      }

      const candidateBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
      });

      if (!bestBlob || candidateBlob.size < bestBlob.size) {
        bestBlob = candidateBlob;
      }

      if (candidateBlob.size <= targetBytes) {
        break;
      }
    }

    onProgress?.(100, 'Done');
    return {
      blob: bestBlob,
      compressedSize: bestBlob.size,
      targetBytes,
      targetMet: bestBlob.size <= targetBytes,
    };
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}
