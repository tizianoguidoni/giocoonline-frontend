import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import LanguageSelector from '@/components/LanguageSelector';
import { Swords, Shield, Scroll, Users, Globe, ChevronRight, Sparkles } from 'lucide-react';

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, character } = useAuth();

  const features = [
    { icon: Swords, title: t('pvpTitle'), desc: t('pvpDesc'), color: '#E63946' },
    { icon: Scroll, title: t('questsTitle'), desc: t('questsDesc'), color: '#9D4CDD' },
    { icon: Shield, title: t('clansTitle'), desc: t('clansDesc'), color: '#2A9D8F' },
    { icon: Globe, title: t('multiplayerTitle'), desc: t('multiplayerDesc'), color: '#4361EE' }
  ];

  const handlePlayClick = () => {
    if (isAuthenticated) {
      navigate(character ? '/game' : '/create-character');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0914]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B58E29] flex items-center justify-center">
                <Swords className="w-5 h-5 text-[#0B0914]" />
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">Mythic Arena</span>
            </div>
            
            <div className="flex items-center gap-4">
              <LanguageSelector />
              
              {isAuthenticated ? (
                <Button 
                  onClick={handlePlayClick}
                  className="btn-primary rounded-full px-6"
                  data-testid="play-now-header-btn"
                >
                  {t('play')}
                </Button>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="text-white/70 hover:text-white hidden sm:flex" data-testid="login-header-btn">
                      {t('login')}
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="btn-primary rounded-full px-6" data-testid="register-header-btn">
                      {t('register')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1562576650-27130b06c0ab?w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0914]/70 via-[#0B0914]/60 to-[#0B0914]"></div>
        
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-[#D4AF37] rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, -100],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-6">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm text-[#A19BAD]">MMORPG Browser Game</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              {t('heroTitle')}
            </h1>
            
            <p className="text-lg sm:text-xl text-[#A19BAD] mb-4">
              {t('heroSubtitle')}
            </p>
            
            <p className="text-base text-[#6C667A] mb-10 max-w-2xl mx-auto">
              {t('heroDescription')}
            </p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handlePlayClick}
                className="btn-primary text-lg px-10 py-6 rounded-full animate-pulse-gold"
                data-testid="play-now-hero-btn"
              >
                {t('play')}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-[#D4AF37] rounded-full"></div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">{t('features')}</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto"></div>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass-panel rounded-2xl p-6 group cursor-pointer"
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-[#A19BAD] text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="gold-framed-panel rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-transparent"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B58E29] mb-6">
                <Swords className="w-10 h-10 text-[#0B0914]" />
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Begin Your Adventure?
              </h2>
              
              <p className="text-[#A19BAD] mb-8 max-w-xl mx-auto">
                Join thousands of players in epic battles, form alliances, and become a legend.
              </p>
              
              <Button
                onClick={handlePlayClick}
                className="btn-primary text-lg px-10 py-6 rounded-full"
                data-testid="play-now-cta-btn"
              >
                {t('play')}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B58E29] flex items-center justify-center">
              <Swords className="w-4 h-4 text-[#0B0914]" />
            </div>
            <span className="text-[#A19BAD]">Mythic Arena © 2024</span>
          </div>
          
          <div className="flex items-center gap-6">
            <Link to="/leaderboard" className="text-[#A19BAD] hover:text-white transition-colors">
              {t('leaderboard')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
