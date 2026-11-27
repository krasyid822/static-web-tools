(function () {
  'use strict';
  const App = (window.PrintCropApp = window.PrintCropApp || {});

  let layerEl = null;
  let hintEl = null;
  let contextMenuEl = null;
  let contextTargetId = null;

  function renderImageElement(imgObj) {
    let box = layerEl.querySelector(`.canvas-image-box[data-id="${imgObj.id}"]`);
    if (!box) {
      box = document.createElement('div');
      box.className = 'canvas-image-box';
      box.dataset.id = imgObj.id;

      const clip = document.createElement('div');
      clip.className = 'canvas-image-clip';
      const img = document.createElement('img');
      img.src = imgObj.src;
      img.alt = imgObj.name || 'Placed image';
      clip.appendChild(img);

      const wGuide = document.createElement('span');
      wGuide.className = 'img-dim-guide img-dim-width';
      const hGuide = document.createElement('span');
      hGuide.className = 'img-dim-guide img-dim-height';

      box.appendChild(clip);
      box.appendChild(wGuide);
      box.appendChild(hGuide);
      layerEl.appendChild(box);
      attachBoxEvents(box, imgObj.id);
    }

    const isSelected = App.state.selectedImageId === imgObj.id;
    const isCropping = App.state.cropMode.active && App.state.cropMode.imageId === imgObj.id;
    box.classList.toggle('selected', isSelected && !isCropping);
    box.classList.toggle('cropping', isCropping);

    box.style.left = `${imgObj.xMm * App.PX_PER_MM}px`;
    box.style.top = `${imgObj.yMm * App.PX_PER_MM}px`;
    box.style.width = `${imgObj.widthMm * App.PX_PER_MM}px`;
    box.style.height = `${imgObj.heightMm * App.PX_PER_MM}px`;

    const imgEl = box.querySelector('img');
    const c = imgObj.crop;
    const renderW = imgObj.naturalWidthMm * c.imgScale * App.PX_PER_MM;
    const renderH = imgObj.naturalHeightMm * c.imgScale * App.PX_PER_MM;
    imgEl.style.width = `${renderW}px`;
    imgEl.style.height = `${renderH}px`;
    imgEl.style.transform = `translate(${c.imgOffsetXMm * App.PX_PER_MM}px, ${c.imgOffsetYMm * App.PX_PER_MM}px)`;

    box.querySelector('.img-dim-width').textContent = App.formatDim(imgObj.widthMm);
    box.querySelector('.img-dim-height').textContent = App.formatDim(imgObj.heightMm);
  }

  function attachBoxEvents(box, id) {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let origXMm = 0;
    let origYMm = 0;
    let origOffXMm = 0;
    let origOffYMm = 0;

    box.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      hideContextMenu();

      const imgObj = App.imageManager.getById(id);
      if (!imgObj) return;

      const isCroppingThis = App.state.cropMode.active && App.state.cropMode.imageId === id;
      if (App.state.cropMode.active && !isCroppingThis) {
        App.cropMode.exit();
      }

      App.imageManager.selectImage(id);
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      origXMm = imgObj.xMm;
      origYMm = imgObj.yMm;
      origOffXMm = imgObj.crop.imgOffsetXMm;
      origOffYMm = imgObj.crop.imgOffsetYMm;
      box.setPointerCapture(e.pointerId);
    });

    box.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const imgObj = App.imageManager.getById(id);
      if (!imgObj) return;

      const scale = App.PX_PER_MM * App.state.viewport.zoom;
      const dxMm = (e.clientX - startX) / scale;
      const dyMm = (e.clientY - startY) / scale;

      if (App.state.cropMode.active && App.state.cropMode.imageId === id) {
        // Inverse manipulation: pan underlying image inside locked crop frame
        imgObj.crop.imgOffsetXMm = origOffXMm + dxMm;
        imgObj.crop.imgOffsetYMm = origOffYMm + dyMm;
      } else {
        imgObj.xMm = origXMm + dxMm;
        imgObj.yMm = origYMm + dyMm;
      }
      renderImageElement(imgObj);
    });

    box.addEventListener('pointerup', () => {
      dragging = false;
    });

    box.addEventListener('wheel', (e) => {
      if (App.state.cropMode.active && App.state.cropMode.imageId === id && !e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        const factor = e.deltaY < 0 ? 1.06 : 0.94;
        App.cropMode.scaleImage(factor);
      }
    }, { passive: false });

    box.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      App.imageManager.selectImage(id);
      showContextMenu(e.clientX, e.clientY, id);
    });
  }

  function showContextMenu(x, y, id) {
    contextTargetId = id;
    contextMenuEl.classList.remove('hidden');
    const rect = contextMenuEl.getBoundingClientRect();
    const left = Math.min(x, window.innerWidth - rect.width - 8);
    const top = Math.min(y, window.innerHeight - rect.height - 8);
    contextMenuEl.style.left = `${Math.max(4, left)}px`;
    contextMenuEl.style.top = `${Math.max(4, top)}px`;
  }

  function hideContextMenu() {
    contextMenuEl.classList.add('hidden');
    contextTargetId = null;
  }

  App.imageManager = {
    init() {
      layerEl = document.getElementById('images-layer');
      hintEl = document.getElementById('empty-canvas-hint');
      contextMenuEl = document.getElementById('image-context-menu');

      document.addEventListener('click', () => hideContextMenu());

      contextMenuEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.context-item');
        if (!btn || !contextTargetId) return;
        const action = btn.dataset.action;
        const id = contextTargetId;
        hideContextMenu();
        this.handleContextAction(action, id);
      });
    },

    getById(id) {
      return App.state.images.find((i) => i.id === id) || null;
    },

    selectImage(id) {
      App.state.selectedImageId = id;
      this.renderAll();
    },

    addFromFile(file) {
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const natWMm = img.naturalWidth / App.PX_PER_MM;
          const natHMm = img.naturalHeight / App.PX_PER_MM;
          const maxW = Math.min(App.state.paper.widthMm * 0.6, 100);
          const scale = maxW / natWMm;
          const wMm = Number((natWMm * scale).toFixed(1));
          const hMm = Number((natHMm * scale).toFixed(1));

          const imgObj = {
            id: App.state.nextImageId++,
            name: file.name || 'Image',
            src: ev.target.result,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            naturalWidthMm: natWMm,
            naturalHeightMm: natHMm,
            xMm: Math.max(5, (App.state.paper.widthMm - wMm) / 2),
            yMm: Math.max(5, (App.state.paper.heightMm - hMm) / 2),
            widthMm: wMm,
            heightMm: hMm,
            crop: {
              imgOffsetXMm: 0,
              imgOffsetYMm: 0,
              imgScale: scale,
              baseWidthMm: wMm,
              baseHeightMm: hMm,
              aspectRatio: 'free'
            }
          };

          App.state.images.push(imgObj);
          App.state.selectedImageId = imgObj.id;
          this.renderAll();
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    },

    renderAll() {
      hintEl.classList.toggle('hidden', App.state.images.length > 0);
      const validIds = new Set(App.state.images.map((i) => String(i.id)));
      Array.from(layerEl.children).forEach((child) => {
        if (!validIds.has(child.dataset.id)) child.remove();
      });
      App.state.images.forEach((imgObj) => renderImageElement(imgObj));
    },

    handleContextAction(action, id) {
      const idx = App.state.images.findIndex((i) => i.id === id);
      if (idx < 0) return;
      const imgObj = App.state.images[idx];

      if (action === 'crop') {
        App.cropMode.enter(id);
      } else if (action === 'resize') {
        const u = App.state.unit;
        const curW = App.mmToDisplay(imgObj.widthMm, u);
        const input = window.prompt(`Enter new physical width in ${u}:`, curW);
        if (input !== null) {
          const newWMm = App.displayToMm(input, u);
          if (newWMm > 1) {
            const ratio = newWMm / imgObj.widthMm;
            imgObj.widthMm = newWMm;
            imgObj.heightMm = imgObj.heightMm * ratio;
            imgObj.crop.imgScale *= ratio;
            imgObj.crop.imgOffsetXMm *= ratio;
            imgObj.crop.imgOffsetYMm *= ratio;
            imgObj.crop.baseWidthMm = imgObj.widthMm;
            imgObj.crop.baseHeightMm = imgObj.heightMm;
            this.renderAll();
          }
        }
      } else if (action === 'duplicate') {
        const copy = JSON.parse(JSON.stringify(imgObj));
        copy.id = App.state.nextImageId++;
        copy.xMm += 10;
        copy.yMm += 10;
        App.state.images.push(copy);
        App.state.selectedImageId = copy.id;
        this.renderAll();
      } else if (action === 'front') {
        App.state.images.splice(idx, 1);
        App.state.images.push(imgObj);
        layerEl.appendChild(layerEl.querySelector(`[data-id="${id}"]`));
      } else if (action === 'back') {
        App.state.images.splice(idx, 1);
        App.state.images.unshift(imgObj);
        layerEl.prepend(layerEl.querySelector(`[data-id="${id}"]`));
      } else if (action === 'reset-crop') {
        const fitScale = imgObj.widthMm / imgObj.naturalWidthMm;
        imgObj.heightMm = imgObj.naturalHeightMm * fitScale;
        imgObj.crop = {
          imgOffsetXMm: 0,
          imgOffsetYMm: 0,
          imgScale: fitScale,
          baseWidthMm: imgObj.widthMm,
          baseHeightMm: imgObj.heightMm,
          aspectRatio: 'free'
        };
        this.renderAll();
      } else if (action === 'delete') {
        if (App.state.cropMode.active && App.state.cropMode.imageId === id) {
          App.cropMode.exit();
        }
        App.state.images.splice(idx, 1);
        App.state.selectedImageId = null;
        this.renderAll();
      }
    }
  };
})();
