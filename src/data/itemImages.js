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
  wooden_sword:        SWORD_FALLBACK,
  iron_sword:          SWORD_FALLBACK,
  steel_sword:         'https://images.pexels.com/photos/1383766/pexels-photo-1383766.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  silver_blade:        'https://images.pexels.com/photos/1383766/pexels-photo-1383766.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
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
  shortsword:          SWORD_FALLBACK,
  warhammer:           'https://images.unsplash.com/photo-1661685991719-f56055164620?w=150&h=150&fit=crop',
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
  wooden_shield:       SHIELD_FALLBACK,
  iron_shield:         SHIELD_FALLBACK,
  steel_shield:        'https://images.pexels.com/photos/7695127/pexels-photo-7695127.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  tower_shield:        'https://images.pexels.com/photos/7695127/pexels-photo-7695127.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  dragon_shield:       'https://images.unsplash.com/photo-1686747506706-67418fbd612c?w=150&h=150&fit=crop',
  aegis:               ICON('aegis'),

  // ─── HELMETS ─────────────────────────────────────────
  leather_cap:         HELMET_FALLBACK,
  iron_helmet:         HELMET_FALLBACK,
  steel_helmet:        'https://images.unsplash.com/photo-1600081522768-cb2e80ed4491?w=150&h=150&fit=crop',
  knight_helmet:       'https://images.unsplash.com/photo-1600081522768-cb2e80ed4491?w=150&h=150&fit=crop',
  dragon_helmet:       ICON('dragon_helmet'),
  crown_of_kings:      ICON('divine_crown'),
  divine_crown:        ICON('divine_crown'),

  // ─── BODY ARMOR ──────────────────────────────────────
  cloth_armor:         ARMOR_FALLBACK,
  leather_armor:       ARMOR_FALLBACK,
  chainmail:           ARMOR_FALLBACK,
  plate_armor:         ARMOR_FALLBACK,
  dragon_scale_armor:  ARMOR_FALLBACK,
  divine_plate:        ICON('divine_plate'),

  // ─── POTIONS ─────────────────────────────────────────
  small_health_potion: POTION_FALLBACK,
  medium_health_potion:POTION_FALLBACK,
  large_health_potion: 'https://images.pexels.com/photos/417049/pexels-photo-417049.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  small_mana_potion:   POTION_FALLBACK,
  medium_mana_potion:  POTION_FALLBACK,
  large_mana_potion:   'https://images.pexels.com/photos/417049/pexels-photo-417049.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',

  // ─── GEMS ────────────────────────────────────────────
  ruby:                GEM_FALLBACK,
  sapphire:            'https://images.unsplash.com/photo-1705575420317-daaed2ab4cf3?w=150&h=150&fit=crop',
  emerald:             'https://images.unsplash.com/photo-1705575420317-daaed2ab4cf3?w=150&h=150&fit=crop',
  diamond:             'https://images.pexels.com/photos/7568017/pexels-photo-7568017.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  legendary_gem:       'https://images.unsplash.com/photo-1772047678445-46c849baf7c5?w=150&h=150&fit=crop',

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
