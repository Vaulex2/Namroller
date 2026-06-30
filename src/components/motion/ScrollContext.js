import { createContext, useContext } from 'react';

/* Holds the app's scroll container ref. The app scrolls an inner <div>
   (not the window), so scroll-aware animations must observe this element
   as their root/container. See App.jsx. */
export const ScrollContext = createContext({ current: null });

export const useScrollContainer = () => useContext(ScrollContext);
