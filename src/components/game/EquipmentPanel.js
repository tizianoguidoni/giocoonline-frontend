import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Shield, Sword, Crown, Crosshair, 
  Package, Star, X, ChevronRight, Sparkles
} from 'lucide-react';
import { getItemImage } from '@/data/itemImages';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// 4 Slot specifici richiesti dal gioco
const EQUIPMENT_SLOTS = [
  { id: 'helmet', name: 'Elmo', icon: Crown, position: 'top' },
  { id: 'sword', name: 'Spada', icon: Sword, position: 'left' },
  { id: 'secondary', name: 'Colpo', icon: Crosshair, position: 'right' },
  { id: 'shield', name: 'Scudo', icon: Shield, position: 'bottom' }
];

const RARITY_COLORS = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
  admin: '#E63946'
};

export default function EquipmentPanel() {
  const { t } = useTranslation();
  const { character, refreshCharacter } = useAuth();
  const { inventory, fetchInventory } = useGame();
  const [equipment, setEquipment] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [equipping, setEquipping] = useState(false);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/equipment`);
      setEquipment(response.data.equipment || {});
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEquip = async (itemId, slot) => {
    setEquipping(true);
    try {
      await axios.post(`${API}/equipment/equip`, {
        item_id: itemId,
        slot: slot
      });
      toast.success('Oggetto equipaggiato!');
      await fetchEquipment();
      await fetchInventory();
      await refreshCharacter();
      setSelectedSlot(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Errore nell\'equipaggiamento');
    } finally {
      setEquipping(false);
    }
  };

  const handleUnequip = async (slot) => {
    setEquipping(true);
    try {
      await axios.post(`${API}/equipment/unequip/${slot}`);
      toast.success('Oggetto rimosso!');
      await fetchEquipment();
      await fetchInventory();
      setSelectedSlot(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Errore nella rimozione');
    } finally {
      setEquipping(false);
    }
  };

  // Get items that can be equipped in selected slot
  const getItemsForSlot = (slot) => {
    return inventory.filter(item => item.slot === slot && !item.equipped);
  };

  // Calculate total stats from equipment
  const getTotalStats = () => {
    const stats = {};
    Object.values(equipment).forEach(item => {
      if (item?.stats) {
        Object.entries(item.stats).forEach(([stat, val]) => {
          stats[stat] = (stats[stat] || 0) + val;
        });
      }
    });
    return stats;
  };

  const totalStats = getTotalStats();

  return (
    <div className="h-full flex flex-col">
      <div className="glass-panel rounded-2xl p-6 flex-1 overflow-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9D4CDD] to-[#7B2CBF] flex items-center justify-center">
            <Sword className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Equipaggiamento</h2>
            <p className="text-[#A19BAD] text-sm">4 Slot: Elmo, Spada, Colpo, Scudo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Equipment Slots Visual */}
          <div className="relative">
            <div className="aspect-square max-w-md mx-auto relative">
              {/* Character silhouette background */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-[#4A3B72]/30 border-2 border-[#D4AF37]/20 flex items-center justify-center">
                  <span className="text-4xl font-bold text-[#D4AF37]/50">
                    {character?.name?.[0] || '?'}
                  </span>
                </div>
              </div>

              {/* 4 Equipment Slots */}
              {EQUIPMENT_SLOTS.map(slot => {
                const equippedItem = equipment[slot.id];
                const rarityColor = equippedItem ? RARITY_COLORS[equippedItem.rarity] : '#6C667A';
                
                const positions = {
                  top: 'top-0 left-1/2 -translate-x-1/2',
                  bottom: 'bottom-0 left-1/2 -translate-x-1/2',
                  left: 'left-0 top-1/2 -translate-y-1/2',
                  right: 'right-0 top-1/2 -translate-y-1/2'
                };

                return (
                  <motion.button
                    key={slot.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`absolute ${positions[slot.position]} w-20 h-20 rounded-xl transition-all flex flex-col items-center justify-center gap-1 overflow-hidden`}
                    style={{
                      backgroundColor: equippedItem ? `${rarityColor}20` : 'rgba(74, 59, 114, 0.3)',
                      borderWidth: 2,
                      borderColor: equippedItem ? rarityColor : 'rgba(255,255,255,0.1)',
                      boxShadow: equippedItem ? `0 0 20px ${rarityColor}40` : 'none'
                    }}
                    data-testid={`equipment-slot-${slot.id}`}
                  >
                    {equippedItem ? (
                      <>
                        <img 
                          src={getItemImage(equippedItem.item_id || equippedItem.id)} 
                          alt={equippedItem.name}
                          className="absolute inset-0 w-full h-full object-cover opacity-70"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <slot.icon className="w-8 h-8 relative z-10" style={{ color: rarityColor, filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.9))' }} />
                        <span className="text-[10px] text-white truncate max-w-full px-1 relative z-10 bg-black/50 rounded">
                          {equippedItem.name?.split(' ')[0]}
                        </span>
                      </>
                    ) : (
                      <>
                        <slot.icon className="w-6 h-6 text-[#6C667A]" />
                        <span className="text-[10px] text-[#6C667A]">{slot.name}</span>
                      </>
                    )}
                    
                    {equippedItem?.rarity === 'legendary' && (
                      <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-[#F59E0B] z-20" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Total Stats */}
            {Object.keys(totalStats).length > 0 && (
              <div className="mt-6">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#D4AF37]" />
                  Bonus Totali Equipaggiamento
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(totalStats).map(([stat, val]) => (
                    <div key={stat} className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-[#2A9D8F] font-bold">+{val}</p>
                      <p className="text-[#6C667A] text-xs capitalize">{stat.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Slot Details / Item Selection */}
          <div>
            <AnimatePresence mode="wait">
              {selectedSlot ? (
                <motion.div
                  key="selection"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="gold-framed-panel rounded-xl p-5"
                >
                  {/* Current Slot Info */}
                  {(() => {
                    const slot = EQUIPMENT_SLOTS.find(s => s.id === selectedSlot);
                    const equippedItem = equipment[selectedSlot];
                    const availableItems = getItemsForSlot(selectedSlot);
                    
                    return (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <slot.icon className="w-5 h-5 text-[#D4AF37]" />
                            {slot.name}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSlot(null)}
                            className="text-[#A19BAD]"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Currently Equipped */}
                        {equippedItem && (
                          <div 
                            className="rounded-xl p-4 mb-4"
                            style={{ 
                              backgroundColor: `${RARITY_COLORS[equippedItem.rarity]}10`,
                              borderWidth: 1,
                              borderColor: RARITY_COLORS[equippedItem.rarity]
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[#A19BAD] text-sm">Equipaggiato:</span>
                              <span 
                                className="text-xs px-2 py-0.5 rounded capitalize"
                                style={{ 
                                  backgroundColor: `${RARITY_COLORS[equippedItem.rarity]}30`,
                                  color: RARITY_COLORS[equippedItem.rarity]
                                }}
                              >
                                {equippedItem.rarity}
                              </span>
                            </div>
                            <h4 
                              className="font-bold mb-2"
                              style={{ color: RARITY_COLORS[equippedItem.rarity] }}
                            >
                              {equippedItem.name}
                            </h4>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {Object.entries(equippedItem.stats || {}).map(([stat, val]) => (
                                <span key={stat} className="text-xs bg-black/30 px-2 py-1 rounded text-white">
                                  +{val} {stat}
                                </span>
                              ))}
                            </div>
                            <Button
                              onClick={() => handleUnequip(selectedSlot)}
                              disabled={equipping}
                              variant="ghost"
                              className="w-full text-[#E63946] hover:bg-[#E63946]/10"
                              data-testid="unequip-btn"
                            >
                              Rimuovi
                            </Button>
                          </div>
                        )}

                        {/* Available Items */}
                        <div>
                          <h4 className="text-white font-medium mb-3">
                            Oggetti Disponibili ({availableItems.length})
                          </h4>
                          
                          {availableItems.length === 0 ? (
                            <p className="text-[#6C667A] text-center py-8">
                              Nessun oggetto disponibile per questo slot.
                              <br />
                              <span className="text-sm">Acquista dal negozio!</span>
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {availableItems.map(item => (
                                <button
                                  key={item.id}
                                  onClick={() => handleEquip(item.id, selectedSlot)}
                                  disabled={equipping}
                                  className="w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-white/5"
                                  style={{ borderWidth: 1, borderColor: `${RARITY_COLORS[item.rarity]}40` }}
                                  data-testid={`equip-item-${item.id}`}
                                >
                                  <div 
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: `${RARITY_COLORS[item.rarity]}20` }}
                                  >
                                    <slot.icon className="w-5 h-5" style={{ color: RARITY_COLORS[item.rarity] }} />
                                  </div>
                                  <div className="flex-1 text-left">
                                    <p className="text-white font-medium">{item.name}</p>
                                    <div className="flex gap-1">
                                      {Object.entries(item.stats || {}).slice(0, 3).map(([stat, val]) => (
                                        <span key={stat} className="text-[10px] text-[#2A9D8F]">
                                          +{val} {stat}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              ) : (
                <motion.div
                  key="info"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <Package className="w-16 h-16 text-[#6C667A] mx-auto mb-4" />
                  <h3 className="text-white font-medium mb-2">Seleziona uno Slot</h3>
                  <p className="text-[#6C667A] text-sm">
                    Clicca su uno dei 4 slot per vedere<br />
                    gli oggetti disponibili o rimuovere l'equipaggiamento
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
