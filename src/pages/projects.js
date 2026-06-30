/* Completed-project locations for the interactive Uzbekistan map.
   x / y are percentage offsets within the map container, positioned over the
   UzbekistanMap silhouette. They are eyeballed (the silhouette is a stylised
   potrace outline, not a geodetic projection) — nudge if a pin drifts off-shape.
   Translatable copy (city, project name, type, capacity) lives in i18n under
   projects.items.{id}.*; year/icon are language-neutral. */
export const NR_PROJECTS = [
  { id: 'tashkent',  x: 78, y: 51, year: '2023', icon: 'factory' },
  { id: 'samarkand', x: 62, y: 62, year: '2021', icon: 'package' },
  { id: 'bukhara',   x: 50, y: 62, year: '2022', icon: 'cog' },
  { id: 'navoi',     x: 54, y: 59, year: '2024', icon: 'flame' },
  { id: 'nukus',     x: 27, y: 42, year: '2020', icon: 'truck' },
  { id: 'andijan',   x: 91, y: 54.5, year: '2023', icon: 'gauge' },
  { id: 'termez',    x: 63, y: 80, year: '2022', icon: 'shield' },
  { id: 'fergana',   x: 88, y: 56.5, year: '2024', icon: 'flame' },
  { id: 'namangan',  x: 85, y: 51.5, year: '2023', icon: 'grid' },
  { id: 'jizzakh',   x: 66.4, y: 59.3, year: '2021', icon: 'cog' },
  { id: 'gulistan',  x: 70.9, y: 56.7, year: '2020', icon: 'truck' },
  { id: 'qarshi',    x: 56.6, y: 68.2, year: '2023', icon: 'factory' },
  { id: 'urgench',   x: 31.8, y: 49.1, year: '2021', icon: 'wrench' },
  { id: 'zarafshan', x: 48.9, y: 48.9, year: '2024', icon: 'cube' },
];
