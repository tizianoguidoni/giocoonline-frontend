// Inventario dei negozi del villaggio
export const SHOPS = {
  fabbro: {
    name: 'Fabbro',
    keeper: 'Maestro Fabbro',
    greeting:
      'Benvenuto nella mia forgia. Le lame migliori del regno nascono qui.',
    items: [
      { id: 'spada_ferro', name: 'Spada di Ferro', price: 80, icon: 'sword' },
      { id: 'spada_acciaio', name: "Spada d'Acciaio", price: 220, icon: 'sword' },
      { id: 'scudo', name: 'Scudo', price: 120, icon: 'shield' },
      { id: 'armatura', name: 'Armatura Leggera', price: 300, icon: 'armor' },
      { id: 'riparazione', name: 'Riparazione Equipaggiamento', price: 40, icon: 'tool' },
    ],
  },
  mago: {
    name: 'Mercante Magico',
    keeper: 'Mago Anziano',
    greeting: 'La magia è ovunque, basta saperla vedere.',
    items: [
      { id: 'pozione_mana', name: 'Pozione del Mana', price: 50, icon: 'potion-blue' },
      { id: 'pozione_vita', name: 'Pozione della Salute', price: 45, icon: 'potion-red' },
      { id: 'pergamena', name: 'Pergamena Antica', price: 90, icon: 'scroll' },
      { id: 'cristallo', name: 'Cristallo Magico', price: 180, icon: 'crystal' },
    ],
  },
  cibo: {
    name: 'Bancarella del Cibo',
    keeper: 'Venditore Allegro',
    greeting:
      'Cibo caldo e fresco! Riempi la pancia prima di partire all’avventura!',
    items: [
      { id: 'pane', name: 'Pane', price: 5, icon: 'bread', effect: '+10 HP' },
      { id: 'carne', name: 'Carne Arrosto', price: 15, icon: 'meat', effect: '+30 HP' },
      { id: 'formaggio', name: 'Formaggio', price: 8, icon: 'cheese', effect: '+15 HP' },
      { id: 'zuppa', name: 'Zuppa Calda', price: 12, icon: 'soup', effect: '+20 HP, bonus temp.' },
    ],
  },
};
