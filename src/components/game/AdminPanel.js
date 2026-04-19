import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Shield, Users, Package, Swords, Crown, Trash2, 
  Gift, Megaphone, Search, RefreshCw, Edit, Plus,
  Skull, Award, Coins, Star, ChevronDown, Ban,
  FileText, UserCheck, UserX, AlertTriangle, History,
  Gem, Trophy, Check, X
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RARITY_COLORS = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
  admin: '#E63946'
};

export default function AdminPanel() {
  const { t } = useTranslation();
  const { user, character } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  
  // Users & Characters
  const [users, setUsers] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChar, setSelectedChar] = useState(null);
  
  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  
  // Give item
  const [allItems, setAllItems] = useState([]);
  const [giveItemId, setGiveItemId] = useState('');
  const [giveItemQty, setGiveItemQty] = useState(1);
  
  // Ban
  const [banDays, setBanDays] = useState(1);
  const [banReason, setBanReason] = useState('');
  
  // Co-Admin
  const [coAdmins, setCoAdmins] = useState([]);
  
  // Contest
  const [contestRewards, setContestRewards] = useState([]);
  const [contestItemId, setContestItemId] = useState('');
  const [contestAchievement, setContestAchievement] = useState('');
  
  // Logs
  const [adminLogs, setAdminLogs] = useState([]);
  
  // Broadcast
  const [broadcastMsg, setBroadcastMsg] = useState('');

  const isSuperAdmin = user?.role === 'super_admin';
  const isAnyAdmin = user?.role === 'super_admin' || user?.role === 'co_admin';

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isAnyAdmin) {
      fetchData();
    }
  }, [isAnyAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const promises = [
        axios.get(`${API}/admin/users`),
        axios.get(`${API}/admin/characters`)
      ];
      
      if (isSuperAdmin) {
        promises.push(
          axios.get(`${API}/admin/dashboard`),
          axios.get(`${API}/admin/items`),
          axios.get(`${API}/admin/co-admins`),
          axios.get(`${API}/admin/logs?limit=50`),
          axios.get(`${API}/admin/contest/rewards`)
        );
      }
      
      const results = await Promise.all(promises);
      setUsers(results[0].data);
      setCharacters(results[1].data);
      
      if (isSuperAdmin) {
        setDashboardData(results[2].data);
        setAllItems(results[3].data);
        setCoAdmins(results[4].data);
        setAdminLogs(results[5].data);
        setContestRewards(results[6].data);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Errore nel caricamento dati admin');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCharacter = async () => {
    if (!selectedChar) return;
    try {
      await axios.put(`${API}/admin/character/${selectedChar.id}`, editData);
      toast.success('Personaggio aggiornato!');
      setEditMode(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Errore');
    }
  };

  const handleDonateItem = async () => {
    if (!selectedChar || !giveItemId) return;
    try {
      await axios.post(`${API}/admin/donate`, {
        target_character_id: selectedChar.id,
        item_id: giveItemId,
        quantity: giveItemQty
      });
      const item = allItems.find(i => i.id === giveItemId);
      toast.success(`Donato ${giveItemQty}x ${item?.name || giveItemId} a ${selectedChar.name}!`);
      setGiveItemId('');
      setGiveItemQty(1);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Errore');
    }
  };

  const handleBanPlayer = async () => {
    if (!selectedChar || !banReason) {
      toast.error('Inserisci un motivo per il ban');
      return;
    }
    
    // Co-admin can only ban for max 5 days
    const maxDays = isSuperAdmin ? 365 : 5;
    const days = Math.min(banDays, maxDays);
    
    try {
      // Find user_id from character
      const targetUser = users.find(u => u.id === selectedChar.user_id);
      if (!targetUser) {
        toast.error('Utente non trovato');
        return;
      }
      
      await axios.post(`${API}/admin/ban`, {
        user_id: targetUser.id,
        days: days,
        reason: banReason
      });
      toast.success(`${selectedChar.name} bannato per ${days} giorni`);
      setBanDays(1);
      setBanReason('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Errore nel ban');
    }
  };

  const handleUnbanPlayer = async (userId) => {
    try {
      await axios.post(`${API}/admin/unban/${userId}`);
      toast.success('Utente sbannato!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Errore');
    }
  };

  const handleCreateCoAdmin = async (userId) => {
    try {
      await axios.post(`${API}/admin/co-admin/create`, { user_id: userId });
      toast.success('Co-Admin creato!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Errore');
    }
  };

  const handleRemoveCoAdmin = async (userId) => {
    try {
      await axios.post(`${API}/admin/co-admin/remove`, { user_id: userId });
      toast.success('Co-Admin rimosso!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Errore');
    }
  };

  const handleContestReward = async () => {
    if (!selectedChar || !contestItemId || !contestAchievement) {
      toast.error('Compila tutti i campi per il premio contest');
      return;
    }
    try {
      await axios.post(`${API}/admin/contest/reward`, {
        character_id: selectedChar.id,
        item_id: contestItemId,
        achievement: contestAchievement
      });
      const item = allItems.find(i => i.id === contestItemId);
      toast.success(`Premio ${item?.name} assegnato a ${selectedChar.name}!`);
      setContestItemId('');
      setContestAchievement('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Errore');
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    try {
      await axios.post(`${API}/admin/broadcast?message=${encodeURIComponent(broadcastMsg)}`);
      toast.success('Messaggio broadcast inviato!');
      setBroadcastMsg('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Errore');
    }
  };

  // Filter characters by search
  const filteredChars = characters.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.includes(searchTerm)
  );

  // Check access
  if (!isAnyAdmin) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-[#E63946] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Accesso Negato</h2>
          <p className="text-[#A19BAD]">Solo gli amministratori possono accedere a questa sezione.</p>
        </div>
      </div>
    );
  }

  // Legendary items for contest (only super admin)
  const legendaryItems = allItems.filter(i => i.rarity === 'legendary' || i.rarity === 'admin');

  return (
    <div className="h-full overflow-auto">
      <div className="glass-panel rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
            isSuperAdmin 
              ? 'from-[#E63946] to-[#ff6b6b]' 
              : 'from-[#9D4CDD] to-[#7B2CBF]'
          } flex items-center justify-center`}>
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {isSuperAdmin ? 'Super Admin' : 'Co-Admin'} Panel
            </h2>
            <p className="text-[#A19BAD] text-sm">
              {isSuperAdmin 
                ? 'Controllo completo del gioco' 
                : 'Gestione moderazione (ban max 5 giorni)'}
            </p>
          </div>
          <Button onClick={fetchData} variant="ghost" className="ml-auto text-[#A19BAD]">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className={`grid bg-black/30 ${isSuperAdmin ? 'grid-cols-6' : 'grid-cols-2'}`}>
            {isSuperAdmin && (
              <TabsTrigger value="dashboard" data-testid="admin-tab-dashboard">
                <BarChart3Icon className="w-4 h-4 mr-2" /> Dashboard
              </TabsTrigger>
            )}
            <TabsTrigger value="players" data-testid="admin-tab-players">
              <Users className="w-4 h-4 mr-2" /> Giocatori
            </TabsTrigger>
            {isSuperAdmin && (
              <>
                <TabsTrigger value="items" data-testid="admin-tab-items">
                  <Package className="w-4 h-4 mr-2" /> Oggetti
                </TabsTrigger>
                <TabsTrigger value="coadmins" data-testid="admin-tab-coadmins">
                  <UserCheck className="w-4 h-4 mr-2" /> Co-Admin
                </TabsTrigger>
                <TabsTrigger value="contest" data-testid="admin-tab-contest">
                  <Trophy className="w-4 h-4 mr-2" /> Contest
                </TabsTrigger>
                <TabsTrigger value="logs" data-testid="admin-tab-logs">
                  <History className="w-4 h-4 mr-2" /> Log
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="moderation" data-testid="admin-tab-moderation">
              <Ban className="w-4 h-4 mr-2" /> Ban
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab (Super Admin Only) */}
          {isSuperAdmin && (
            <TabsContent value="dashboard" className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-[#D4AF37]">{dashboardData?.stats?.total_users || 0}</p>
                  <p className="text-[#A19BAD] text-sm">Utenti Totali</p>
                </div>
                <div className="glass-panel rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-[#9D4CDD]">{dashboardData?.stats?.total_characters || 0}</p>
                  <p className="text-[#A19BAD] text-sm">Personaggi</p>
                </div>
                <div className="glass-panel rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-[#2A9D8F]">{dashboardData?.stats?.co_admins || 0}</p>
                  <p className="text-[#A19BAD] text-sm">Co-Admin</p>
                </div>
                <div className="glass-panel rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-[#E63946]">{dashboardData?.stats?.banned_users || 0}</p>
                  <p className="text-[#A19BAD] text-sm">Bannati</p>
                </div>
              </div>

              {/* Recent Logs */}
              <div className="gold-framed-panel rounded-xl p-4">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#D4AF37]" />
                  Attivita Recenti
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {dashboardData?.recent_logs?.slice(0, 10).map((log, i) => (
                    <div key={log.id || i} className="bg-black/30 rounded-lg p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#D4AF37] font-medium">{log.action}</span>
                        <span className="text-[#6C667A] text-xs">
                          {new Date(log.timestamp).toLocaleString('it-IT')}
                        </span>
                      </div>
                      <p className="text-[#A19BAD] text-xs mt-1">
                        {JSON.stringify(log.details).substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Broadcast */}
              <div className="gold-framed-panel rounded-xl p-4">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-[#D4AF37]" />
                  Messaggio Globale
                </h3>
                <div className="flex gap-3">
                  <Input
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    className="game-input flex-1"
                    placeholder="Scrivi un messaggio per tutti i giocatori..."
                    data-testid="admin-broadcast-input"
                  />
                  <Button onClick={handleBroadcast} className="btn-primary" data-testid="admin-broadcast-btn">
                    <Megaphone className="w-4 h-4 mr-2" />
                    Invia
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Players Tab */}
          <TabsContent value="players" className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6C667A]" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="game-input pl-11"
                  placeholder="Cerca per nome o email..."
                  data-testid="admin-search-players"
                />
              </div>
              <div className="text-[#A19BAD] text-sm py-2">
                {filteredChars.length} personaggi
              </div>
            </div>

            <div className="grid gap-3 max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D4AF37] border-t-transparent mx-auto"></div>
                </div>
              ) : (
                filteredChars.map(char => {
                  const charUser = users.find(u => u.id === char.user_id);
                  const isBanned = charUser?.is_banned;
                  
                  return (
                    <div 
                      key={char.id}
                      className={`glass-panel rounded-xl p-4 cursor-pointer transition-all ${
                        selectedChar?.id === char.id ? 'border border-[#D4AF37]' : ''
                      } ${isBanned ? 'opacity-60' : ''}`}
                      onClick={() => { setSelectedChar(char); setEditData(char); setEditMode(false); }}
                      data-testid={`admin-char-${char.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#4A3B72] flex items-center justify-center relative">
                          <span className="text-[#D4AF37] font-bold text-lg">{char.name[0]}</span>
                          {char.role === 'super_admin' && (
                            <Crown className="absolute -top-1 -right-1 w-4 h-4 text-[#E63946]" />
                          )}
                          {char.role === 'co_admin' && (
                            <Shield className="absolute -top-1 -right-1 w-4 h-4 text-[#9D4CDD]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-semibold">{char.name}</h4>
                            {isBanned && (
                              <span className="text-[10px] bg-[#E63946] px-2 py-0.5 rounded text-white">BANNATO</span>
                            )}
                          </div>
                          <p className="text-[#6C667A] text-sm">
                            Lv.{char.level} {char.race} {char.char_class}
                          </p>
                          <p className="text-[#6C667A] text-xs">{charUser?.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#D4AF37] font-mono">{char.gold} G</p>
                          <p className="text-[#9D4CDD] text-sm">{char.gems || 0} Gemme</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Character Panel */}
            {selectedChar && isSuperAdmin && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="gold-framed-panel rounded-xl p-4 mt-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Modifica: {selectedChar.name}
                  </h3>
                  <Button
                    onClick={() => setEditMode(!editMode)}
                    variant="ghost"
                    className="text-[#D4AF37]"
                    data-testid="admin-edit-toggle"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {editMode ? 'Annulla' : 'Modifica Stats'}
                  </Button>
                </div>

                {editMode ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {['level', 'gold', 'gems', 'xp', 'hp', 'mana', 'strength', 'intelligence', 'agility', 'defense'].map(field => (
                        <div key={field}>
                          <Label className="text-[#A19BAD] text-xs capitalize">{field}</Label>
                          <Input
                            type="number"
                            value={editData[field] || 0}
                            onChange={(e) => setEditData({...editData, [field]: parseInt(e.target.value)})}
                            className="game-input h-9"
                            data-testid={`admin-edit-${field}`}
                          />
                        </div>
                      ))}
                    </div>
                    <Button onClick={handleUpdateCharacter} className="btn-primary w-full" data-testid="admin-save-btn">
                      Salva Modifiche
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-[#D4AF37] font-bold">{selectedChar.level}</p>
                      <p className="text-[#6C667A] text-xs">Livello</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-[#D4AF37] font-bold">{selectedChar.gold}</p>
                      <p className="text-[#6C667A] text-xs">Oro</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-[#9D4CDD] font-bold">{selectedChar.gems || 0}</p>
                      <p className="text-[#6C667A] text-xs">Gemme</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-[#E63946] font-bold">{selectedChar.hp}/{selectedChar.max_hp}</p>
                      <p className="text-[#6C667A] text-xs">HP</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-[#4361EE] font-bold">{selectedChar.mana}/{selectedChar.max_mana}</p>
                      <p className="text-[#6C667A] text-xs">Mana</p>
                    </div>
                  </div>
                )}

                {/* Give Item (Super Admin Only) */}
                <div className="border-t border-white/10 pt-4 mt-4">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-[#2A9D8F]" />
                    Dona Oggetto (Senza Perderlo)
                  </h4>
                  <div className="flex gap-2">
                    <select
                      value={giveItemId}
                      onChange={(e) => setGiveItemId(e.target.value)}
                      className="game-input flex-1 rounded-lg"
                      data-testid="admin-give-item-select"
                    >
                      <option value="">Seleziona oggetto...</option>
                      {allItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          [{item.rarity}] {item.name} {item.admin_only ? '(ADMIN)' : ''}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      min="1"
                      value={giveItemQty}
                      onChange={(e) => setGiveItemQty(parseInt(e.target.value) || 1)}
                      className="game-input w-20"
                      data-testid="admin-give-item-qty"
                    />
                    <Button onClick={handleDonateItem} className="btn-secondary" data-testid="admin-give-item-btn">
                      <Gift className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </TabsContent>

          {/* Moderation/Ban Tab (Both Admins) */}
          <TabsContent value="moderation" className="space-y-4">
            <div className="gold-framed-panel rounded-xl p-4">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Ban className="w-5 h-5 text-[#E63946]" />
                Sistema Ban
                {!isSuperAdmin && <span className="text-[#A19BAD] text-xs ml-2">(Max 5 giorni)</span>}
              </h3>

              {selectedChar ? (
                <div className="space-y-4">
                  <div className="bg-black/30 rounded-lg p-3">
                    <p className="text-white">Giocatore selezionato: <strong>{selectedChar.name}</strong></p>
                    <p className="text-[#6C667A] text-sm">Lv.{selectedChar.level} {selectedChar.char_class}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[#A19BAD]">Giorni di Ban</Label>
                      <Input
                        type="number"
                        min="1"
                        max={isSuperAdmin ? 365 : 5}
                        value={banDays}
                        onChange={(e) => setBanDays(Math.min(parseInt(e.target.value) || 1, isSuperAdmin ? 365 : 5))}
                        className="game-input"
                        data-testid="admin-ban-days"
                      />
                    </div>
                    <div>
                      <Label className="text-[#A19BAD]">Motivo</Label>
                      <Input
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        className="game-input"
                        placeholder="Motivo del ban..."
                        data-testid="admin-ban-reason"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleBanPlayer} 
                    className="w-full bg-[#E63946] hover:bg-[#E63946]/80"
                    data-testid="admin-ban-btn"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Banna per {banDays} Giorni
                  </Button>
                </div>
              ) : (
                <p className="text-[#6C667A] text-center py-8">
                  Seleziona un giocatore dalla tab "Giocatori" per bannarlo
                </p>
              )}

              {/* Banned Users List */}
              <div className="mt-6 border-t border-white/10 pt-4">
                <h4 className="text-white font-medium mb-3">Utenti Bannati</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {users.filter(u => u.is_banned).map(u => (
                    <div key={u.id} className="flex items-center justify-between bg-[#E63946]/10 rounded-lg p-3">
                      <div>
                        <p className="text-white font-medium">{u.username}</p>
                        <p className="text-[#6C667A] text-xs">
                          Fino a: {u.ban_until ? new Date(u.ban_until).toLocaleDateString('it-IT') : 'N/A'}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleUnbanPlayer(u.id)}
                        variant="ghost"
                        className="text-[#2A9D8F]"
                        data-testid={`admin-unban-${u.id}`}
                      >
                        <Check className="w-4 h-4 mr-1" /> Sbanna
                      </Button>
                    </div>
                  ))}
                  {users.filter(u => u.is_banned).length === 0 && (
                    <p className="text-[#6C667A] text-center py-4">Nessun utente bannato</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Items Tab (Super Admin Only) */}
          {isSuperAdmin && (
            <TabsContent value="items" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
                {allItems.map((item) => (
                  <div 
                    key={item.id}
                    className="glass-panel rounded-lg p-3"
                    style={{ borderLeft: `3px solid ${RARITY_COLORS[item.rarity]}` }}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${RARITY_COLORS[item.rarity]}20` }}
                      >
                        <Package className="w-5 h-5" style={{ color: RARITY_COLORS[item.rarity] }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{item.name}</p>
                        <p className="text-[#6C667A] text-xs capitalize">{item.rarity} {item.type}</p>
                        {item.admin_only && (
                          <span className="text-[10px] bg-[#E63946] px-1 rounded text-white">ADMIN ONLY</span>
                        )}
                        {item.shop && (
                          <span className="text-[10px] bg-[#2A9D8F] px-1 rounded text-white ml-1">SHOP</span>
                        )}
                      </div>
                      <p className="text-[#D4AF37] text-xs font-mono">{item.price}G</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}

          {/* Co-Admin Management (Super Admin Only) */}
          {isSuperAdmin && (
            <TabsContent value="coadmins" className="space-y-4">
              <div className="gold-framed-panel rounded-xl p-4">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#9D4CDD]" />
                  Gestione Co-Admin
                </h3>

                {/* Current Co-Admins */}
                <div className="mb-6">
                  <h4 className="text-[#A19BAD] text-sm mb-3">Co-Admin Attuali ({coAdmins.length})</h4>
                  <div className="space-y-2">
                    {coAdmins.map(admin => (
                      <div key={admin.id} className="flex items-center justify-between bg-[#9D4CDD]/10 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-[#9D4CDD]" />
                          <div>
                            <p className="text-white font-medium">{admin.username}</p>
                            <p className="text-[#6C667A] text-xs">{admin.email}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRemoveCoAdmin(admin.id)}
                          variant="ghost"
                          className="text-[#E63946]"
                          data-testid={`admin-remove-coadmin-${admin.id}`}
                        >
                          <UserX className="w-4 h-4 mr-1" /> Rimuovi
                        </Button>
                      </div>
                    ))}
                    {coAdmins.length === 0 && (
                      <p className="text-[#6C667A] text-center py-4">Nessun Co-Admin</p>
                    )}
                  </div>
                </div>

                {/* Promote to Co-Admin */}
                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-[#A19BAD] text-sm mb-3">Promuovi a Co-Admin</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {users.filter(u => u.role === 'player').map(u => (
                      <div key={u.id} className="flex items-center justify-between bg-black/30 rounded-lg p-3">
                        <div>
                          <p className="text-white">{u.username}</p>
                          <p className="text-[#6C667A] text-xs">{u.email}</p>
                        </div>
                        <Button
                          onClick={() => handleCreateCoAdmin(u.id)}
                          variant="ghost"
                          className="text-[#2A9D8F]"
                          data-testid={`admin-promote-${u.id}`}
                        >
                          <Plus className="w-4 h-4 mr-1" /> Promuovi
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Contest Tab (Super Admin Only) */}
          {isSuperAdmin && (
            <TabsContent value="contest" className="space-y-4">
              <div className="gold-framed-panel rounded-xl p-4">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#F59E0B]" />
                  Premi Contest (Solo Item Leggendari)
                </h3>

                {selectedChar ? (
                  <div className="space-y-4">
                    <div className="bg-black/30 rounded-lg p-3">
                      <p className="text-white">Premiare: <strong>{selectedChar.name}</strong></p>
                    </div>

                    <div>
                      <Label className="text-[#A19BAD]">Oggetto Leggendario</Label>
                      <select
                        value={contestItemId}
                        onChange={(e) => setContestItemId(e.target.value)}
                        className="game-input w-full rounded-lg"
                        data-testid="admin-contest-item"
                      >
                        <option value="">Seleziona oggetto leggendario...</option>
                        {legendaryItems.map(item => (
                          <option key={item.id} value={item.id}>
                            [{item.rarity}] {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-[#A19BAD]">Motivazione/Achievement</Label>
                      <Input
                        value={contestAchievement}
                        onChange={(e) => setContestAchievement(e.target.value)}
                        className="game-input"
                        placeholder="Es: Primo posto Boss mondiale, Miglior PvP del mese..."
                        data-testid="admin-contest-reason"
                      />
                    </div>

                    <Button 
                      onClick={handleContestReward} 
                      className="w-full btn-primary"
                      data-testid="admin-contest-reward-btn"
                    >
                      <Award className="w-4 h-4 mr-2" />
                      Assegna Premio Contest
                    </Button>
                  </div>
                ) : (
                  <p className="text-[#6C667A] text-center py-8">
                    Seleziona un giocatore dalla tab "Giocatori" per premiarlo
                  </p>
                )}

                {/* Recent Rewards */}
                <div className="mt-6 border-t border-white/10 pt-4">
                  <h4 className="text-white font-medium mb-3">Premi Recenti</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {contestRewards.map(reward => (
                      <div key={reward.id} className="bg-[#F59E0B]/10 rounded-lg p-3">
                        <div className="flex justify-between">
                          <span className="text-[#F59E0B] font-medium">{reward.character_name}</span>
                          <span className="text-[#6C667A] text-xs">
                            {new Date(reward.timestamp).toLocaleDateString('it-IT')}
                          </span>
                        </div>
                        <p className="text-white text-sm">{reward.item_name}</p>
                        <p className="text-[#A19BAD] text-xs">{reward.achievement}</p>
                      </div>
                    ))}
                    {contestRewards.length === 0 && (
                      <p className="text-[#6C667A] text-center py-4">Nessun premio assegnato</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Logs Tab (Super Admin Only) */}
          {isSuperAdmin && (
            <TabsContent value="logs" className="space-y-4">
              <div className="glass-panel rounded-xl p-4">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#D4AF37]" />
                  Log Azioni Admin
                </h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {adminLogs.map((log, i) => (
                    <div key={log.id || i} className="bg-black/30 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                            log.action.includes('ban') ? 'bg-[#E63946]/20 text-[#E63946]' :
                            log.action.includes('donate') || log.action.includes('reward') ? 'bg-[#2A9D8F]/20 text-[#2A9D8F]' :
                            log.action.includes('admin') ? 'bg-[#9D4CDD]/20 text-[#9D4CDD]' :
                            'bg-[#D4AF37]/20 text-[#D4AF37]'
                          }`}>
                            {log.action}
                          </span>
                        </div>
                        <span className="text-[#6C667A] text-xs">
                          {new Date(log.timestamp).toLocaleString('it-IT')}
                        </span>
                      </div>
                      <p className="text-[#A19BAD] text-xs mt-2">
                        {JSON.stringify(log.details, null, 2).substring(0, 150)}
                      </p>
                    </div>
                  ))}
                  {adminLogs.length === 0 && (
                    <p className="text-[#6C667A] text-center py-8">Nessun log disponibile</p>
                  )}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

// Simple icon component
function BarChart3Icon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/>
      <path d="M18 17V9"/>
      <path d="M13 17V5"/>
      <path d="M8 17v-3"/>
    </svg>
  );
}
