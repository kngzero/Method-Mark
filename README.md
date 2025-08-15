# Method Guide – Brand PDF Builder (MVP)

A lightweight React app to assemble brand boards and export a multi-page PDF in **A4** or **16×9**. Slide 1 provides a fixed brand board grid. Slide 2 is a freeform canvas where you can drag in images or color swatches. Colors accept `#hex`, `rgb[a]`, `hsl[a]`, and `oklch`/`oklab` (auto-converted to sRGB).

## Quickstart
```bash
npm i
npm run dev
# open the printed localhost URL
```

## Build
```bash
npm run build
npm run preview
```

## Tests
```bash
npm test
```

## Notes
- **Export PDF** uses `html2canvas` + `jspdf` to rasterize each slide.
- Switch paper size between **A4** (portrait) and **16×9** (landscape).
- Add more slides via toolbar, mix Brand Board / Freeform pages.
- Drag to reposition & resize items on Freeform.
- Accepts `oklch()`; converted offline to sRGB.