import React from 'react';
import styles from './Button.module.css';

export default function Button({ variant = 'secondary', className = '', disabled = false, ...props }) {
  const classes = [styles.button, styles[variant]];
  if (disabled) classes.push(styles.disabled);
  if (className) classes.push(className);
  return <button {...props} disabled={disabled} className={classes.join(' ')} />;
}
