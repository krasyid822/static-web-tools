(function () {
  'use strict';
  const App = (window.PrintCropApp = window.PrintCropApp || {});

  let modalEl, previewEl, paperInfoEl, activeTab = 'visual';
  let visT, visB, visL, visR;
  let rulT, rulB, rulL, rulR;
  let photoInput, detectCanvas, detectStatus, profileNameInput;

  function buildCalibrationSvg(widthMm, heightMm) {
    const colors = ['#0f172a', '#2563eb', '#dc2626', '#059669', '#d97706'];
    let lines = '';
    for (let mm = 1; mm <= 15; mm++) {
      const c = colors[(mm - 1) % colors.length];
      const sw = mm % 5 === 0 ? 0.35 : 0.18;
      // Top, Bottom, Left, Right stepped lines
      lines += `<line x1="${mm}" y1="${mm}" x2="${widthMm - mm}" y2="${mm}" stroke="${c}" stroke-width="${sw}" />`;
      lines += `<line x1="${mm}" y1="${heightMm - mm}" x2="${widthMm - mm}" y2="${heightMm - mm}" stroke="${c}" stroke-width="${sw}" />`;
      lines += `<line x1="${mm}" y1="${mm}" x2="${mm}" y2="${heightMm - mm}" stroke="${c}" stroke-width="${sw}" />`;
      lines += `<line x1="${widthMm - mm}" y1="${mm}" x2="${widthMm - mm}" y2="${heightMm - mm}" stroke="${c}" stroke-width="${sw}" />`;
      if (mm % 2 === 1 || mm <= 5) {
        lines += `<text x="${widthMm / 2}" y="${mm + 2.2}" font-size="2.2" fill="${c}" text-anchor="middle">${mm}</text>`;
        lines += `<text x="${widthMm / 2}" y="${heightMm - mm - 0.6}" font-size="2.2" fill="${c}" text-anchor="middle">${mm}</text>`;
        lines += `<text x="${mm + 0.8}" y="${heightMm / 2}" font-size="2.2" fill="${c}">${mm}</text>`;
        lines += `<text x="${widthMm - mm - 2.6}" y="${heightMm / 2}" font-size="2.2" fill="${c}">${mm}</text>`;
      }
    }

    // Center crosshair
    const cx = widthMm / 2;
    const cy = heightMm / 2;
    lines += `<line x1="${cx - 10}" y1="${cy}" x2="${cx + 10}" y2="${cy}" stroke="#0f172a" stroke-width="0.3" />`;
    lines += `<line x1="${cx}" y1="${cy - 10}" x2="${cx}" y2="${cy + 10}" stroke="#0f172a" stroke-width="0.3" />`;
    lines += `<text x="${cx}" y="${cy - 14}" font-size="4" fill="#0f172a" text-anchor="middle" font-weight="bold">BOUNDARY CALIBRATION (${widthMm} x ${heightMm} mm)</text>`;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${widthMm} ${heightMm}" style="width:100%;height:100%;display:block;">${lines}</svg>`;
  }

  function detectEdgesFromPhoto(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 400;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        detectCanvas.width = w;
        detectCanvas.height = h;
        detectCanvas.classList.remove('hidden');

        const ctx = detectCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;

        let minX = w, maxX = 0, minY = h, maxY = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            if (lum < 140) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (maxX > minX && maxY > minY) {
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 2;
          ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

          const { widthMm, heightMm } = App.state.paper;
          const u = App.state.unit;
          rulT.value = App.mmToDisplay((minY / h) * heightMm, u);
          rulB.value = App.mmToDisplay(((h - maxY) / h) * heightMm, u);
          rulL.value = App.mmToDisplay((minX / w) * widthMm, u);
          rulR.value = App.mmToDisplay(((w - maxX) / w) * widthMm, u);
          detectStatus.textContent = 'Detected printed boundary. Review values below.';
        } else {
          detectStatus.textContent = 'Could not detect dark boundary lines. Please enter ruler values manually.';
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  App.calibration = {
    init() {
      modalEl = document.getElementById('calibration-modal');
      previewEl = document.getElementById('cal-pattern-preview');
      paperInfoEl = document.getElementById('cal-paper-info');

      visT = document.getElementById('cal-vis-top');
      visB = document.getElementById('cal-vis-bottom');
      visL = document.getElementById('cal-vis-left');
      visR = document.getElementById('cal-vis-right');

      rulT = document.getElementById('cal-rul-top');
      rulB = document.getElementById('cal-rul-bottom');
      rulL = document.getElementById('cal-rul-left');
      rulR = document.getElementById('cal-rul-right');

      photoInput = document.getElementById('cal-photo-input');
      detectCanvas = document.getElementById('cal-detect-canvas');
      detectStatus = document.getElementById('cal-detect-status');
      profileNameInput = document.getElementById('cal-profile-name');

      modalEl.querySelectorAll('.cal-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
          activeTab = tab.dataset.tab;
          modalEl.querySelectorAll('.cal-tab').forEach((t) => t.classList.toggle('active', t === tab));
          document.getElementById('cal-tab-visual').classList.toggle('hidden', activeTab !== 'visual');
          document.getElementById('cal-tab-ruler-camera').classList.toggle('hidden', activeTab !== 'ruler-camera');
        });
      });

      photoInput.addEventListener('change', (e) => {
        if (e.target.files[0]) detectEdgesFromPhoto(e.target.files[0]);
      });

      document.getElementById('btn-print-calibration').addEventListener('click', () => {
        const { widthMm, heightMm } = App.state.paper;
        App.printEngine.printCustomStage(buildCalibrationSvg(widthMm, heightMm));
      });

      document.getElementById('btn-apply-calibration').addEventListener('click', () => {
        let margins;
        if (activeTab === 'visual') {
          margins = {
            top: Math.max(0, parseFloat(visT.value) || 0),
            bottom: Math.max(0, parseFloat(visB.value) || 0),
            left: Math.max(0, parseFloat(visL.value) || 0),
            right: Math.max(0, parseFloat(visR.value) || 0)
          };
        } else {
          const u = App.state.unit;
          margins = {
            top: Math.max(0, App.displayToMm(rulT.value, u)),
            bottom: Math.max(0, App.displayToMm(rulB.value, u)),
            left: Math.max(0, App.displayToMm(rulL.value, u)),
            right: Math.max(0, App.displayToMm(rulR.value, u))
          };
        }

        const name = (profileNameInput.value || '').trim() || `Calibrated Printer (${App.state.customPrinters.length + 1})`;
        const profile = {
          id: `cal-${Date.now()}`,
          name,
          brand: 'Calibrated',
          margins,
          supportsBorderless: false
        };
        App.saveCustomPrinter(profile);
        App.state.printer.profileId = profile.id;
        App.state.printer.borderless = false;
        App.state.printer.margins = { ...margins };
        App.canvas.renderSafeMargins();
        modalEl.classList.add('hidden');
      });
    },

    openModal() {
      const { widthMm, heightMm } = App.state.paper;
      paperInfoEl.textContent = `${App.formatDim(widthMm)} × ${App.formatDim(heightMm)}`;
      previewEl.innerHTML = buildCalibrationSvg(widthMm, heightMm);
      modalEl.classList.remove('hidden');
    }
  };
})();
