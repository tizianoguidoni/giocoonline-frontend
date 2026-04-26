import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Skull, Settings, Users, Shield, 
  Map, Coins, Swords, Trash2, 
  UserMinus, MessageSquareOff, Eye,
  CloudRain, Sun, Moon, Palette, Terminal,
  Heart, Crown, Gift
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

export function AdminPanelUI({ role, game, onClose }) {
  const [tab, setTab] = useState('game');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [minimapData, setMinimapData] = useState(null);
  const [consoleCmd, setConsoleCmd] = useState('');
  const [consoleLogs, setConsoleLogs] = useState(['ARK_ADMIN_CONSOLE v3.0 Initialized...', 'System ready.']);

  useEffect(() => {
    if (game) {
      try {
        setMinimapData(game.getMinimapData());
      } catch (e) {
        console.error("Failed to get initial minimap data", e);
      }
    }
  }, [game]);

  useEffect(() => {
    if (tab === 'moderation') {
      fetchUsers();
    }
  }, [tab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${API}/admin/users`);
      setUsers(resp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const executeCommand = (cmd) => {
    const parts = cmd.toLowerCase().split(' ');
    const base = parts[0];
    
    setConsoleLogs(prev => [...prev, `> ${cmd}`]);
    
    if (base === '/give' && parts[1] === 'gold') {
      const amt = parseInt(parts[2]) || 1000;
      game?.cheatGiveMoney(amt);
      setConsoleLogs(prev => [...prev, `Success: Gave ${amt} gold to player.`]);
    } else if (base === '/tp') {
      // simplified tp to exit
      game?.teleportToCell(game.maze.exitCell.x, game.maze.exitCell.y);
      setConsoleLogs(prev => [...prev, `Success: Teleported to exit.`]);
    } else if (base === '/killall') {
      game?.cheatKillAll();
      setConsoleLogs(prev => [...prev, `Success: All enemies eliminated.`]);
    } else if (base === '/theme') {
      const theme = parts[1];
      if (['pietra', 'mattoni', 'natura'].includes(theme)) {
        game?.setTheme(theme);
        setConsoleLogs(prev => [...prev, `Success: Environment theme set to ${theme}.`]);
      } else {
        setConsoleLogs(prev => [...prev, `Error: Theme '${theme}' not found.`]);
      }
    } else if (base === '/givepass') {
      const targetUser = parts[1];
      if (targetUser) {
        // Here we would typically make an API call to grant the pass
        axios.post(`${API}/admin/givepass`, { username: targetUser }).catch(() => {});
        // If it's the current player, unlock immediately
        if (game?.seasonPass && (targetUser === 'me' || targetUser === 'all')) {
          game.seasonPass.purchasePremium();
        }
        setConsoleLogs(prev => [...prev, `Success: Granted Premium Season Pass to ${targetUser}.`]);
      } else {
        setConsoleLogs(prev => [...prev, `Error: Specify username (e.g., /givepass Mario).`]);
      }
    } else {
      setConsoleLogs(prev => [...prev, `Error: Unknown command.`]);
    }
    setConsoleCmd('');
  };

  const themeColor = '#ff3c00'; // Admin Orange/Red

  const cardStyle = {
    background: 'rgba(255, 60, 0, 0.05)',
    border: '1px solid rgba(255, 60, 0, 0.2)',
    padding: '15px',
    borderRadius: '10px',
    marginBottom: '10px'
  };

  const btnStyle = (active) => ({
    background: active ? themeColor : 'rgba(255, 255, 255, 0.05)',
    border: `1px solid ${active ? themeColor : '#333'}`,
    color: active ? '#000' : '#888',
    padding: '8px 16px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '11px',
    borderRadius: '4px',
    transition: 'all 0.2s'
  });

  const cheatBtnStyle = {
    background: 'rgba(255, 60, 0, 0.1)',
    border: '1px solid #ff3c00',
    color: '#ff3c00',
    padding: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '10px',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%'
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[5000] font-mono p-4 overflow-hidden backdrop-blur-sm">
      <div className="w-full max-w-5xl h-[85vh] bg-[#0a0a0f] border border-[#ff3c00] shadow-[0_0_50px_rgba(255,60,0,0.2)] text-white flex flex-col rounded-xl">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-gradient-to-r from-[#ff3c00]/10 to-transparent">
          <div className="flex items-center gap-4">
            <Shield className="w-8 h-8 text-[#ff3c00] animate-pulse" />
            <div>
              <h2 className="text-xl font-black tracking-[0.3em] text-[#ff3c00]">MOTHERSHIP_ADMIN</h2>
              <p className="text-[10px] text-white/30 uppercase">Authorized access only • v3.5.0</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 border border-white/10 hover:bg-white/5 text-white/40 hover:text-white rounded-lg transition-all"
          >
            DISCONNECT [ESC]
          </button>
        </div>

        {/* Sidebar + Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-white/5 flex flex-col gap-1 p-4">
            {[
              { id: 'game', label: 'GAMEPLAY', icon: Swords },
              { id: 'world', label: 'WORLD CTRL', icon: Palette },
              { id: 'economy', label: 'ECONOMY', icon: Coins },
              { id: 'moderation', label: 'PLAYERS', icon: Users },
              { id: 'console', label: 'CONSOLE', icon: Terminal },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all ${
                  tab === item.id 
                  ? 'bg-[#ff3c00] text-black shadow-[0_0_15px_rgba(255,60,0,0.4)]' 
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Main Panel */}
          <div className="flex-1 overflow-y-auto p-8 bg-[#050508]">
            {tab === 'game' && (
              <div className="grid grid-cols-2 gap-8">
                {/* Minimap TP */}
                <div className="space-y-4">
                  <div className="text-[10px] text-[#ff3c00] font-black uppercase tracking-widest flex items-center gap-2">
                    <Map className="w-3 h-3" /> Teletrasporto Rapido
                  </div>
                  <div className="aspect-square bg-black border border-white/10 p-2 rounded-xl">
                    {minimapData ? (
                      <div className="grid h-full gap-[1px]" style={{ gridTemplateColumns: `repeat(${minimapData.grid[0].length}, 1fr)` }}>
                        {minimapData.grid.map((row, y) => row.map((cell, x) => {
                          const isPlayer = minimapData.playerCellX === x && minimapData.playerCellY === y;
                          const isExit = minimapData.exitCell.x === x && minimapData.exitCell.y === y;
                          return (
                            <div 
                              key={`${x}-${y}`}
                              onClick={() => {
                                game?.teleportToCell(x, y);
                                setMinimapData(game.getMinimapData());
                              }}
                              className={`cursor-pointer hover:opacity-80 transition-all ${
                                isPlayer ? 'bg-[#ff3c00] scale-125 z-10' : 
                                isExit ? 'bg-cyan-400' : 
                                cell === 1 ? 'bg-white/5' : 'bg-white/20'
                              }`}
                            />
                          );
                        }))}
                      </div>
                    ) : <div className="h-full flex items-center justify-center text-white/20">GRID_ERROR</div>}
                  </div>
                </div>

                {/* Combat Controls */}
                <div className="space-y-6">
                  <div className="text-[10px] text-[#ff3c00] font-black uppercase tracking-widest flex items-center gap-2">
                    <Swords className="w-3 h-3" /> Comandi Combattimento
                  </div>
                  <div className="space-y-2">
                    <button onClick={() => game?.cheatGodMode()} style={cheatBtnStyle}>
                      <Shield className="w-4 h-4" /> TOGGLE GOD MODE (INVINCIBILE)
                    </button>
                    <button onClick={() => game?.cheatKillAll()} style={cheatBtnStyle}>
                      <Skull className="w-4 h-4" /> ELIMINA TUTTI I NEMICI
                    </button>
                    <button onClick={() => game?.cheatHeal()} style={cheatBtnStyle}>
                      <Heart className="w-4 h-4" /> RIPRISTINA SALUTE E MANA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tab === 'world' && (
              <div className="space-y-8">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'pietra', label: 'PIETRA', icon: Map },
                    { id: 'mattoni', label: 'MATTONI', icon: Settings },
                    { id: 'natura', label: 'NATURA', icon: Sun },
                  ].map(t => (
                    <button 
                      key={t.id}
                      onClick={() => game?.setTheme(t.id)}
                      className="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-[#ff3c00]/10 hover:border-[#ff3c00] transition-all group"
                    >
                      <t.icon className="w-8 h-8 mb-4 text-white/20 group-hover:text-[#ff3c00]" />
                      <span className="font-black text-xs tracking-[0.2em]">{t.label}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div style={cardStyle}>
                    <div className="text-[10px] font-bold mb-4 flex items-center gap-2"><Moon className="w-3 h-3" /> ILLUMINAZIONE</div>
                    <div className="flex gap-2">
                      <button onClick={() => game?.setDayNight(true)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded text-[10px]">GIORNO</button>
                      <button onClick={() => game?.setDayNight(false)} className="flex-1 py-3 bg-black border border-white/10 rounded text-[10px]">NOTTE</button>
                    </div>
                  </div>
                  <div style={cardStyle}>
                    <div className="text-[10px] font-bold mb-4 flex items-center gap-2"><CloudRain className="w-3 h-3" /> EFFETTI ATMOSFERA</div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-3 bg-white/5 border border-white/10 rounded text-[10px]">NEBBIA ON</button>
                      <button className="flex-1 py-3 bg-white/5 border border-white/10 rounded text-[10px]">NEBBIA OFF</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'economy' && (
              <div className="space-y-6">
                <div style={cardStyle}>
                  <div className="text-[10px] font-bold mb-4 uppercase tracking-widest text-[#ff3c00]">GIVE_CURRENCY</div>
                  <div className="flex gap-2">
                    <button onClick={() => game?.cheatGiveMoney(1000)} style={btnStyle(false)}>+1.000€</button>
                    <button onClick={() => game?.cheatGiveMoney(10000)} style={btnStyle(false)}>+10.000€</button>
                    <button onClick={() => game?.cheatGiveMoney(100000)} style={btnStyle(false)}>+100.000€</button>
                  </div>
                </div>
                <div style={cardStyle}>
                  <div className="text-[10px] font-bold mb-4 uppercase tracking-widest text-[#ff3c00]">GIVE_ITEMS</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => game?.cheatUnlockAll()} style={btnStyle(false)}>SBLOCCA TUTTE LE ARMI</button>
                    <button className="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded text-[10px] opacity-50">
                      SBLOCCA OGGETTI PREMIUM <Shield className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tab === 'moderation' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-[10px] text-[#ff3c00] font-black uppercase tracking-widest">Database Giocatori</div>
                  <button onClick={fetchUsers} className="text-[10px] text-white/40 hover:text-white underline">REFRESH_DB</button>
                </div>
                {loading ? <div className="text-center py-20 text-white/20 animate-pulse">SYNCING_WITH_DATABASE...</div> : (
                  <div className="space-y-2">
                    {users.map(u => (
                      <div key={u.username} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/[0.07] transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black">
                              {u.username[0].toUpperCase()}
                           </div>
                           <div>
                              <div className="text-sm font-bold flex items-center gap-2">
                                {u.username}
                                {u.role === 'owner' && <Crown className="w-3 h-3 text-yellow-500" />}
                              </div>
                              <div className="text-[10px] text-white/30 uppercase tracking-tighter">
                                {u.role} • {u.is_banned ? <span className="text-[#ff3c00]">BANNED</span> : <span className="text-green-500">ACTIVE</span>}
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button className="p-2 hover:bg-red-500/20 text-white/20 hover:text-red-500 rounded-lg transition-all" title="Ban Player">
                              <UserMinus className="w-4 h-4" />
                           </button>
                           <button className="p-2 hover:bg-orange-500/20 text-white/20 hover:text-orange-500 rounded-lg transition-all" title="Mute Player">
                              <MessageSquareOff className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => executeCommand(`/givepass ${u.username}`)}
                             className="p-2 hover:bg-yellow-500/20 text-white/20 hover:text-yellow-500 rounded-lg transition-all" 
                             title="Gift Season Pass"
                           >
                              <Gift className="w-4 h-4" />
                           </button>
                           <button className="p-2 hover:bg-[#ff3c00]/20 text-white/20 hover:text-[#ff3c00] rounded-lg transition-all" title="View Profile">
                              <Eye className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'console' && (
              <div className="h-full flex flex-col gap-4">
                <div className="flex-1 bg-black p-6 rounded-xl border border-white/10 overflow-y-auto text-[11px] space-y-1 font-mono text-green-500">
                  {consoleLogs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <span className="text-[#ff3c00] font-black self-center">{'>'}</span>
                  <input 
                    type="text" 
                    value={consoleCmd}
                    onChange={(e) => setConsoleCmd(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && executeCommand(consoleCmd)}
                    placeholder="Esegui comando: /give gold 5000, /theme natura, /tp..."
                    className="flex-1 bg-black/40 border border-white/10 px-4 py-3 rounded-lg text-xs outline-none focus:border-[#ff3c00] transition-all"
                  />
                  <button onClick={() => executeCommand(consoleCmd)} className="bg-[#ff3c00] text-black px-6 py-3 rounded-lg font-black text-xs">RUN</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 flex justify-between items-center text-[9px] text-white/20 uppercase tracking-widest">
           <span>Connected to node_primary_db</span>
           <div className="flex gap-4">
              <span>LATENCY: 24ms</span>
              <span>UPTIME: 142h 12m</span>
           </div>
        </div>
      </div>
    </div>
  );
}
