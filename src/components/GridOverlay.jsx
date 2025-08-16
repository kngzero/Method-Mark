import React from 'react';
import styles from './GridOverlay.module.css';

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
  const safeOffset = margin + safeMargin;
  return (
    <div className={`gridOverlay ${styles.overlay}`}>
      <div
        className={styles.inner}
        style={{
          left: margin,
          top: margin,
          width: width - margin * 2,
          height: height - margin * 2,
          backgroundImage: bgImages.join(','),
        }}
      ></div>
      {showSafeMargin && safeMargin > 0 && (
        <div
          className={styles.safe}
          style={{
            left: safeOffset,
            top: safeOffset,
            width: width - safeOffset * 2,
            height: height - safeOffset * 2,
          }}
        ></div>
      )}
    </div>
  );
}
