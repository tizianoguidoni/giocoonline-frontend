// Item images for Mythic Arena
// Local icons from rpg_icons_pack take priority over Pexels/Unsplash fallbacks

// Base paths for local categorized icons
const SPADA = (name) => `/icons/spade/${name}.png`;
const ARMA = (name) => `/icons/armi_varie/${name}.png`;
const SCUDO = (name) => `/icons/scudi/${name}.png`;
const ELMO = (name) => `/icons/elmi/${name}.png`;
const ARMATURA = (name) => `/icons/armature/${name}.png`;
const GEMMA = (name) => `/icons/gemme/${name}.png`;
const POZIONE = (name) => `/icons/pozioni/${name}.png`;
const ZAINO = (name) => `/icons/zaini/${name}.png`;
const METALLO = (name) => `/icons/metalli/${name}.png`;
const SPECIALE = (name) => `/icons/speciali/${name}.png`;

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
  wooden_sword:        SPADA('wooden_sword'),
  iron_sword:          SPADA('iron_sword'),
  steel_sword:         SPADA('steel_sword'),
  silver_blade:        SPADA('silver_blade'),
  flame_sword:         SPADA('flame_sword'),
  dragon_slayer:       SPADA('dragon_slayer'),
  frost_brand:         SPADA('frost_brand'),
  excalibur:           SPADA('excalibur'),
  shadow_blade:        SPADA('shadow_blade'),
  soul_reaper:         ARMA('soul_reaper'),
  godslayer:           SPADA('godslayer'),
  admin_excalibur:     SPADA('excalibur'),
  creator_blade:       SPADA('void_sword'),
  void_sword:          SPADA('void_sword'),

  // ─── IN-GAME WEAPONS (Labirinto) ────────────────────
  shortsword:          '/assets/icons/shortsword.png',
  warhammer:           '/assets/icons/warhammer.png',
  runebow:             '/assets/icons/runebow.png',
  magestaff:           '/assets/icons/magestaff.png',
  soulblade:           '/assets/icons/soulblade.png',

  // ─── DAGGERS ─────────────────────────────────────────
  wooden_dagger:       DAGGER_FALLBACK,
  iron_dagger:         DAGGER_FALLBACK,
  steel_dagger:        DAGGER_FALLBACK,
  assassin_blade:      'https://images.pexels.com/photos/5064698/pexels-photo-5064698.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  shadow_dagger:       ARMA('shadow_dagger'),
  death_whisper:       ARMA('death_whisper'),

  // ─── SHIELDS ─────────────────────────────────────────
  wooden_shield:       SCUDO('aegis'),
  iron_shield:         SCUDO('aegis'),
  steel_shield:        SCUDO('aegis'),
  tower_shield:        SCUDO('aegis'),
  dragon_shield:       SCUDO('aegis'),
  aegis:               SCUDO('aegis'),

  // ─── HELMETS ─────────────────────────────────────────
  leather_cap:         ELMO('dragon_helmet'),
  iron_helmet:         ELMO('dragon_helmet'),
  steel_helmet:        ELMO('dragon_helmet'),
  knight_helmet:       ELMO('dragon_helmet'),
  dragon_helmet:       ELMO('dragon_helmet'),
  crown_of_kings:      ELMO('divine_crown'),
  divine_crown:        ELMO('divine_crown'),

  // ─── BODY ARMOR ──────────────────────────────────────
  cloth_armor:         ARMATURA('divine_plate'),
  leather_armor:       ARMATURA('divine_plate'),
  chainmail:           ARMATURA('divine_plate'),
  plate_armor:         ARMATURA('divine_plate'),
  dragon_scale_armor:  ARMATURA('divine_plate'),
  divine_plate:        ARMATURA('divine_plate'),

  // ─── POTIONS ─────────────────────────────────────────
  small_health_potion: POZIONE('hp_small'),
  medium_health_potion: POZIONE('hp_medium'),
  large_health_potion: POZIONE('hp_large'),
  small_mana_potion:   POZIONE('mana_small'),
  medium_mana_potion:  POZIONE('mana_medium'),
  large_mana_potion:   POZIONE('mana_large'),

  // ─── GEMS ────────────────────────────────────────────
  ruby:                GEMMA('ruby'),
  sapphire:            GEMMA('sapphire'),
  emerald:             GEMMA('emerald'),
  diamond:             GEMMA('diamond'),
  legendary_gem:       GEMMA('diamond'), // Fallback

  // ─── MATERIALS ───────────────────────────────────────
  iron_ore:            METALLO('iron_ore'),
  silver_ore:          METALLO('silver_ore'),
  gold_ore:            METALLO('gold_ore'),
  mithril_ore:         METALLO('mithril_ore'),
  dragon_scale:        SPECIALE('dragon_scale'),
  phoenix_feather:     SPECIALE('phoenix_feather'),

  // ─── BACKPACKS ───────────────────────────────────────
  small_backpack:      ZAINO('backpack_small'),
  leather_backpack:    ZAINO('backpack_medium'),
  adventurer_backpack: ZAINO('backpack_large'),
  magical_backpack:    ZAINO('backpack_large'),
  
  // ─── SPECIAL ITEMS ───────────────────────────────────
  key:                 SPECIALE('key'),
};

// Default image for items without specific images
export const DEFAULT_ITEM_IMAGE = SWORD_FALLBACK;

// Get item image with fallback
export function getItemImage(itemId) {
  return ITEM_IMAGES[itemId] || DEFAULT_ITEM_IMAGE;
}
