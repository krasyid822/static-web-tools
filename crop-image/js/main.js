(function () {
  'use strict';
  const App = (window.PrintCropApp = window.PrintCropApp || {});

  let paperDropdown = null;
  let selectedPaperPreset = App.PAPER_SIZES.find((p) => p.id === 'a4');

  function updateUnitLabels() {
    const u = App.state.unit;
    document.querySelectorAll('.unit-text').forEach((el) => {
      el.textContent = u;
    });
    document.querySelectorAll('.unit-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.unit === u);
    });
    document.querySelectorAll('#startup-unit-toggle .seg-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.unit === u);
    });
    if (paperDropdown) {
      paperDropdown.setItems(App.PAPER_SIZES, selectedPaperPreset.id);
    }
    App.canvas.renderPaper();
    App.imageManager.renderAll();
  }

  function applyStartupPaper() {
    const customW = document.getElementById('custom-paper-width');
    const customH = document.getElementById('custom-paper-height');
    const u = App.state.unit;

    let wMm, hMm;
    if (selectedPaperPreset.isCustom) {
      wMm = Math.max(10, App.displayToMm(customW.value, u));
      hMm = Math.max(10, App.displayToMm(customH.value, u));
    } else {
      wMm = selectedPaperPreset.widthMm;
      hMm = selectedPaperPreset.heightMm;
      if (App.state.paper.orientation === 'landscape' && wMm < hMm) {
        [wMm, hMm] = [hMm, wMm];
      } else if (App.state.paper.orientation === 'portrait' && wMm > hMm) {
        [wMm, hMm] = [hMm, wMm];
      }
    }

    App.state.paper.id = selectedPaperPreset.id;
    App.state.paper.name = selectedPaperPreset.name;
    App.state.paper.widthMm = wMm;
    App.state.paper.heightMm = hMm;

    App.canvas.renderPaper();
    App.canvas.fitToScreen();
    document.getElementById('startup-modal').classList.add('hidden');
  }

  function initStartupModal() {
    const customFields = document.getElementById('custom-paper-fields');
    const customW = document.getElementById('custom-paper-width');
    const customH = document.getElementById('custom-paper-height');

    paperDropdown = new App.SearchableDropdown(document.getElementById('paper-dropdown-container'), {
      items: App.PAPER_SIZES,
      selectedId: selectedPaperPreset.id,
      placeholder: 'Search paper size (e.g. A4, Letter, 210)…',
      getMeta: (p) => {
        if (p.isCustom) return 'Manual';
        const u = App.state.unit;
        return `${App.mmToDisplay(p.widthMm, u)} × ${App.mmToDisplay(p.heightMm, u)} ${u}`;
      },
      onChange: (preset) => {
        selectedPaperPreset = preset;
        customFields.classList.toggle('hidden', !preset.isCustom);
        if (preset.isCustom) {
          const u = App.state.unit;
          customW.value = App.mmToDisplay(App.state.paper.widthMm, u);
          customH.value = App.mmToDisplay(App.state.paper.heightMm, u);
        }
      }
    });

    document.querySelectorAll('#startup-unit-toggle .seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        App.state.unit = btn.dataset.unit;
        updateUnitLabels();
      });
    });

    document.querySelectorAll('#startup-orientation-toggle .seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        App.state.paper.orientation = btn.dataset.orient;
        document.querySelectorAll('#startup-orientation-toggle .seg-btn').forEach((b) => {
          b.classList.toggle('active', b === btn);
        });
      });
    });

    document.getElementById('btn-start-workspace').addEventListener('click', applyStartupPaper);
  }

  function initToolbarAndShortcuts() {
    document.getElementById('btn-paper-setup').addEventListener('click', () => {
      document.getElementById('startup-modal').classList.remove('hidden');
    });

    document.querySelectorAll('.unit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        App.state.unit = btn.dataset.unit;
        updateUnitLabels();
      });
    });

    const fileInput = document.getElementById('file-image-input');
    document.getElementById('btn-add-image').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      Array.from(e.target.files).forEach((f) => App.imageManager.addFromFile(f));
      fileInput.value = '';
    });

    const viewport = document.getElementById('workspace-viewport');
    viewport.addEventListener('dragover', (e) => e.preventDefault());
    viewport.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files) {
        Array.from(e.dataTransfer.files).forEach((f) => App.imageManager.addFromFile(f));
      }
    });

    document.addEventListener('paste', (e) => {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          App.imageManager.addFromFile(item.getAsFile());
        }
      }
    });

    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      const r = viewport.getBoundingClientRect();
      App.canvas.zoomAt(App.state.viewport.zoom * 1.2, r.width / 2, r.height / 2);
    });

    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      const r = viewport.getBoundingClientRect();
      App.canvas.zoomAt(App.state.viewport.zoom / 1.2, r.width / 2, r.height / 2);
    });

    document.getElementById('btn-zoom-fit').addEventListener('click', () => App.canvas.fitToScreen());
    document.getElementById('btn-open-print').addEventListener('click', () => App.printEngine.openModal());
    document.getElementById('btn-open-calibration').addEventListener('click', () => App.calibration.openModal());

    document.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.getElementById(btn.dataset.close).classList.add('hidden');
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && App.state.cropMode.active) {
        App.cropMode.exit();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        App.printEngine.openModal();
      } else if (e.key === 'Delete' && App.state.selectedImageId && !App.state.cropMode.active) {
        if (document.activeElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        App.imageManager.handleContextAction('delete', App.state.selectedImageId);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    App.canvas.init();
    App.imageManager.init();
    App.cropMode.init();
    App.printEngine.init();
    App.calibration.init();
    initStartupModal();
    initToolbarAndShortcuts();
    App.canvas.fitToScreen();
  });
})();
