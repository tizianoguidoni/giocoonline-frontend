import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Game } from '../../game/Game';
import { assetManager } from '../../game/AssetManager';
import { HUD } from '../../components/HUD';
import { MiniMap } from '../../components/HUD';
import { AdminPanelUI } from '../../components/AdminPanelUI';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

// Ensure /api is always present in the base URL
const API = process.env.REACT_APP_BACKEND_URL 
  ? (process.env.REACT_APP_BACKEND_URL.endsWith('/api') ? process.env.REACT_APP_BACKEND_URL : `${process.env.REACT_APP_BACKEND_URL}/api`)
  : 'http://localhost:8000/api';

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
    console.log("Maze3D: Starting Game...");
    if (gameRef.current) { 
        console.log("Maze3D: Cleaning up old game instance");
        gameRef.current.stop(); 
        gameRef.current = null; 
    }
    setEnd(null); 
    setState(null);
    
    try {
        const g = new Game(canvasRef.current, handleEvent);
        gameRef.current = g;
        g.start();
        setStarted(true);
        console.log("Maze3D: Game started successfully");
        setTimeout(() => g.requestPointerLock(), 100);
    } catch (err) {
        console.error("Maze3D: CRITICAL ERROR STARTING GAME:", err);
        toast.error("Errore critico durante l'avvio del labirinto.");
    }
  }, [handleEvent]);

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

  useEffect(() => {
    if (isAssetsLoaded && canvasRef.current && !started && !end) {
       startGame();
    }
  }, [isAssetsLoaded, started, end, startGame]);

  useEffect(() => {
    return () => { 
        if (gameRef.current) {
            console.log("Maze3D: Component unmounting, stopping game");
            gameRef.current.stop(); 
        }
    };
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
          try {
             console.log(`Maze3D: Sending rewards to ${API}/combat/maze-win`);
             await axios.post(`${API}/combat/maze-win`, { gold: state.score });
             refreshCharacter();
          } catch(e) {
             console.error("Maze3D: Failed to send rewards:", e);
          }
        } else {
          toast.error("SEI MORTO. Hai perso il bottino in tasca.");
        }
      }
    };
    processRewards();
  }, [end, state, refreshCharacter]);

  useEffect(() => {
    const handleResize = () => {
      if (gameRef.current) {
        gameRef.current.renderer.setSize(window.innerWidth, window.innerHeight);
        gameRef.current.camera.aspect = window.innerWidth / window.innerHeight;
        gameRef.current.camera.updateProjectionMatrix();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pause game when modals are open
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.setPaused(showExitConfirm || adminOpen);
    }
  }, [showExitConfirm, adminOpen]);

  if (!isAssetsLoaded) {
    return (
      <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-black text-[#50c8e8]">
         <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#50c8e8] border-t-transparent mb-4"></div>
         <div className="tracking-[0.2em] font-bold">CARICAMENTO LABIRINTO...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[1000] overflow-hidden" 
         style={{ cursor: started && !end && !showExitConfirm && !adminOpen ? 'none' : 'default' }}>
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {started && !end && (
        <div className="absolute inset-0 pointer-events-none z-50">
          <HUD state={state} zoneName={zoneName} />
          {gameRef.current && <MiniMap game={gameRef.current} />}
        </div>
      )}

      {/* Back Button */}
      {started && !end && !adminOpen && !showExitConfirm && (
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
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center">
          <div className="bg-[#0a0a0f] border border-[#ff4020] p-10 text-center text-white shadow-[0_0_50px_rgba(255,64,32,0.2)] max-w-lg">
            <h2 className="text-[#ff4020] text-3xl font-bold mb-6 tracking-widest uppercase">Abbandonare la Sfida?</h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              Pausa tattica. Se esci ora tornerai all'Hub principale. <br/>
              <b>L'oro raccolto finora verrà salvato automaticamente.</b>
            </p>
            <div className="flex flex-col gap-4">
               <button 
                 onClick={async () => {
                   setShowExitConfirm(false); 
                   setStarted(false); 
                   if (state && state.score > 0) {
                     try {
                        console.log(`Maze3D: Sending partial rewards to ${API}/combat/maze-win`);
                        await axios.post(`${API}/combat/maze-win`, { gold: state.score });
                        refreshCharacter();
                        toast.success(`Hai salvato ${state.score} monete.`);
                     } catch(e) { 
                        console.error("Maze3D: Failed to send partial rewards:", e);
                     }
                   }
                   if (gameRef.current) gameRef.current.stop(); 
                   onExit(); 
                 }} 
                 className="w-full py-4 bg-[#ff4020] hover:bg-red-600 text-white font-black tracking-[0.3em] transition-all transform hover:scale-[1.02]"
               >
                 TORNA ALL'HUB
               </button>
               <button 
                 onClick={() => { 
                   setShowExitConfirm(false); 
                   setTimeout(() => gameRef.current && gameRef.current.requestPointerLock(), 150); 
                 }} 
                 className="w-full py-4 border border-gray-700 hover:border-[#50c8e8] text-gray-400 hover:text-[#50c8e8] font-bold tracking-widest transition-all"
               >
                 CONTINUA A COMBATTERE
               </button>
            </div>
          </div>
        </div>
      )}

      {/* End Screen */}
      {end && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-[200] backdrop-blur-lg">
           <div className={`text-7xl font-black tracking-[0.5em] mb-6 uppercase ${end === 'win' ? 'text-green-500 drop-shadow-[0_0_20px_#22c55e]' : 'text-red-600 drop-shadow-[0_0_20px_#dc2626]'}`}>
              {end === 'win' ? 'VITTORIA' : 'SCONFITTA'}
           </div>
           <div className="text-white/60 text-xl mb-12 tracking-[0.2em]">
              MONETE: <span className="text-yellow-400 font-bold">{state?.score || 0}</span> | TEMPO: {Math.floor(state?.time || 0)}s
           </div>
           <div className="flex gap-6">
             <button onClick={() => startGame()} className="px-10 py-4 bg-transparent border-2 border-[#50c8e8] text-[#50c8e8] hover:bg-[#50c8e8]/20 font-bold tracking-[0.2em] transition-all">RIPROVA</button>
             <button onClick={onExit} className="px-10 py-4 bg-transparent border-2 border-white/20 text-white/40 hover:border-white/60 hover:text-white font-bold tracking-[0.2em] transition-all">HUB</button>
           </div>
        </div>
      )}

      {adminOpen && <AdminPanelUI role={user?.role || 'player'} game={gameRef.current} onClose={() => setAdminOpen(false)} />}
    </div>
  );
}
