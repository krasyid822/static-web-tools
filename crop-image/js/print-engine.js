(function () {
  'use strict';
  const App = (window.PrintCropApp = window.PrintCropApp || {});

  let modalEl, dropdown, borderlessRow, borderlessChk, saveRow;
  let mTop, mBottom, mLeft, mRight, customNameInput;
  let pageStyleEl = null;

  function ensurePageStyle(widthMm, heightMm) {
    if (!pageStyleEl) {
      pageStyleEl = document.createElement('style');
      pageStyleEl.id = 'dynamic-print-page-style';
      document.head.appendChild(pageStyleEl);
    }
    pageStyleEl.textContent = `@media print { @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; } }`;
  }

  function syncMarginInputs() {
    const u = App.state.unit;
    const m = App.state.printer.borderless
      ? { top: 0, bottom: 0, left: 0, right: 0 }
      : App.state.printer.margins;

    mTop.value = App.mmToDisplay(m.top, u);
    mBottom.value = App.mmToDisplay(m.bottom, u);
    mLeft.value = App.mmToDisplay(m.left, u);
    mRight.value = App.mmToDisplay(m.right, u);

    const disabled = App.state.printer.borderless;
    [mTop, mBottom, mLeft, mRight].forEach((inp) => {
      inp.disabled = disabled;
    });
  }

  function applyProfile(profile) {
    App.state.printer.profileId = profile.id;
    App.state.printer.margins = { ...profile.margins };

    // Conditional Borderless Checkbox: only show when supported or in custom mode
    const canBorderless = Boolean(profile.supportsBorderless || profile.isCustom);
    borderlessRow.classList.toggle('hidden', !canBorderless);
    if (!canBorderless) {
      App.state.printer.borderless = false;
      borderlessChk.checked = false;
    }

    saveRow.classList.toggle('hidden', !profile.isCustom);
    syncMarginInputs();
    App.canvas.renderSafeMargins();
  }

  App.printEngine = {
    init() {
      modalEl = document.getElementById('print-modal');
      borderlessRow = document.getElementById('borderless-row');
      borderlessChk = document.getElementById('chk-borderless');
      saveRow = document.getElementById('save-printer-row');
      mTop = document.getElementById('margin-top-input');
      mBottom = document.getElementById('margin-bottom-input');
      mLeft = document.getElementById('margin-left-input');
      mRight = document.getElementById('margin-right-input');
      customNameInput = document.getElementById('custom-printer-name');

      dropdown = new App.SearchableDropdown(document.getElementById('printer-dropdown-container'), {
        items: App.getAllPrinters(),
        selectedId: App.state.printer.profileId,
        placeholder: 'Search printer model or brand…',
        getMeta: (p) => `${p.margins.top}/${p.margins.bottom}/${p.margins.left}/${p.margins.right} mm`,
        onChange: (p) => applyProfile(p)
      });

      borderlessChk.addEventListener('change', () => {
        App.state.printer.borderless = borderlessChk.checked;
        syncMarginInputs();
        App.canvas.renderSafeMargins();
      });

      const onManualMargin = () => {
        const u = App.state.unit;
        App.state.printer.margins = {
          top: Math.max(0, App.displayToMm(mTop.value, u)),
          bottom: Math.max(0, App.displayToMm(mBottom.value, u)),
          left: Math.max(0, App.displayToMm(mLeft.value, u)),
          right: Math.max(0, App.displayToMm(mRight.value, u))
        };
        App.canvas.renderSafeMargins();
      };

      [mTop, mBottom, mLeft, mRight].forEach((inp) => inp.addEventListener('change', onManualMargin));

      document.getElementById('btn-save-printer-profile').addEventListener('click', () => {
        const name = (customNameInput.value || '').trim() || `Custom Printer (${App.state.customPrinters.length + 1})`;
        const profile = {
          id: `custom-${Date.now()}`,
          name,
          brand: 'Custom',
          margins: { ...App.state.printer.margins },
          supportsBorderless: true
        };
        App.saveCustomPrinter(profile);
        App.state.printer.profileId = profile.id;
        this.refreshDropdown();
        customNameInput.value = '';
      });

      document.getElementById('btn-print-to-calibration').addEventListener('click', () => {
        this.closeModal();
        App.calibration.openModal();
      });

      document.getElementById('btn-execute-print').addEventListener('click', () => {
        this.closeModal();
        this.printLayout();
      });

      applyProfile(dropdown.getSelectedItem());
    },

    refreshDropdown() {
      dropdown.setItems(App.getAllPrinters(), App.state.printer.profileId);
    },

    openModal() {
      this.refreshDropdown();
      syncMarginInputs();
      modalEl.classList.remove('hidden');
    },

    closeModal() {
      modalEl.classList.add('hidden');
    },

    printLayout() {
      if (App.state.cropMode.active) App.cropMode.exit();

      const { widthMm, heightMm } = App.state.paper;
      ensurePageStyle(widthMm, heightMm);

      const stage = document.getElementById('print-stage');
      stage.innerHTML = '';
      stage.style.width = `${widthMm}mm`;
      stage.style.height = `${heightMm}mm`;

      App.state.images.forEach((imgObj) => {
        const clip = document.createElement('div');
        clip.className = 'print-image-clip';
        clip.style.left = `${imgObj.xMm}mm`;
        clip.style.top = `${imgObj.yMm}mm`;
        clip.style.width = `${imgObj.widthMm}mm`;
        clip.style.height = `${imgObj.heightMm}mm`;

        const img = document.createElement('img');
        img.src = imgObj.src;
        const c = imgObj.crop;
        img.style.width = `${imgObj.naturalWidthMm * c.imgScale}mm`;
        img.style.height = `${imgObj.naturalHeightMm * c.imgScale}mm`;
        img.style.transform = `translate(${c.imgOffsetXMm}mm, ${c.imgOffsetYMm}mm)`;

        clip.appendChild(img);
        stage.appendChild(clip);
      });

      window.print();
    },

    printCustomStage(htmlContent) {
      const { widthMm, heightMm } = App.state.paper;
      ensurePageStyle(widthMm, heightMm);
      const stage = document.getElementById('print-stage');
      stage.innerHTML = htmlContent;
      stage.style.width = `${widthMm}mm`;
      stage.style.height = `${heightMm}mm`;
      window.print();
    }
  };
})();
