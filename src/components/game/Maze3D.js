import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Game } from '../../game/Game';
import { assetManager } from '../../game/AssetManager';
import { HUD } from '../../components/HUD';
import { MiniMap } from '../../components/HUD';
import { AdminPanelUI } from '../../components/AdminPanelUI';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000/api';

export default function Maze3D({ onExit }) {
  const { user, character, refreshCharacter } = useAuth();
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  
  const [started, setStarted] = useState(false);
  const [state, setState] = useState(null);
  const [zoneName, setZoneName] = useState('Dungeon');
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [end, setEnd] = useState(null);
  
  const keysPressed = useRef([]);

  const handleEvent = useCallback((ev) => {
    if (ev.type === 'state') setState(ev.state);
    else if (ev.type === 'toast') {
      toast(ev.text);
    } else if (ev.type === 'zone') {
      setZoneName(ev.zone.name);
    } else if (ev.type === 'death') {
      setEnd('death');
    } else if (ev.type === 'win') {
      setEnd('win');
    }
  }, []);

  const startGame = useCallback(() => {
    if (gameRef.current) { gameRef.current.stop(); gameRef.current = null; }
    setEnd(null); setState(null);
    const g = new Game(canvasRef.current, handleEvent);
    gameRef.current = g;
    g.start();
    setStarted(true);
    setTimeout(() => g.requestPointerLock(), 100);
  }, [handleEvent]);

  useEffect(() => {
    if (!isAssetsLoaded) {
       assetManager.loadAll().then(() => {
          setIsAssetsLoaded(true);
       });
    }
  }, [isAssetsLoaded]);

  useEffect(() => {
    if (isAssetsLoaded && canvasRef.current && !started && !end) {
       startGame();
    }
  }, [isAssetsLoaded, started, end, startGame]);

  useEffect(() => {
    return () => { if (gameRef.current) gameRef.current.stop(); };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      // M-K-O Admin Shortcut
      const keyStr = e.key.toLowerCase();
      keysPressed.current.push(keyStr);
      if (keysPressed.current.length > 5) keysPressed.current.shift();
      
      const seq = keysPressed.current.join('');
      if (seq.includes('mko')) {
        const role = user?.role || 'player';
        if (role === 'owner' || role === 'co_admin' || role === 'super_admin') {
          setAdminOpen(prev => {
            if (!prev && document.pointerLockElement) document.exitPointerLock();
            return !prev;
          });
        }
        keysPressed.current = [];
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [user]);

  // Handle game end / rewards
  useEffect(() => {
    const processRewards = async () => {
      if (end && state) {
        if (end === 'win') {
          toast.success(`FUGA RIUSCITA! Hai mantenuto ${state.score} monete e guadagnato XP!`);
          // Here we would call an API point to save the loot securely
          try {
             // Example endpoint, replace appropriately later
             await axios.post(`${API}/combat/maze-win`, { gold: state.score });
             refreshCharacter();
          } catch(e) {}
        } else {
          toast.error("SEI MORTO. Hai perso il bottino in tasca.");
        }
      }
    };
    processRewards();
  }, [end, state, refreshCharacter]);

  if (!isAssetsLoaded) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black text-[#50c8e8]">
         <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#50c8e8] border-t-transparent mb-4"></div>
         <div>CARICAMENTO ASSET 3D...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden" style={{ cursor: started && !end && !showExitConfirm && !adminOpen ? 'none' : 'default' }}>
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {started && !end && (
        <div className="absolute inset-0 pointer-events-none z-50">
          <HUD state={state} zoneName={zoneName} />
          {gameRef.current && <MiniMap game={gameRef.current} />}
        </div>
      )}

      {/* Back Button */}
      {started && !end && !adminOpen && (
        <div className="absolute top-5 left-5 z-[100]">
          <button 
            onClick={() => {
              if (document.pointerLockElement) document.exitPointerLock();
              setShowExitConfirm(true);
            }} 
            className="text-4xl text-[#50c8e8] drop-shadow-[0_0_10px_#50c8e8] hover:scale-110 transition-transform"
          >
            🔙
          </button>
        </div>
      )}

      {/* Exit Confirmation */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center">
          <div className="bg-[#0a0a0f] border border-[#50c8e8] p-10 text-center text-white shadow-[0_0_30px_rgba(80,200,232,0.2)]">
            <h2 className="text-[#ff4020] text-2xl font-bold mb-4 tracking-widest">ATTENZIONE</h2>
            <p className="opacity-80 leading-relaxed max-w-md">
              Se esci dal labirinto e torni alla Hub, <b>la partita si resetterà</b>.<br/>
              L'oro e l'equipaggiamento rimangono salvati nel tuo inventario, non preoccuparti!
            </p>
            <div className="flex gap-4 justify-center mt-8">
               <button 
                 onClick={async () => {
                   setShowExitConfirm(false); 
                   setStarted(false); 
                   if (state && state.score > 0) {
                     try {
                        await axios.post(`${API}/combat/maze-win`, { gold: state.score });
                        refreshCharacter();
                        toast.success(`Hai salvato ${state.score} monete tornando alla base.`);
                     } catch(e) { }
                   }
                   if (gameRef.current) gameRef.current.stop(); 
                   onExit(); 
                 }} 
                 className="px-6 py-3 bg-[#ff4020] text-white font-bold tracking-wider hover:bg-red-600"
               >
                 RITORNA ALL'HUB
               </button>
               <button 
                 onClick={() => { 
                   setShowExitConfirm(false); 
                   setTimeout(() => gameRef.current && gameRef.current.requestPointerLock(), 150); 
                 }} 
                 className="px-6 py-3 border border-[#50c8e8] text-[#50c8e8] tracking-wider hover:bg-[#50c8e8]/10"
               >
                 ANNULLA
               </button>
            </div>
          </div>
        </div>
      )}

      {/* End Screen */}
      {end && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-[200]">
           <div className={`text-6xl font-bold tracking-widest mb-4 ${end === 'win' ? 'text-green-500' : 'text-red-500'}`}>
              {end === 'win' ? 'FUGA RIUSCITA' : 'SEI MORTO'}
           </div>
           <div className="text-white opacity-80 text-lg mb-8">
              Score: <span className="text-yellow-400 font-bold">{state?.score || 0}</span> | Tempo: {Math.floor(state?.time || 0)}s
           </div>
           <div className="flex gap-4">
             <button onClick={() => startGame()} className="px-6 py-3 border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 tracking-widest">RIPROVA</button>
             <button onClick={onExit} className="px-6 py-3 border-2 border-blue-500 text-blue-500 hover:bg-blue-500/10 tracking-widest">TORNA ALL'HUB</button>
           </div>
        </div>
      )}

      {adminOpen && <AdminPanelUI role={user?.role || 'player'} game={gameRef.current} onClose={() => setAdminOpen(false)} />}
    </div>
  );
}
