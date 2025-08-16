import React from 'react';

export default function GridOverlay({ grid, showSafeMargin }) {
  const {
    margin,
    safeMargin = 0,
    stepX,
    stepY,
    moduleW,
    moduleH,
    gutter,
    width,
    height,
  } = grid;
  const style = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  };
  const bgImages = [
    `repeating-linear-gradient(to right, #ddd, #ddd 1px, transparent 1px, transparent ${stepX}px)`,
    `repeating-linear-gradient(to bottom, #ddd, #ddd 1px, transparent 1px, transparent ${stepY}px)`
  ];
  if (gutter > 0) {
    bgImages.push(
      `repeating-linear-gradient(to right, transparent, transparent ${moduleW}px, rgba(0,0,0,0.05) ${moduleW}px, rgba(0,0,0,0.05) ${stepX}px)`,
      `repeating-linear-gradient(to bottom, transparent, transparent ${moduleH}px, rgba(0,0,0,0.05) ${moduleH}px, rgba(0,0,0,0.05) ${stepY}px)`
    );
  }
  const innerStyle = {
    position: 'absolute',
    left: margin,
    top: margin,
    width: width - margin * 2,
    height: height - margin * 2,
    boxSizing: 'border-box',
    backgroundImage: bgImages.join(','),
    border: '1px solid #ccc',
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
    <div className="gridOverlay" style={style}>
      <div style={innerStyle}></div>
      {showSafeMargin && safeMargin > 0 && <div style={safeStyle}></div>}
    </div>
  );
}
