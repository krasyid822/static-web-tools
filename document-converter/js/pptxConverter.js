const EMU_PER_PIXEL = 9525; // 914400 EMU/inch / 96 px/inch
const DEFAULT_SLIDE_WIDTH = 1280; // 12192000 EMU
const DEFAULT_SLIDE_HEIGHT = 720; // 6858000 EMU
const MAX_CANVAS_DIMENSION = 16384;
const MAX_CANVAS_AREA = 268435456; // 16384 * 16384

const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

const DEFAULT_THEME = {
  colors: {
    dk1: '#000000',
    lt1: '#ffffff',
    dk2: '#1f497d',
    lt2: '#eeece1',
    accent1: '#4f81bd',
    accent2: '#c0504d',
    accent3: '#9bbb59',
    accent4: '#8064a2',
    accent5: '#4bacc6',
    accent6: '#f79646',
    hlink: '#0000ff',
    folHlink: '#800080',
    tx1: '#000000',
    bg1: '#ffffff',
    tx2: '#1f497d',
    bg2: '#eeece1',
  },
  majorFont: 'Calibri',
  minorFont: 'Calibri',
};

function getJSZip() {
  if (typeof window === 'undefined' || typeof window.JSZip !== 'function') {
    throw new Error('JSZip library is not loaded.');
  }
  return window.JSZip;
}

/**
 * Validates that a File is a PPTX archive by checking MIME/extension and ZIP/OLE2 magic bytes.
 * @param {File} file
 */
export async function validatePptxFile(file) {
  if (!file) {
    throw new Error('No file selected.');
  }

  const hasPptxMime = file.type === PPTX_MIME;
  const hasPptxExt = /\.pptx$/i.test(file.name || '');
  if (!hasPptxMime && !(file.type === '' && hasPptxExt) && !hasPptxExt) {
    throw new Error('Invalid file type. Please select a PPTX presentation.');
  }

  const headerBuffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(headerBuffer);

  const isOle2Encrypted =
    bytes.length === 4 &&
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0;

  if (isOle2Encrypted) {
    throw new Error('This PPTX file is password-protected or encrypted and cannot be opened.');
  }

  const isZipMagic =
    bytes.length === 4 &&
    bytes[0] === 0x50 && // P
    bytes[1] === 0x4b && // K
    bytes[2] === 0x03 &&
    bytes[3] === 0x04;

  if (!isZipMagic) {
    throw new Error('Invalid PPTX file: corrupted or not a valid OpenXML archive.');
  }
}

function parseXml(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Corrupted XML structure inside PPTX archive.');
  }
  return doc;
}

function resolveZipPath(baseDir, target) {
  if (!target) return '';
  if (target.startsWith('/')) {
    return target.slice(1);
  }
  const parts = (baseDir ? baseDir.split('/') : []).filter(Boolean);
  for (const segment of target.split('/')) {
    if (segment === '..') {
      parts.pop();
    } else if (segment && segment !== '.') {
      parts.push(segment);
    }
  }
  return parts.join('/');
}

function getDirName(path) {
  const idx = path.lastIndexOf('/');
  return idx === -1 ? '' : path.slice(0, idx);
}

function getRelsPath(partPath) {
  const idx = partPath.lastIndexOf('/');
  if (idx === -1) return `_rels/${partPath}.rels`;
  return `${partPath.slice(0, idx)}/_rels/${partPath.slice(idx + 1)}.rels`;
}

async function readRelsMap(zip, partPath) {
  const relsPath = getRelsPath(partPath);
  const relsFile = zip.file(relsPath);
  const map = new Map();
  if (!relsFile) return map;

  const xml = await relsFile.async('string');
  const doc = parseXml(xml);
  const baseDir = getDirName(partPath);
  const rels = doc.getElementsByTagName('Relationship');
  for (const rel of rels) {
    const id = rel.getAttribute('Id');
    const type = rel.getAttribute('Type') || '';
    const target = rel.getAttribute('Target') || '';
    if (id && target) {
      map.set(id, {
        type,
        target: resolveZipPath(baseDir, target),
      });
    }
  }
  return map;
}

function parseTheme(themeXml) {
  const theme = {
    colors: { ...DEFAULT_THEME.colors },
    majorFont: DEFAULT_THEME.majorFont,
    minorFont: DEFAULT_THEME.minorFont,
  };
  if (!themeXml) return theme;

  const doc = parseXml(themeXml);
  const clrScheme = doc.getElementsByTagNameNS('*', 'clrScheme')[0];
  if (clrScheme) {
    for (const child of clrScheme.children) {
      const name = child.localName;
      const srgb = child.getElementsByTagNameNS('*', 'srgbClr')[0];
      const sys = child.getElementsByTagNameNS('*', 'sysClr')[0];
      let hex = null;
      if (srgb) {
        hex = `#${srgb.getAttribute('val')}`;
      } else if (sys) {
        const lastClr = sys.getAttribute('lastClr');
        if (lastClr) hex = `#${lastClr}`;
      }
      if (hex) {
        theme.colors[name] = hex;
      }
    }
    theme.colors.tx1 = theme.colors.dk1;
    theme.colors.bg1 = theme.colors.lt1;
    theme.colors.tx2 = theme.colors.dk2;
    theme.colors.bg2 = theme.colors.lt2;
  }

  const majorLatin = doc.getElementsByTagNameNS('*', 'majorFont')[0]?.getElementsByTagNameNS('*', 'latin')[0];
  const minorLatin = doc.getElementsByTagNameNS('*', 'minorFont')[0]?.getElementsByTagNameNS('*', 'latin')[0];
  if (majorLatin?.getAttribute('typeface')) theme.majorFont = majorLatin.getAttribute('typeface');
  if (minorLatin?.getAttribute('typeface')) theme.minorFont = minorLatin.getAttribute('typeface');

  return theme;
}

/**
 * Loads a PPTX file into an in-memory document structure.
 * @param {File} file
 */
export async function loadPptxDocument(file) {
  const JSZip = getJSZip();
  const arrayBuffer = await file.arrayBuffer();

  let zip;
  try {
    zip = await JSZip.loadAsync(arrayBuffer);
  } catch {
    throw new Error('The PPTX file appears to be corrupted or invalid.');
  }

  const presFile = zip.file('ppt/presentation.xml');
  const presRelsFile = zip.file('ppt/_rels/presentation.xml.rels');
  if (!presFile || !presRelsFile) {
    throw new Error('Invalid PPTX structure: missing presentation.xml.');
  }

  const presDoc = parseXml(await presFile.async('string'));
  const presRels = await readRelsMap(zip, 'ppt/presentation.xml');

  const sldSz = presDoc.getElementsByTagNameNS('*', 'sldSz')[0];
  const width = sldSz?.getAttribute('cx')
    ? Math.round(Number(sldSz.getAttribute('cx')) / EMU_PER_PIXEL)
    : DEFAULT_SLIDE_WIDTH;
  const height = sldSz?.getAttribute('cy')
    ? Math.round(Number(sldSz.getAttribute('cy')) / EMU_PER_PIXEL)
    : DEFAULT_SLIDE_HEIGHT;

  const slides = [];
  const sldIds = presDoc.getElementsByTagNameNS('*', 'sldId');
  for (const sldId of sldIds) {
    const rId =
      sldId.getAttribute('r:id') ||
      sldId.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
    const rel = rId ? presRels.get(rId) : null;
    if (rel?.target && zip.file(rel.target)) {
      slides.push(rel.target);
    }
  }

  if (slides.length === 0) {
    throw new Error('This PPTX file contains no slides.');
  }

  const themeFile = zip.file('ppt/theme/theme1.xml');
  const theme = parseTheme(themeFile ? await themeFile.async('string') : null);

  return {
    type: 'pptx',
    zip,
    slides,
    width,
    height,
    theme,
    numPages: slides.length,
    async destroy() {},
  };
}

function getDirectChild(parent, localName) {
  if (!parent) return null;
  for (const child of parent.children) {
    if (child.localName === localName) return child;
  }
  return null;
}

function getDirectChildren(parent, localName) {
  if (!parent) return [];
  const res = [];
  for (const child of parent.children) {
    if (child.localName === localName) res.push(child);
  }
  return res;
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function applyColorModifiers(hex, colorNode) {
  let { r, g, b } = hexToRgb(hex);
  let alpha = 1;

  for (const child of colorNode.children) {
    const val = Number(child.getAttribute('val') || 0) / 100000;
    if (child.localName === 'alpha') {
      alpha = val;
    } else if (child.localName === 'lumMod') {
      r = Math.min(255, Math.round(r * val));
      g = Math.min(255, Math.round(g * val));
      b = Math.min(255, Math.round(b * val));
    } else if (child.localName === 'lumOff') {
      const offset = Math.round(255 * val);
      r = Math.min(255, Math.max(0, r + offset));
      g = Math.min(255, Math.max(0, g + offset));
      b = Math.min(255, Math.max(0, b + offset));
    }
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resolveColorNode(parentNode, theme) {
  if (!parentNode) return null;
  const srgb = getDirectChild(parentNode, 'srgbClr');
  if (srgb) {
    return applyColorModifiers(`#${srgb.getAttribute('val')}`, srgb);
  }
  const scheme = getDirectChild(parentNode, 'schemeClr');
  if (scheme) {
    const key = scheme.getAttribute('val');
    const baseHex = theme.colors[key] || '#000000';
    return applyColorModifiers(baseHex, scheme);
  }
  return null;
}

function resolveFill(spPr, theme, ctx, x, y, w, h) {
  if (!spPr) return null;
  if (getDirectChild(spPr, 'noFill')) return null;

  const solid = getDirectChild(spPr, 'solidFill');
  if (solid) {
    return resolveColorNode(solid, theme);
  }

  const grad = getDirectChild(spPr, 'gradFill');
  if (grad) {
    const gsLst = getDirectChild(grad, 'gsLst');
    const stops = gsLst ? getDirectChildren(gsLst, 'gs') : [];
    if (stops.length > 0) {
      const lin = getDirectChild(grad, 'lin');
      const ang = lin ? (Number(lin.getAttribute('ang') || 0) / 60000) * (Math.PI / 180) : 0;
      const cx = x + w / 2;
      const cy = y + h / 2;
      const dx = (Math.cos(ang) * w) / 2;
      const dy = (Math.sin(ang) * h) / 2;
      const gradient = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
      for (const stop of stops) {
        const pos = Math.max(0, Math.min(1, Number(stop.getAttribute('pos') || 0) / 100000));
        const color = resolveColorNode(stop, theme) || '#000000';
        gradient.addColorStop(pos, color);
      }
      return gradient;
    }
  }

  return null;
}

function parseXfrm(xfrmNode) {
  if (!xfrmNode) return null;
  const off = getDirectChild(xfrmNode, 'off');
  const ext = getDirectChild(xfrmNode, 'ext');
  if (!off || !ext) return null;

  return {
    x: Number(off.getAttribute('x') || 0) / EMU_PER_PIXEL,
    y: Number(off.getAttribute('y') || 0) / EMU_PER_PIXEL,
    w: Number(ext.getAttribute('cx') || 0) / EMU_PER_PIXEL,
    h: Number(ext.getAttribute('cy') || 0) / EMU_PER_PIXEL,
    rot: (Number(xfrmNode.getAttribute('rot') || 0) / 60000) * (Math.PI / 180),
    flipH: xfrmNode.getAttribute('flipH') === '1',
    flipV: xfrmNode.getAttribute('flipV') === '1',
  };
}

function getImageMime(path) {
  const lower = path.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'image/png';
}

async function loadImageFromZip(zip, path) {
  const file = zip.file(path);
  if (!file) return null;
  const blob = new Blob([await file.async('arraybuffer')], { type: getImageMime(path) });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to decode embedded image: ${path}`));
      image.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function traceShapePath(ctx, prst, x, y, w, h) {
  ctx.beginPath();
  if (prst === 'ellipse') {
    ctx.ellipse(x + w / 2, y + h / 2, Math.max(0, w / 2), Math.max(0, h / 2), 0, 0, Math.PI * 2);
  } else if (prst === 'roundRect') {
    const r = Math.min(w, h) * 0.1;
    ctx.roundRect(x, y, w, h, r);
  } else if (prst === 'triangle') {
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
  } else if (prst === 'line') {
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
  } else {
    ctx.rect(x, y, w, h);
  }
}

function drawTextBody(ctx, txBody, x, y, w, h, theme) {
  if (!txBody) return;
  const bodyPr = getDirectChild(txBody, 'bodyPr');
  const lIns = bodyPr?.getAttribute('lIns') ? Number(bodyPr.getAttribute('lIns')) / EMU_PER_PIXEL : 9.6;
  const rIns = bodyPr?.getAttribute('rIns') ? Number(bodyPr.getAttribute('rIns')) / EMU_PER_PIXEL : 9.6;
  const tIns = bodyPr?.getAttribute('tIns') ? Number(bodyPr.getAttribute('tIns')) / EMU_PER_PIXEL : 4.8;
  const bIns = bodyPr?.getAttribute('bIns') ? Number(bodyPr.getAttribute('bIns')) / EMU_PER_PIXEL : 4.8;
  const anchor = bodyPr?.getAttribute('anchor') || 't';

  const contentX = x + lIns;
  const contentW = Math.max(10, w - lIns - rIns);
  const paragraphs = getDirectChildren(txBody, 'p');
  const lines = [];

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const p = paragraphs[pIdx];
    const pPr = getDirectChild(p, 'pPr');
    const algn = pPr?.getAttribute('algn') || 'l';
    const buChar = pPr ? getDirectChild(pPr, 'buChar')?.getAttribute('char') : null;
    const buAuto = pPr ? getDirectChild(pPr, 'buAutoNum') : null;
    const bulletPrefix = buChar ? `${buChar} ` : buAuto ? `${pIdx + 1}. ` : '';

    const runs = getDirectChildren(p, 'r');
    const tokens = [];
    for (let rIdx = 0; rIdx < runs.length; rIdx++) {
      const r = runs[rIdx];
      const rPr = getDirectChild(r, 'rPr');
      const tNode = getDirectChild(r, 't');
      if (!tNode) continue;

      const text = (rIdx === 0 ? bulletPrefix : '') + (tNode.textContent || '');
      const sz = rPr?.getAttribute('sz') ? Number(rPr.getAttribute('sz')) / 100 : 18;
      const fontSizePx = sz * (96 / 72);
      const bold = rPr?.getAttribute('b') === '1';
      const italic = rPr?.getAttribute('i') === '1';
      const underline = rPr?.getAttribute('u') && rPr.getAttribute('u') !== 'none';
      const latin = rPr ? getDirectChild(rPr, 'latin')?.getAttribute('typeface') : null;
      const fontFamily = latin || theme.minorFont || 'sans-serif';
      const solid = rPr ? getDirectChild(rPr, 'solidFill') : null;
      const color = (solid && resolveColorNode(solid, theme)) || theme.colors.tx1 || '#000000';

      for (const word of text.split(/(\s+)/)) {
        if (word) {
          tokens.push({ word, fontSizePx, bold, italic, underline, fontFamily, color });
        }
      }
    }

    if (tokens.length === 0) {
      lines.push({ algn, items: [], height: 20 });
      continue;
    }

    let currentLine = [];
    let currentWidth = 0;
    let maxLineHeight = 0;

    for (const tok of tokens) {
      ctx.font = `${tok.italic ? 'italic ' : ''}${tok.bold ? 'bold ' : ''}${tok.fontSizePx}px "${tok.fontFamily}", sans-serif`;
      const tokWidth = ctx.measureText(tok.word).width;
      if (currentLine.length > 0 && currentWidth + tokWidth > contentW && tok.word.trim() !== '') {
        lines.push({ algn, items: currentLine, width: currentWidth, height: maxLineHeight });
        currentLine = [];
        currentWidth = 0;
        maxLineHeight = 0;
      }
      currentLine.push({ ...tok, width: tokWidth });
      currentWidth += tokWidth;
      maxLineHeight = Math.max(maxLineHeight, tok.fontSizePx * 1.25);
    }
    if (currentLine.length > 0) {
      lines.push({ algn, items: currentLine, width: currentWidth, height: maxLineHeight });
    }
  }

  const totalTextHeight = lines.reduce((acc, l) => acc + l.height, 0);
  let cursorY = y + tIns;
  if (anchor === 'ctr') {
    cursorY = y + Math.max(tIns, (h - totalTextHeight) / 2);
  } else if (anchor === 'b') {
    cursorY = y + Math.max(tIns, h - bIns - totalTextHeight);
  }

  ctx.textBaseline = 'top';
  for (const line of lines) {
    let cursorX = contentX;
    if (line.algn === 'ctr') {
      cursorX = contentX + (contentW - (line.width || 0)) / 2;
    } else if (line.algn === 'r') {
      cursorX = contentX + contentW - (line.width || 0);
    }

    for (const item of line.items) {
      ctx.font = `${item.italic ? 'italic ' : ''}${item.bold ? 'bold ' : ''}${item.fontSizePx}px "${item.fontFamily}", sans-serif`;
      ctx.fillStyle = item.color;
      ctx.fillText(item.word, cursorX, cursorY);
      if (item.underline) {
        ctx.fillRect(cursorX, cursorY + item.fontSizePx, item.width, Math.max(1, item.fontSizePx * 0.06));
      }
      cursorX += item.width;
    }
    cursorY += line.height;
  }
}

async function renderShapeNode(node, ctx, zip, rels, theme) {
  const tag = node.localName;

  if (tag === 'grpSp') {
    const grpSpPr = getDirectChild(node, 'grpSpPr');
    const xfrm = grpSpPr ? getDirectChild(grpSpPr, 'xfrm') : null;
    const outer = parseXfrm(xfrm);
    const chOff = xfrm ? getDirectChild(xfrm, 'chOff') : null;
    const chExt = xfrm ? getDirectChild(xfrm, 'chExt') : null;

    ctx.save();
    if (outer && chOff && chExt) {
      const cx = Number(chOff.getAttribute('x') || 0) / EMU_PER_PIXEL;
      const cy = Number(chOff.getAttribute('y') || 0) / EMU_PER_PIXEL;
      const cw = Number(chExt.getAttribute('cx') || 1) / EMU_PER_PIXEL;
      const ch = Number(chExt.getAttribute('cy') || 1) / EMU_PER_PIXEL;
      ctx.translate(outer.x, outer.y);
      ctx.scale(outer.w / cw, outer.h / ch);
      ctx.translate(-cx, -cy);
    }
    for (const child of node.children) {
      if (['sp', 'pic', 'cxnSp', 'grpSp', 'graphicFrame'].includes(child.localName)) {
        await renderShapeNode(child, ctx, zip, rels, theme);
      }
    }
    ctx.restore();
    return;
  }

  if (tag === 'pic') {
    const spPr = getDirectChild(node, 'spPr');
    const box = parseXfrm(spPr ? getDirectChild(spPr, 'xfrm') : null);
    const blipFill = getDirectChild(node, 'blipFill');
    const blip = blipFill ? getDirectChild(blipFill, 'blip') : null;
    const rEmbed =
      blip?.getAttribute('r:embed') ||
      blip?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed');
    const rel = rEmbed ? rels.get(rEmbed) : null;
    if (!box || !rel?.target) return;

    const img = await loadImageFromZip(zip, rel.target);
    if (!img) return;

    ctx.save();
    ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
    if (box.rot) ctx.rotate(box.rot);
    ctx.scale(box.flipH ? -1 : 1, box.flipV ? -1 : 1);
    ctx.drawImage(img, -box.w / 2, -box.h / 2, box.w, box.h);
    ctx.restore();
    return;
  }

  if (tag === 'sp' || tag === 'cxnSp') {
    const spPr = getDirectChild(node, 'spPr');
    const box = parseXfrm(spPr ? getDirectChild(spPr, 'xfrm') : null);
    if (!box) return;

    const prstGeom = spPr ? getDirectChild(spPr, 'prstGeom') : null;
    const prst = tag === 'cxnSp' ? 'line' : prstGeom?.getAttribute('prst') || 'rect';

    ctx.save();
    ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
    if (box.rot) ctx.rotate(box.rot);
    ctx.scale(box.flipH ? -1 : 1, box.flipV ? -1 : 1);

    const lx = -box.w / 2;
    const ly = -box.h / 2;
    traceShapePath(ctx, prst, lx, ly, box.w, box.h);

    const fill = resolveFill(spPr, theme, ctx, lx, ly, box.w, box.h);
    if (fill && prst !== 'line') {
      ctx.fillStyle = fill;
      ctx.fill();
    }

    const ln = spPr ? getDirectChild(spPr, 'ln') : null;
    if (ln && !getDirectChild(ln, 'noFill')) {
      const strokeColor = resolveFill(ln, theme, ctx, lx, ly, box.w, box.h);
      if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(1, Number(ln.getAttribute('w') || 12700) / EMU_PER_PIXEL);
        ctx.stroke();
      }
    }
    ctx.restore();

    const txBody = getDirectChild(node, 'txBody');
    if (txBody) {
      drawTextBody(ctx, txBody, box.x, box.y, box.w, box.h, theme);
    }
    return;
  }

  if (tag === 'graphicFrame') {
    const xfrm = getDirectChild(node, 'xfrm');
    const box = parseXfrm(xfrm);
    const tbl = node.getElementsByTagNameNS('*', 'tbl')[0];
    if (!box || !tbl) return;

    const gridCols = tbl.getElementsByTagNameNS('*', 'gridCol');
    const colWidths = Array.from(gridCols).map((c) => Number(c.getAttribute('w') || 0) / EMU_PER_PIXEL);
    const rows = getDirectChildren(tbl, 'tr');

    let curY = box.y;
    for (const row of rows) {
      const rowH = Number(row.getAttribute('h') || 370840) / EMU_PER_PIXEL;
      const cells = getDirectChildren(row, 'tc');
      let curX = box.x;

      for (let cIdx = 0; cIdx < cells.length; cIdx++) {
        const cell = cells[cIdx];
        const cellW = colWidths[cIdx] || box.w / Math.max(1, cells.length);
        const tcPr = getDirectChild(cell, 'tcPr');
        const fill = resolveFill(tcPr, theme, ctx, curX, curY, cellW, rowH);
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fillRect(curX, curY, cellW, rowH);
        }
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(curX, curY, cellW, rowH);

        const txBody = getDirectChild(cell, 'txBody');
        if (txBody) {
          drawTextBody(ctx, txBody, curX, curY, cellW, rowH, theme);
        }
        curX += cellW;
      }
      curY += rowH;
    }
  }
}

async function renderBackground(slideDoc, slideRels, ctx, zip, width, height, theme) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const cSld = slideDoc.getElementsByTagNameNS('*', 'cSld')[0];
  const bg = cSld ? getDirectChild(cSld, 'bg') : null;
  const bgPr = bg ? getDirectChild(bg, 'bgPr') : null;

  if (!bgPr) return;

  const blipFill = getDirectChild(bgPr, 'blipFill');
  if (blipFill) {
    const blip = getDirectChild(blipFill, 'blip');
    const rEmbed =
      blip?.getAttribute('r:embed') ||
      blip?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed');
    const rel = rEmbed ? slideRels.get(rEmbed) : null;
    if (rel?.target) {
      const img = await loadImageFromZip(zip, rel.target);
      if (img) {
        ctx.drawImage(img, 0, 0, width, height);
        return;
      }
    }
  }

  const fill = resolveFill(bgPr, theme, ctx, 0, 0, width, height);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, width, height);
  }
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

/**
 * Sequentially renders PPTX slides to an offscreen canvas and emits Blobs.
 * @param {object} pptxDoc
 * @param {{ pages: number[], scale: number, mimeType: string, quality?: number, signal?: AbortSignal }} options
 * @param {{ onPageComplete: (slideNum: number, blob: Blob, index: number, total: number) => void }} callbacks
 */
export async function convertPptxSlidesToBlobs(pptxDoc, options, callbacks) {
  const { pages, scale, mimeType, quality, signal } = options;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context.');
  }

  const width = Math.floor(pptxDoc.width * scale);
  const height = Math.floor(pptxDoc.height * scale);

  if (width > MAX_CANVAS_DIMENSION || height > MAX_CANVAS_DIMENSION || width * height > MAX_CANVAS_AREA) {
    throw new Error(
      `Slide dimensions exceed browser canvas memory limits (${width}x${height}px). Try a lower DPI scale.`
    );
  }

  try {
    for (let i = 0; i < pages.length; i++) {
      if (signal?.aborted) {
        throw new DOMException('Conversion cancelled', 'AbortError');
      }

      const slideNum = pages[i];
      const slidePath = pptxDoc.slides[slideNum - 1];
      const slideXml = await pptxDoc.zip.file(slidePath).async('string');
      const slideDoc = parseXml(slideXml);
      const slideRels = await readRelsMap(pptxDoc.zip, slidePath);

      canvas.width = width;
      canvas.height = height;

      ctx.save();
      ctx.scale(scale, scale);

      await renderBackground(slideDoc, slideRels, ctx, pptxDoc.zip, pptxDoc.width, pptxDoc.height, pptxDoc.theme);

      const spTree = slideDoc.getElementsByTagNameNS('*', 'spTree')[0];
      if (spTree) {
        for (const child of spTree.children) {
          if (['sp', 'pic', 'cxnSp', 'grpSp', 'graphicFrame'].includes(child.localName)) {
            await renderShapeNode(child, ctx, pptxDoc.zip, slideRels, pptxDoc.theme);
          }
        }
      }

      ctx.restore();

      if (signal?.aborted) {
        throw new DOMException('Conversion cancelled', 'AbortError');
      }

      const blob = await canvasToBlob(canvas, mimeType, quality);

      canvas.width = 0;
      canvas.height = 0;

      callbacks.onPageComplete(slideNum, blob, i + 1, pages.length);

      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}
