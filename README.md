# Labirinto 3D - Fantasy FPS
Gioco 3D fantasy nel browser (Three.js vanilla + React).

## Struttura
- `src/` - codice React + logica di gioco
  - `src/game/` - motore 3D modulare: maze, world, weapons, enemies, merchant, spells, audio, textures, props, Game orchestrator
  - `src/App.js` - UI React (HUD, MiniMap, Merchant, Leaderboard)
- `public/` - HTML template
- `backend/` - FastAPI per leaderboard (MongoDB)

## Setup Frontend
```bash
yarn install
yarn start         # dev su localhost:3000
```

## Setup Backend (opzionale, per leaderboard)
```bash
cd backend
pip install -r requirements.txt
# Crea .env con MONGO_URL e DB_NAME
uvicorn server:app --reload --port 8001
```

## Controlli
- WASD: muovere / SHIFT: corsa
- Mouse: mirare / Click: attaccare
- 1..5: cambiare arma
- R: ricarica / Q: arma successiva
- Z: Fireball (30 mana) / X: Cura (25) / C: Scudo (35)
- E: interagisci (porte, mercante) / ESC: rilascia mouse

## Feature
- Labirinto procedurale 35x35 con 7 stanze speciali
- 4 zone con atmosfere diverse (2 outdoor con cielo stellato)
- 5 armi fantasy (spade, martello, arco, bastone, lama leggendaria)
- Sistema magie (Fireball / Heal / Shield)
- Nemici con skin zona-specific (Orco/Goblin/Scheletro/Demone) + Boss
- Mercante Oscuro (armi a metà prezzo, solo soldi in tasca)
- Economia dual: soldi in tasca vs banca
- Chiavi + porte + porta del Guardiano
- Audio procedurale (Web Audio API)
- Texture procedurali (Canvas)
- Leaderboard (se backend attivo)
