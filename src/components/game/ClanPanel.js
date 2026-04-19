import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Users, Crown, Shield, Plus, LogOut, Search } from 'lucide-react';

export default function ClanPanel() {
  const { t } = useTranslation();
  const { character } = useAuth();
  const { 
    currentClan, clans, 
    fetchClans, createClan, joinClan, leaveClan 
  } = useGame();
  
  const [showCreate, setShowCreate] = useState(false);
  const [clanName, setClanName] = useState('');
  const [clanTag, setClanTag] = useState('');
  const [clanDesc, setClanDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClans();
  }, [fetchClans]);

  const handleCreateClan = async (e) => {
    e.preventDefault();
    if (!clanName || !clanTag) return;
    
    setLoading(true);
    try {
      await createClan(clanName, clanDesc, clanTag);
      toast.success('Clan created!');
      setShowCreate(false);
      setClanName('');
      setClanTag('');
      setClanDesc('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create clan');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClan = async (clanId) => {
    setLoading(true);
    try {
      await joinClan(clanId);
      toast.success('Joined clan!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to join clan');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveClan = async () => {
    setLoading(true);
    try {
      await leaveClan();
      toast.success('Left clan');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to leave clan');
    } finally {
      setLoading(false);
    }
  };

  const filteredClans = clans.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // User is in a clan
  if (currentClan) {
    return (
      <div className="h-full flex flex-col">
        <div className="glass-panel rounded-2xl p-6 flex-1 overflow-auto">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-[#D4AF37]" />
            <h2 className="text-2xl font-bold text-white">{t('clan')}</h2>
          </div>
          
          {/* Clan Info */}
          <div className="gold-framed-panel rounded-xl p-6 mb-6" data-testid="current-clan">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center">
                <Shield className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">{currentClan.name}</h3>
                  <span className="text-[#D4AF37] text-sm">[{currentClan.tag}]</span>
                </div>
                <p className="text-[#A19BAD] text-sm">Level {currentClan.level}</p>
              </div>
            </div>
            
            <p className="text-[#A19BAD] mb-4">{currentClan.description}</p>
            
            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-[#6C667A]">Members</span>
              <span className="text-white font-mono">{currentClan.members.length}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-[#6C667A]">Territories</span>
              <span className="text-[#2A9D8F] font-mono">{currentClan.territories.length}</span>
            </div>
            
            {currentClan.leader_id === character?.id && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#D4AF37]/10 mb-4">
                <Crown className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-[#D4AF37] text-sm">You are the clan leader</span>
              </div>
            )}
            
            <Button
              onClick={handleLeaveClan}
              disabled={loading}
              variant="ghost"
              className="w-full text-[#E63946] hover:bg-red-500/10"
              data-testid="leave-clan-btn"
            >
              <LogOut className="w-5 h-5 mr-2" />
              {t('leave')} Clan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // User is not in a clan
  return (
    <div className="h-full flex flex-col">
      <div className="glass-panel rounded-2xl p-6 flex-1 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[#D4AF37]" />
            <h2 className="text-2xl font-bold text-white">{t('clan')}</h2>
          </div>
          
          <Button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary rounded-lg"
            data-testid="create-clan-btn"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('create')}
          </Button>
        </div>
        
        {/* Create Clan Form */}
        {showCreate && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateClan}
            className="gold-framed-panel rounded-xl p-4 mb-6 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#A19BAD]">Clan Name</Label>
                <Input
                  value={clanName}
                  onChange={(e) => setClanName(e.target.value)}
                  className="game-input rounded-lg"
                  placeholder="Dragon Knights"
                  maxLength={30}
                  required
                  data-testid="clan-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A19BAD]">Tag (2-5 chars)</Label>
                <Input
                  value={clanTag}
                  onChange={(e) => setClanTag(e.target.value.toUpperCase())}
                  className="game-input rounded-lg"
                  placeholder="DK"
                  maxLength={5}
                  required
                  data-testid="clan-tag-input"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#A19BAD]">Description</Label>
              <Textarea
                value={clanDesc}
                onChange={(e) => setClanDesc(e.target.value)}
                className="game-input rounded-lg resize-none"
                placeholder="We are the mightiest warriors..."
                rows={3}
                maxLength={200}
                data-testid="clan-desc-input"
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="btn-primary rounded-lg flex-1">
                {loading ? 'Creating...' : t('create')}
              </Button>
              <Button type="button" onClick={() => setShowCreate(false)} variant="ghost" className="text-[#A19BAD]">
                {t('cancel')}
              </Button>
            </div>
          </motion.form>
        )}
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6C667A]" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="game-input pl-11 rounded-lg"
            placeholder="Search clans..."
            data-testid="clan-search-input"
          />
        </div>
        
        {/* Clan List */}
        <div className="space-y-3">
          {filteredClans.length === 0 ? (
            <p className="text-[#A19BAD] text-center py-8">No clans found</p>
          ) : (
            filteredClans.map((clan, index) => (
              <motion.div
                key={clan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-panel rounded-xl p-4 flex items-center gap-4"
                data-testid={`clan-${clan.id}`}
              >
                <div className="w-12 h-12 rounded-lg bg-[#4A3B72] flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#D4AF37]" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white">{clan.name}</h4>
                    <span className="text-[#D4AF37] text-xs">[{clan.tag}]</span>
                  </div>
                  <p className="text-[#6C667A] text-sm">
                    {clan.members.length} members • Level {clan.level}
                  </p>
                </div>
                
                <Button
                  onClick={() => handleJoinClan(clan.id)}
                  disabled={loading}
                  className="btn-secondary rounded-lg"
                  data-testid={`join-clan-${clan.id}`}
                >
                  {t('join')}
                </Button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
