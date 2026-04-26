import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { Sparkles, Shield, Sword, Crown, Crosshair } from 'lucide-react';
import { CharacterPreview } from './CharacterPreview';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

const EQUIPMENT_SLOTS = [
  { id: 'helmet', name: 'Testa', icon: Crown },
  { id: 'sword', name: 'Arma', icon: Sword },
  { id: 'shield', name: 'Scudo', icon: Shield },
  { id: 'secondary', name: 'Accessorio', icon: Crosshair }
];

const RARITY_COLORS = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
  admin: '#E63946'
};

const StatBar = ({ label, current, max, color }) => {
  const safeCurrent = current || 0;
  const safeMax = max || 100;
  const percentage = Math.min(100, Math.max(0, (safeCurrent / safeMax) * 100));
  
  return (
    <div className="text-center w-full px-2">
      <div className={`text-xs uppercase font-semibold ${color}`}>{label}</div>
      <div className="text-lg font-bold text-white">{safeCurrent} / {safeMax}</div>
      <div className="w-full h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500" 
          style={{ width: `${percentage}%`, backgroundColor: color.split('-')[0] === 'text' ? color.split('-')[1] : color.split('-')[0] }}
        ></div>
      </div>
    </div>
  );
};

export default function EquipmentPanel() {
  const { character, refreshCharacter } = useAuth();
  const { inventory, fetchInventory } = useGame();
  const [equipment, setEquipment] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
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
      await axios.post(`${API}/equipment/equip`, { item_id: itemId, slot });
      toast.success('Oggetto equipaggiato!');
      await fetchEquipment();
      await fetchInventory();
      await refreshCharacter();
      setSelectedInventoryItem(null);
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

  const equipableItems = inventory ? inventory.filter(item => !item.equipped && ['sword','shield','helmet','secondary'].includes(item.slot)) : [];
  
  const totalStats = {};
  Object.values(equipment).forEach(item => {
    if (!item) return;
    if (item.stats) {
      Object.entries(item.stats).forEach(([k, v]) => {
        totalStats[k] = (totalStats[k] || 0) + v;
      });
    } else if (item.defense) {
      totalStats['defense'] = (totalStats['defense'] || 0) + item.defense;
    } else if (item.damage) {
      totalStats['damage'] = (totalStats['damage'] || 0) + item.damage;
    }
  });

  return (
    <div className="w-full h-[85vh] bg-gradient-to-br from-gray-900 to-black text-gray-100 font-['Inter',_sans-serif] flex items-center justify-center overflow-hidden relative rounded-xl border border-gray-700/50">
      
      {/* Background glowing elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-blob pointer-events-none"></div>
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-pink-600 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-blob animation-delay-4000 pointer-events-none"></div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .shadow-blue-glow {
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.7);
        }
        .shadow-yellow-glow {
          box-shadow: 0 0 15px rgba(252, 211, 77, 0.7);
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      <div className="relative z-10 w-full h-full bg-gray-900 bg-opacity-40 backdrop-filter backdrop-blur-lg flex flex-col p-6">
        
        <div className="flex h-full space-x-6">
          {/* Left Panel: Inventory Grid */}
          <div className="w-1/3 bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-md p-5 rounded-lg border border-gray-700/50 shadow-inner flex flex-col overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-bold mb-5 text-blue-300 uppercase tracking-wide flex-shrink-0">ALL ITEMS</h2>
            <div className="grid grid-cols-4 gap-3">
              {equipableItems.map((item, index) => {
                const isSelected = selectedInventoryItem?.id === item.id;
                return (
                  <div 
                    key={index} 
                    onClick={() => { setSelectedInventoryItem(item); setSelectedSlot(null); }}
                    className={`relative p-2 rounded-md border bg-gray-800 bg-opacity-70 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-xs text-center aspect-square ${isSelected ? 'border-blue-500 shadow-blue-glow' : 'border-gray-700 hover:border-blue-400'}`}
                  >
                    <span className="truncate w-full block font-semibold">{item.name?.split(' ')[0]}</span>
                    {item.rarity === 'legendary' && <Sparkles className="absolute top-1 right-1 w-3 h-3 text-yellow-400" />}
                  </div>
                );
              })}
              {equipableItems.length === 0 && (
                <div className="col-span-4 text-center text-gray-500 py-4 font-semibold">Nessun oggetto equipaggiabile</div>
              )}
            </div>
          </div>

          {/* Center Panel: Character Display */}
          <div className="w-1/3 flex flex-col items-center justify-between relative p-2">
            <div className="w-full h-[60%] flex-grow bg-gradient-to-t from-gray-900 via-gray-800 to-gray-700 rounded-xl shadow-2xl flex items-center justify-center overflow-hidden border border-gray-700/50 relative group">
              <div className="absolute inset-0 w-full h-full">
                <CharacterPreview equipment={equipment} />
              </div>
              <div className="absolute inset-0 border-4 border-transparent group-hover:border-blue-500/30 rounded-xl transition-all duration-300 pointer-events-none"></div>
            </div>
            
            <div className="flex justify-around w-full p-4 bg-gray-900 bg-opacity-70 backdrop-filter backdrop-blur-md rounded-lg border border-gray-700/50 mt-4 shadow-lg flex-shrink-0">
              <StatBar label="HEALTH" current={character?.hp} max={character?.max_hp || 100} color="text-red-400" />
              <StatBar label="MANA" current={character?.mana} max={character?.max_mana || 100} color="text-blue-400" />
              <StatBar label="GOLD" current={character?.gold} max={character?.gold} color="text-yellow-400" />
            </div>
          </div>

          {/* Right Panel: Equipment Slots and Item Details */}
          <div className="w-1/3 bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-md p-5 rounded-lg border border-gray-700/50 shadow-inner flex flex-col overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-bold mb-5 text-yellow-300 uppercase tracking-wide flex-shrink-0">EQUIPMENT</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6 flex-shrink-0">
              {EQUIPMENT_SLOTS.map((slot, index) => {
                const equippedItem = equipment[slot.id];
                const isSelected = selectedSlot === slot.id;
                
                return (
                  <div 
                    key={index} 
                    onClick={() => { setSelectedSlot(slot.id); setSelectedInventoryItem(null); }}
                    className={`relative p-3 rounded-md border bg-gray-800 bg-opacity-70 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-sm min-h-[80px] ${isSelected ? 'border-yellow-400 shadow-yellow-glow' : 'border-gray-700 hover:border-yellow-400'}`}
                  >
                    <span className="text-gray-400 text-xs uppercase flex items-center gap-1"><slot.icon className="w-3 h-3"/>{slot.name}</span>
                    <span className="font-bold text-base mt-1 text-center" style={{ color: equippedItem ? RARITY_COLORS[equippedItem.rarity] || '#fde047' : '#9ca3af' }}>
                      {equippedItem ? equippedItem.name : 'Empty'}
                    </span>
                    {isSelected && <div className="absolute inset-0 border-2 border-yellow-500 rounded-md pointer-events-none"></div>}
                  </div>
                );
              })}
            </div>

            {/* Details Section */}
            {(selectedSlot || selectedInventoryItem) ? (
              <div className="bg-gray-900 bg-opacity-60 backdrop-filter backdrop-blur-md p-5 rounded-lg border border-gray-700/50 flex-grow shadow-lg relative overflow-hidden flex flex-col">
                <div className="absolute inset-0 border-2 border-transparent hover:border-yellow-500/30 transition-all duration-300 pointer-events-none"></div>
                
                {selectedSlot && (
                  <>
                    <h3 className="text-2xl font-bold mb-2 uppercase tracking-wide" style={{ color: equipment[selectedSlot] ? RARITY_COLORS[equipment[selectedSlot].rarity] : '#fde047' }}>
                      {equipment[selectedSlot]?.name || 'Empty Slot'}
                    </h3>
                    {equipment[selectedSlot] && (
                      <>
                        <p className="text-sm text-gray-400 mb-3 italic uppercase">{equipment[selectedSlot].rarity} {equipment[selectedSlot].slot}</p>
                        
                        {equipment[selectedSlot].damage && <p className="text-4xl font-extrabold text-red-500 mb-4">{equipment[selectedSlot].damage} <span className="text-lg text-gray-300">ATTACK</span></p>}
                        {equipment[selectedSlot].defense && <p className="text-4xl font-extrabold text-blue-500 mb-4">{equipment[selectedSlot].defense} <span className="text-lg text-gray-300">DEFENSE</span></p>}
                        
                        {equipment[selectedSlot].stats && (
                          <ul className="list-disc list-inside text-base text-gray-300 mb-5 space-y-1">
                            {Object.entries(equipment[selectedSlot].stats).map(([k, v]) => (
                              <li key={k}>+{v} {k.replace('_', ' ')}</li>
                            ))}
                          </ul>
                        )}
                        
                        <Button 
                          className="mt-auto w-full bg-red-600/80 hover:bg-red-600 text-white font-bold py-3 uppercase tracking-wider"
                          onClick={() => handleUnequip(selectedSlot)}
                          disabled={equipping}
                        >
                          UNEQUIP
                        </Button>
                      </>
                    )}
                    {!equipment[selectedSlot] && (
                      <p className="text-sm text-gray-400 mt-2 italic">Select an item from your inventory to equip it here.</p>
                    )}
                  </>
                )}
                
                {selectedInventoryItem && (
                  <>
                    <h3 className="text-2xl font-bold mb-2 uppercase tracking-wide" style={{ color: RARITY_COLORS[selectedInventoryItem.rarity] || '#fde047' }}>
                      {selectedInventoryItem.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3 italic uppercase">{selectedInventoryItem.rarity} {selectedInventoryItem.slot}</p>
                    
                    {selectedInventoryItem.damage && <p className="text-4xl font-extrabold text-red-500 mb-4">{selectedInventoryItem.damage} <span className="text-lg text-gray-300">ATTACK</span></p>}
                    {selectedInventoryItem.defense && <p className="text-4xl font-extrabold text-blue-500 mb-4">{selectedInventoryItem.defense} <span className="text-lg text-gray-300">DEFENSE</span></p>}
                    
                    {selectedInventoryItem.stats && (
                      <ul className="list-disc list-inside text-base text-gray-300 mb-5 space-y-1">
                        {Object.entries(selectedInventoryItem.stats).map(([k, v]) => (
                          <li key={k}>+{v} {k.replace('_', ' ')}</li>
                        ))}
                      </ul>
                    )}
                    
                    <Button 
                      className="mt-auto w-full bg-yellow-600/80 hover:bg-yellow-500 text-white font-bold py-3 uppercase tracking-wider"
                      onClick={() => handleEquip(selectedInventoryItem.id, selectedInventoryItem.slot)}
                      disabled={equipping || !selectedInventoryItem.slot}
                    >
                      EQUIP
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-gray-900 bg-opacity-60 p-5 rounded-lg border border-gray-700/50 flex-grow flex items-center justify-center text-center">
                <p className="text-gray-500 text-sm italic">Select an item to view its legendary properties.</p>
              </div>
            )}
            
            {/* Total Stats Summary */}
            {Object.keys(totalStats).length > 0 && !selectedSlot && !selectedInventoryItem && (
               <div className="mt-4 bg-gray-900/60 p-4 rounded-lg border border-gray-700/50 flex-shrink-0 shadow-lg">
                  <h4 className="text-yellow-300 font-bold text-sm mb-3 uppercase tracking-wide">Total Bonus</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(totalStats).map(([stat, val]) => (
                      <div key={stat} className="flex justify-between border-b border-gray-700 pb-1">
                        <span className="text-gray-400 capitalize">{stat.replace('_', ' ')}</span>
                        <span className="text-green-400 font-bold">+{val}</span>
                      </div>
                    ))}
                  </div>
               </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
