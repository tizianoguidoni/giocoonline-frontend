import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Swords, Shield, Wand2, Skull, Heart, 
  ChevronLeft, ChevronRight, Sparkles,
  User, Users, Mountain, Axe
} from 'lucide-react';
import axios from 'axios';
import LanguageSelector from '@/components/LanguageSelector';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RACE_ICONS = {
  human: User,
  elf: Sparkles,
  dwarf: Mountain,
  orc: Axe
};

const CLASS_ICONS = {
  warrior: Swords,
  mage: Wand2,
  assassin: Skull,
  healer: Heart
};

const AVATARS = {
  warrior: [
    'https://images.unsplash.com/photo-1699500325919-8d5aaf21d0da?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1672673321304-07d3c58247a0?w=200&h=200&fit=crop',
    'https://images.pexels.com/photos/7229896/pexels-photo-7229896.jpeg?auto=compress&cs=tinysrgb&w=200'
  ],
  mage: [
    'https://images.unsplash.com/photo-1636005811079-ea1b09d86e5a?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1572979129454-dce4055c1f68?w=200&h=200&fit=crop',
    'https://images.pexels.com/photos/3155367/pexels-photo-3155367.jpeg?auto=compress&cs=tinysrgb&w=200'
  ],
  assassin: [
    'https://images.unsplash.com/photo-1541727261696-8680e53c1149?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1766878778072-36ee0edac967?w=200&h=200&fit=crop',
    'https://images.pexels.com/photos/3115523/pexels-photo-3115523.jpeg?auto=compress&cs=tinysrgb&w=200'
  ],
  healer: [
    'https://images.unsplash.com/photo-1659489727971-4bbee4d4b312?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1711634998582-052f23b0e3b4?w=200&h=200&fit=crop',
    'https://images.pexels.com/photos/7220103/pexels-photo-7220103.jpeg?auto=compress&cs=tinysrgb&w=200'
  ]
};

export default function CharacterCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createCharacter } = useAuth();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [races, setRaces] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [racesRes, classesRes] = await Promise.all([
          axios.get(`${API}/game/races`),
          axios.get(`${API}/game/classes`)
        ]);
        setRaces(racesRes.data);
        setClasses(classesRes.data);
      } catch (error) {
        console.error('Failed to fetch game data:', error);
      }
    };
    fetchData();
  }, []);

  const calculateStats = () => {
    if (!selectedRace || !selectedClass) return null;
    
    const race = races.find(r => r.id === selectedRace);
    const charClass = classes.find(c => c.id === selectedClass);
    
    if (!race || !charClass) return null;
    
    return {
      strength: race.stats.strength + charClass.stats.strength,
      intelligence: race.stats.intelligence + charClass.stats.intelligence,
      agility: race.stats.agility + charClass.stats.agility,
      defense: race.stats.defense + charClass.stats.defense,
      hp: 100 + charClass.stats.hp_bonus,
      mana: 50 + charClass.stats.mana_bonus
    };
  };

  const stats = calculateStats();

  const handleCreate = async () => {
    if (!name || !selectedRace || !selectedClass) {
      toast.error('Please complete all steps');
      return;
    }
    
    setLoading(true);
    try {
      await createCharacter({
        name,
        race: selectedRace,
        char_class: selectedClass,
        avatar_id: selectedAvatar
      });
      toast.success('Character created!');
      navigate('/game');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create character');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedRace !== null;
      case 2: return selectedClass !== null;
      case 3: return name.length >= 2;
      default: return false;
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1562576650-27130b06c0ab?w=1920&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-[#0B0914]/90"></div>
      
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl z-10"
      >
        <div className="gold-framed-panel rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{t('createCharacter')}</h1>
            <p className="text-[#A19BAD]">Step {step} of 3</p>
            
            {/* Progress bar */}
            <div className="flex gap-2 justify-center mt-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 w-16 rounded-full transition-all ${
                    s <= step ? 'bg-[#D4AF37]' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Content */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-white text-center mb-6">{t('selectRace')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {races.map((race) => {
                    const Icon = RACE_ICONS[race.id] || User;
                    return (
                      <button
                        key={race.id}
                        onClick={() => setSelectedRace(race.id)}
                        className={`selection-card rounded-xl p-4 text-center ${
                          selectedRace === race.id ? 'selected' : ''
                        }`}
                        data-testid={`race-${race.id}`}
                      >
                        <div className="w-16 h-16 mx-auto rounded-full bg-[#4A3B72]/50 flex items-center justify-center mb-3">
                          <Icon className="w-8 h-8 text-[#D4AF37]" />
                        </div>
                        <h3 className="font-semibold text-white">{t(race.id)}</h3>
                        <p className="text-xs text-[#A19BAD] mt-1">{race.description}</p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
            
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-white text-center mb-6">{t('selectClass')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {classes.map((charClass) => {
                    const Icon = CLASS_ICONS[charClass.id] || Swords;
                    return (
                      <button
                        key={charClass.id}
                        onClick={() => setSelectedClass(charClass.id)}
                        className={`selection-card rounded-xl p-4 text-center ${
                          selectedClass === charClass.id ? 'selected' : ''
                        }`}
                        data-testid={`class-${charClass.id}`}
                      >
                        <div className="w-16 h-16 mx-auto rounded-full bg-[#4A3B72]/50 flex items-center justify-center mb-3">
                          <Icon className="w-8 h-8 text-[#D4AF37]" />
                        </div>
                        <h3 className="font-semibold text-white">{t(charClass.id)}</h3>
                        <p className="text-xs text-[#A19BAD] mt-1">{charClass.description}</p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
            
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left - Avatar & Name */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[#A19BAD]">{t('characterName')}</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="game-input h-12 rounded-xl text-lg"
                        placeholder="Enter your hero's name..."
                        maxLength={20}
                        data-testid="character-name-input"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-[#A19BAD]">Select Avatar</Label>
                      <div className="flex gap-3 justify-center">
                        {[1, 2, 3].map((avatarId) => (
                          <button
                            key={avatarId}
                            onClick={() => setSelectedAvatar(avatarId)}
                            className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                              selectedAvatar === avatarId 
                                ? 'border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                                : 'border-white/10'
                            }`}
                            data-testid={`avatar-${avatarId}`}
                          >
                            <img
                              src={selectedClass ? AVATARS[selectedClass][avatarId - 1] : AVATARS.warrior[avatarId - 1]}
                              alt={`Avatar ${avatarId}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right - Stats Preview */}
                  <div className="glass-panel rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#D4AF37]" />
                      Character Preview
                    </h3>
                    
                    {stats && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 rounded-xl overflow-hidden avatar-ring">
                            <img
                              src={selectedClass ? AVATARS[selectedClass][selectedAvatar - 1] : AVATARS.warrior[0]}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-white font-semibold text-lg">{name || 'Your Hero'}</p>
                            <p className="text-[#A19BAD] text-sm">
                              {t(selectedRace)} {t(selectedClass)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {[
                            { label: t('health'), value: stats.hp, max: 150, color: '#E63946' },
                            { label: t('mana'), value: stats.mana, max: 120, color: '#4361EE' },
                            { label: t('strength'), value: stats.strength, max: 25, color: '#D4AF37' },
                            { label: t('intelligence'), value: stats.intelligence, max: 25, color: '#9D4CDD' },
                            { label: t('agility'), value: stats.agility, max: 25, color: '#2A9D8F' },
                            { label: t('defense'), value: stats.defense, max: 25, color: '#6C667A' }
                          ].map((stat) => (
                            <div key={stat.label} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-[#A19BAD]">{stat.label}</span>
                                <span className="text-white font-mono">{stat.value}</span>
                              </div>
                              <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${(stat.value / stat.max) * 100}%`,
                                    backgroundColor: stat.color,
                                    boxShadow: `0 0 10px ${stat.color}50`
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1}
              className="text-white/70 hover:text-white"
              data-testid="prev-step-btn"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              {t('back')}
            </Button>
            
            {step < 3 ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="btn-primary rounded-full px-8"
                data-testid="next-step-btn"
              >
                {t('next')}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={loading || !canProceed()}
                className="btn-primary rounded-full px-8"
                data-testid="create-character-btn"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-[#0B0914] border-t-transparent"></span>
                ) : (
                  <>
                    {t('create')}
                    <Sparkles className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
