# AGENTS.md

## 1. Project Overview & Tech Stack
- **Application Goal:** A web-based precision physical-scale print layout and image cropping workspace that maintains 1:1 physical accuracy (`mm`/`cm`) from screen setup to physical printer output.
- **Core Stack:** Vanilla HTML5, CSS3, and JavaScript (ES6+).
- **No Frameworks/Build Tools:** Do not introduce frontend frameworks (e.g., React, Vue, Next.js) or heavy bundlers unless explicitly instructed. Keep the architecture pure web standard with clean modular JS/CSS files.

## 2. Initial UI & Paper Size Configuration
- **Startup Modal:** On application load, immediately display an interactive setup modal before granting access to the workspace.
- **Paper Size Dropdown:**
  - Must contain a comprehensive list of standard paper sizes (e.g., ISO A-series, B-series, C-series, ANSI/North American sizes).
  - Must include a **Custom Size** option that unlocks manual width and height inputs when selected.
  - Must include a built-in **search/filter input** inside the dropdown so users can quickly filter paper presets by name or dimensions.
- **Strict Metric Units:** Restrict all dimension displays, presets, and custom inputs strictly to **millimeters (`mm`)** and **centimeters (`cm`)**. Never display or accept inches (`in`), points (`pt`), or raw pixels (`px`) for physical paper or image sizing inputs.

## 3. Workspace Canvas & Viewport Controls
- **Canvas Generation:** Upon confirming the paper setup, dismiss the modal and render the main working canvas proportioned accurately to the selected physical dimensions.
- **Dimension Guides (Rulers/Edges):** Display dynamic dimension indicators along the outer edges (width and height) of the working canvas showing exact physical measurements in the active unit (`mm` or `cm`).
- **Touchpad Pinch-to-Zoom:**
  - Support smooth zoom-in and zoom-out gestures using laptop touchpad pinch gestures.
  - **Implementation Note:** On desktop browsers, touchpad pinch gestures dispatch `wheel` events with `e.ctrlKey === true`. Intercept these events (`e.preventDefault()`) to prevent native browser page zooming and apply custom transform scaling to the canvas viewport instead.

## 4. Image Objects, Positioning & Context Menu
- **Image Placement & Free Dragging:**
  - Users can insert/paste images anywhere onto the canvas at arbitrary coordinates.
  - Images can be freely dragged and repositioned anywhere on the canvas.
- **Image Dimension Guides:** Each placed image must display live width and height dimension indicators along its outer edges in the active unit (`mm` or `cm`).
- **Right-Click Context Menu:** Right-clicking an image opens a floating popup context menu (`contextmenu` event with `e.preventDefault()`) listing available image manipulation tools.

## 5. Image Tools: Precision Crop & Directional Expand
- **Entering & Exiting Crop Mode:**
  - Triggered by right-clicking an image and selecting **Crop** from the context menu.
  - Clicking anywhere on an empty area of the canvas exits Crop Mode and commits the current crop state. Re-entering requires right-clicking the image and selecting **Crop** again.
- **Fixed-Frame Crop Behavior (Inverse Manipulation):**
  - Users configure the crop frame using an **Aspect Ratio** and **Physical Size** (`mm` or `cm`).
  - Once set, the **crop frame remains locked in size and position**; instead, the user pans (drags) and scales (zooms) the **underlying image inside the fixed crop frame** to compose the shot.
- **Directional Crop Expansion (Expand Crop):**
  - Inside Crop Mode, provide controls to expand the crop frame in four directions: **Right**, **Left**, **Top**, or **Bottom**, using the current frame's base dimensions as the unit increment.
  - **Continuous Frame Merging:** Expanding does **not** create a separate detached frame; it seamlessly extends the existing unified crop frame by adding the base dimension along that axis.
  - **Example:** If the current crop frame is set to `1:1` at `5 cm × 5 cm` and the user triggers **Expand Right**, the frame seamlessly becomes a single unified `10 cm × 5 cm` (`2:1`) crop boundary.

## 6. Direct Print Engine & Printer Margin Calibration
- **Direct Printing:** Provide a direct print trigger (`window.print()`) utilizing `@media print` CSS rules (`@page` sizing) that preserve exact 1:1 physical dimensions (`mm`/`cm`) and strip out all workspace UI overlays (rulers, bounding boxes, menus).
- **Print Setup Modal:**
  - **Searchable Printer Spec Dropdown:** Include a searchable dropdown pre-populated with common printer models and their hardware-specific minimum printable margins (Top, Bottom, Left, Right in `mm`). Selecting a printer automatically applies its minimum non-printable margins to the print layout and visualizes the safe printable boundary on the canvas.
  - **Custom Margin Option:** Include a **Custom** option allowing manual entry of Top, Bottom, Left, and Right minimum margins (`mm`/`cm`) if the user's printer is not listed.
  - **Conditional Borderless Checkbox:** Dynamically display a **Borderless Mode** checkbox *only* when the selected printer profile supports borderless printing (or when toggled in custom mode). Enabling it sets print margins to `0 mm`.
- **Printer Boundary Calibration Tool:**
  - Provide a built-in diagnostic feature to generate and print a **Boundary Test Pattern** (graduated edge ticks, corner crosshairs, and stepped margin lines in `mm` along all four paper edges).
  - **Dual Verification Modes:**
    1. **Ruler-Free Visual Verification:** Pattern includes distinct numbered/color-coded stepped lines near the edges so the user can visually identify the last visible printed line/mark cut off by the printer's physical rollers without needing a physical ruler, then input that code/number into the app to auto-calculate exact margins.
    2. **Ruler / Camera-Assisted Verification:** Users can either measure the unprinted white edge with a physical ruler (`mm`) or scan/photograph the printed calibration sheet so the app can detect the cut-off boundary and automatically save the custom printer margin profile.