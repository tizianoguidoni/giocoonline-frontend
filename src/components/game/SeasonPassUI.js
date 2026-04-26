import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Lock, Check, ChevronRight, Gem, Coins, Sword, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SeasonPassUI({ season, level, xp, xpRequired, isPremium, claimedFree, claimedPremium, onClaim, onBuyPremium, onClose }) {
  const scrollRef = useRef(null);

  if (!season) return null;

  const handleClaim = (reqLevel, type) => {
    if (onClaim) onClaim(reqLevel, type);
  };

  const handleBuyPremium = () => {
    if (onBuyPremium) onBuyPremium();
  };

  const getRewardIcon = (type) => {
    switch (type) {
      case 'gold': return <Coins className="w-6 h-6 text-yellow-400" />;
      case 'gems': return <Gem className="w-6 h-6 text-purple-400" />;
      case 'weapon': return <Sword className="w-6 h-6 text-red-400" />;
      case 'armor': return <Shield className="w-6 h-6 text-blue-400" />;
      case 'project': return <Star className="w-6 h-6 text-orange-400" />;
      default: return <Star className="w-6 h-6 text-gray-400" />;
    }
  };

  const renderRewardCard = (rewardObj, isPremiumRow) => {
    if (!rewardObj) return <div className="w-24 h-24 m-1 opacity-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10" />;
    
    const reqLevel = rewardObj.level;
    const reward = isPremiumRow ? rewardObj.premiumReward : rewardObj.freeReward;
    
    if (!reward) return <div className="w-24 h-24 m-1 opacity-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10" />;

    const isUnlocked = level >= reqLevel;
    const isClaimed = isPremiumRow ? claimedPremium.includes(reqLevel) : claimedFree.includes(reqLevel);
    const canClaim = isUnlocked && !isClaimed && (!isPremiumRow || isPremium);
    const lockedByPremium = isPremiumRow && !isPremium;

    return (
      <div 
        className={`w-24 h-28 m-1 relative rounded-xl border flex flex-col items-center justify-center p-2 transition-all cursor-pointer ${
          isClaimed ? 'bg-green-900/30 border-green-500/50 opacity-60' :
          canClaim ? 'bg-gradient-to-b from-yellow-500/20 to-orange-500/20 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] animate-pulse' :
          isUnlocked && lockedByPremium ? 'bg-black/50 border-[#D4AF37]/30' :
          'bg-black/40 border-white/10'
        }`}
        onClick={() => canClaim && handleClaim(reqLevel, isPremiumRow ? 'premium' : 'free')}
      >
        <div className="absolute top-1 left-2 text-[10px] font-bold text-white/50">LV.{reqLevel}</div>
        
        {!isUnlocked && <Lock className="absolute top-2 right-2 w-3 h-3 text-white/20" />}
        {isClaimed && <Check className="absolute top-2 right-2 w-4 h-4 text-green-400" />}
        {isUnlocked && lockedByPremium && !isClaimed && <Crown className="absolute top-2 right-2 w-3 h-3 text-[#D4AF37]/50" />}

        <div className="mb-1 mt-3">
          {getRewardIcon(reward.type)}
        </div>
        
        <div className="text-[10px] text-center font-bold text-white leading-tight">
          {reward.amount ? `+${reward.amount}` : ''}
          {reward.name || (reward.id ? reward.id.toUpperCase() : '')}
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-0 left-0 right-0 h-[65vh] bg-[#0A0A0F] border-t-2 border-[#D4AF37] shadow-[0_-10px_50px_rgba(212,175,55,0.15)] z-[100] flex flex-col font-sans"
    >
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/10 to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center border-2 border-black shadow-[0_0_20px_rgba(212,175,55,0.4)]">
            <span className="text-2xl font-black text-black">{level}</span>
          </div>
          
          <div>
            <h2 className="text-3xl font-black text-white tracking-wider flex items-center gap-3">
              {season.name}
              {isPremium && <span className="text-[12px] bg-[#D4AF37] text-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1"><Crown className="w-3 h-3"/> Premium Active</span>}
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="w-64 h-2 bg-black rounded-full overflow-hidden border border-white/20">
                <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-300" style={{ width: `${(xp / xpRequired) * 100}%` }} />
              </div>
              <span className="text-xs text-white/50 font-mono">{xp} / {xpRequired} XP</span>
              <span className="text-xs text-white/30 ml-4 font-mono">Ends in {season.durationDays} days</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          {!isPremium && (
            <Button 
              onClick={handleBuyPremium}
              className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black hover:opacity-90 font-bold px-6 py-6 h-auto shadow-[0_0_20px_rgba(212,175,55,0.3)] border-none"
            >
              <div className="flex flex-col items-center">
                <span className="flex items-center gap-2"><Crown className="w-4 h-4"/> Sblocca Premium</span>
                <span className="text-xs opacity-80">{season.price}€</span>
              </div>
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} className="text-white/50 hover:text-white">
            Chiudi
          </Button>
        </div>
      </div>

      {/* Rewards Track */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex flex-col gap-4 min-w-max">
          
          {/* Premium Row */}
          <div className="flex items-center">
            <div className="w-32 flex-shrink-0 flex items-center justify-between pr-4 border-r border-white/10 mr-4">
              <div className="flex items-center gap-2 text-[#D4AF37] font-bold">
                <Crown className="w-4 h-4" /> Premium
              </div>
              <ChevronRight className="w-4 h-4 text-white/20" />
            </div>
            {season.rewards.map((r, i) => (
              <React.Fragment key={`prem_${i}`}>
                {renderRewardCard(r, true)}
                {i < season.rewards.length - 1 && <div className="w-8 h-[1px] bg-white/10 mx-1" />}
              </React.Fragment>
            ))}
          </div>

          {/* Free Row */}
          <div className="flex items-center">
            <div className="w-32 flex-shrink-0 flex items-center justify-between pr-4 border-r border-white/10 mr-4">
              <div className="flex items-center gap-2 text-white/70 font-bold">
                Free
              </div>
              <ChevronRight className="w-4 h-4 text-white/20" />
            </div>
            {season.rewards.map((r, i) => (
              <React.Fragment key={`free_${i}`}>
                {renderRewardCard(r, false)}
                {i < season.rewards.length - 1 && <div className="w-8 h-[1px] bg-white/10 mx-1" />}
              </React.Fragment>
            ))}
          </div>

        </div>
      </div>

      {/* CSS for custom horizontal scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.6);
        }
      `}} />
    </motion.div>
  );
}
