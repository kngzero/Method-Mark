import React from 'react';

export default function Checklist({ items, auto, manual, onManualChange }) {
  return (
    <div>
      {items.map(it => {
        const checked = auto[it] || manual[it];
        return (
          <div key={it} className="row" style={{ justifyContent:'flex-start' }}>
            <input
              type="checkbox"
              checked={checked}
              disabled={auto[it]}
              onChange={e=>onManualChange(it, e.target.checked)}
            />
            <span>{it}</span>
          </div>
        );
      })}
    </div>
  );
}
