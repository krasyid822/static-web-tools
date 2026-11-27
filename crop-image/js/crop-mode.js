(function () {
  'use strict';
  const App = (window.PrintCropApp = window.PrintCropApp || {});

  let panelEl, aspectEl, widthInput, heightInput, zoomSlider, zoomValEl;

  function getActiveImage() {
    if (!App.state.cropMode.active) return null;
    return App.imageManager.getById(App.state.cropMode.imageId);
  }

  function syncPanelFromImage(imgObj) {
    const u = App.state.unit;
    aspectEl.value = imgObj.crop.aspectRatio || 'free';
    widthInput.value = App.mmToDisplay(imgObj.widthMm, u);
    heightInput.value = App.mmToDisplay(imgObj.heightMm, u);

    const pct = Math.round((imgObj.crop.imgScale / (imgObj.widthMm / imgObj.naturalWidthMm)) * 100);
    zoomSlider.value = Math.min(400, Math.max(20, pct));
    zoomValEl.textContent = `${zoomSlider.value}%`;
  }

  App.cropMode = {
    init() {
      panelEl = document.getElementById('crop-mode-panel');
      aspectEl = document.getElementById('crop-aspect-select');
      widthInput = document.getElementById('crop-width-input');
      heightInput = document.getElementById('crop-height-input');
      zoomSlider = document.getElementById('crop-zoom-slider');
      zoomValEl = document.getElementById('crop-zoom-val');

      aspectEl.addEventListener('change', () => {
        const imgObj = getActiveImage();
        if (!imgObj) return;
        const key = aspectEl.value;
        imgObj.crop.aspectRatio = key;
        const ratio = App.ASPECT_RATIOS[key];
        if (ratio) {
          imgObj.heightMm = Number((imgObj.widthMm / ratio).toFixed(2));
          imgObj.crop.baseWidthMm = imgObj.widthMm;
          imgObj.crop.baseHeightMm = imgObj.heightMm;
          syncPanelFromImage(imgObj);
          App.imageManager.renderAll();
        }
      });

      const onDimChange = (changedAxis) => {
        const imgObj = getActiveImage();
        if (!imgObj) return;
        const u = App.state.unit;
        let wMm = App.displayToMm(widthInput.value, u);
        let hMm = App.displayToMm(heightInput.value, u);
        if (wMm < 1 || hMm < 1) return;

        const ratio = App.ASPECT_RATIOS[imgObj.crop.aspectRatio];
        if (ratio) {
          if (changedAxis === 'w') hMm = wMm / ratio;
          else wMm = hMm * ratio;
        }
        imgObj.widthMm = wMm;
        imgObj.heightMm = hMm;
        imgObj.crop.baseWidthMm = wMm;
        imgObj.crop.baseHeightMm = hMm;
        syncPanelFromImage(imgObj);
        App.imageManager.renderAll();
      };

      widthInput.addEventListener('change', () => onDimChange('w'));
      heightInput.addEventListener('change', () => onDimChange('h'));

      zoomSlider.addEventListener('input', () => {
        const imgObj = getActiveImage();
        if (!imgObj) return;
        const baseScale = imgObj.widthMm / imgObj.naturalWidthMm;
        imgObj.crop.imgScale = baseScale * (parseFloat(zoomSlider.value) / 100);
        zoomValEl.textContent = `${zoomSlider.value}%`;
        App.imageManager.renderAll();
      });

      panelEl.querySelectorAll('.expand-btn').forEach((btn) => {
        btn.addEventListener('click', () => this.expand(btn.dataset.dir));
      });

      document.getElementById('btn-crop-done').addEventListener('click', () => this.exit());
    },

    enter(imageId) {
      const imgObj = App.imageManager.getById(imageId);
      if (!imgObj) return;
      App.state.cropMode.active = true;
      App.state.cropMode.imageId = imageId;
      App.state.selectedImageId = imageId;
      imgObj.crop.baseWidthMm = imgObj.widthMm;
      imgObj.crop.baseHeightMm = imgObj.heightMm;
      panelEl.classList.remove('hidden');
      syncPanelFromImage(imgObj);
      App.imageManager.renderAll();
    },

    exit() {
      if (!App.state.cropMode.active) return;
      App.state.cropMode.active = false;
      App.state.cropMode.imageId = null;
      panelEl.classList.add('hidden');
      App.imageManager.renderAll();
    },

    scaleImage(factor) {
      const imgObj = getActiveImage();
      if (!imgObj) return;
      imgObj.crop.imgScale = Math.max(0.05, imgObj.crop.imgScale * factor);
      syncPanelFromImage(imgObj);
      App.imageManager.renderAll();
    },

    expand(dir) {
      const imgObj = getActiveImage();
      if (!imgObj) return;
      const bw = imgObj.crop.baseWidthMm || imgObj.widthMm;
      const bh = imgObj.crop.baseHeightMm || imgObj.heightMm;

      if (dir === 'right') {
        imgObj.widthMm += bw;
      } else if (dir === 'left') {
        imgObj.xMm -= bw;
        imgObj.widthMm += bw;
        imgObj.crop.imgOffsetXMm += bw;
      } else if (dir === 'bottom') {
        imgObj.heightMm += bh;
      } else if (dir === 'top') {
        imgObj.yMm -= bh;
        imgObj.heightMm += bh;
        imgObj.crop.imgOffsetYMm += bh;
      }

      imgObj.crop.aspectRatio = 'free';
      syncPanelFromImage(imgObj);
      App.imageManager.renderAll();
    }
  };
})();
