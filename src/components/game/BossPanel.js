import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Skull, Shield, Swords, Heart, Coins, Star,
  Flame, Snowflake, Zap, Users, Crown, Award,
  ChevronRight, AlertTriangle
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BOSS_ICONS = {
  normal: Skull,
  rare: Crown,
  epic: Flame,
  world: Star
};

const BOSS_COLORS = {
  normal: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#A855F7',
  world: '#F59E0B'
};

export default function BossPanel() {
  const { t } = useTranslation();
  const { character, refreshCharacter } = useAuth();
  const [bosses, setBosses] = useState([]);
  const [selectedBoss, setSelectedBoss] = useState(null);
  const [bossDetails, setBossDetails] = useState(null);
  const [fighting, setFighting] = useState(false);
  const [fightResult, setFightResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBosses();
  }, []);

  const fetchBosses = async () => {
    try {
      const response = await axios.get(`${API}/bosses`);
      setBosses(response.data);
    } catch (error) {
      console.error('Failed to fetch bosses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBossDetails = async (bossId) => {
    try {
      const response = await axios.get(`${API}/bosses/${bossId}`);
      setBossDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch boss details:', error);
    }
  };

  const handleSelectBoss = async (boss) => {
    setSelectedBoss(boss);
    setFightResult(null);
    await fetchBossDetails(boss.id);
  };

  const handleFight = async () => {
    if (!selectedBoss || fighting) return;
    
    setFighting(true);
    setFightResult(null);
    
    try {
      const response = await axios.post(`${API}/bosses/${selectedBoss.id}/fight`);
      setFightResult(response.data);
      
      if (response.data.boss_defeated) {
        toast.success(`Boss sconfitto! +${response.data.rewards.xp} XP, +${response.data.rewards.gold} Oro`);
        if (response.data.rewards.drops?.length > 0) {
          toast.success(`Drop: ${response.data.rewards.drops.join(', ')}`);
        }
      } else {
        toast.info(`Fase ${response.data.boss_phase} completata! Continua a combattere.`);
      }
      
      await refreshCharacter();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Combattimento fallito');
    } finally {
      setFighting(false);
    }
  };

  const canFight = (boss) => {
    if (!character) return false;
    if (character.hp <= 0) return false;
    if (boss.min_players && boss.min_players > 1) return character.is_admin; // Admin can solo world bosses
    return character.level >= Math.floor(boss.level * 0.5); // Need at least half the boss level
  };

  return (
    <div className="h-full flex flex-col">
      <div className="glass-panel rounded-2xl p-6 flex-1 overflow-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E63946] to-[#ff6b6b] flex items-center justify-center">
            <Skull className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Boss</h2>
            <p className="text-[#A19BAD] text-sm">Sconfiggi boss potenti per ricompense epiche</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Boss List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#E63946] border-t-transparent mx-auto"></div>
              </div>
            ) : (
              bosses.map(boss => {
                const Icon = BOSS_ICONS[boss.type] || Skull;
                const color = BOSS_COLORS[boss.type];
                const canFightBoss = canFight(boss);
                
                return (
                  <motion.button
                    key={boss.id}
                    onClick={() => handleSelectBoss(boss)}
                    whileHover={{ scale: 1.02 }}
                    className={`w-full glass-panel rounded-xl p-4 text-left transition-all ${
                      selectedBoss?.id === boss.id 
                        ? 'border border-[#E63946] shadow-[0_0_15px_rgba(230,57,70,0.3)]' 
                        : ''
                    } ${!canFightBoss ? 'opacity-60' : ''}`}
                    style={{ borderLeft: `4px solid ${color}` }}
                    data-testid={`boss-${boss.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="w-7 h-7" style={{ color }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-semibold">{boss.name}</h4>
                          {boss.type === 'world' && <Star className="w-4 h-4 text-[#F59E0B]" fill="#F59E0B" />}
                        </div>
                        <p className="text-[#6C667A] text-xs capitalize">
                          {boss.type} • Livello {boss.level}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#E63946] font-mono text-sm">{boss.hp} HP</p>
                        <p className="text-[#6C667A] text-xs">{boss.phases} fasi</p>
                      </div>
                    </div>
                    
                    {boss.min_players > 1 && (
                      <div className="mt-2 flex items-center gap-1 text-[#F59E0B] text-xs">
                        <Users className="w-3 h-3" />
                        <span>Min. {boss.min_players} giocatori</span>
                      </div>
                    )}
                  </motion.button>
                );
              })
            )}
          </div>

          {/* Boss Details */}
          <div className="gold-framed-panel rounded-xl p-4">
            {selectedBoss && bossDetails ? (
              <div className="space-y-4">
                {/* Boss Header */}
                <div className="text-center pb-4 border-b border-white/10">
                  <div 
                    className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-3"
                    style={{ 
                      backgroundColor: `${BOSS_COLORS[bossDetails.type]}20`,
                      boxShadow: `0 0 30px ${BOSS_COLORS[bossDetails.type]}40`
                    }}
                  >
                    {(() => {
                      const Icon = BOSS_ICONS[bossDetails.type] || Skull;
                      return <Icon className="w-12 h-12" style={{ color: BOSS_COLORS[bossDetails.type] }} />;
                    })()}
                  </div>
                  <h3 className="text-2xl font-bold text-white">{bossDetails.name}</h3>
                  <p className="text-[#A19BAD] capitalize">{bossDetails.type} Boss • Livello {bossDetails.level}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <Heart className="w-5 h-5 text-[#E63946] mx-auto mb-1" />
                    <p className="text-white font-bold">{bossDetails.hp}</p>
                    <p className="text-[#6C667A] text-xs">HP</p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <Swords className="w-5 h-5 text-[#D4AF37] mx-auto mb-1" />
                    <p className="text-white font-bold">{bossDetails.damage}</p>
                    <p className="text-[#6C667A] text-xs">Danno</p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <Shield className="w-5 h-5 text-[#4361EE] mx-auto mb-1" />
                    <p className="text-white font-bold">{bossDetails.defense}</p>
                    <p className="text-[#6C667A] text-xs">Difesa</p>
                  </div>
                </div>

                {/* Abilities */}
                <div>
                  <h4 className="text-white font-semibold mb-2">Abilità:</h4>
                  <div className="flex flex-wrap gap-2">
                    {bossDetails.abilities.map((ability, i) => (
                      <span key={i} className="bg-[#E63946]/20 text-[#E63946] px-2 py-1 rounded text-xs">
                        {ability}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rewards */}
                <div>
                  <h4 className="text-white font-semibold mb-2">Ricompense:</h4>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#9D4CDD]" />
                      <span className="text-[#9D4CDD]">{bossDetails.rewards.xp} XP</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-[#D4AF37]" />
                      <span className="text-[#D4AF37]">{bossDetails.rewards.gold}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-[#A19BAD] text-xs">
                    Drop possibili: {bossDetails.rewards.drops.slice(0, 3).join(', ')}...
                  </div>
                </div>

                {/* Fight Result */}
                <AnimatePresence>
                  {fightResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`p-4 rounded-xl ${
                        fightResult.boss_defeated 
                          ? 'bg-[#2A9D8F]/20 border border-[#2A9D8F]' 
                          : 'bg-[#D4AF37]/20 border border-[#D4AF37]'
                      }`}
                    >
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-[#2A9D8F] text-lg font-bold">-{fightResult.player_damage}</p>
                          <p className="text-[#6C667A] text-xs">Danno inflitto</p>
                        </div>
                        <div>
                          <p className="text-[#E63946] text-lg font-bold">-{fightResult.boss_damage}</p>
                          <p className="text-[#6C667A] text-xs">Danno subito</p>
                        </div>
                      </div>
                      {fightResult.boss_defeated && fightResult.rewards && (
                        <div className="mt-3 pt-3 border-t border-white/10 text-center">
                          <p className="text-[#D4AF37] font-bold">VITTORIA!</p>
                          <p className="text-[#A19BAD] text-sm">
                            +{fightResult.rewards.xp} XP, +{fightResult.rewards.gold} Oro
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Fight Button */}
                <Button
                  onClick={handleFight}
                  disabled={!canFight(selectedBoss) || fighting}
                  className={`w-full py-4 rounded-xl text-lg ${
                    canFight(selectedBoss) 
                      ? 'bg-gradient-to-r from-[#E63946] to-[#ff6b6b] hover:shadow-[0_0_20px_rgba(230,57,70,0.5)]' 
                      : 'bg-white/10 text-[#6C667A] cursor-not-allowed'
                  }`}
                  data-testid="fight-boss-btn"
                >
                  {fighting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Combattimento...
                    </div>
                  ) : (
                    <>
                      <Swords className="w-5 h-5 mr-2" />
                      Combatti Boss
                    </>
                  )}
                </Button>

                {!canFight(selectedBoss) && (
                  <p className="text-[#E63946] text-sm text-center">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    {character?.hp <= 0 
                      ? 'HP insufficienti' 
                      : bossDetails.min_players > 1 
                        ? `Richiesti ${bossDetails.min_players} giocatori`
                        : `Livello troppo basso (min. ${Math.floor(bossDetails.level * 0.5)})`
                    }
                  </p>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <Skull className="w-16 h-16 text-[#6C667A] mx-auto mb-4" />
                  <p className="text-[#A19BAD]">Seleziona un boss per vedere i dettagli</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
