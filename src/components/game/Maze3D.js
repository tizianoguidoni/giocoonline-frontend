import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Game } from '@/game/Game';
import { assetManager } from '@/game/AssetManager';
import { useAuth } from '@/context/AuthContext';
import { 
  Skull, Heart, Zap, Shield, Target, 
  Map as MapIcon, Settings, X, LogOut,
  ChevronRight, Award, Clock, Coins, Swords,
  ShieldCheck, Flame, Sparkles
} from 'lucide-react';
import { AdminPanelUI } from '../AdminPanelUI';

// API URL helper
const API = process.env.REACT_APP_BACKEND_URL 
  ? (process.env.REACT_APP_BACKEND_URL.endsWith('/api') ? process.env.REACT_APP_BACKEND_URL : `${process.env.REACT_APP_BACKEND_URL}/api`)
  : 'http://localhost:8000/api';

export default function Maze3D({ onExit }) {
  const { user, character } = useAuth();
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  
  const [gameState, setGameState] = useState(null);
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [hitMarker, setHitMarker] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);
  const [showBossPopup, setShowBossPopup] = useState(false);
  const bossPopupCooldownRef = useRef(false);

  // Load assets
  useEffect(() => {
    if (!isAssetsLoaded) {
      console.log("Maze3D: Loading assets...");
      assetManager.loadAll().then(() => {
        console.log("Maze3D: Assets loaded successfully");
        setIsAssetsLoaded(true);
      }).catch(err => {
        console.error("Maze3D: Failed to load assets:", err);
        setIsAssetsLoaded(true); // Proceed anyway with fallbacks
      });
    }
  }, [isAssetsLoaded]);

  // Detect boss proximity and show popup
  useEffect(() => {
    if (!gameState) return;
    const nearBoss = gameState.bossVisible && gameState.bossAlive;
    if (nearBoss && !bossPopupCooldownRef.current) {
      bossPopupCooldownRef.current = true;
      setShowBossPopup(true);
      // Pause game while popup is visible
      if (gameRef.current) gameRef.current.setPaused(true);
      if (document.pointerLockElement) document.exitPointerLock();
    }
  }, [gameState]);

  // Handle Game Events
  const handleEvent = (event) => {
    switch (event.type) {
      case 'state':
        setGameState(event.state);
        break;
      case 'toast':
        addToast(event.text);
        break;
      case 'hit-marker':
        setHitMarker(true);
        setTimeout(() => setHitMarker(false), 150);
        break;
      case 'damage':
        setDamageFlash(true);
        setTimeout(() => setDamageFlash(false), 200);
        break;
      case 'win':
        // Handle victory - trigger exit with results
        setTimeout(() => {
           const results = gameRef.current ? gameRef.current.getSessionResults() : { gold: 0, score: 0 };
           onExit(results);
        }, 2000);
        break;
      case 'death':
        // Handle death
        setTimeout(() => {
           const results = gameRef.current ? gameRef.current.getSessionResults() : { gold: 0, score: 0 };
           onExit(results);
        }, 2000);
        break;
      default:
        break;
    }
  };

  const addToast = (text) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Keyboard shortcuts (Admin)
  useEffect(() => {
    let keys = '';
    const handleKeys = (e) => {
      keys = (keys + e.key.toLowerCase()).slice(-10);
      if (keys.includes('mko')) {
        keys = ''; // Clear to prevent repeated triggers
        const role = user?.role || 'player';
        if (role === 'owner' || role === 'co_admin' || role === 'super_admin' || user?.email === 'admin@mythicarena.com') {
          setAdminOpen(prev => {
            if (!prev && document.pointerLockElement) document.exitPointerLock();
            return !prev;
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [user]);

  // Pause game when modals are open
  useEffect(() => {
    if (gameRef.current) {
      const isPaused = showExitConfirm || adminOpen;
      gameRef.current.setPaused(isPaused);
      
      if (isPaused && document.pointerLockElement) {
        document.exitPointerLock();
      }

      if (!isPaused) {
        setTimeout(() => {
          if (!document.pointerLockElement && gameRef.current) {
            gameRef.current.requestPointerLock();
          }
        }, 300);
      }
    }
  }, [showExitConfirm, adminOpen]);

  // Initialize Game
  useEffect(() => {
    if (isAssetsLoaded && canvasRef.current && !gameRef.current) {
      console.log("Maze3D: Starting Game...");
      const g = new Game(canvasRef.current, handleEvent, character);
      gameRef.current = g;
      g.start();
      
      // Force a resize immediately so the renderer matches the actual canvas size
      requestAnimationFrame(() => {
        if (g && g._onResize) g._onResize();
      });
      
      // Request pointer lock on click
      const lock = () => g.requestPointerLock();
      canvasRef.current.addEventListener('click', lock);
      
      console.log("Maze3D: Game started successfully");
      
      return () => {
        console.log("Maze3D: Component unmounting, stopping game");
        if (canvasRef.current) canvasRef.current.removeEventListener('click', lock);
        if (g) g.stop();
        gameRef.current = null;
      };
    }
  }, [isAssetsLoaded]);

  if (!isAssetsLoaded) {
    return (
      <div className="absolute inset-0 bg-[#0B0914] z-50 flex flex-col items-center justify-center p-8">
        <Skull className="w-20 h-20 text-[#D4AF37] mb-8 animate-pulse" />
        <h2 className="text-2xl font-black text-white tracking-[0.3em] uppercase mb-2">CARICAMENTO LABIRINTO...</h2>
        <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[#D4AF37]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 15, ease: "linear" }}
          />
        </div>
        <p className="text-[#A19BAD] text-sm mt-4 italic">Stiamo preparando le trappole e i mostri...</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black z-50 overflow-hidden cursor-none select-none">
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Game HUD Layer */}
      <AnimatePresence>
        {gameState && !adminOpen && (
          <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
            {/* Top Bar */}
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-xl tracking-tighter">
                  <motion.span initial={{ x: -20 }} animate={{ x: 0 }}>{gameState.zone.toUpperCase()}</motion.span>
                </div>
                <button 
                  onClick={() => setShowExitConfirm(true)}
                  className="text-white/40 hover:text-white text-[10px] tracking-[0.2em] font-bold text-left pointer-events-auto"
                >
                  BACK
                </button>
                <div className="flex items-center gap-4 mt-2">
                   <div className="flex items-center gap-2 text-xs text-white/60">
                      <Clock className="w-3 h-3" />
                      <span className="font-mono">{Math.floor(gameState.time / 60)}:{(Math.floor(gameState.time % 60)).toString().padStart(2, '0')}</span>
                   </div>
                   <div className="flex items-center gap-2 text-xs text-white/60">
                      <Award className="w-3 h-3" />
                      <span className="font-mono">Score {gameState.score}</span>
                   </div>
                </div>
              </div>

              {/* Minimap Placeholder */}
              <div className="w-48 h-48 bg-black/60 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
                 <div className="absolute top-2 left-2 flex gap-1">
                    {gameState.keys.map(k => (
                       <div key={k} className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                    ))}
                 </div>
              </div>
            </div>

            {/* Bottom Bar - Stats & Weapon */}
            <div className="flex justify-between items-end">
              {/* Left: Player Stats */}
              <div className="flex flex-col gap-4 w-64">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-white/60 uppercase font-black tracking-widest">
                    <span className="flex items-center gap-1"><Heart className="w-2 h-2" /> HP</span>
                    <span>{gameState.hp}/{gameState.maxHp}</span>
                  </div>
                  <div className="h-2 bg-black/40 rounded-full border border-white/5 overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#E63946] to-[#ff4d4d]"
                      animate={{ width: `${(gameState.hp / gameState.maxHp) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-white/60 uppercase font-black tracking-widest">
                    <span className="flex items-center gap-1"><Zap className="w-2 h-2" /> Mana</span>
                    <span>{gameState.mana}/{gameState.maxMana}</span>
                  </div>
                  <div className="h-2 bg-black/40 rounded-full border border-white/5 overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#4361EE] to-[#4cc9f0]"
                      animate={{ width: `${(gameState.mana / gameState.maxMana) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1 text-[#D4AF37] font-mono text-xs">
                    <Coins className="w-3 h-3" /> {gameState.pocketMoney}€
                  </div>
                  <div className="flex items-center gap-1 text-[#4361EE] font-mono text-xs">
                    <MapIcon className="w-3 h-3" /> {gameState.bankMoney}€
                  </div>
                  <div className="flex items-center gap-1 text-[#4cc9f0] font-mono text-xs">
                    <Award className="w-3 h-3" /> {gameState.gems}
                  </div>
                  <div className="flex items-center gap-1 text-white/40 font-mono text-xs">
                    <Settings className="w-3 h-3" /> {gameState.keys.length}
                  </div>
                </div>
              </div>

              {/* Center: Spells Quick Bar */}
              <div className="flex gap-2">
                 {[
                   { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/20', border: 'border-orange-500', key: 'Z', cost: 30 },
                   { icon: Heart, color: 'text-green-500', bg: 'bg-green-500/20', border: 'border-green-500', key: 'X', cost: 25 },
                   { icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-500/20', border: 'border-blue-500', key: 'C', cost: 35 }
                 ].map((s, idx) => (
                   <div key={idx} className={`w-12 h-12 rounded-lg ${s.bg} border ${s.border} flex flex-col items-center justify-center relative shadow-lg`}>
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                      <span className="text-[8px] text-white/80 absolute -bottom-1 -right-1 bg-black px-1 rounded">{s.key}</span>
                      <span className="text-[8px] text-white/40 absolute -top-5 w-full text-center">{s.cost} <Zap className="w-2 h-2 inline" /></span>
                   </div>
                 ))}
              </div>

              {/* Right: Weapon Info */}
              <div className="text-right flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 text-[#D4AF37]">
                   <span className="text-xs italic opacity-60">{gameState.weapon.name}</span>
                   <gameState.weapon.icon className="w-4 h-4" />
                </div>
                <div className="flex items-baseline gap-1">
                   <span className="text-4xl font-black text-white">{gameState.weapon.ammo}</span>
                   <span className="text-xl text-white/20">/ {gameState.weapon.reserve === Infinity ? '∞' : gameState.weapon.reserve}</span>
                </div>
                <div className="text-[10px] text-white/20 tracking-tighter uppercase font-bold">
                   1..5 armi • R ricarica • Z/X/C magia
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Hit Marker */}
      {hitMarker && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="w-10 h-10 border-2 border-white/40 rotate-45" />
        </div>
      )}

      {/* Damage Flash */}
      {damageFlash && (
        <div className="absolute inset-0 bg-red-600/20 pointer-events-none z-50 animate-pulse" />
      )}

      {/* Premium Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
        <div className="relative w-8 h-8">
          <div className="absolute top-1/2 left-0 w-3 h-[2px] bg-[#D4AF37] -translate-y-1/2 shadow-[0_0_8px_#D4AF37]" />
          <div className="absolute top-1/2 right-0 w-3 h-[2px] bg-[#D4AF37] -translate-y-1/2 shadow-[0_0_8px_#D4AF37]" />
          <div className="absolute top-0 left-1/2 w-[2px] h-3 bg-[#D4AF37] -translate-x-1/2 shadow-[0_0_8px_#D4AF37]" />
          <div className="absolute bottom-0 left-1/2 w-[2px] h-3 bg-[#D4AF37] -translate-x-1/2 shadow-[0_0_8px_#D4AF37]" />
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Boss Area Blocked Overlay */}
      <AnimatePresence>
        {showBossPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[300] flex items-center justify-center"
            style={{ background: 'rgba(10,0,20,0.88)', backdropFilter: 'blur(12px)' }}
            onClick={() => {
              setShowBossPopup(false);
              bossPopupCooldownRef.current = false;
              if (gameRef.current) gameRef.current.setPaused(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 18 }}
              onClick={e => e.stopPropagation()}
              className="relative max-w-md w-full mx-6 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(200,40,40,0.4)]"
              style={{ background: 'linear-gradient(135deg,#1a0010 0%,#0d0020 60%,#1a0510 100%)', border: '1px solid rgba(200,40,40,0.35)' }}
            >
              {/* Animated top glow bar */}
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#e63946,#ff8c00,#e63946)', backgroundSize: '200% 100%', animation: 'shimmer 2s linear infinite' }} />

              <div className="p-8 text-center">
                {/* Boss skull icon */}
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(230,57,70,0.3)' }} />
                  <div className="relative w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(230,57,70,0.15)', border: '2px solid rgba(230,57,70,0.5)' }}>
                    <Skull className="w-10 h-10 text-[#E63946]" />
                  </div>
                </div>

                <h2 className="text-2xl font-black text-white mb-1 tracking-widest uppercase">⚔ Stanza del Guardiano</h2>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg,transparent,rgba(230,57,70,0.6))' }} />
                  <span className="text-[#E63946] text-xs font-bold uppercase tracking-[0.3em]">Boss Arena</span>
                  <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg,rgba(230,57,70,0.6),transparent)' }} />
                </div>

                <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-white/90 text-base leading-relaxed font-medium">
                    🛠️ La funzione Boss non è ancora disponibile.
                  </p>
                  <p className="text-white/50 text-sm mt-2">
                    Stiamo sviluppando per voi! 😊
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#E63946] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#ff8c00] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowBossPopup(false);
                    bossPopupCooldownRef.current = false;
                    if (gameRef.current) gameRef.current.setPaused(false);
                  }}
                  className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#E63946,#c0212c)', color: 'white', boxShadow: '0 4px 24px rgba(230,57,70,0.4)' }}
                >
                  Torna al Dungeon
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals Layer */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[200]">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#161224] border border-[#D4AF37]/30 p-10 rounded-3xl max-w-md text-center shadow-[0_0_50px_rgba(212,175,55,0.2)]"
            >
              <LogOut className="w-16 h-16 text-[#E63946] mx-auto mb-6" />
              <h3 className="text-3xl font-black text-white mb-4">ABBANDONARE?</h3>
              <p className="text-[#A19BAD] mb-8">Tutti i progressi della sessione corrente andranno persi. Sei sicuro?</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all"
                >
                  RESTA
                </button>
                <button 
                  onClick={() => {
                    const results = gameRef.current ? gameRef.current.getSessionResults() : { gold: 0, score: 0 };
                    onExit(results);
                  }}
                  className="flex-1 py-4 bg-[#E63946] hover:bg-[#ff4d4d] text-white font-bold rounded-2xl transition-all"
                >
                  ESCI
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {adminOpen && <AdminPanelUI role={user?.role || 'player'} game={gameRef.current} onClose={() => setAdminOpen(false)} />}
      </AnimatePresence>

      {/* Toasts */}
      <div className="absolute bottom-40 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="px-6 py-3 bg-[#D4AF37] text-black font-bold rounded-full shadow-lg text-sm flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
