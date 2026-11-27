# MetricPrint Studio

A standalone Vanilla HTML5/CSS3/ES6+ web application for 1:1 physical-scale (`mm` / `cm`) print layout and image cropping.

## Features
- **Strict Metric Units (`mm` / `cm`)**: All paper presets, custom dimensions, rulers, image guides, and printer margins use millimeters or centimeters.
- **Searchable Paper & Printer Dropdowns**: Includes ISO A/B/C, ANSI, Photo sizes, Custom Size, and common printer margin profiles.
- **Touchpad Pinch-to-Zoom**: Smoothly zooms the workspace canvas via `wheel` (`ctrlKey`) without triggering browser page zoom.
- **Fixed-Frame Crop & Directional Expand**: Right-click any image → **Crop** to lock the crop frame, pan/scale the underlying image inside, and expand the unified frame seamlessly in any direction (Top, Bottom, Left, Right).
- **Direct 1:1 Print & Calibration**: Prints at exact physical scale via `@media print` and includes a Boundary Calibration Tool with both Ruler-Free Visual and Ruler/Camera-Assisted verification.

## Usage
Open `index.html` directly in any modern browser (supports `file://` and static hosting).
