import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Swords, Shield, Wand2, Heart, Package, Scroll, 
  Users, Trophy, MessageSquare, Send, LogOut,
  Zap, Crosshair, ShieldCheck, Sparkles, Settings,
  MapPin, Coins, Star, Crown, Target, Flame, 
  Skull, Eye, Award, Clock, ChevronRight, Globe,
  Home, Backpack, User, BarChart3, Hammer, Crown as AdminIcon,
  ShoppingBag, Shirt
} from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';
import InventoryPanel from '@/components/game/InventoryPanel';
import QuestsPanel from '@/components/game/QuestsPanel';
import ClanPanel from '@/components/game/ClanPanel';
import AdminPanel from '@/components/game/AdminPanel';
import CraftingPanel from '@/components/game/CraftingPanel';
import BossPanel from '@/components/game/BossPanel';
import ShopPanel from '@/components/game/ShopPanel';
import EquipmentPanel from '@/components/game/EquipmentPanel';
import Maze3D from '@/components/game/Maze3D';
import { SeasonPassUI } from '@/components/game/SeasonPassUI';
import { SEASONS } from '@/game/SeasonPassSystem';

// Avatar images for different classes
const CLASS_AVATARS = {
  warrior: 'https://images.unsplash.com/photo-1699500325919-8d5aaf21d0da?w=200&h=200&fit=crop',
  mage: 'https://images.unsplash.com/photo-1636005811079-ea1b09d86e5a?w=200&h=200&fit=crop',
  assassin: 'https://images.unsplash.com/photo-1541727261696-8680e53c1149?w=200&h=200&fit=crop',
  healer: 'https://images.unsplash.com/photo-1659489727971-4bbee4d4b312?w=200&h=200&fit=crop'
};

// Enemy images  
const ENEMY_IMAGES = {
  slime: 'https://images.unsplash.com/photo-1605979257913-1704eb7b6246?w=150&h=150&fit=crop',
  goblin: 'https://images.unsplash.com/photo-1761325684397-b91138faca5f?w=150&h=150&fit=crop',
  wolf: 'https://images.unsplash.com/photo-1615812214207-34e3be6812df?w=150&h=150&fit=crop',
  skeleton: 'https://images.unsplash.com/photo-1733519786430-e42dc635b1c2?w=150&h=150&fit=crop',
  orc_warrior: 'https://images.unsplash.com/photo-1770610973306-a09b57e6dc52?w=150&h=150&fit=crop',
  bandit: 'https://images.unsplash.com/photo-1624510220783-3f4c1f5b7e3d?w=150&h=150&fit=crop',
  dark_mage: 'https://images.unsplash.com/photo-1636005811079-ea1b09d86e5a?w=150&h=150&fit=crop',
  stone_golem: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&h=150&fit=crop',
  vampire: 'https://images.unsplash.com/photo-1509248961895-b4d7d2f5a9a8?w=150&h=150&fit=crop',
  demon: 'https://images.unsplash.com/photo-1770610973306-a09b57e6dc52?w=150&h=150&fit=crop'
};

const LOCATIONS = [
  { id: 'home', name: 'La tua Casa', icon: Home, description: 'Riposati e gestisci il tuo inventario' },
  { id: 'town', name: 'Città Centrale', icon: Crown, description: 'La capitale del regno' },
  { id: 'forest', name: 'Foresta Oscura', icon: MapPin, description: 'Piena di goblin e creature' },
  { id: 'dungeon', name: 'Dungeon Antico', icon: Skull, description: 'Pericolo alto, ricompense migliori' },
  { id: 'arena', name: 'Arena PvP', icon: Swords, description: 'Combatti altri giocatori' }
];

const SKILL_ICONS = {
  slash: Swords, shield_bash: Shield, battle_cry: Zap,
  fireball: Flame, ice_shard: Sparkles, arcane_barrier: ShieldCheck,
  backstab: Crosshair, poison_blade: Skull, vanish: Eye,
  heal: Heart, smite: Zap, blessing: Star
};

export default function GamePage() {
  const { t } = useTranslation();
  const { user, character, logout, refreshCharacter } = useAuth();
  const { 
    inventory, skills, chatMessages, quests,
    fetchChatHistory, sendChatMessage, performCombat,
    fetchInventory, fetchQuests, fetchSkills
  } = useGame();
  
  const [activeTab, setActiveTab] = useState('combat');
  const [chatInput, setChatInput] = useState('');
  const [chatChannel, setChatChannel] = useState('global');
  const [combatResult, setCombatResult] = useState(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const [enemies, setEnemies] = useState([]);
  const [currentEnemy, setCurrentEnemy] = useState(null);
  const [enemyHp, setEnemyHp] = useState(0);
  const [currentLocation, setCurrentLocation] = useState(LOCATIONS[0]);
  const [combatLog, setCombatLog] = useState([]);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [turnTimer, setTurnTimer] = useState(5);
  const [inCombat, setInCombat] = useState(false);
  const [isInMaze, setIsInMaze] = useState(false);
  const [showSeasonPass, setShowSeasonPass] = useState(false);
  const chatEndRef = useRef(null);

  // Mock season state for the UI
  const [mockSeasonState, setMockSeasonState] = useState({
    level: 1,
    xp: 0,
    xpRequired: 1000,
    isPremium: false,
    claimedFree: [],
    claimedPremium: []
  });

  // Fetch enemies from API
  useEffect(() => {
    const fetchEnemies = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/combat/enemies`);
        const enemiesWithImages = response.data.map(e => ({
          ...e,
          image: ENEMY_IMAGES[e.id] || 'https://images.unsplash.com/photo-1770610973306-a09b57e6dc52?w=150&h=150&fit=crop'
        }));
        setEnemies(enemiesWithImages);
        if (enemiesWithImages.length > 0) {
          setCurrentEnemy(enemiesWithImages[0]);
          setEnemyHp(enemiesWithImages[0].hp);
        }
      } catch (error) {
        console.error('Failed to fetch enemies:', error);
      }
    };
    fetchEnemies();
  }, []);

  useEffect(() => {
    fetchChatHistory(chatChannel);
    const interval = setInterval(() => fetchChatHistory(chatChannel), 5000);
    return () => clearInterval(interval);
  }, [chatChannel, fetchChatHistory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Combat timer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (inCombat && turnTimer > 0) {
      const timer = setTimeout(() => setTurnTimer(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (inCombat && turnTimer === 0) {
      // Auto attack when time runs out
      handleCombat();
      setTurnTimer(5);
    }
  }, [inCombat, turnTimer]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    try {
      await sendChatMessage(chatInput, chatChannel);
      setChatInput('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const startCombat = (enemy) => {
    setCurrentEnemy(enemy);
    setEnemyHp(enemy.hp);
    setInCombat(true);
    setTurnTimer(5);
    setCombatLog([{ type: 'system', text: `Combattimento iniziato contro ${enemy.name}!` }]);
  };

  const handleCombat = async () => {
    if (isAttacking || !currentEnemy) return;
    setIsAttacking(true);
    setTurnTimer(5);
    
    try {
      const result = await performCombat(currentEnemy.id);
      
      // Update combat log
      const newLog = [
        { type: 'player', text: `Hai inflitto ${result.player_damage} danni!` },
        { type: 'enemy', text: `${currentEnemy.name} ti ha inflitto ${result.enemy_damage} danni!` }
      ];
      
      setCombatLog(prev => [...prev.slice(-8), ...newLog]);
      setCombatResult(result);
      
      if (result.victory) {
        toast.success(`${t('victory')} +${result.xp_gained} XP, +${result.gold_gained} Oro`);
        setCombatLog(prev => [...prev, { type: 'victory', text: `Hai sconfitto ${result.enemy_name}!` }]);
        setInCombat(false);
        setEnemyHp(0);
        
        if (result.level_up) {
          toast.success(`Livello aumentato! Ora sei Lv.${result.new_level}!`);
        }
        
        // Respawn new enemy after delay
        setTimeout(() => {
          if (enemies.length > 0) {
            const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
            setCurrentEnemy(randomEnemy);
            setEnemyHp(randomEnemy.hp);
          }
        }, 2000);
      } else {
        // Update enemy HP based on damage dealt
        const newEnemyHp = Math.max(0, enemyHp - result.player_damage);
        setEnemyHp(newEnemyHp);
      }
      
      await refreshCharacter();
      setTimeout(() => setCombatResult(null), 2000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Combattimento fallito');
    } finally {
      setIsAttacking(false);
    }
  };

  const xpForNextLevel = character?.level * 100;
  const xpProgress = character ? (character.xp / xpForNextLevel) * 100 : 0;
  const hpPercent = character ? (character.hp / character.max_hp) * 100 : 0;
  const manaPercent = character ? (character.mana / character.max_mana) * 100 : 0;
  const enemyHpPercent = currentEnemy ? (enemyHp / currentEnemy.hp) * 100 : 0;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0B0914] flex flex-col">
      {/* Top Navigation Bar - Apeha Style */}
      <header className="h-14 bg-[#161224]/90 border-b border-[#D4AF37]/20 flex items-center px-4 gap-4 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B58E29] flex items-center justify-center">
            <Swords className="w-4 h-4 text-[#0B0914]" />
          </div>
          <span className="text-lg font-bold text-[#D4AF37] hidden sm:block">Mythic Arena</span>
        </div>
        
        {/* Location Selector */}
        <div className="relative">
          <Button
            onClick={() => setShowLocationMenu(!showLocationMenu)}
            variant="ghost"
            className="text-white/80 hover:text-white gap-2"
            data-testid="location-btn"
          >
            <currentLocation.icon className="w-4 h-4 text-[#D4AF37]" />
            {currentLocation.name}
          </Button>
          
          {showLocationMenu && (
            <div className="absolute top-full left-0 mt-2 glass-panel rounded-lg p-2 min-w-[200px] z-50">
              {LOCATIONS.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => { setCurrentLocation(loc); setShowLocationMenu(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                    currentLocation.id === loc.id ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-white/70 hover:bg-white/5'
                  }`}
                  data-testid={`location-${loc.id}`}
                >
                  <loc.icon className="w-4 h-4" />
                  <div>
                    <p className="text-sm font-medium">{loc.name}</p>
                    <p className="text-xs text-[#6C667A]">{loc.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex-1" />
        
        {/* Quick Stats */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[#D4AF37] font-mono">{character?.gold || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#9D4CDD]" />
            <span className="text-[#9D4CDD] font-mono">Lv.{character?.level || 1}</span>
          </div>
        </div>
        
        <LanguageSelector />
        
        <Button
          variant="ghost"
          onClick={logout}
          className="text-[#E63946] hover:text-red-400 hover:bg-red-500/10"
          data-testid="logout-btn"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Character Panel */}
        <aside className="w-64 bg-[#161224]/80 border-r border-white/5 p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Character Card */}
          <div className="gold-framed-panel rounded-xl p-4" data-testid="player-stats-panel">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                  <img
                    src={CLASS_AVATARS[character?.char_class] || CLASS_AVATARS.warrior}
                    alt={character?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#9D4CDD] flex items-center justify-center text-xs font-bold text-white">
                  {character?.level}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold truncate">{character?.name}</h2>
                <p className="text-[#A19BAD] text-sm capitalize">
                  {t(character?.race)} {t(character?.char_class)}
                </p>
                <p className={`text-xs ${character?.reputation >= 0 ? 'text-[#2A9D8F]' : 'text-[#E63946]'}`}>
                  Rep: {character?.reputation || 0}
                </p>
              </div>
            </div>
            
            {/* HP Bar */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#E63946] flex items-center gap-1">
                    <Heart className="w-3 h-3" /> HP
                  </span>
                  <span className="text-white font-mono">{character?.hp}/{character?.max_hp}</span>
                </div>
                <div className="h-4 bg-black/50 rounded-full overflow-hidden border border-[#E63946]/30">
                  <motion.div 
                    className="h-full rounded-full bg-gradient-to-r from-[#E63946] to-[#ff6b6b]"
                    style={{ boxShadow: '0 0 10px rgba(230, 57, 70, 0.5)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${hpPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              
              {/* Mana Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#4361EE] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Mana
                  </span>
                  <span className="text-white font-mono">{character?.mana}/{character?.max_mana}</span>
                </div>
                <div className="h-4 bg-black/50 rounded-full overflow-hidden border border-[#4361EE]/30">
                  <motion.div 
                    className="h-full rounded-full bg-gradient-to-r from-[#4361EE] to-[#6b8cff]"
                    style={{ boxShadow: '0 0 10px rgba(67, 97, 238, 0.5)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${manaPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              
              {/* XP Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#9D4CDD] flex items-center gap-1">
                    <Star className="w-3 h-3" /> XP
                  </span>
                  <span className="text-white font-mono">{character?.xp}/{xpForNextLevel}</span>
                </div>
                <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-[#9D4CDD]/30">
                  <motion.div 
                    className="h-full rounded-full bg-gradient-to-r from-[#9D4CDD] to-[#c77dff]"
                    style={{ boxShadow: '0 0 10px rgba(157, 76, 221, 0.5)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="bg-black/30 rounded-lg p-2 text-center">
                <span className="text-[#D4AF37] font-bold">{character?.strength}</span>
                <p className="text-[#6C667A]">FOR</p>
              </div>
              <div className="bg-black/30 rounded-lg p-2 text-center">
                <span className="text-[#9D4CDD] font-bold">{character?.intelligence}</span>
                <p className="text-[#6C667A]">INT</p>
              </div>
              <div className="bg-black/30 rounded-lg p-2 text-center">
                <span className="text-[#2A9D8F] font-bold">{character?.agility}</span>
                <p className="text-[#6C667A]">AGI</p>
              </div>
              <div className="bg-black/30 rounded-lg p-2 text-center">
                <span className="text-[#6C667A] font-bold">{character?.defense}</span>
                <p className="text-[#6C667A]">DIF</p>
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="space-y-1">
            {[
              { id: 'combat', icon: Swords, label: 'Combattimento' },
              { id: 'bosses', icon: Skull, label: 'Boss' },
              { id: 'shop', icon: ShoppingBag, label: 'Negozio' },
              { id: 'equipment', icon: Shirt, label: 'Equipaggiamento' },
              { id: 'inventory', icon: Backpack, label: t('inventory') },
              { id: 'crafting', icon: Hammer, label: 'Crafting' },
              { id: 'quests', icon: Scroll, label: t('quests') },
              { id: 'clan', icon: Users, label: t('clan') },
              { id: 'leaderboard', icon: BarChart3, label: t('leaderboard') },
              { id: 'seasonpass', icon: Crown, label: 'Season Pass' },
              ...((user?.role === 'super_admin' || user?.role === 'co_admin') 
                ? [{ id: 'admin', icon: AdminIcon, label: 'Admin' }] 
                : [])
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'seasonpass') {
                    setShowSeasonPass(true);
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id && item.id !== 'seasonpass'
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30'
                    : item.id === 'seasonpass'
                    ? 'bg-gradient-to-r from-[#D4AF37]/10 to-[#B8860B]/10 text-[#D4AF37] hover:from-[#D4AF37]/20 border border-[#D4AF37]/20 shadow-[0_0_10px_rgba(212,175,55,0.1)]'
                    : 'text-[#A19BAD] hover:bg-white/5 hover:text-white'
                }`}
                data-testid={`nav-${item.id}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Combat/Game Area */}
          <div className="flex-1 overflow-auto p-4">
            <AnimatePresence mode="wait">
              {activeTab === 'combat' && (
                <motion.div
                  key="combat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full w-full relative"
                >
                  {isInMaze ? (
                    <Maze3D onExit={async (results) => {
                      setIsInMaze(false);
                      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
                      if (results && results.gold > 0) {
                        try {
                          const token = localStorage.getItem('token');
                          const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
                          await axios.post(`${baseUrl}/api/combat/maze-win`, { gold: results.gold }, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          toast.success(`+${results.gold}€ salvati!`);
                        } catch (err) { console.error(err); toast.error("Errore salvataggio!"); }
                      }
                    }} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                      <div className="max-w-2xl gold-framed-panel p-12 bg-black/60 backdrop-blur-md rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.15)]">
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="mb-8"
                        >
                          <Skull className="w-24 h-24 text-[#D4AF37] mx-auto mb-6 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
                          <h2 className="text-4xl font-black text-white tracking-[0.2em] uppercase mb-4">
                            IL LABIRINTO DI SANGUE
                          </h2>
                          <div className="h-1 w-32 bg-[#D4AF37] mx-auto mb-6" />
                          <p className="text-[#A19BAD] text-lg leading-relaxed max-w-md mx-auto">
                            Sei pronto ad affrontare le profondità? 
                            Ti aspettano Orchi, Goblin e pericoli striscianti.
                            <br/>
                            <span className="text-[#D4AF37]/60 text-sm mt-4 block italic">
                              Il gioco verrà avviato a schermo intero per la massima immersione.
                            </span>
                          </p>
                        </motion.div>

                        <div className="flex justify-center">
                          <Button 
                            onClick={() => {
                              setIsInMaze(true);
                              document.documentElement.requestFullscreen().catch(() => {
                                console.warn("Fullscreen request failed");
                              });
                            }}
                            className="px-16 py-10 bg-gradient-to-r from-[#D4AF37] to-[#B58E29] text-black font-black text-2xl hover:scale-110 active:scale-95 transition-all rounded-2xl shadow-[0_15px_40px_rgba(212,175,55,0.4)] group"
                          >
                            <span className="group-hover:tracking-widest transition-all">ACCETTA LA SFIDA</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
              
              {activeTab === 'inventory' && (
                <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <InventoryPanel />
                </motion.div>
              )}
              
              {activeTab === 'quests' && (
                <motion.div key="quests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <QuestsPanel />
                </motion.div>
              )}
              
              {activeTab === 'clan' && (
                <motion.div key="clan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ClanPanel />
                </motion.div>
              )}
              
              {activeTab === 'leaderboard' && (
                <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <LeaderboardEmbed />
                </motion.div>
              )}
              
              {activeTab === 'bosses' && (
                <motion.div key="bosses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <BossPanel />
                </motion.div>
              )}
              
              {activeTab === 'shop' && (
                <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ShopPanel />
                </motion.div>
              )}
              
              {activeTab === 'equipment' && (
                <motion.div key="equipment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <EquipmentPanel />
                </motion.div>
              )}
              
              {activeTab === 'crafting' && (
                <motion.div key="crafting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <CraftingPanel />
                </motion.div>
              )}
              
              {activeTab === 'admin' && (user?.role === 'super_admin' || user?.role === 'co_admin') && (
                <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <AdminPanel />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showSeasonPass && (
                <SeasonPassUI 
                  season={SEASONS[0]}
                  level={mockSeasonState.level}
                  xp={mockSeasonState.xp}
                  xpRequired={mockSeasonState.xpRequired}
                  isPremium={mockSeasonState.isPremium}
                  claimedFree={mockSeasonState.claimedFree}
                  claimedPremium={mockSeasonState.claimedPremium}
                  onClose={() => setShowSeasonPass(false)}
                  onBuyPremium={() => {
                    setMockSeasonState(prev => ({ ...prev, isPremium: true }));
                    toast.success('Premium Pass Acquistato!');
                  }}
                  onClaim={(reqLevel, type) => {
                    const claimedList = type === 'premium' ? mockSeasonState.claimedPremium : mockSeasonState.claimedFree;
                    if (claimedList.includes(reqLevel)) {
                      toast.error('Già riscosso!');
                      return;
                    }
                    if (type === 'premium' && !mockSeasonState.isPremium) {
                      toast.error('Richiede il Pass Premium!');
                      return;
                    }
                    if (mockSeasonState.level < reqLevel) {
                      toast.error('Livello non raggiunto!');
                      return;
                    }
                    toast.success('Ricompensa riscossa!');
                    setMockSeasonState(prev => ({
                      ...prev,
                      [type === 'premium' ? 'claimedPremium' : 'claimedFree']: [...claimedList, reqLevel]
                    }));
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

// Embedded Leaderboard Component
function LeaderboardEmbed() {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('level');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/leaderboard?sort_by=${sortBy}`);
        const data = await response.json();
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [sortBy]);

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Trophy className="w-6 h-6 text-[#D4AF37]" />
          {t('leaderboard')}
        </h2>
        
        <div className="flex gap-2">
          {['level', 'xp', 'reputation'].map((filter) => (
            <Button
              key={filter}
              onClick={() => setSortBy(filter)}
              size="sm"
              className={`rounded-full ${sortBy === filter ? 'btn-primary' : 'btn-secondary'}`}
            >
              {filter === 'level' ? 'Livello' : filter === 'xp' ? 'XP' : 'Rep'}
            </Button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D4AF37] border-t-transparent mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.slice(0, 10).map((entry) => (
            <div
              key={entry.character_id}
              className={`flex items-center gap-4 p-3 rounded-xl ${
                entry.rank <= 3 ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/20' : 'bg-white/5'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                entry.rank === 1 ? 'bg-[#FFD700] text-black' :
                entry.rank === 2 ? 'bg-[#C0C0C0] text-black' :
                entry.rank === 3 ? 'bg-[#CD7F32] text-black' :
                'bg-white/10 text-white'
              }`}>
                {entry.rank}
              </div>
              
              <div className="flex-1">
                <p className="text-white font-medium">{entry.character_name}</p>
                {entry.clan_name && (
                  <p className="text-[#2A9D8F] text-xs">[{entry.clan_name}]</p>
                )}
              </div>
              
              <div className="text-right">
                <p className="text-[#D4AF37] font-mono">Lv.{entry.level}</p>
                <p className="text-[#9D4CDD] text-xs">{entry.xp.toLocaleString()} XP</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
