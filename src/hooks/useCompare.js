import React from 'react';

/* Shared context + hook for the product comparison shortlist. The Provider
   (with its state/persistence logic) lives in context/CompareContext.jsx;
   this module holds the non-component pieces so both can be imported without
   tripping fast-refresh's component-only rule (mirrors ScrollContext.js). */

export const STORAGE_KEY = 'nr-compare';
export const MAX_COMPARE = 4;

export const CompareContext = React.createContext(null);

export function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
}

export function useCompare() {
  const ctx = React.useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within a CompareProvider');
  return ctx;
}
