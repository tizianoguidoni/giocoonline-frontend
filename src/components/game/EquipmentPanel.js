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
  { id: 'helmet', name: 'Elmo', icon: Crown },
  { id: 'sword', name: 'Spada', icon: Sword },
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
  
  // Calculate total stats
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
    <div className="w-full h-[85vh] bg-[#1A1525] text-gray-100 font-sans flex flex-col rounded-xl overflow-hidden shadow-2xl border border-[#2D283E]">
      <div className="flex h-full p-4 gap-4">
        
        {/* Left Panel: Inventory Grid */}
        <div className="w-1/3 bg-[#2D283E]/50 p-4 rounded-lg border border-[#4A3B72] overflow-y-auto flex flex-col">
          <h2 className="text-xl font-bold mb-4 text-[#D4AF37] flex-shrink-0">INVENTARIO</h2>
          <div className="grid grid-cols-4 gap-2">
            {equipableItems.map((item, index) => (
              <div 
                key={index} 
                onClick={() => { setSelectedInventoryItem(item); setSelectedSlot(null); }}
                className={`bg-[#1A1525] p-2 rounded-md border transition-colors duration-200 cursor-pointer flex items-center justify-center text-xs text-center aspect-square ${selectedInventoryItem?.id === item.id ? 'border-[#D4AF37]' : 'border-[#4A3B72] hover:border-[#7b2cbf]'}`}
                style={{ borderColor: selectedInventoryItem?.id === item.id ? RARITY_COLORS[item.rarity] || '#D4AF37' : undefined }}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="truncate w-full block">{item.name?.split(' ')[0]}</span>
                  {item.rarity === 'legendary' && <Sparkles className="w-3 h-3 text-[#F59E0B]" />}
                </div>
              </div>
            ))}
            {equipableItems.length === 0 && (
              <div className="col-span-4 text-center text-gray-500 py-4">Nessun oggetto equipaggiabile</div>
            )}
          </div>
        </div>

        {/* Center Panel: Character Display */}
        <div className="w-1/3 flex flex-col items-center justify-center relative bg-gradient-to-t from-[#0f0c1b] to-[#1A1525] rounded-lg shadow-inner border border-[#2D283E] overflow-hidden">
          <div className="absolute inset-0">
             <CharacterPreview equipment={equipment} />
          </div>
          
          <div className="absolute bottom-0 flex justify-around w-full p-4 bg-[#0f0c1b]/80 backdrop-blur-sm rounded-b-lg border-t border-[#2D283E] z-10">
            <div className="text-center">
              <div className="text-red-400 text-xs font-bold uppercase">Health</div>
              <div className="text-base font-bold">{character?.hp || 100} / {character?.max_hp || 100}</div>
            </div>
            <div className="text-center">
              <div className="text-blue-400 text-xs font-bold uppercase">Mana</div>
              <div className="text-base font-bold">{character?.mana || 100} / {character?.max_mana || 100}</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 text-xs font-bold uppercase">Gold</div>
              <div className="text-base font-bold">{character?.gold || 0}</div>
            </div>
          </div>
        </div>

        {/* Right Panel: Equipment Slots and Item Details */}
        <div className="w-1/3 bg-[#2D283E]/50 p-4 rounded-lg border border-[#4A3B72] flex flex-col overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-[#D4AF37] flex-shrink-0">EQUIPAGGIAMENTO</h2>
          
          <div className="grid grid-cols-2 gap-2 mb-6 flex-shrink-0">
            {EQUIPMENT_SLOTS.map((slot, index) => {
              const equippedItem = equipment[slot.id];
              const isSelected = selectedSlot === slot.id;
              
              return (
                <div 
                  key={index} 
                  onClick={() => { setSelectedSlot(slot.id); setSelectedInventoryItem(null); }}
                  className={`bg-[#1A1525] p-2 rounded-md border transition-colors duration-200 cursor-pointer flex flex-col items-center justify-center text-sm min-h-[80px] relative ${isSelected ? 'border-[#D4AF37]' : 'border-[#4A3B72] hover:border-[#7b2cbf]'}`}
                  style={{ borderColor: isSelected || equippedItem ? RARITY_COLORS[equippedItem?.rarity] || (isSelected ? '#D4AF37' : '#4A3B72') : undefined }}
                >
                  <span className="text-gray-400 text-xs mb-1 flex items-center gap-1"><slot.icon className="w-3 h-3"/> {slot.name}</span>
                  <span className="font-semibold text-center text-sm" style={{ color: equippedItem ? RARITY_COLORS[equippedItem.rarity] || '#fff' : '#6C667A' }}>
                    {equippedItem ? equippedItem.name : 'Vuoto'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Details Section */}
          {(selectedSlot || selectedInventoryItem) ? (
            <div className="bg-[#1A1525] p-4 rounded-lg border border-[#4A3B72] flex-grow flex flex-col">
              {selectedSlot && (
                <>
                  <h3 className="text-lg font-bold mb-1" style={{ color: equipment[selectedSlot] ? RARITY_COLORS[equipment[selectedSlot].rarity] : '#fff' }}>
                    {equipment[selectedSlot]?.name || 'Slot Vuoto'}
                  </h3>
                  {equipment[selectedSlot] && (
                    <>
                      <p className="text-xs text-gray-400 mb-2 uppercase">{equipment[selectedSlot].rarity} {equipment[selectedSlot].slot}</p>
                      {equipment[selectedSlot].damage && <p className="text-xl font-bold text-red-400 mb-2">{equipment[selectedSlot].damage} ATTACK</p>}
                      {equipment[selectedSlot].defense && <p className="text-xl font-bold text-blue-400 mb-2">{equipment[selectedSlot].defense} DEFENSE</p>}
                      
                      {equipment[selectedSlot].stats && (
                        <ul className="list-disc list-inside text-sm mb-4 text-gray-300">
                          {Object.entries(equipment[selectedSlot].stats).map(([k, v]) => (
                            <li key={k}>+{v} {k.replace('_', ' ')}</li>
                          ))}
                        </ul>
                      )}
                      
                      <Button 
                        className="mt-auto w-full bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleUnequip(selectedSlot)}
                        disabled={equipping}
                      >
                        Rimuovi
                      </Button>
                    </>
                  )}
                  {!equipment[selectedSlot] && (
                    <p className="text-sm text-gray-400 mt-2">Seleziona un oggetto dall'inventario per equipaggiarlo in questo slot.</p>
                  )}
                </>
              )}
              
              {selectedInventoryItem && (
                <>
                  <h3 className="text-lg font-bold mb-1" style={{ color: RARITY_COLORS[selectedInventoryItem.rarity] || '#fff' }}>
                    {selectedInventoryItem.name}
                  </h3>
                  <p className="text-xs text-gray-400 mb-2 uppercase">{selectedInventoryItem.rarity} {selectedInventoryItem.slot}</p>
                  
                  {selectedInventoryItem.damage && <p className="text-xl font-bold text-red-400 mb-2">{selectedInventoryItem.damage} ATTACK</p>}
                  {selectedInventoryItem.defense && <p className="text-xl font-bold text-blue-400 mb-2">{selectedInventoryItem.defense} DEFENSE</p>}
                  
                  {selectedInventoryItem.stats && (
                    <ul className="list-disc list-inside text-sm mb-4 text-gray-300">
                      {Object.entries(selectedInventoryItem.stats).map(([k, v]) => (
                        <li key={k}>+{v} {k.replace('_', ' ')}</li>
                      ))}
                    </ul>
                  )}
                  
                  <Button 
                    className="mt-auto w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold"
                    onClick={() => handleEquip(selectedInventoryItem.id, selectedInventoryItem.slot)}
                    disabled={equipping || !selectedInventoryItem.slot}
                  >
                    Equipaggia
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="bg-[#1A1525] p-4 rounded-lg border border-[#4A3B72] flex-grow flex items-center justify-center text-center">
              <p className="text-gray-500 text-sm">Seleziona un oggetto o uno slot per vederne i dettagli.</p>
            </div>
          )}
          
          {/* Total Stats Summary */}
          {Object.keys(totalStats).length > 0 && !selectedSlot && !selectedInventoryItem && (
             <div className="mt-4 bg-[#1A1525] p-4 rounded-lg border border-[#4A3B72] flex-shrink-0">
                <h4 className="text-[#D4AF37] font-bold text-sm mb-2">Bonus Totali</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(totalStats).map(([stat, val]) => (
                    <div key={stat} className="flex justify-between border-b border-[#2D283E] pb-1">
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
  );
}
