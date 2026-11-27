(function () {
  'use strict';
  const App = (window.PrintCropApp = window.PrintCropApp || {});

  App.PX_PER_MM = 96 / 25.4;

  const STORAGE_KEY = 'metricprint_custom_printers_v1';

  function loadCustomPrinters() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  App.state = {
    unit: 'mm', // 'mm' | 'cm'
    paper: {
      id: 'a4',
      name: 'ISO A4',
      orientation: 'portrait', // 'portrait' | 'landscape'
      widthMm: 210,
      heightMm: 297
    },
    viewport: {
      zoom: 1,
      panX: 0,
      panY: 0
    },
    images: [],
    nextImageId: 1,
    selectedImageId: null,
    cropMode: {
      active: false,
      imageId: null
    },
    printer: {
      profileId: 'epson-l3110',
      borderless: false,
      margins: { top: 3, bottom: 3, left: 3, right: 3 }
    },
    customPrinters: loadCustomPrinters()
  };

  App.saveCustomPrinter = function (profile) {
    const existingIdx = App.state.customPrinters.findIndex((p) => p.id === profile.id);
    if (existingIdx >= 0) {
      App.state.customPrinters[existingIdx] = profile;
    } else {
      App.state.customPrinters.push(profile);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(App.state.customPrinters));
    } catch {
      // Ignore storage quota errors
    }
  };

  App.getAllPrinters = function () {
    const builtIn = App.PRINTER_PROFILES;
    const customSaved = App.state.customPrinters;
    const customEntry = builtIn.find((p) => p.isCustom);
    const others = builtIn.filter((p) => !p.isCustom);
    return [...others, ...customSaved, customEntry].filter(Boolean);
  };

  App.mmToDisplay = function (mm, unit) {
    const u = unit || App.state.unit;
    const val = u === 'cm' ? mm / 10 : mm;
    return Number(val.toFixed(u === 'cm' ? 2 : 1));
  };

  App.displayToMm = function (val, unit) {
    const u = unit || App.state.unit;
    const num = parseFloat(val);
    if (!Number.isFinite(num)) return 0;
    return u === 'cm' ? num * 10 : num;
  };

  App.formatDim = function (mm, unit) {
    const u = unit || App.state.unit;
    return `${App.mmToDisplay(mm, u)} ${u}`;
  };
})();
