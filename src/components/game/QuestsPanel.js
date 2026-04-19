import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { Scroll, CheckCircle, Clock, Star, Coins, Sparkles, Gift, Trophy, Target } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function QuestsPanel() {
  const { t } = useTranslation();
  const { character, refreshCharacter } = useAuth();
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/quests`);
      setQuests(response.data);
    } catch (error) {
      console.error('Failed to fetch quests:', error);
      toast.error('Errore nel caricamento missioni');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (questId) => {
    setClaiming(questId);
    try {
      const response = await axios.post(`${API}/quests/${questId}/claim`);
      toast.success(response.data.message);
      if (response.data.item_given) {
        toast.success(`Ricevuto: ${response.data.item_given}!`);
      }
      await refreshCharacter();
      await fetchQuests();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Errore nel riscatto');
    } finally {
      setClaiming(null);
    }
  };

  const activeQuests = quests.filter(q => !q.completed);
  const completedQuests = quests.filter(q => q.completed && !q.claimed);
  const claimedQuests = quests.filter(q => q.claimed);

  return (
    <div className="h-full flex flex-col">
      <div className="glass-panel rounded-2xl p-6 flex-1 overflow-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9D4CDD] to-[#7B2CBF] flex items-center justify-center">
            <Scroll className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{t('quests')}</h2>
            <p className="text-[#A19BAD] text-sm">Completa missioni per ricompense</p>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#D4AF37] border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Ready to Claim */}
            {completedQuests.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <Gift className="w-5 h-5 text-[#D4AF37]" />
                  Pronte da Riscattare
                </h3>
                <div className="space-y-3">
                  {completedQuests.map((quest) => (
                    <motion.div
                      key={quest.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="gold-framed-panel rounded-xl p-4"
                      data-testid={`quest-claim-${quest.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Trophy className="w-8 h-8 text-[#D4AF37]" />
                          <div>
                            <h4 className="font-semibold text-white">{quest.name}</h4>
                            <div className="flex gap-3 text-sm">
                              <span className="text-[#9D4CDD]">+{quest.reward_xp} XP</span>
                              <span className="text-[#D4AF37]">+{quest.reward_gold} Oro</span>
                              {quest.reward_item_name && (
                                <span className="text-[#2A9D8F]">+{quest.reward_item_name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleClaim(quest.id)}
                          disabled={claiming === quest.id}
                          className="btn-primary"
                          data-testid={`claim-btn-${quest.id}`}
                        >
                          {claiming === quest.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          ) : (
                            'Riscatta!'
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Quests */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-[#4361EE]" />
                Missioni Attive ({activeQuests.length})
              </h3>
              
              {activeQuests.length === 0 ? (
                <p className="text-[#A19BAD] text-center py-8">Nessuna missione disponibile</p>
              ) : (
                <div className="space-y-3">
                  {activeQuests.map((quest, index) => (
                    <motion.div
                      key={quest.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-panel rounded-xl p-4"
                      data-testid={`quest-${quest.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white">{quest.name}</h4>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#4361EE]/20 text-[#4361EE]">
                              Lv.{quest.min_level}+
                            </span>
                          </div>
                          <p className="text-[#A19BAD] text-sm mb-3">{quest.description}</p>
                          
                          {/* Progress */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-[#6C667A]">Progresso</span>
                              <span className="text-white font-mono">
                                {quest.progress}/{quest.required}
                              </span>
                            </div>
                            <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-[#9D4CDD] to-[#4361EE] rounded-full transition-all"
                                style={{ 
                                  width: `${(quest.progress / quest.required) * 100}%`,
                                  boxShadow: '0 0 10px rgba(157, 76, 221, 0.5)'
                                }}
                              />
                            </div>
                          </div>
                          
                          {/* Rewards */}
                          <div className="flex gap-4 mt-3">
                            <span className="text-sm flex items-center gap-1">
                              <Sparkles className="w-4 h-4 text-[#9D4CDD]" />
                              <span className="text-[#9D4CDD]">{quest.reward_xp} XP</span>
                            </span>
                            <span className="text-sm flex items-center gap-1">
                              <Coins className="w-4 h-4 text-[#D4AF37]" />
                              <span className="text-[#D4AF37]">{quest.reward_gold}</span>
                            </span>
                            {quest.reward_item_name && (
                              <span className="text-sm flex items-center gap-1">
                                <Gift className="w-4 h-4 text-[#2A9D8F]" />
                                <span className="text-[#2A9D8F]">{quest.reward_item_name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Completed Quests */}
            {claimedQuests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-[#2A9D8F]" />
                  Completate ({claimedQuests.length})
                </h3>
                
                <div className="space-y-2">
                  {claimedQuests.map((quest, index) => (
                    <motion.div
                      key={quest.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass-panel rounded-xl p-3 opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-[#D4AF37]" fill="#D4AF37" />
                        <span className="text-white">{quest.name}</span>
                        <span className="text-[#2A9D8F] text-sm ml-auto">Completata!</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
