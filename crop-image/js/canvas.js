(function () {
  'use strict';
  const App = (window.PrintCropApp = window.PrintCropApp || {});

  const MIN_ZOOM = 0.15;
  const MAX_ZOOM = 5.0;

  let els = {};

  function cacheElements() {
    els = {
      viewport: document.getElementById('workspace-viewport'),
      transformLayer: document.getElementById('canvas-transform-layer'),
      paperSheet: document.getElementById('paper-sheet'),
      safeOverlay: document.getElementById('safe-margin-overlay'),
      guideTop: document.getElementById('paper-guide-top'),
      guideLeft: document.getElementById('paper-guide-left'),
      ticksTop: document.getElementById('ruler-top-ticks'),
      ticksLeft: document.getElementById('ruler-left-ticks'),
      widthBadge: document.getElementById('paper-width-badge'),
      heightBadge: document.getElementById('paper-height-badge'),
      zoomLabel: document.getElementById('zoom-label'),
      toolbarPaperLabel: document.getElementById('toolbar-paper-label')
    };
  }

  function renderRulerTicks(container, lengthMm, isHorizontal) {
    container.innerHTML = '';
    const stepMm = lengthMm > 500 ? 50 : 10;
    const majorEvery = stepMm * 5;
    for (let mm = 0; mm <= lengthMm; mm += stepMm) {
      const tick = document.createElement('div');
      tick.className = 'ruler-tick';
      const posPx = mm * App.PX_PER_MM;
      const isMajor = mm % majorEvery === 0;
      if (isHorizontal) {
        tick.style.left = `${posPx}px`;
        tick.style.height = isMajor ? '10px' : '5px';
      } else {
        tick.style.top = `${posPx}px`;
        tick.style.width = isMajor ? '10px' : '5px';
      }
      container.appendChild(tick);
    }
  }

  App.canvas = {
    init() {
      cacheElements();
      this.bindEvents();
      this.renderPaper();
    },

    bindEvents() {
      // Touchpad Pinch-to-Zoom (ctrlKey === true on wheel) & regular wheel pan
      els.viewport.addEventListener(
        'wheel',
        (e) => {
          if (e.ctrlKey) {
            e.preventDefault();
            const rect = els.viewport.getBoundingClientRect();
            const cursorX = e.clientX - rect.left;
            const cursorY = e.clientY - rect.top;
            const factor = Math.exp(-e.deltaY * 0.01);
            this.zoomAt(App.state.viewport.zoom * factor, cursorX, cursorY);
          } else {
            e.preventDefault();
            App.state.viewport.panX -= e.deltaX;
            App.state.viewport.panY -= e.deltaY;
            this.applyTransform();
          }
        },
        { passive: false }
      );

      // Middle-mouse or Space+drag pan
      let isPanning = false;
      let startX = 0;
      let startY = 0;
      let startPanX = 0;
      let startPanY = 0;

      els.viewport.addEventListener('pointerdown', (e) => {
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
          isPanning = true;
          startX = e.clientX;
          startY = e.clientY;
          startPanX = App.state.viewport.panX;
          startPanY = App.state.viewport.panY;
          els.viewport.setPointerCapture(e.pointerId);
        } else if (e.target === els.viewport || e.target === els.paperSheet || e.target === els.safeOverlay) {
          if (App.state.cropMode.active && App.cropMode) {
            App.cropMode.exit();
          }
          if (App.imageManager) {
            App.imageManager.selectImage(null);
          }
        }
      });

      els.viewport.addEventListener('pointermove', (e) => {
        if (!isPanning) return;
        App.state.viewport.panX = startPanX + (e.clientX - startX);
        App.state.viewport.panY = startPanY + (e.clientY - startY);
        this.applyTransform();
      });

      els.viewport.addEventListener('pointerup', () => {
        isPanning = false;
      });
    },

    renderPaper() {
      const { widthMm, heightMm, name } = App.state.paper;
      const wPx = widthMm * App.PX_PER_MM;
      const hPx = heightMm * App.PX_PER_MM;

      els.paperSheet.style.width = `${wPx}px`;
      els.paperSheet.style.height = `${hPx}px`;

      els.guideTop.style.width = `${wPx}px`;
      els.guideLeft.style.height = `${hPx}px`;

      els.widthBadge.textContent = App.formatDim(widthMm);
      els.heightBadge.textContent = App.formatDim(heightMm);

      const u = App.state.unit;
      els.toolbarPaperLabel.textContent = `${name} (${App.mmToDisplay(widthMm, u)} × ${App.mmToDisplay(heightMm, u)} ${u})`;

      renderRulerTicks(els.ticksTop, widthMm, true);
      renderRulerTicks(els.ticksLeft, heightMm, false);

      this.renderSafeMargins();
    },

    renderSafeMargins() {
      const m = App.state.printer.borderless
        ? { top: 0, bottom: 0, left: 0, right: 0 }
        : App.state.printer.margins;

      els.safeOverlay.style.top = `${m.top * App.PX_PER_MM}px`;
      els.safeOverlay.style.bottom = `${m.bottom * App.PX_PER_MM}px`;
      els.safeOverlay.style.left = `${m.left * App.PX_PER_MM}px`;
      els.safeOverlay.style.right = `${m.right * App.PX_PER_MM}px`;
    },

    applyTransform() {
      const { panX, panY, zoom } = App.state.viewport;
      els.transformLayer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
      els.zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
    },

    zoomAt(newZoom, pivotX, pivotY) {
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
      const oldZoom = App.state.viewport.zoom;
      const ratio = clamped / oldZoom;

      App.state.viewport.panX = pivotX - (pivotX - App.state.viewport.panX) * ratio;
      App.state.viewport.panY = pivotY - (pivotY - App.state.viewport.panY) * ratio;
      App.state.viewport.zoom = clamped;
      this.applyTransform();
    },

    fitToScreen() {
      const rect = els.viewport.getBoundingClientRect();
      const pad = 70;
      const wPx = App.state.paper.widthMm * App.PX_PER_MM;
      const hPx = App.state.paper.heightMm * App.PX_PER_MM;
      const scaleX = (rect.width - pad * 2) / wPx;
      const scaleY = (rect.height - pad * 2) / hPx;
      const zoom = Math.min(1.5, Math.max(MIN_ZOOM, Math.min(scaleX, scaleY)));

      App.state.viewport.zoom = zoom;
      App.state.viewport.panX = (rect.width - wPx * zoom) / 2;
      App.state.viewport.panY = (rect.height - hPx * zoom) / 2 + 10;
      this.applyTransform();
    }
  };
})();
