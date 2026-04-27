import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  ShoppingBag, Sword, Shield, FlaskRound, Gem, 
  Coins, Search, Filter, Star, Package, Sparkles,
  Crown, Zap, Heart
} from 'lucide-react';
import { getItemImage } from '@/data/itemImages';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RARITY_COLORS = {
  common: { color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.1)', border: 'rgba(156, 163, 175, 0.3)' },
  uncommon: { color: '#22C55E', bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)' },
  rare: { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)' },
  epic: { color: '#A855F7', bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)' },
  legendary: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' }
};

const TYPE_ICONS = {
  weapon: Sword,
  armor: Shield,
  consumable: FlaskRound,
  gem: Gem,
  material: Package
};

const SLOT_NAMES = {
  sword: 'Spada',
  secondary: 'Colpo',
  shield: 'Scudo',
  helmet: 'Elmo',
  backpack: 'Zaino'
};

export default function ShopPanel() {
  const { t } = useTranslation();
  const { character, refreshCharacter } = useAuth();
  const [shopItems, setShopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchShopItems();
  }, []);

  const fetchShopItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/shop`);
      setShopItems(response.data || []);
    } catch (error) {
      console.error('Failed to fetch shop items:', error);
      toast.error('Errore nel caricamento del negozio');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedItem) return;
    
    const totalCost = selectedItem.price * quantity;
    if (character.gold < totalCost) {
      toast.error(`Oro insufficiente! Hai ${character.gold}G, servono ${totalCost}G`);
      return;
    }

    setPurchasing(true);
    try {
      await axios.post(`${API}/shop/buy`, {
        item_id: selectedItem.id,
        quantity: quantity
      });
      
      toast.success(`Acquistato ${quantity}x ${selectedItem.name} per ${totalCost}G!`);
      await refreshCharacter();
      setSelectedItem(null);
      setQuantity(1);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Acquisto fallito');
    } finally {
      setPurchasing(false);
    }
  };

  // Filter items
  const filteredItems = shopItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.type === activeCategory || 
      (activeCategory === 'equipment' && item.slot);
    return matchesSearch && matchesCategory;
  });

  // Group by type for display
  const categories = [
    { id: 'all', label: 'Tutti', icon: Package },
    { id: 'equipment', label: 'Equipaggiamento', icon: Sword },
    { id: 'consumable', label: 'Consumabili', icon: FlaskRound },
    { id: 'gem', label: 'Gemme', icon: Gem },
    { id: 'material', label: 'Materiali', icon: Sparkles }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="glass-panel rounded-2xl p-6 flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B58E29] flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-[#0B0914]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Negozio</h2>
              <p className="text-[#A19BAD] text-sm">Acquista armi, armature e pozioni</p>
            </div>
          </div>
          
          {/* Gold Display */}
          <div className="flex items-center gap-2 bg-[#D4AF37]/20 px-4 py-2 rounded-xl border border-[#D4AF37]/30">
            <Coins className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-[#D4AF37] font-bold font-mono text-lg">{character?.gold || 0}</span>
            <span className="text-[#A19BAD] text-sm">Oro</span>
          </div>
        </div>

        {/* Search and Categories */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6C667A]" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="game-input pl-11"
              placeholder="Cerca oggetti..."
              data-testid="shop-search"
            />
          </div>
          
          <div className="flex gap-1 overflow-x-auto pb-2">
            {categories.map(cat => (
              <Button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                variant="ghost"
                className={`rounded-lg whitespace-nowrap ${
                  activeCategory === cat.id 
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30' 
                    : 'text-[#A19BAD] hover:text-white'
                }`}
                data-testid={`shop-category-${cat.id}`}
              >
                <cat.icon className="w-4 h-4 mr-2" />
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Items Grid and Details */}
        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#D4AF37] border-t-transparent"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredItems.map(item => {
                  const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
                  const Icon = TYPE_ICONS[item.type] || Package;
                  const canAfford = character?.gold >= item.price;
                  
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setSelectedItem(item); setQuantity(1); }}
                      className={`p-4 rounded-xl text-left transition-all ${
                        selectedItem?.id === item.id 
                          ? 'ring-2 ring-[#D4AF37]' 
                          : ''
                      } ${!canAfford ? 'opacity-60' : ''}`}
                      style={{ 
                        backgroundColor: rarity.bg,
                        borderWidth: 1,
                        borderColor: rarity.border
                      }}
                      data-testid={`shop-item-${item.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                          style={{ backgroundColor: `${rarity.color}20`, borderWidth: 1, borderColor: `${rarity.color}40` }}
                        >
                          <img 
                            src={getItemImage(item.id)} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                          <div className="hidden items-center justify-center w-full h-full">
                            <Icon className="w-6 h-6" style={{ color: rarity.color }} />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm truncate">{item.name}</h4>
                          <p className="text-[#6C667A] text-xs capitalize">
                            {t(item.rarity)} 
                            {item.slot && ` - ${SLOT_NAMES[item.slot] || item.slot}`}
                          </p>
                          
                          {/* Quick Stats */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(item.stats).slice(0, 2).map(([stat, val]) => (
                              <span 
                                key={stat} 
                                className="text-[10px] px-1 rounded"
                                style={{ backgroundColor: `${rarity.color}30`, color: rarity.color }}
                              >
                                +{val}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className={`mt-3 flex items-center gap-1 ${canAfford ? 'text-[#D4AF37]' : 'text-[#E63946]'}`}>
                        <Coins className="w-4 h-4" />
                        <span className="font-mono font-bold">{item.price}</span>
                      </div>
                    </motion.button>
                  );
                })}
                
                {filteredItems.length === 0 && (
                  <div className="col-span-full text-center py-12 text-[#6C667A]">
                    Nessun oggetto trovato
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Item Details Panel */}
          <AnimatePresence>
            {selectedItem && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-80 flex-shrink-0"
              >
                <div 
                  className="gold-framed-panel rounded-xl p-5 sticky top-0"
                  data-testid="shop-item-details"
                >
                  {/* Item Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div 
                      className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{ backgroundColor: `${RARITY_COLORS[selectedItem.rarity]?.color}20`, borderWidth: 2, borderColor: RARITY_COLORS[selectedItem.rarity]?.color }}
                    >
                      <img 
                        src={getItemImage(selectedItem.id)} 
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
                          const Icon = TYPE_ICONS[selectedItem.type] || Package;
                          return <Icon className="w-8 h-8" style={{ color: RARITY_COLORS[selectedItem.rarity]?.color }} />;
                        })()}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 
                        className="text-xl font-bold"
                        style={{ color: RARITY_COLORS[selectedItem.rarity]?.color }}
                      >
                        {selectedItem.name}
                      </h3>
                      <p className="text-[#A19BAD] text-sm capitalize">
                        {t(selectedItem.rarity)} {selectedItem.type}
                      </p>
                      {selectedItem.slot && (
                        <p className="text-[#D4AF37] text-xs mt-1">
                          Slot: {SLOT_NAMES[selectedItem.slot] || selectedItem.slot}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mb-4">
                    <h4 className="text-white font-medium mb-2 text-sm">Statistiche</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedItem.stats).map(([stat, val]) => (
                        <div 
                          key={stat}
                          className="bg-black/30 rounded-lg p-2 text-center"
                        >
                          <p className="text-[#D4AF37] font-bold">+{val}</p>
                          <p className="text-[#6C667A] text-xs capitalize">{stat.replace('_', ' ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  {selectedItem.type === 'consumable' || selectedItem.type === 'material' ? (
                    <div className="mb-4">
                      <label className="text-[#A19BAD] text-sm mb-2 block">Quantita</label>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          variant="ghost"
                          className="text-white"
                          disabled={quantity <= 1}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          max={99}
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                          className="game-input w-20 text-center"
                          data-testid="shop-quantity"
                        />
                        <Button
                          onClick={() => setQuantity(Math.min(99, quantity + 1))}
                          variant="ghost"
                          className="text-white"
                          disabled={quantity >= 99}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {/* Total and Purchase */}
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[#A19BAD]">Totale:</span>
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-[#D4AF37]" />
                        <span className={`font-mono font-bold text-xl ${
                          character?.gold >= selectedItem.price * quantity 
                            ? 'text-[#D4AF37]' 
                            : 'text-[#E63946]'
                        }`}>
                          {selectedItem.price * quantity}
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handlePurchase}
                      disabled={purchasing || character?.gold < selectedItem.price * quantity}
                      className="btn-primary w-full rounded-xl py-3"
                      data-testid="shop-buy-btn"
                    >
                      {purchasing ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <ShoppingBag className="w-5 h-5 mr-2" />
                          {character?.gold >= selectedItem.price * quantity 
                            ? 'Acquista' 
                            : 'Oro Insufficiente'}
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => setSelectedItem(null)}
                      variant="ghost"
                      className="w-full mt-2 text-[#A19BAD]"
                    >
                      Chiudi
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
