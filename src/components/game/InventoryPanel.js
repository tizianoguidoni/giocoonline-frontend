import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Package, Sword, Shield, FlaskRound, Gem, Star, Trash2, Crown, Crosshair, Sparkles } from 'lucide-react';
import { getItemImage } from '@/data/itemImages';

const RARITY_COLORS = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
  admin: '#E63946'
};

const ITEM_ICONS = {
  weapon: Sword,
  armor: Shield,
  consumable: FlaskRound,
  accessory: Gem,
  gem: Sparkles,
  material: Package
};

const SLOT_ICONS = {
  sword: Sword,
  secondary: Crosshair,
  shield: Shield,
  helmet: Crown
};

const SLOT_NAMES = {
  sword: 'Spada',
  secondary: 'Colpo',
  shield: 'Scudo',
  helmet: 'Elmo'
};

export default function InventoryPanel() {
  const { t } = useTranslation();
  const { inventory, useItem: consumeItem, fetchInventory } = useGame();
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const handleUseItem = async (itemId) => {
    setLoading(true);
    try {
      const result = await consumeItem(itemId);
      const effects = [];
      if (result.effects?.hp_restored) effects.push(`+${result.effects.hp_restored} HP`);
      if (result.effects?.mana_restored) effects.push(`+${result.effects.mana_restored} Mana`);
      toast.success(`Oggetto usato! ${effects.join(', ')}`);
      setSelectedItem(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Errore nell\'uso dell\'oggetto');
    } finally {
      setLoading(false);
    }
  };

  // Group items by type
  const filterOptions = [
    { id: 'all', label: 'Tutti' },
    { id: 'equipment', label: 'Equipaggiamento' },
    { id: 'consumable', label: 'Consumabili' },
    { id: 'gem', label: 'Gemme' },
    { id: 'material', label: 'Materiali' }
  ];

  const filteredInventory = inventory.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'equipment') return item.slot;
    return item.item_type === filter;
  });

  // Group by rarity for better organization
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    const rarityOrder = { admin: 0, legendary: 1, epic: 2, rare: 3, uncommon: 4, common: 5 };
    return (rarityOrder[a.rarity] || 6) - (rarityOrder[b.rarity] || 6);
  });

  return (
    <div className="h-full flex flex-col">
      <div className="glass-panel rounded-2xl p-6 flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B58E29] flex items-center justify-center">
              <Package className="w-6 h-6 text-[#0B0914]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{t('inventory')}</h2>
              <p className="text-[#A19BAD] text-sm">{inventory.length} oggetti totali</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {filterOptions.map(opt => (
            <Button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              variant="ghost"
              size="sm"
              className={`rounded-lg whitespace-nowrap ${
                filter === opt.id 
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30' 
                  : 'text-[#A19BAD] hover:text-white'
              }`}
              data-testid={`inventory-filter-${opt.id}`}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        
        {/* Inventory Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2" data-testid="inventory-grid">
            {sortedInventory.map((item) => {
              const Icon = item.slot ? (SLOT_ICONS[item.slot] || Package) : (ITEM_ICONS[item.item_type] || Package);
              const rarityColor = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
              
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedItem(item)}
                  className={`aspect-square rounded-xl relative flex flex-col items-center justify-center overflow-hidden transition-all ${
                    item.equipped ? 'ring-2 ring-[#D4AF37]' : ''
                  } ${selectedItem?.id === item.id ? 'ring-2 ring-white' : ''}`}
                  style={{ 
                    backgroundColor: `${rarityColor}15`,
                    borderWidth: 1,
                    borderColor: `${rarityColor}40`
                  }}
                  data-testid={`inventory-item-${item.id}`}
                >
                  <img 
                    src={getItemImage(item.item_id || item.id)} 
                    alt={item.name}
                    className="w-full h-full object-cover absolute inset-0"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <Icon className="w-6 h-6 relative z-10" style={{ color: rarityColor, filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' }} />
                  
                  {/* Quantity badge */}
                  {item.quantity > 1 && (
                    <span className="absolute bottom-1 right-1 text-[10px] font-mono text-white bg-black/60 px-1 rounded">
                      {item.quantity}
                    </span>
                  )}
                  
                  {/* Equipped indicator */}
                  {item.equipped && (
                    <span className="absolute top-1 right-1">
                      <Star className="w-3 h-3 text-[#D4AF37]" fill="#D4AF37" />
                    </span>
                  )}
                  
                  {/* Slot indicator */}
                  {item.slot && (
                    <span 
                      className="absolute top-1 left-1 text-[8px] px-1 rounded font-medium"
                      style={{ backgroundColor: `${rarityColor}30`, color: rarityColor }}
                    >
                      {SLOT_NAMES[item.slot]?.[0] || item.slot[0].toUpperCase()}
                    </span>
                  )}
                </motion.button>
              );
            })}
            
            {sortedInventory.length === 0 && (
              <div className="col-span-full text-center py-12 text-[#6C667A]">
                {filter === 'all' 
                  ? 'Inventario vuoto. Visita il negozio!' 
                  : 'Nessun oggetto in questa categoria'}
              </div>
            )}
          </div>
        </div>
        
        {/* Selected Item Details */}
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="gold-framed-panel rounded-xl p-4 mt-4"
            data-testid="item-details"
          >
            <div className="flex items-start gap-4">
              <div 
                className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ backgroundColor: `${RARITY_COLORS[selectedItem.rarity]}20`, borderWidth: 2, borderColor: RARITY_COLORS[selectedItem.rarity] }}
              >
                <img 
                  src={getItemImage(selectedItem.item_id || selectedItem.id)} 
                  alt={selectedItem.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { 
                    e.target.style.display = 'none';
                    const icon = e.target.nextSibling;
                    if (icon) icon.style.display = 'flex';
                  }}
                />
                <div className="hidden items-center justify-center w-full h-full">
                  {(() => {
                    const Icon = selectedItem.slot 
                      ? (SLOT_ICONS[selectedItem.slot] || Package) 
                      : (ITEM_ICONS[selectedItem.item_type] || Package);
                    return <Icon className="w-8 h-8" style={{ color: RARITY_COLORS[selectedItem.rarity] }} />;
                  })()}
                </div>
              </div>
              
              <div className="flex-1">
                <h3 
                  className="text-lg font-semibold"
                  style={{ color: RARITY_COLORS[selectedItem.rarity] }}
                >
                  {selectedItem.name}
                </h3>
                <p className="text-[#A19BAD] text-sm capitalize">
                  {t(selectedItem.rarity)} {selectedItem.item_type}
                  {selectedItem.slot && (
                    <span className="ml-2 text-[#D4AF37]">
                      • Slot: {SLOT_NAMES[selectedItem.slot] || selectedItem.slot}
                    </span>
                  )}
                </p>
                
                {/* Stats */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(selectedItem.stats || {}).map(([stat, value]) => (
                    <span key={stat} className="text-xs bg-white/10 px-2 py-1 rounded">
                      <span className="text-[#2A9D8F]">+{value}</span> {stat.replace('_', ' ')}
                    </span>
                  ))}
                </div>
                
                {selectedItem.equipped && (
                  <p className="text-[#D4AF37] text-xs mt-2 flex items-center gap-1">
                    <Star className="w-3 h-3" fill="#D4AF37" />
                    Attualmente equipaggiato
                  </p>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2 mt-4">
              {selectedItem.item_type === 'consumable' && (
                <Button
                  onClick={() => handleUseItem(selectedItem.id)}
                  disabled={loading}
                  className="btn-primary rounded-lg flex-1"
                  data-testid="use-item-btn"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <FlaskRound className="w-4 h-4 mr-2" />
                      Usa
                    </>
                  )}
                </Button>
              )}
              
              {selectedItem.slot && !selectedItem.equipped && (
                <p className="text-[#A19BAD] text-xs flex-1 text-center py-2">
                  Vai su "Equipaggiamento" per equipaggiare questo oggetto
                </p>
              )}
              
              <Button
                variant="ghost"
                onClick={() => setSelectedItem(null)}
                className="text-[#A19BAD]"
              >
                Chiudi
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
