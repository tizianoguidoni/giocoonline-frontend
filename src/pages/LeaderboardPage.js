import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trophy, Crown, Medal, ArrowLeft, Users } from 'lucide-react';
import axios from 'axios';
import LanguageSelector from '@/components/LanguageSelector';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState([]);
  const [sortBy, setSortBy] = useState('level');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API}/leaderboard?sort_by=${sortBy}`);
        setLeaderboard(response.data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [sortBy]);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-[#FFD700]" />;
      case 2: return <Medal className="w-6 h-6 text-[#C0C0C0]" />;
      case 3: return <Medal className="w-6 h-6 text-[#CD7F32]" />;
      default: return <span className="text-[#A19BAD] font-mono w-6 text-center">{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0914] p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/">
            <Button variant="ghost" className="text-white/70 hover:text-white">
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t('back')}
            </Button>
          </Link>
          <LanguageSelector />
        </div>
        
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B58E29] mb-4">
            <Trophy className="w-8 h-8 text-[#0B0914]" />
          </div>
          <h1 className="text-4xl font-bold text-white">{t('leaderboard')}</h1>
        </motion.div>
        
        {/* Sort Filters */}
        <div className="flex justify-center gap-4 mb-8">
          {['level', 'xp', 'reputation'].map((filter) => (
            <Button
              key={filter}
              onClick={() => setSortBy(filter)}
              className={`rounded-full px-6 ${
                sortBy === filter ? 'btn-primary' : 'btn-secondary'
              }`}
              data-testid={`sort-${filter}`}
            >
              {t(filter === 'level' ? 'level' : filter === 'xp' ? 'experience' : 'reputation')}
            </Button>
          ))}
        </div>
        
        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="gold-framed-panel rounded-2xl overflow-hidden"
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D4AF37] border-t-transparent mx-auto"></div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-[#6C667A] mx-auto mb-4" />
              <p className="text-[#A19BAD]">No players yet. Be the first!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 p-4 text-[#A19BAD] text-sm uppercase tracking-wider">
                <div className="col-span-1">Rank</div>
                <div className="col-span-5">Player</div>
                <div className="col-span-2 text-center">{t('level')}</div>
                <div className="col-span-2 text-center">XP</div>
                <div className="col-span-2 text-center">{t('clan')}</div>
              </div>
              
              {/* Rows */}
              {leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.character_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors hover:bg-white/5 ${
                    entry.rank <= 3 ? 'bg-[#D4AF37]/5' : ''
                  }`}
                  data-testid={`leaderboard-entry-${entry.rank}`}
                >
                  <div className="col-span-1 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#4A3B72] flex items-center justify-center">
                      <span className="text-[#D4AF37] font-bold">{entry.character_name[0]}</span>
                    </div>
                    <span className="text-white font-semibold">{entry.character_name}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-[#D4AF37] font-mono text-lg">{entry.level}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-[#9D4CDD] font-mono">{entry.xp.toLocaleString()}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    {entry.clan_name ? (
                      <span className="text-[#2A9D8F] text-sm">{entry.clan_name}</span>
                    ) : (
                      <span className="text-[#6C667A]">-</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
