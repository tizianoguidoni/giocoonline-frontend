import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Hammer, Package, Coins, AlertTriangle, CheckCircle,
  ChevronRight, Sparkles, Flame, Shield, Swords
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RARITY_COLORS = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B'
};

export default function CraftingPanel() {
  const { t } = useTranslation();
  const { character, refreshCharacter } = useAuth();
  const { inventory, fetchInventory } = useGame();
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [crafting, setCrafting] = useState(false);
  const [craftResult, setCraftResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await axios.get(`${API}/crafting/recipes`);
      setRecipes(response.data);
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInventoryCount = (itemId) => {
    return inventory
      .filter(item => item.item_id === itemId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const canCraft = (recipe) => {
    if (!character || character.gold < recipe.gold_cost) return false;
    
    // Check materials using materials_info from API
    if (recipe.materials_info) {
      for (const mat of recipe.materials_info) {
        if (getInventoryCount(mat.item_id) < mat.quantity) return false;
      }
    }
    return true;
  };

  const handleCraft = async () => {
    if (!selectedRecipe || crafting) return;
    
    setCrafting(true);
    setCraftResult(null);
    
    try {
      const response = await axios.post(`${API}/crafting/craft/${selectedRecipe.id}`);
      
      setCraftResult(response.data);
      
      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
      
      await refreshCharacter();
      await fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Crafting fallito');
    } finally {
      setCrafting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="glass-panel rounded-2xl p-6 flex-1 overflow-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B58E29] flex items-center justify-center">
            <Hammer className="w-6 h-6 text-[#0B0914]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Crafting</h2>
            <p className="text-[#A19BAD] text-sm">Crea oggetti potenti</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-[#D4AF37] font-mono">{character?.gold || 0}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recipe List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D4AF37] border-t-transparent mx-auto"></div>
              </div>
            ) : (
              recipes.map(recipe => {
                const craftable = canCraft(recipe);
                return (
                  <motion.button
                    key={recipe.id}
                    onClick={() => setSelectedRecipe(recipe)}
                    whileHover={{ scale: 1.02 }}
                    className={`w-full glass-panel rounded-xl p-4 text-left transition-all ${
                      selectedRecipe?.id === recipe.id 
                        ? 'border border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                        : ''
                    } ${!craftable ? 'opacity-60' : ''}`}
                    style={{ borderLeft: `4px solid ${RARITY_COLORS[recipe.result_rarity]}` }}
                    data-testid={`recipe-${recipe.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${RARITY_COLORS[recipe.result_rarity]}20` }}
                      >
                        {recipe.result_rarity === 'legendary' ? (
                          <Sparkles className="w-6 h-6" style={{ color: RARITY_COLORS[recipe.result_rarity] }} />
                        ) : (
                          <Package className="w-6 h-6" style={{ color: RARITY_COLORS[recipe.result_rarity] }} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{recipe.result_name}</h4>
                        <p className="text-[#6C667A] text-xs capitalize">{recipe.result_rarity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#D4AF37] text-sm font-mono">{recipe.gold_cost}G</p>
                        <p className={`text-xs ${recipe.success_rate >= 70 ? 'text-[#2A9D8F]' : recipe.success_rate >= 40 ? 'text-[#F59E0B]' : 'text-[#E63946]'}`}>
                          {recipe.success_rate}% successo
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>

          {/* Recipe Details */}
          <div className="gold-framed-panel rounded-xl p-4">
            {selectedRecipe ? (
              <div className="space-y-4">
                <div className="text-center pb-4 border-b border-white/10">
                  <div 
                    className="w-20 h-20 mx-auto rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${RARITY_COLORS[selectedRecipe.result_rarity]}20` }}
                  >
                    <Sparkles className="w-10 h-10" style={{ color: RARITY_COLORS[selectedRecipe.result_rarity] }} />
                  </div>
                  <h3 
                    className="text-xl font-bold"
                    style={{ color: RARITY_COLORS[selectedRecipe.result_rarity] }}
                  >
                    {selectedRecipe.result_name}
                  </h3>
                  <p className="text-[#A19BAD] text-sm capitalize">{selectedRecipe.result_rarity}</p>
                </div>

                {/* Materials */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Materiali Richiesti:</h4>
                  <div className="space-y-2">
                    {(selectedRecipe.materials_info || []).map((mat) => {
                      const owned = getInventoryCount(mat.item_id);
                      const hasEnough = owned >= mat.quantity;
                      return (
                        <div key={mat.item_id} className="flex items-center justify-between bg-black/30 rounded-lg p-2">
                          <span className="text-[#A19BAD] text-sm">{mat.name}</span>
                          <span className={`font-mono ${hasEnough ? 'text-[#2A9D8F]' : 'text-[#E63946]'}`}>
                            {owned}/{mat.quantity}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cost & Success Rate */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <p className={`text-lg font-bold ${character?.gold >= selectedRecipe.gold_cost ? 'text-[#D4AF37]' : 'text-[#E63946]'}`}>
                      {selectedRecipe.gold_cost}G
                    </p>
                    <p className="text-[#6C667A] text-xs">Costo</p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <p className={`text-lg font-bold ${
                      selectedRecipe.success_rate >= 70 ? 'text-[#2A9D8F]' : 
                      selectedRecipe.success_rate >= 40 ? 'text-[#F59E0B]' : 'text-[#E63946]'
                    }`}>
                      {selectedRecipe.success_rate}%
                    </p>
                    <p className="text-[#6C667A] text-xs">Successo</p>
                  </div>
                </div>

                {/* Craft Result */}
                <AnimatePresence>
                  {craftResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`p-4 rounded-xl text-center ${
                        craftResult.success ? 'bg-[#2A9D8F]/20 border border-[#2A9D8F]' : 'bg-[#E63946]/20 border border-[#E63946]'
                      }`}
                    >
                      {craftResult.success ? (
                        <>
                          <CheckCircle className="w-8 h-8 text-[#2A9D8F] mx-auto mb-2" />
                          <p className="text-[#2A9D8F] font-semibold">{craftResult.message}</p>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-8 h-8 text-[#E63946] mx-auto mb-2" />
                          <p className="text-[#E63946] font-semibold">{craftResult.message}</p>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Craft Button */}
                <Button
                  onClick={handleCraft}
                  disabled={!canCraft(selectedRecipe) || crafting}
                  className={`w-full py-4 rounded-xl text-lg ${
                    canCraft(selectedRecipe) ? 'btn-primary' : 'bg-white/10 text-[#6C667A] cursor-not-allowed'
                  }`}
                  data-testid="craft-btn"
                >
                  {crafting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Crafting...
                    </div>
                  ) : (
                    <>
                      <Hammer className="w-5 h-5 mr-2" />
                      Crea Oggetto
                    </>
                  )}
                </Button>

                {!canCraft(selectedRecipe) && (
                  <p className="text-[#E63946] text-sm text-center">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    Materiali o oro insufficienti
                  </p>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <Hammer className="w-16 h-16 text-[#6C667A] mx-auto mb-4" />
                  <p className="text-[#A19BAD]">Seleziona una ricetta per vedere i dettagli</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
