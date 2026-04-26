// SeasonPassSystem.js
// Manages the 10 seasons roadmap and rewards.

const XP_PER_LEVEL = 1000;
const MAX_LEVEL = 50;

// Base rewards that cycle through seasons
const WEAPONS = ['shortsword', 'warhammer', 'runebow', 'magestaff', 'soulblade'];
const ARMORS = ['Leather', 'Iron', 'Steel', 'Mithril', 'Adamantite', 'Dragon', 'Void', 'Celestial', 'Abyssal', 'Mythic'];
const PROJECTS = ['Double Jump Boots', 'Aura Emitter', 'Gem Magnet', 'Health Regen Ring', 'Mana Core', 'Gold Duplicator', 'Shadow Cloak', 'Phoenix Feather', 'Time Relic', 'Admin Crown'];

export const SEASONS = Array.from({ length: 10 }).map((_, i) => {
  const seasonNumber = i + 1;
  const rewards = Array.from({ length: MAX_LEVEL }).map((_, levelIndex) => {
    const level = levelIndex + 1;
    
    // Free rewards (every 5 levels)
    let freeReward = null;
    if (level % 5 === 0) {
      freeReward = { type: 'gold', amount: level * 100 };
    }
    if (level === 10) freeReward = { type: 'gems', amount: 50 };
    if (level === 50) freeReward = { type: 'weapon', id: WEAPONS[i % WEAPONS.length] };

    // Premium rewards (every level)
    let premiumReward = { type: 'gold', amount: level * 200 };
    if (level % 3 === 0) premiumReward = { type: 'gems', amount: 30 };
    if (level % 10 === 0) premiumReward = { type: 'armor', name: `${ARMORS[i]} Armor Piece` };
    if (level === 25) premiumReward = { type: 'project', name: PROJECTS[i] };
    if (level === 50) premiumReward = { type: 'weapon', id: WEAPONS[(i + 1) % WEAPONS.length], name: `Premium ${WEAPONS[(i + 1) % WEAPONS.length]}` };

    return { level, freeReward, premiumReward };
  });

  return {
    id: `season_${seasonNumber}`,
    name: `Season ${seasonNumber}: The ${ARMORS[i]} Age`,
    durationDays: 60,
    price: 5.99,
    rewards
  };
});

export class SeasonPassSystem {
  constructor(game) {
    this.game = game;
    this.currentSeasonIndex = 0; // Starts at Season 1
    this.isPremium = false;
    this.xp = 0;
    this.level = 1;
    this.claimedFree = new Set();
    this.claimedPremium = new Set();
  }

  get currentSeason() {
    return SEASONS[this.currentSeasonIndex];
  }

  addXP(amount) {
    if (this.level >= MAX_LEVEL) return;
    this.xp += amount;
    
    let leveledUp = false;
    while (this.xp >= XP_PER_LEVEL && this.level < MAX_LEVEL) {
      this.xp -= XP_PER_LEVEL;
      this.level += 1;
      leveledUp = true;
    }

    if (leveledUp && this.game) {
      this.game.onEvent({ type: 'toast', text: `🎉 Level Up! Season Pass Lv.${this.level}` });
      // In a real app, we'd sync this state with the backend
    }
  }

  claimReward(level, type) {
    const isPremiumReward = type === 'premium';
    const claimedSet = isPremiumReward ? this.claimedPremium : this.claimedFree;
    
    if (level > this.level) return { ok: false, reason: 'Level not reached yet.' };
    if (claimedSet.has(level)) return { ok: false, reason: 'Already claimed.' };
    if (isPremiumReward && !this.isPremium) return { ok: false, reason: 'Requires Premium Pass.' };

    const rewardObj = this.currentSeason.rewards.find(r => r.level === level);
    if (!rewardObj) return { ok: false, reason: 'Invalid level.' };

    const reward = isPremiumReward ? rewardObj.premiumReward : rewardObj.freeReward;
    if (!reward) return { ok: false, reason: 'No reward at this level.' };

    // Apply reward
    if (reward.type === 'gold') this.game.player.pocketMoney += reward.amount;
    if (reward.type === 'gems') this.game.player.gems += reward.amount;
    if (reward.type === 'weapon') this.game.weapons.ownWeapon(reward.id);
    if (reward.type === 'armor' || reward.type === 'project') {
      // For now just add a toast, inventory needs an expansion for these items
      this.game.onEvent({ type: 'toast', text: `Unloked: ${reward.name}` });
    }

    claimedSet.add(level);
    this.game._updateUI();
    return { ok: true };
  }

  purchasePremium() {
    this.isPremium = true;
    this.game.onEvent({ type: 'toast', text: `🌟 Premium Pass Activated!` });
    this.game._updateUI();
  }

  getState() {
    return {
      season: this.currentSeason,
      level: this.level,
      xp: this.xp,
      xpRequired: XP_PER_LEVEL,
      isPremium: this.isPremium,
      claimedFree: Array.from(this.claimedFree),
      claimedPremium: Array.from(this.claimedPremium)
    };
  }

  // Load state from backend/local storage
  loadState(state) {
    if (!state) return;
    if (state.currentSeasonIndex !== undefined) this.currentSeasonIndex = state.currentSeasonIndex;
    if (state.isPremium !== undefined) this.isPremium = state.isPremium;
    if (state.xp !== undefined) this.xp = state.xp;
    if (state.level !== undefined) this.level = state.level;
    if (state.claimedFree) this.claimedFree = new Set(state.claimedFree);
    if (state.claimedPremium) this.claimedPremium = new Set(state.claimedPremium);
  }
}
