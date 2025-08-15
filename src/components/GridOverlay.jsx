import React from 'react';

export default function GridOverlay({ grid }) {
  const { margin, stepX, stepY, width, height } = grid;
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
  return (
    <div style={style}>
      <div style={innerStyle}></div>
    </div>
  );
}
