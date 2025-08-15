export const GRID_PRESETS = {
  A4: { cols: 12, rows: 16, margin: 40, gutter: 8 },
  '16x9': { cols: 16, rows: 9, margin: 40, gutter: 8 }
};

// Allow optional overrides for grid settings
export function computeGrid(format, width, height, override = {}) {
  const base = GRID_PRESETS[format];
  if (!base) throw new Error('Unknown format: ' + format);
  const preset = { ...base, ...override };
  const { cols, rows, margin, gutter } = preset;
  const moduleW = (width - margin * 2 - gutter * (cols - 1)) / cols;
  const moduleH = (height - margin * 2 - gutter * (rows - 1)) / rows;
  const stepX = moduleW + gutter;
  const stepY = moduleH + gutter;
  return { cols, rows, margin, gutter, moduleW, moduleH, stepX, stepY, width, height };
}
