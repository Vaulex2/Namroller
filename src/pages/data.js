// Shared pool of vertical manufacturing clips (posters live in /public/posters).
// Any product reuses three of these for its detail-page thumbnail strip.
const V = (name) => ({ src: `/${name}.mp4`, poster: `/posters/${name}.jpg` });
const CLIPS = [
  V('video_2026-06-28_00-30-36'), // 0
  V('video_2026-06-28_00-30-40'), // 1
  V('video_2026-06-28_00-31-03'), // 2
  V('IMG_1823'),                  // 3
  V('video_2026-06-28_22-46-37'), // 4
  V('video_2026-06-28_22-47-34'), // 5
  V('video_2026-06-28_22-48-05'), // 6
  V('IMG_0948'),                  // 7
  V('IMG_8870'),                  // 8
];

export const NR_PRODUCTS = [
  {
    id: 'trough-idler',
    name: 'Trough idler set',
    icon: 'package',
    image: '/Gemini_Generated_Image_ceyruwceyruwceyr.png',
    // Detail-page thumbnail strip clips (replace the static photos).
    videos: [CLIPS[0], CLIPS[1], CLIPS[2]],
    cat: 'Idlers',
    blurb: 'Three-roll station for bulk material on inclined and horizontal belts.',
    diameter: '89–159',
    load: '1,200',
    // Icon arrays drive the editorial sections; prose lives in i18n (pd.{id}.*).
    // Keep array lengths equal to the matching i18n arrays.
    content: {
      process:  ['package', 'cog', 'flame', 'check'],
      features: ['shield', 'gauge', 'ruler', 'cog'],
    },
    specs: [
      { label: 'Roller diameter', value: '89 / 108 / 133 / 159', unit: 'mm' },
      { label: 'Trough angle', value: '20° / 30° / 35°' },
      { label: 'Tube material', value: 'St37 seamless steel' },
      { label: 'Bearing', value: '6204 / 6205 2Z' },
      { label: 'Max. load per set', value: '1,200', unit: 'N' },
      { label: 'Belt width range', value: '500–1400', unit: 'mm' },
    ],
  },
  {
    id: 'return-roller',
    name: 'Return roller',
    icon: 'cog',
    image: '/Gemini_Generated_Image_nwrnx8nwrnx8nwrn.png',
    videos: [CLIPS[3], CLIPS[4], CLIPS[5]],
    cat: 'Idlers',
    blurb: 'Single-roll support for the belt\'s return run. Rubber-disc option for sticky materials.',
    diameter: '108–159',
    load: '900',
    content: {
      process:  ['package', 'cog', 'wrench', 'check'],
      features: ['shield', 'cog', 'gauge', 'truck'],
    },
    specs: [
      { label: 'Roller diameter', value: '108 / 133 / 159', unit: 'mm' },
      { label: 'Tube wall', value: '4.0–5.0', unit: 'mm' },
      { label: 'Surface', value: 'Plain / rubber disc' },
      { label: 'Bearing', value: '6204 2Z' },
      { label: 'Max. load', value: '900', unit: 'N' },
      { label: 'Shaft', value: 'Ø20 / Ø25', unit: 'mm' },
    ],
  },
  {
    id: 'impact-roller',
    name: 'Impact roller',
    icon: 'shield',
    image: '/Gemini_Generated_Image_ut769gut769gut76.png',
    videos: [CLIPS[6], CLIPS[7], CLIPS[8]],
    cat: 'Idlers',
    blurb: 'Rubber-ringed rollers that absorb load shock at transfer and loading points.',
    diameter: '133–194',
    load: '2,000',
    content: {
      process:  ['package', 'flame', 'wrench', 'check'],
      features: ['shield', 'gauge', 'cog', 'package'],
    },
    specs: [
      { label: 'Roller diameter (over rings)', value: '133 / 159 / 194', unit: 'mm' },
      { label: 'Ring material', value: 'Vulcanised rubber, 65 Sh' },
      { label: 'Tube', value: 'St37 steel core' },
      { label: 'Bearing', value: '6205 / 6306 2Z' },
      { label: 'Max. impact load', value: '2,000', unit: 'N' },
      { label: 'Service', value: 'Loading / transfer zones' },
    ],
  },
  {
    id: 'guide-roller',
    name: 'Guide / training roller',
    icon: 'ruler',
    image: '/Gemini_Generated_Image_9486qg9486qg9486.png',
    videos: [CLIPS[0], CLIPS[3], CLIPS[6]],
    cat: 'Idlers',
    blurb: 'Self-aligning rollers that correct belt tracking and prevent edge wear.',
    diameter: '108–133',
    load: '1,000',
    content: {
      process:  ['package', 'cog', 'wrench', 'check'],
      features: ['ruler', 'cog', 'shield', 'gauge'],
    },
    specs: [
      { label: 'Roller diameter', value: '108 / 133', unit: 'mm' },
      { label: 'Pivot', value: 'Central swivel bearing' },
      { label: 'Vertical guide rolls', value: '2 × Ø89', unit: 'mm' },
      { label: 'Bearing', value: '6204 2Z' },
      { label: 'Max. load', value: '1,000', unit: 'N' },
      { label: 'Belt width range', value: '650–1200', unit: 'mm' },
    ],
  },
  {
    id: 'drive-pulley',
    name: 'Drive & tail pulley',
    icon: 'gauge',
    image: '/Gemini_Generated_Image_yk8ax7yk8ax7yk8a.png',
    videos: [CLIPS[1], CLIPS[4], CLIPS[7]],
    cat: 'Pulleys',
    blurb: 'Lagged and bare pulleys for head, tail and take-up positions.',
    diameter: '250–630',
    load: '—',
    content: {
      process:  ['package', 'cog', 'flame', 'check'],
      features: ['gauge', 'shield', 'cog', 'wrench'],
    },
    specs: [
      { label: 'Pulley diameter', value: '250 / 320 / 400 / 500 / 630', unit: 'mm' },
      { label: 'Lagging', value: 'Plain / diamond rubber 10–14 mm' },
      { label: 'Shaft', value: 'C45 turned, keyed' },
      { label: 'Bearing housing', value: 'SN / SNL plummer block' },
      { label: 'Balancing', value: 'Static / dynamic on request' },
      { label: 'Face width', value: 'to suit belt + 100', unit: 'mm' },
    ],
  },
  {
    id: 'complete-system',
    name: 'Complete conveyor system',
    icon: 'factory',
    image: '/Gemini_Generated_Image_moick5moick5moic.png',
    videos: [CLIPS[2], CLIPS[5], CLIPS[8]],
    cat: 'Systems',
    blurb: 'Engineered belt conveyors — frame, idlers, pulleys, drive and structure, supplied and installed.',
    diameter: '—',
    load: '—',
    content: {
      process:  ['ruler', 'factory', 'truck', 'check'],
      features: ['factory', 'gauge', 'shield', 'truck'],
    },
    specs: [
      { label: 'Belt width', value: '500–1400', unit: 'mm' },
      { label: 'Capacity', value: 'up to 12,000', unit: 't/day' },
      { label: 'Length per flight', value: 'up to 120', unit: 'm' },
      { label: 'Drive', value: 'Geared motor, 5.5–110', unit: 'kW' },
      { label: 'Structure', value: 'Galvanised / painted steel' },
      { label: 'Scope', value: 'Design · fabrication · installation' },
    ],
  },
];
