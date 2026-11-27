(function () {
  'use strict';
  const App = (window.PrintCropApp = window.PrintCropApp || {});

  App.PAPER_SIZES = [
    // ISO A-Series
    { id: 'a0', name: 'ISO A0', category: 'ISO A', widthMm: 841, heightMm: 1189 },
    { id: 'a1', name: 'ISO A1', category: 'ISO A', widthMm: 594, heightMm: 841 },
    { id: 'a2', name: 'ISO A2', category: 'ISO A', widthMm: 420, heightMm: 594 },
    { id: 'a3', name: 'ISO A3', category: 'ISO A', widthMm: 297, heightMm: 420 },
    { id: 'a4', name: 'ISO A4', category: 'ISO A', widthMm: 210, heightMm: 297 },
    { id: 'a5', name: 'ISO A5', category: 'ISO A', widthMm: 148, heightMm: 210 },
    { id: 'a6', name: 'ISO A6', category: 'ISO A', widthMm: 105, heightMm: 148 },
    { id: 'a7', name: 'ISO A7', category: 'ISO A', widthMm: 74, heightMm: 105 },

    // ISO B-Series
    { id: 'b0', name: 'ISO B0', category: 'ISO B', widthMm: 1000, heightMm: 1414 },
    { id: 'b1', name: 'ISO B1', category: 'ISO B', widthMm: 707, heightMm: 1000 },
    { id: 'b2', name: 'ISO B2', category: 'ISO B', widthMm: 500, heightMm: 707 },
    { id: 'b3', name: 'ISO B3', category: 'ISO B', widthMm: 353, heightMm: 500 },
    { id: 'b4', name: 'ISO B4', category: 'ISO B', widthMm: 250, heightMm: 353 },
    { id: 'b5', name: 'ISO B5', category: 'ISO B', widthMm: 176, heightMm: 250 },
    { id: 'b6', name: 'ISO B6', category: 'ISO B', widthMm: 125, heightMm: 176 },
    { id: 'b7', name: 'ISO B7', category: 'ISO B', widthMm: 88, heightMm: 125 },

    // ISO C-Series
    { id: 'c0', name: 'ISO C0', category: 'ISO C', widthMm: 917, heightMm: 1297 },
    { id: 'c1', name: 'ISO C1', category: 'ISO C', widthMm: 648, heightMm: 917 },
    { id: 'c2', name: 'ISO C2', category: 'ISO C', widthMm: 458, heightMm: 648 },
    { id: 'c3', name: 'ISO C3', category: 'ISO C', widthMm: 324, heightMm: 458 },
    { id: 'c4', name: 'ISO C4', category: 'ISO C', widthMm: 229, heightMm: 324 },
    { id: 'c5', name: 'ISO C5', category: 'ISO C', widthMm: 162, heightMm: 229 },
    { id: 'c6', name: 'ISO C6', category: 'ISO C', widthMm: 114, heightMm: 162 },

    // ANSI / North American (strictly in mm)
    { id: 'letter', name: 'ANSI A / Letter', category: 'ANSI', widthMm: 215.9, heightMm: 279.4 },
    { id: 'legal', name: 'Legal', category: 'ANSI', widthMm: 215.9, heightMm: 355.6 },
    { id: 'tabloid', name: 'ANSI B / Tabloid', category: 'ANSI', widthMm: 279.4, heightMm: 431.8 },
    { id: 'half-letter', name: 'Half Letter', category: 'ANSI', widthMm: 139.7, heightMm: 215.9 },
    { id: 'ansi-c', name: 'ANSI C', category: 'ANSI', widthMm: 431.8, heightMm: 558.8 },
    { id: 'ansi-d', name: 'ANSI D', category: 'ANSI', widthMm: 558.8, heightMm: 863.6 },
    { id: 'ansi-e', name: 'ANSI E', category: 'ANSI', widthMm: 863.6, heightMm: 1117.6 },

    // Photo & Regional
    { id: 'f4', name: 'F4 / Folio', category: 'Regional', widthMm: 215, heightMm: 330 },
    { id: 'photo-4r', name: 'Photo 4R', category: 'Photo', widthMm: 102, heightMm: 152 },
    { id: 'photo-5r', name: 'Photo 5R', category: 'Photo', widthMm: 127, heightMm: 178 },
    { id: 'photo-6r', name: 'Photo 6R', category: 'Photo', widthMm: 152, heightMm: 203 },

    // Custom
    { id: 'custom', name: 'Custom Size', category: 'Custom', widthMm: 210, heightMm: 297, isCustom: true }
  ];

  App.PRINTER_PROFILES = [
    { id: 'epson-l3110', name: 'Epson EcoTank L3110 / L3210', brand: 'Epson', margins: { top: 3, bottom: 3, left: 3, right: 3 }, supportsBorderless: true },
    { id: 'epson-l121', name: 'Epson EcoTank L121', brand: 'Epson', margins: { top: 3, bottom: 3, left: 3, right: 3 }, supportsBorderless: false },
    { id: 'canon-g2010', name: 'Canon PIXMA G2010 / G3010', brand: 'Canon', margins: { top: 3, bottom: 5, left: 3.4, right: 3.4 }, supportsBorderless: true },
    { id: 'canon-ip2770', name: 'Canon PIXMA iP2770', brand: 'Canon', margins: { top: 3, bottom: 5, left: 3.4, right: 3.4 }, supportsBorderless: true },
    { id: 'hp-deskjet-2775', name: 'HP DeskJet 2775 / 2700', brand: 'HP', margins: { top: 3, bottom: 12.7, left: 3, right: 3 }, supportsBorderless: false },
    { id: 'hp-inktank-315', name: 'HP Ink Tank 315 / 415', brand: 'HP', margins: { top: 3, bottom: 3, left: 3, right: 3 }, supportsBorderless: true },
    { id: 'hp-laser-m15w', name: 'HP LaserJet Pro M15w', brand: 'HP', margins: { top: 4.2, bottom: 4.2, left: 4.2, right: 4.2 }, supportsBorderless: false },
    { id: 'brother-dcp-t420w', name: 'Brother DCP-T420W / T520W', brand: 'Brother', margins: { top: 3, bottom: 3, left: 3, right: 3 }, supportsBorderless: true },
    { id: 'brother-hl-l2321d', name: 'Brother HL-L2321D Laser', brand: 'Brother', margins: { top: 4.2, bottom: 4.2, left: 4.2, right: 4.2 }, supportsBorderless: false },
    { id: 'generic-inkjet', name: 'Generic Inkjet Printer', brand: 'Generic', margins: { top: 3.5, bottom: 5, left: 3.5, right: 3.5 }, supportsBorderless: false },
    { id: 'generic-laser', name: 'Generic Laser Printer', brand: 'Generic', margins: { top: 4.5, bottom: 4.5, left: 4.5, right: 4.5 }, supportsBorderless: false },
    { id: 'custom', name: 'Custom Margins', brand: 'Custom', margins: { top: 3, bottom: 3, left: 3, right: 3 }, supportsBorderless: true, isCustom: true }
  ];

  App.ASPECT_RATIOS = {
    'free': null,
    '1:1': 1,
    '3:2': 3 / 2,
    '2:3': 2 / 3,
    '4:3': 4 / 3,
    '3:4': 3 / 4,
    '16:9': 16 / 9,
    '4:5': 4 / 5
  };
})();
