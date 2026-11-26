import {
  validatePdfFile,
  loadPdfDocument,
  parsePageRange,
  formatPageFilename,
  convertPagesToBlobs,
} from './pdfConverter.js';
import {
  validatePptxFile,
  loadPptxDocument,
  convertPptxSlidesToBlobs,
} from './pptxConverter.js';
import { createZipBundler, buildZipFilename, triggerDownload } from './zipBundler.js';
import {
  compressPdfToTargetSize,
  compressPptxToTargetSize,
  buildCompressedFilename,
} from './documentCompressor.js';

const MIME_TO_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

const state = {
  currentFile: null,
  currentDoc: null,
  currentDocType: null,
  activeMode: 'convert',
  abortController: null,
  lastZipUrl: null,
  lastZipFilename: '',
  isConverting: false,
};

const el = {
  themeToggle: document.getElementById('theme-toggle'),
  themeIcon: document.getElementById('theme-icon'),
  alertBanner: document.getElementById('alert-banner'),
  alertMessage: document.getElementById('alert-message'),
  alertDismiss: document.getElementById('alert-dismiss'),
  dropZone: document.getElementById('drop-zone'),
  fileInput: document.getElementById('file-input'),
  browseBtn: document.getElementById('browse-btn'),
  fileInfo: document.getElementById('file-info'),
  fileName: document.getElementById('file-name'),
  fileSize: document.getElementById('file-size'),
  filePages: document.getElementById('file-pages'),
  changeFileBtn: document.getElementById('change-file-btn'),
  settingsPanel: document.getElementById('settings-panel'),
  modeTabs: document.querySelectorAll('.mode-tab'),
  convertSettings: document.getElementById('convert-settings'),
  compressSettings: document.getElementById('compress-settings'),
  formatSelect: document.getElementById('format-select'),
  scaleSelect: document.getElementById('scale-select'),
  qualityGroup: document.getElementById('quality-group'),
  qualitySlider: document.getElementById('quality-slider'),
  qualityValue: document.getElementById('quality-value'),
  pageRangeRadios: document.querySelectorAll('input[name="page-range-mode"]'),
  pageRangeInput: document.getElementById('page-range-input'),
  convertBtn: document.getElementById('convert-btn'),
  targetSizeInput: document.getElementById('target-size-input'),
  targetSizeUnit: document.getElementById('target-size-unit'),
  targetSizeHint: document.getElementById('target-size-hint'),
  presetBtns: document.querySelectorAll('.preset-btn'),
  compressBtn: document.getElementById('compress-btn'),
  progressPanel: document.getElementById('progress-panel'),
  progressStatus: document.getElementById('progress-status'),
  progressPercent: document.getElementById('progress-percent'),
  progressBarContainer: document.getElementById('progress-bar-container'),
  progressFill: document.getElementById('progress-fill'),
  cancelBtn: document.getElementById('cancel-btn'),
  resultPanel: document.getElementById('result-panel'),
  resultTitle: document.getElementById('result-title'),
  resultSummary: document.getElementById('result-summary'),
  redownloadBtn: document.getElementById('redownload-btn'),
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function showAlert(message) {
  el.alertMessage.textContent = message;
  el.alertBanner.hidden = false;
}

function hideAlert() {
  el.alertBanner.hidden = true;
  el.alertMessage.textContent = '';
}

function revokeLastZipUrl() {
  if (state.lastZipUrl) {
    URL.revokeObjectURL(state.lastZipUrl);
    state.lastZipUrl = null;
  }
}

function updateProgress(percent, statusText) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  el.progressStatus.textContent = statusText;
  el.progressPercent.textContent = `${clamped}%`;
  el.progressFill.style.width = `${clamped}%`;
  el.progressBarContainer.setAttribute('aria-valuenow', String(clamped));
}

function setConvertingUi(converting) {
  state.isConverting = converting;
  el.convertBtn.disabled = converting;
  el.compressBtn.disabled = converting;
  el.changeFileBtn.disabled = converting;
  el.formatSelect.disabled = converting;
  el.scaleSelect.disabled = converting;
  el.qualitySlider.disabled = converting;
  el.targetSizeInput.disabled = converting;
  el.targetSizeUnit.disabled = converting;
  el.presetBtns.forEach((b) => {
    b.disabled = converting;
  });
  el.modeTabs.forEach((t) => {
    t.disabled = converting;
  });
  el.pageRangeRadios.forEach((r) => {
    r.disabled = converting;
  });
  const isCustom = document.querySelector('input[name="page-range-mode"]:checked')?.value === 'custom';
  el.pageRangeInput.disabled = converting || !isCustom;
  el.progressPanel.hidden = !converting;
}

function setTargetSizeFromBytes(bytes) {
  if (bytes >= 1024 * 1024) {
    el.targetSizeUnit.value = 'MB';
    el.targetSizeInput.value = (bytes / (1024 * 1024)).toFixed(2);
  } else {
    el.targetSizeUnit.value = 'KB';
    el.targetSizeInput.value = Math.max(20, Math.round(bytes / 1024));
  }
}

function switchMode(mode) {
  if (state.isConverting) return;
  state.activeMode = mode;
  el.modeTabs.forEach((tab) => {
    const isActive = tab.dataset.mode === mode;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
  el.convertSettings.hidden = mode !== 'convert';
  el.compressSettings.hidden = mode !== 'compress';
  el.resultPanel.hidden = true;
  hideAlert();
}

function initTheme() {
  const saved = localStorage.getItem('pdf-to-img-theme');
  if (saved === 'dark' || saved === 'light') {
    document.documentElement.setAttribute('data-theme', saved);
    el.themeIcon.textContent = saved === 'dark' ? '☀️' : '🌙';
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = current ? current === 'dark' : prefersDark;
  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('pdf-to-img-theme', next);
  el.themeIcon.textContent = next === 'dark' ? '☀️' : '🌙';
}

function detectFileType(file) {
  const name = file.name || '';
  if (file.type === 'application/pdf' || /\.pdf$/i.test(name)) {
    return 'pdf';
  }
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    /\.pptx$/i.test(name)
  ) {
    return 'pptx';
  }
  throw new Error('Unsupported file type. Please select a PDF or PPTX file.');
}

async function handleFileSelected(file) {
  if (!file || state.isConverting) return;
  hideAlert();
  revokeLastZipUrl();
  el.resultPanel.hidden = true;

  if (state.currentDoc) {
    await state.currentDoc.destroy();
    state.currentDoc = null;
    state.currentDocType = null;
  }

  try {
    const fileType = detectFileType(file);
    let doc;
    if (fileType === 'pdf') {
      await validatePdfFile(file);
      doc = await loadPdfDocument(file);
    } else {
      await validatePptxFile(file);
      doc = await loadPptxDocument(file);
    }

    state.currentFile = file;
    state.currentDoc = doc;
    state.currentDocType = fileType;

    const unit = fileType === 'pptx' ? 'slide' : 'page';
    el.fileName.textContent = file.name;
    el.fileSize.textContent = formatBytes(file.size);
    el.filePages.textContent = `${doc.numPages} ${doc.numPages === 1 ? unit : `${unit}s`}`;

    setTargetSizeFromBytes(Math.round(file.size * 0.5));
    el.compressBtn.textContent = `Compress & Download ${fileType.toUpperCase()}`;
    el.targetSizeHint.textContent = `Original size: ${formatBytes(file.size)}. Quality and resolution will be adjusted automatically to meet your target.`;

    el.dropZone.hidden = true;
    el.fileInfo.hidden = false;
    el.settingsPanel.hidden = false;
  } catch (err) {
    state.currentFile = null;
    state.currentDoc = null;
    state.currentDocType = null;
    showAlert(err.message || 'Unable to load file.');
  } finally {
    el.fileInput.value = '';
  }
}

async function handleConvert() {
  if (!state.currentDoc || !state.currentFile || state.isConverting) return;
  hideAlert();
  el.resultPanel.hidden = true;

  const totalPages = state.currentDoc.numPages;
  const unit = state.currentDocType === 'pptx' ? 'slide' : 'page';
  const mode = document.querySelector('input[name="page-range-mode"]:checked')?.value || 'all';

  let pages;
  try {
    pages =
      mode === 'all'
        ? Array.from({ length: totalPages }, (_, i) => i + 1)
        : parsePageRange(el.pageRangeInput.value, totalPages);
  } catch (err) {
    showAlert(err.message);
    return;
  }

  const mimeType = el.formatSelect.value;
  const ext = MIME_TO_EXT[mimeType] || 'png';
  const scale = Number(el.scaleSelect.value);
  const quality = mimeType === 'image/png' ? undefined : Number(el.qualitySlider.value);

  state.abortController = new AbortController();
  setConvertingUi(true);
  updateProgress(0, `Processing ${unit} 1 of ${pages.length}...`);

  try {
    const bundler = createZipBundler();
    const convertFn = state.currentDocType === 'pptx' ? convertPptxSlidesToBlobs : convertPagesToBlobs;

    await convertFn(
      state.currentDoc,
      { pages, scale, mimeType, quality, signal: state.abortController.signal },
      {
        onPageComplete(pageNum, blob, index, total) {
          const filename = formatPageFilename(pageNum, totalPages, ext, unit);
          bundler.addFile(filename, blob);
          const pct = (index / total) * 90;
          updateProgress(pct, `Processing ${unit} ${index} of ${total}...`);
        },
      }
    );

    updateProgress(92, 'Bundling ZIP archive...');
    const zipBlob = await bundler.generateZip((meta) => {
      updateProgress(92 + meta.percent * 0.08, 'Bundling ZIP archive...');
    });

    revokeLastZipUrl();
    state.lastZipUrl = URL.createObjectURL(zipBlob);
    state.lastZipFilename = buildZipFilename(state.currentFile.name);

    triggerDownload(state.lastZipUrl, state.lastZipFilename);

    el.resultTitle.textContent = 'Conversion Complete';
    el.resultSummary.textContent = `${pages.length} ${pages.length === 1 ? unit : `${unit}s`} converted (${formatBytes(zipBlob.size)})`;
    el.redownloadBtn.textContent = 'Download ZIP Again';
    el.resultPanel.hidden = false;
  } catch (err) {
    if (err?.name !== 'AbortError') {
      showAlert(err?.message || 'An unexpected error occurred during conversion.');
    }
  } finally {
    state.abortController = null;
    setConvertingUi(false);
  }
}

async function handleCompress() {
  if (!state.currentDoc || !state.currentFile || state.isConverting) return;
  hideAlert();
  el.resultPanel.hidden = true;

  const rawValue = Number(el.targetSizeInput.value);
  const unit = el.targetSizeUnit.value;
  if (!Number.isFinite(rawValue) || rawValue <= 0) {
    showAlert('Please enter a valid positive target file size.');
    return;
  }

  const multiplier = unit === 'MB' ? 1024 * 1024 : 1024;
  const targetBytes = Math.round(rawValue * multiplier);
  if (targetBytes < 20 * 1024) {
    showAlert('Target size must be at least 20 KB.');
    return;
  }

  state.abortController = new AbortController();
  setConvertingUi(true);
  updateProgress(0, 'Preparing compression...');

  try {
    const callbacks = {
      onProgress(percent, statusText) {
        updateProgress(percent, statusText);
      },
    };

    const result =
      state.currentDocType === 'pptx'
        ? await compressPptxToTargetSize(
            state.currentFile,
            { targetBytes, signal: state.abortController.signal },
            callbacks
          )
        : await compressPdfToTargetSize(
            state.currentDoc,
            { targetBytes, signal: state.abortController.signal },
            callbacks
          );

    revokeLastZipUrl();
    state.lastZipUrl = URL.createObjectURL(result.blob);
    state.lastZipFilename = buildCompressedFilename(state.currentFile.name);

    triggerDownload(state.lastZipUrl, state.lastZipFilename);

    const origSize = state.currentFile.size;
    const savedPct = origSize > 0 ? Math.round(((origSize - result.compressedSize) / origSize) * 100) : 0;
    const savedLabel = savedPct >= 0 ? `saved ${savedPct}%` : `${Math.abs(savedPct)}% larger`;
    const targetNote = result.targetMet
      ? ''
      : ` — closest achievable size for target ${formatBytes(targetBytes)}`;

    el.resultTitle.textContent = 'Compression Complete';
    el.resultSummary.textContent = `${formatBytes(origSize)} → ${formatBytes(result.compressedSize)} (${savedLabel})${targetNote}`;
    el.redownloadBtn.textContent = 'Download Compressed File Again';
    el.resultPanel.hidden = false;
  } catch (err) {
    if (err?.name !== 'AbortError') {
      showAlert(err?.message || 'An unexpected error occurred during compression.');
    }
  } finally {
    state.abortController = null;
    setConvertingUi(false);
  }
}

function bindEvents() {
  el.themeToggle.addEventListener('click', toggleTheme);
  el.alertDismiss.addEventListener('click', hideAlert);

  el.browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    el.fileInput.click();
  });

  el.dropZone.addEventListener('click', () => el.fileInput.click());
  el.dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      el.fileInput.click();
    }
  });

  ['dragenter', 'dragover'].forEach((evtName) => {
    el.dropZone.addEventListener(evtName, (e) => {
      e.preventDefault();
      el.dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach((evtName) => {
    el.dropZone.addEventListener(evtName, (e) => {
      e.preventDefault();
      el.dropZone.classList.remove('drag-over');
    });
  });

  el.dropZone.addEventListener('drop', (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileSelected(file);
  });

  el.fileInput.addEventListener('change', () => {
    const file = el.fileInput.files?.[0];
    if (file) handleFileSelected(file);
  });

  el.changeFileBtn.addEventListener('click', () => {
    if (!state.isConverting) el.fileInput.click();
  });

  el.formatSelect.addEventListener('change', () => {
    el.qualityGroup.hidden = el.formatSelect.value === 'image/png';
  });

  el.qualitySlider.addEventListener('input', () => {
    el.qualityValue.textContent = Number(el.qualitySlider.value).toFixed(2);
  });

  el.pageRangeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      const isCustom = radio.value === 'custom' && radio.checked;
      el.pageRangeInput.disabled = !isCustom;
      if (isCustom) el.pageRangeInput.focus();
    });
  });

  el.convertBtn.addEventListener('click', handleConvert);
  el.compressBtn.addEventListener('click', handleCompress);

  el.modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => switchMode(tab.dataset.mode));
  });

  el.presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!state.currentFile || state.isConverting) return;
      const ratio = Number(btn.dataset.ratio);
      setTargetSizeFromBytes(Math.round(state.currentFile.size * ratio));
    });
  });

  el.cancelBtn.addEventListener('click', () => {
    state.abortController?.abort();
  });

  el.redownloadBtn.addEventListener('click', () => {
    if (state.lastZipUrl && state.lastZipFilename) {
      triggerDownload(state.lastZipUrl, state.lastZipFilename);
    }
  });

  window.addEventListener('beforeunload', revokeLastZipUrl);
}

initTheme();
bindEvents();
