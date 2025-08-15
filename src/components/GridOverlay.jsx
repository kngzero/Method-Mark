import React from 'react';

export default function GridOverlay({ grid, showSafeMargin }) {
  const { margin, safeMargin = 0, stepX, stepY, width, height } = grid;
  const style = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  };
  const innerStyle = {
    position: 'absolute',
    left: margin,
    top: margin,
    width: width - margin * 2,
    height: height - margin * 2,
    backgroundSize: `${stepX}px ${stepY}px`,
    backgroundImage:
      `linear-gradient(to right, #ddd 1px, transparent 1px),` +
      `linear-gradient(to bottom, #ddd 1px, transparent 1px)`,
  };
  const safeOffset = margin + safeMargin;
  const safeStyle = {
    position: 'absolute',
    left: safeOffset,
    top: safeOffset,
    width: width - safeOffset * 2,
    height: height - safeOffset * 2,
    border: '2px dashed #f00',
  };
  return (
    <div style={style}>
      <div style={innerStyle}></div>
      {showSafeMargin && safeMargin > 0 && <div style={safeStyle}></div>}
    </div>
  );
}
