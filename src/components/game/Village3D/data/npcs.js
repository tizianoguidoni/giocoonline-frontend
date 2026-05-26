// Dati statici degli NPC interattivi del villaggio

/**
 * @typedef {Object} InteractiveNPC
 * @property {string} id - Unique identifier.
 * @property {string} name - Character name.
 * @property {string} color - Outfit material color.
 * @property {string} hatColor - Hat material color.
 * @property {string} dialog - Dialogue text.
 * @property {number[]} position - Initial 3D spawn coordinate [x, y, z].
 */

/** @type {InteractiveNPC[]} */
export const INTERACTIVE_NPCS = [
  {
    id: 'vecchio',
    name: 'Vecchio Distratto',
    color: '#8b6f4e',
    hatColor: '#4a3520',
    dialog: 'Ho perso i miei occhiali da qualche parte nel villaggio. Senza quelli scambio perfino i cani per pecore.',
    position: [-15, 0, 8],
  },
  {
    id: 'apprendista',
    name: 'Ragazzo Apprendista',
    color: '#3a4a8a',
    hatColor: '#1f2a5a',
    dialog: 'Un giorno diventerò il mago più potente del regno. Per ora riesco solo ad accendere candele.',
    position: [18, 0, -10],
  },
  {
    id: 'contadina',
    name: 'Contadina',
    color: '#a85c3d',
    hatColor: '#d4b483',
    dialog: "Quest'anno il raccolto è stato ottimo. Finalmente niente zuppa annacquata.",
    position: [-12, 0, -18],
  },
  {
    id: 'guardia',
    name: 'Guardia',
    color: '#2f3a4a',
    hatColor: '#6b6b6b',
    dialog: 'Mantieni la calma e non creare problemi. Il capitano ci osserva.',
    position: [10, 0, 20],
  },
  {
    id: 'viaggiatore',
    name: 'Viaggiatore',
    color: '#5a3a2a',
    hatColor: '#3a2415',
    dialog: 'Ho attraversato tre regni per arrivare qui. E devo dire che il pane locale è eccellente.',
    position: [-22, 0, -2],
  },
];

/**
 * Helper function to determine NPC behavior to avoid nested ternary warning.
 * @param {number} index - The index of the ambient NPC.
 * @returns {string} The behavior type ('sit', 'idle', or 'walk').
 */
function getBehavior(index) {
  if (index % 4 === 0) {
    return 'sit';
  }
  if (index % 5 === 0) {
    return 'idle';
  }
  return 'walk';
}

/**
 * @typedef {Object} AmbientNPC
 * @property {string} id - Unique identifier.
 * @property {string} color - Outfit material color.
 * @property {string} hatColor - Hat material color.
 * @property {number[]} startPos - 3D starting coordinates.
 * @property {number} pathRadius - Random movement path radius.
 * @property {number} speed - Walking/idle movement speed.
 * @property {number} phase - Trigonometric phase shift.
 * @property {string} behavior - The behavior mode.
 */

/** @type {AmbientNPC[]} */
export const AMBIENT_NPCS = Array.from({ length: 22 }, (_, i) => {
  const angle = (i / 22) * Math.PI * 2;
  const radius = 8 + Math.random() * 22;
  const palette = ['#7a4d3a', '#3a5a7a', '#5a3a5a', '#3a6a4a', '#7a6a3a', '#4a3a3a', '#6a3a4a'];
  return {
    id: `amb-${i}`,
    color: palette[i % palette.length],
    hatColor: '#2a2a2a',
    startPos: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
    pathRadius: 2 + Math.random() * 6,
    speed: 0.4 + Math.random() * 0.6,
    phase: Math.random() * Math.PI * 2,
    behavior: getBehavior(i), // Resolves the nested ternary issue cleanly
  };
});
