/**
 * Creates a JSZip wrapper for bundling image blobs with STORE compression.
 */
export function createZipBundler() {
  if (typeof window === 'undefined' || typeof window.JSZip !== 'function') {
    throw new Error('JSZip library is not loaded.');
  }

  const zip = new window.JSZip();

  return {
    /**
     * Appends a file blob to the archive.
     * @param {string} filename
     * @param {Blob} blob
     */
    addFile(filename, blob) {
      zip.file(filename, blob);
    },

    /**
     * Generates the final ZIP blob using STORE compression.
     * @param {(metadata: { percent: number }) => void} [onUpdate]
     * @returns {Promise<Blob>}
     */
    async generateZip(onUpdate) {
      return zip.generateAsync(
        {
          type: 'blob',
          compression: 'STORE',
        },
        onUpdate
      );
    },
  };
}

/**
 * Builds the output ZIP filename from the original document filename.
 * @param {string} originalName
 * @returns {string}
 */
export function buildZipFilename(originalName) {
  const base = (originalName || 'document').replace(/\.(pdf|pptx)$/i, '');
  return `${base}_images.zip`;
}

/**
 * Triggers a browser download for a given Blob URL and filename.
 * @param {string} blobUrl
 * @param {string} filename
 */
export function triggerDownload(blobUrl, filename) {
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
