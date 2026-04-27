// Item images for Mythic Arena
// Local icons from rpg_icons_pack take priority over Pexels/Unsplash fallbacks

// Base path for local icons in /public/icons/
const ICON = (name) => `/icons/${name}.png`;

// Pexels/Unsplash fallbacks for items without custom icons
const SWORD_FALLBACK = 'https://images.pexels.com/photos/6414375/pexels-photo-6414375.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
const DAGGER_FALLBACK = 'https://images.pexels.com/photos/7540069/pexels-photo-7540069.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
const SHIELD_FALLBACK = 'https://images.pexels.com/photos/161936/knight-armor-helmet-weapons-161936.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
const HELMET_FALLBACK = 'https://images.unsplash.com/photo-1720480755725-20e543df8a05?w=150&h=150&fit=crop';
const ARMOR_FALLBACK = 'https://images.pexels.com/photos/161936/knight-armor-helmet-weapons-161936.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
const POTION_FALLBACK = 'https://images.pexels.com/photos/3151984/pexels-photo-3151984.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
const GEM_FALLBACK = 'https://images.pexels.com/photos/6625934/pexels-photo-6625934.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
const ORE_FALLBACK = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop';

export const ITEM_IMAGES = {
  // ─── SWORDS ──────────────────────────────────────────
  wooden_sword:        ICON('wooden_sword'),
  iron_sword:          ICON('iron_sword'),
  steel_sword:         ICON('steel_sword'),
  silver_blade:        ICON('silver_blade'),
  flame_sword:         ICON('flame_sword'),
  dragon_slayer:       ICON('dragon_slayer'),
  frost_brand:         ICON('frost_brand'),
  excalibur:           ICON('excalibur'),
  shadow_blade:        ICON('shadow_blade'),
  soul_reaper:         ICON('soul_reaper'),
  godslayer:           ICON('godslayer'),
  admin_excalibur:     ICON('excalibur'),
  creator_blade:       ICON('void_sword'),
  void_sword:          ICON('void_sword'),

  // ─── IN-GAME WEAPONS (Labirinto) ────────────────────
  shortsword:          ICON('shortsword'),
  warhammer:           ICON('warhammer'),
  runebow:             ICON('runebow'),
  magestaff:           ICON('magestaff'),
  soulblade:           ICON('soul_reaper'),

  // ─── DAGGERS ─────────────────────────────────────────
  wooden_dagger:       DAGGER_FALLBACK,
  iron_dagger:         DAGGER_FALLBACK,
  steel_dagger:        DAGGER_FALLBACK,
  assassin_blade:      'https://images.pexels.com/photos/5064698/pexels-photo-5064698.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  shadow_dagger:       ICON('shadow_dagger'),
  death_whisper:       ICON('death_whisper'),

  // ─── SHIELDS ─────────────────────────────────────────
  wooden_shield:       ICON('aegis'),
  iron_shield:         ICON('aegis'),
  steel_shield:        ICON('aegis'),
  tower_shield:        ICON('aegis'),
  dragon_shield:       ICON('aegis'),
  aegis:               ICON('aegis'),

  // ─── HELMETS ─────────────────────────────────────────
  leather_cap:         ICON('dragon_helmet'),
  iron_helmet:         ICON('dragon_helmet'),
  steel_helmet:        ICON('dragon_helmet'),
  knight_helmet:       ICON('dragon_helmet'),
  dragon_helmet:       ICON('dragon_helmet'),
  crown_of_kings:      ICON('divine_crown'),
  divine_crown:        ICON('divine_crown'),

  // ─── BODY ARMOR ──────────────────────────────────────
  cloth_armor:         ICON('divine_plate'),
  leather_armor:       ICON('divine_plate'),
  chainmail:           ICON('divine_plate'),
  plate_armor:         ICON('divine_plate'),
  dragon_scale_armor:  ICON('divine_plate'),
  divine_plate:        ICON('divine_plate'),

  // ─── POTIONS ─────────────────────────────────────────
  small_health_potion: POTION_FALLBACK,
  medium_health_potion:POTION_FALLBACK,
  large_health_potion: 'https://images.pexels.com/photos/417049/pexels-photo-417049.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  small_mana_potion:   POTION_FALLBACK,
  medium_mana_potion:  POTION_FALLBACK,
  large_mana_potion:   'https://images.pexels.com/photos/417049/pexels-photo-417049.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',

  // ─── GEMS ────────────────────────────────────────────
  ruby:                '/assets/icons/gem.png',
  sapphire:            '/assets/icons/gem.png',
  emerald:             '/assets/icons/gem.png',
  diamond:             '/assets/icons/gem.png',
  legendary_gem:       '/assets/icons/gem.png',

  // ─── MATERIALS ───────────────────────────────────────
  iron_ore:            ORE_FALLBACK,
  silver_ore:          ORE_FALLBACK,
  gold_ore:            'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=150&h=150&fit=crop',
  mithril_ore:         'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=150&h=150&fit=crop',
  dragon_scale:        'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=150&h=150&fit=crop',
  phoenix_feather:     ORE_FALLBACK,
};

// Default image for items without specific images
export const DEFAULT_ITEM_IMAGE = SWORD_FALLBACK;

// Get item image with fallback
export function getItemImage(itemId) {
  return ITEM_IMAGES[itemId] || DEFAULT_ITEM_IMAGE;
}
