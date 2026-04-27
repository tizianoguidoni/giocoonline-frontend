import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { toast } from 'sonner';
import axios from 'axios';
import { CharacterPreview } from './CharacterPreview';
import { getItemImage } from '@/data/itemImages';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

// ─── Rarity config ───────────────────────────────────────────────────────────
const RARITY = {
  common:    { color: '#9CA3AF', label: 'Common',    glow: 'rgba(156,163,175,0.4)' },
  uncommon:  { color: '#22C55E', label: 'Uncommon',  glow: 'rgba(34,197,94,0.4)'  },
  rare:      { color: '#3B82F6', label: 'Rare',      glow: 'rgba(59,130,246,0.4)' },
  epic:      { color: '#A855F7', label: 'Epic',      glow: 'rgba(168,85,247,0.4)' },
  legendary: { color: '#F59E0B', label: 'Legendary', glow: 'rgba(245,158,11,0.4)' },
  admin:     { color: '#E63946', label: 'Admin',     glow: 'rgba(230,57,70,0.4)'  },
};

// ─── Inventory category tabs ──────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',       label: 'ALL',      icon: '⚡' },
  { id: 'sword',     label: 'WEAPONS',  icon: '⚔️' },
  { id: 'secondary', label: 'DAGGERS',  icon: '🗡️' },
  { id: 'shield',    label: 'SHIELDS',  icon: '🛡️' },
  { id: 'helmet',    label: 'HELMETS',  icon: '⛑️' },
  { id: 'potion',    label: 'POTIONS',  icon: '🧪' },
  { id: 'gem',       label: 'GEMS',     icon: '💎' },
  { id: 'material',  label: 'MATS',     icon: '⛏️' },
];

// ─── Equipment slots ──────────────────────────────────────────────────────────
const SLOTS = [
  { id: 'helmet',    label: 'HEAD',      icon: '⛑️' },
  { id: 'sword',     label: 'WEAPON',    icon: '⚔️' },
  { id: 'shield',    label: 'SHIELD',    icon: '🛡️' },
  { id: 'secondary', label: 'ACCESSORY', icon: '🗡️' },
];

// ─── Stat key → display label ─────────────────────────────────────────────────
const STAT_LABELS = {
  damage: 'ATTACK', defense: 'DEFENSE', strength: 'STR',
  intelligence: 'INT', agility: 'AGI', hp_bonus: 'HP BONUS',
  crit_chance: 'CRIT %', block: 'BLOCK %', fire_damage: 'FIRE DMG',
  ice_damage: 'ICE DMG', dark_damage: 'DARK DMG', holy_damage: 'HOLY DMG',
  lifesteal: 'LIFESTEAL', all_damage: 'ALL DMG', fire_resist: 'FIRE RES',
  all_resist: 'ALL RES', reflect: 'REFLECT', heal: 'HEAL', mana: 'MANA',
  stealth: 'STEALTH', all_stats: 'ALL STATS', instant_kill_chance: 'INSTAKILL %',
};

// ─── Bottom stat bar ──────────────────────────────────────────────────────────
function BottomBar({ label, current, max, color, icon }) {
  const pct = Math.min(100, Math.max(0, ((current || 0) / (max || 1)) * 100));
  return (
    <div className="flex flex-col items-center gap-1 min-w-[120px]">
      <span className="text-xs font-bold tracking-widest" style={{ color }}>{icon} {label}</span>
      <span className="text-xl font-extrabold text-white">
        {current ?? '—'}{max && max !== current ? ` / ${max}` : ''}
      </span>
      <div className="w-full h-1 rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function EquipmentPanel() {
  const { character, refreshCharacter } = useAuth();
  const { inventory, fetchInventory } = useGame();
  const [equipment, setEquipment] = useState({});
  const [category, setCategory]   = useState('all');
  const [selected, setSelected]   = useState(null);   // { type: 'item'|'slot', data }
  const [loading, setLoading]     = useState(true);
  const [equipping, setEquipping] = useState(false);

  useEffect(() => { fetchEquipment(); }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/equipment`);
      setEquipment(res.data.equipment || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleEquip = async (itemId, slot) => {
    setEquipping(true);
    try {
      await axios.post(`${API}/equipment/equip`, { item_id: itemId, slot });
      toast.success('Oggetto equipaggiato!');
      await fetchEquipment(); await fetchInventory(); await refreshCharacter();
      setSelected(null);
    } catch (e) { toast.error(e.response?.data?.detail || 'Errore'); }
    finally { setEquipping(false); }
  };

  const handleUnequip = async (slot) => {
    setEquipping(true);
    try {
      await axios.post(`${API}/equipment/unequip/${slot}`);
      toast.success('Oggetto rimosso!');
      await fetchEquipment(); await fetchInventory(); await refreshCharacter();
      setSelected(null);
    } catch (e) { toast.error(e.response?.data?.detail || 'Errore'); }
    finally { setEquipping(false); }
  };

  // Filtered inventory
  const allItems = inventory || [];
  const filtered = category === 'all'
    ? allItems.filter(i => ['sword','secondary','shield','helmet'].includes(i.slot) && !i.equipped)
    : allItems.filter(i => {
        if (['sword','secondary','shield','helmet'].includes(category)) return i.slot === category && !i.equipped;
        return (i.subtype === category || i.item_type === category) && !i.equipped;
      });

  // Backpack capacity logic
  const hasBackpack = allItems.some(i => i.item_id === 'backpack' || i.id === 'backpack' || i.name?.toLowerCase().includes('zaino'));
  const maxSlots = hasBackpack ? 20 : 5;
  const totalGridSlots = 20;
  const gridCells = Array.from({ length: totalGridSlots }, (_, i) => i);

  // Calculate total gear bonus
  const totalBonus = {};
  Object.values(equipment).forEach(item => {
    if (!item?.stats) return;
    Object.entries(item.stats).forEach(([k, v]) => { totalBonus[k] = (totalBonus[k] || 0) + (typeof v === 'number' ? v : 0); });
  });

  // Detail panel data
  const detailItem  = selected?.type === 'item' ? selected.data : null;
  const detailSlot  = selected?.type === 'slot' ? selected.data : null;
  const detailEquip = detailSlot ? equipment[detailSlot] : null;
  const detail      = detailItem || detailEquip;
  const rarityInfo  = detail ? (RARITY[detail.rarity] || RARITY.common) : null;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}
      className="w-full h-[88vh] bg-[#0a0c14] text-gray-100 flex flex-col overflow-hidden relative rounded-xl border border-white/10">

      {/* ── Animated background blobs ── */}
      <style>{`
        @keyframes blob { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-40px) scale(1.1)} 66%{transform:translate(-20px,20px) scale(0.9)} }
        .blob { animation: blob 8s infinite; border-radius:9999px; filter:blur(80px); position:absolute; pointer-events:none; mix-blend-mode:screen; }
        .blob-2 { animation-delay:2s; } .blob-3 { animation-delay:4s; }
        .inv-scroll::-webkit-scrollbar{width:4px} .inv-scroll::-webkit-scrollbar-thumb{background:#ffffff22;border-radius:4px}
        .slot-glow { box-shadow: 0 0 20px var(--glow); }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.25s ease; }
      `}</style>
      <div className="blob w-80 h-80 bg-blue-700 opacity-20 top-10 left-10" />
      <div className="blob blob-2 w-80 h-80 bg-purple-700 opacity-20 top-40 right-20" />
      <div className="blob blob-3 w-60 h-60 bg-pink-600 opacity-15 bottom-20 left-1/3" />

      {/* ── TOP BAR: character info ── */}
      <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/30 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center font-black text-black text-sm">
            {character?.level || '?'}
          </div>
          <div>
            <div className="font-bold text-sm text-white">{character?.name || 'Personaggio'}</div>
            <div className="text-xs text-gray-400">{character?.race} · {character?.char_class}</div>
          </div>
        </div>
        <div className="text-lg font-bold tracking-widest text-white/80 uppercase">⚔ Inventory</div>
        <div className="flex items-center gap-5 text-sm">
          <span className="text-yellow-400 font-bold">🪙 {character?.gold?.toLocaleString() || 0}</span>
          <span className="text-blue-300 font-bold">✨ Lv.{character?.level || 1}</span>
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* ═══ LEFT: Inventory ═══ */}
        <div className="w-[280px] flex flex-col border-r border-white/10 bg-black/20 backdrop-blur-sm flex-shrink-0">
          {/* Category tabs */}
          <div className="flex overflow-x-auto gap-1 p-2 border-b border-white/10 flex-shrink-0">
            {CATEGORIES.map(cat => (
              <button key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex-shrink-0 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all duration-200
                  ${category === cat.id
                    ? 'bg-white/15 text-white border border-white/30'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                {cat.icon}
              </button>
            ))}
          </div>

          {/* Category title */}
          <div className="px-4 pt-3 pb-1 text-xs font-bold tracking-widest text-gray-400 uppercase flex-shrink-0">
            {CATEGORIES.find(c => c.id === category)?.label || 'ALL'} — {filtered.length} items
          </div>

          {/* Item grid */}
          <div className="inv-scroll flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-4 gap-2">
              {gridCells.map((slotIndex) => {
                const item = filtered[slotIndex];
                const isLocked = slotIndex >= maxSlots;

                if (isLocked) {
                  return (
                    <div key={slotIndex} className="relative aspect-square rounded-md border border-white/5 bg-black/40 flex items-center justify-center">
                      <span className="text-gray-700 text-xl">🔒</span>
                    </div>
                  );
                }

                if (!item) {
                  return (
                    <div key={slotIndex} className="relative aspect-square rounded-md border border-white/5 bg-white/5 flex items-center justify-center">
                    </div>
                  );
                }

                const rar = RARITY[item.rarity] || RARITY.common;
                const isSel = selected?.data?.id === item.id;
                
                return (
                  <div key={slotIndex}
                    onClick={() => setSelected({ type: 'item', data: item })}
                    className="relative aspect-square rounded-md cursor-pointer overflow-hidden border transition-all duration-150 group"
                    style={{
                      borderColor: isSel ? rar.color : 'rgba(255,255,255,0.1)',
                      boxShadow: isSel ? `0 0 12px ${rar.glow}` : 'none',
                      background: 'rgba(255,255,255,0.04)',
                    }}>
                    {/* Item image */}
                    <img src={getItemImage(item.item_id || item.id)} alt={item.name}
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200"
                      style={{ opacity: isSel ? 0.9 : 0.55 }}
                      onError={e => { e.target.style.display = 'none'; }} />
                    {/* Rarity corner dot */}
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: rar.color }} />
                    {/* Quantity badge */}
                    {item.quantity > 1 && (
                      <span className="absolute bottom-1 right-1 text-[9px] font-bold text-white bg-black/60 rounded px-1">{item.quantity}</span>
                    )}
                    {/* Hover overlay with name */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end justify-center p-1">
                      <span className="text-[9px] text-white font-semibold text-center opacity-0 group-hover:opacity-100 transition-opacity leading-tight line-clamp-2">
                        {item.name}
                      </span>
                    </div>
                    {/* Selection border pulse */}
                    {isSel && <div className="absolute inset-0 border-2 rounded-md" style={{ borderColor: rar.color, boxShadow: `inset 0 0 8px ${rar.glow}` }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ CENTER: Character Preview ═══ */}
        <div className="flex-1 flex flex-col items-center justify-between py-4 px-2 relative">
          
          {/* Tavern Background */}
          <div className="absolute inset-0 z-0 pointer-events-none rounded-xl overflow-hidden shadow-inner">
            <img src="/icons/tavern_bg.png" alt="Tavern Background" className="w-full h-full object-cover opacity-40 mix-blend-screen" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c14] via-transparent to-[#0a0c14]/80" />
            <div className="absolute inset-0 bg-gradient-to-x from-[#0a0c14] via-transparent to-[#0a0c14]" />
          </div>

          {/* 3D Character */}
          <div className="flex-1 w-full max-w-[340px] relative z-10">
            {/* Atmospheric ground glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-12 bg-orange-500/10 rounded-full blur-2xl" />
            <CharacterPreview equipment={equipment} />
          </div>

          {/* Bottom stat bars */}
          <div className="flex items-center justify-center gap-8 px-6 py-3 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 w-full max-w-lg mt-2 flex-shrink-0">
            <BottomBar label="HEALTH" current={character?.hp} max={character?.max_hp} color="#ef4444" icon="♥" />
            <div className="w-px h-8 bg-white/10" />
            <BottomBar label="MANA" current={character?.mana} max={character?.max_mana} color="#3b82f6" icon="✦" />
            <div className="w-px h-8 bg-white/10" />
            <BottomBar label="XP" current={character?.xp} max={10000} color="#a855f7" icon="⚡" />
          </div>
        </div>

        {/* ═══ RIGHT: Equipment Slots + Detail ═══ */}
        <div className="w-[280px] flex flex-col border-l border-white/10 bg-black/20 backdrop-blur-sm flex-shrink-0">

          {/* Equipment slots */}
          <div className="p-3 border-b border-white/10 flex-shrink-0">
            <div className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">Equipment</div>
            <div className="flex flex-col gap-2">
              {SLOTS.map(slot => {
                const eq = equipment[slot.id];
                const rar = eq ? (RARITY[eq.rarity] || RARITY.common) : null;
                const isSel = selected?.type === 'slot' && selected.data === slot.id;
                return (
                  <div key={slot.id}
                    onClick={() => setSelected({ type: 'slot', data: slot.id })}
                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 border"
                    style={{
                      borderColor: isSel ? (rar?.color || '#ffffff44') : 'rgba(255,255,255,0.07)',
                      background: isSel ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)',
                      boxShadow: isSel && rar ? `0 0 10px ${rar.glow}` : 'none',
                    }}>
                    {/* Icon / Image */}
                    <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 border border-white/10 bg-white/5 flex items-center justify-center text-lg relative">
                      {eq
                        ? <img src={getItemImage(eq.item_id || eq.id)} alt={eq.name}
                            className="w-full h-full object-cover"
                            onError={e => { e.target.style.display = 'none'; }} />
                        : <span className="opacity-30">{slot.icon}</span>}
                      {eq && rar && <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rar.color }} />}
                    </div>
                    {/* Labels */}
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">{slot.label}</div>
                      <div className="text-xs font-semibold truncate" style={{ color: rar?.color || '#6b7280' }}>
                        {eq ? eq.name : 'Empty'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail / Action panel */}
          <div className="flex-1 overflow-y-auto inv-scroll p-3">
            {detail ? (
              <div className="fade-in flex flex-col gap-3 h-full">
                {/* Item image hero */}
                <div className="relative w-full h-28 rounded-xl overflow-hidden border border-white/10 bg-black/30 flex items-center justify-center"
                  style={{ boxShadow: `0 4px 30px ${rarityInfo?.glow}` }}>
                  <img src={getItemImage(detail.item_id || detail.id)} alt={detail.name}
                    className="h-24 w-24 object-contain drop-shadow-2xl"
                    onError={e => { e.target.style.display='none'; }} />
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: `radial-gradient(circle at center, ${rarityInfo?.glow} 0%, transparent 70%)` }} />
                </div>

                {/* Name + rarity */}
                <div>
                  <div className="text-xs font-bold tracking-widest uppercase" style={{ color: rarityInfo?.color }}>
                    {rarityInfo?.label} {detail.slot || detail.subtype || ''}
                  </div>
                  <div className="text-base font-extrabold text-white uppercase leading-tight">{detail.name}</div>
                </div>

                {/* Main stats */}
                {detail.stats && Object.entries(detail.stats).filter(([,v]) => typeof v === 'number').length > 0 && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="grid grid-cols-1 gap-1.5">
                      {Object.entries(detail.stats).filter(([,v]) => typeof v === 'number').map(([k, v]) => (
                        <div key={k} className="flex justify-between items-center">
                          <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">{STAT_LABELS[k] || k.replace(/_/g,' ')}</span>
                          <span className="text-sm font-black" style={{ color: rarityInfo?.color }}>+{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto flex flex-col gap-2">
                  {detailItem && (
                    <button
                      onClick={() => handleEquip(detailItem.id, detailItem.slot)}
                      disabled={equipping || !detailItem.slot}
                      className="w-full py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-200 disabled:opacity-40"
                      style={{
                        background: rarityInfo?.glow ? `linear-gradient(135deg, ${rarityInfo.color}33, ${rarityInfo.color}66)` : '#ffffff22',
                        border: `1px solid ${rarityInfo?.color || '#fff'}`,
                        color: rarityInfo?.color || '#fff',
                        boxShadow: equipping ? 'none' : `0 0 15px ${rarityInfo?.glow}`,
                      }}>
                      {equipping ? '...' : `⚔ EQUIP — ${(detailItem.slot || '').toUpperCase()}`}
                    </button>
                  )}
                  {detailSlot && detailEquip && (
                    <button
                      onClick={() => handleUnequip(detailSlot)}
                      disabled={equipping}
                      className="w-full py-2.5 rounded-lg text-xs font-black uppercase tracking-widest bg-red-900/40 border border-red-500/50 text-red-400 hover:bg-red-900/60 transition-all duration-200 disabled:opacity-40">
                      {equipping ? '...' : '✕ UNEQUIP'}
                    </button>
                  )}
                  {detailSlot && !detailEquip && (
                    <div className="text-center text-xs text-gray-600 italic py-2">Slot vuoto — seleziona un oggetto dall'inventario</div>
                  )}
                </div>
              </div>
            ) : (
              /* No selection — show gear bonus summary */
              <div className="fade-in flex flex-col gap-2 h-full">
                <div className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Gear Bonus</div>
                {Object.entries(totalBonus).length > 0
                  ? Object.entries(totalBonus).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{STAT_LABELS[k] || k.replace(/_/g,' ')}</span>
                        <span className="text-xs font-black text-green-400">+{v}</span>
                      </div>
                    ))
                  : <p className="text-xs text-gray-600 italic mt-4 text-center">Nessun equipaggiamento attivo.<br/>Seleziona uno slot o un oggetto.</p>}
              </div>
            )}
          </div>

          {/* Bottom shortcut hints */}
          <div className="flex justify-between px-3 py-2 border-t border-white/10 bg-black/20 flex-shrink-0 text-[10px] text-gray-600">
            <span>[E] EQUIP</span>
            <span>[ESC] BACK</span>
          </div>
        </div>
      </div>
    </div>
  );
}
