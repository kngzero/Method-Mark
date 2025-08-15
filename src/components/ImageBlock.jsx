import React from 'react';

export default function ImageBlock({ url, alt }) {
  if (!url) return null;
  return (
    <img
      src={url}
      alt={alt}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}
