import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Swords, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      await register(username, email, password);
      toast.success(t('success'));
      navigate('/create-character');
    } catch (error) {
      toast.error(error.response?.data?.detail || t('error'));
    } finally {
      setLoading(false);
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
      <div className="absolute inset-0 bg-[#0B0914]/85"></div>
      
      <div className="absolute top-4 left-4 z-20">
        <Link to="/">
          <Button variant="ghost" className="text-white/70 hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('back')}
          </Button>
        </Link>
      </div>
      
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="gold-framed-panel rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B58E29] mb-4">
              <Swords className="w-8 h-8 text-[#0B0914]" />
            </div>
            <h1 className="text-3xl font-bold text-white">{t('registerTitle')}</h1>
            <p className="text-[#A19BAD] mt-2">Mythic Arena</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[#A19BAD]">{t('username')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6C667A]" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="game-input pl-11 h-12 rounded-xl"
                  placeholder="DragonSlayer99"
                  required
                  minLength={3}
                  maxLength={20}
                  data-testid="register-username-input"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#A19BAD]">{t('email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6C667A]" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="game-input pl-11 h-12 rounded-xl"
                  placeholder="hero@mythicarena.com"
                  required
                  data-testid="register-email-input"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#A19BAD]">{t('password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6C667A]" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="game-input pl-11 h-12 rounded-xl"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  data-testid="register-password-input"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#A19BAD]">{t('confirmPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6C667A]" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="game-input pl-11 h-12 rounded-xl"
                  placeholder="••••••••"
                  required
                  data-testid="register-confirm-password-input"
                />
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 btn-primary rounded-xl text-lg"
              data-testid="register-submit-button"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-[#0B0914] border-t-transparent"></span>
              ) : (
                t('register')
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-[#A19BAD]">
              {t('hasAccount')}{' '}
              <Link to="/login" className="text-[#D4AF37] hover:text-[#FADB5F] transition-colors" data-testid="login-link">
                {t('login')}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
