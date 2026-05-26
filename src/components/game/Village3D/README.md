# Village3D — Piazza Centrale del Villaggio

Modulo React + Three.js (drop-in) per aggiungere una piazza medievale 3D realistica al tuo gioco esistente, compatibile con il flusso `<Village3D onExit={...} />` che già usi in `GamePage.js`.

## ✨ Caratteristiche

- 🏰 **Piazza medievale 3D realistica** ~150×150 m con fontana centrale animata
- 🪨 Pavimentazione interamente in **sampietrini** (texture procedurale)
- ⛲ **Fontana in pietra** con acqua animata (shader) e gocce zampillanti
- 🏚️ **Case medievali** con travi a vista, finestre illuminate di notte, camini fumanti
- 🛒 **3 negozi interattivi + alchimista**: Fabbro, Mercante Magico, Bancarella Cibo, Alchimista
- 🧙 **5 NPC interattivi** con dialoghi predefiniti (Vecchio, Apprendista, Contadina, Guardia, Viaggiatore)
- 🚶 **22 NPC ambientali** che camminano, si siedono, si fermano (LOD attivo solo vicino al player)
- ☀️🌙 **Sistema giorno/notte** con sole, luna, stelle, torce animate e lampioni
- 🚪 **Porta di uscita** con dissolvenza per tornare alla stanza precedente
- 🎮 Controlli **WASD + mouse + click** (pointer lock), Shift per correre
- ⚡ **Ottimizzazioni**: distanza visiva limitata (fog), LOD NPC, texture condivise, geometrie low-poly

## 📦 Installazione

### 1. Dipendenze

```bash
yarn add three @react-three/fiber @react-three/drei
# oppure
npm i three @react-three/fiber @react-three/drei
```

### 2. Copia il modulo

Copia l'intera cartella `Village3D/` dentro `src/components/` del tuo gioco:

```
src/components/Village3D/
├── Village3D.jsx
├── index.js
├── components/
│   ├── Ground.jsx
│   ├── Fountain.jsx
│   ├── Houses.jsx
│   ├── Shops.jsx
│   ├── Trees.jsx
│   ├── Benches.jsx
│   ├── Lighting.jsx
│   ├── Player.jsx
│   ├── NPCs.jsx
│   └── ExitDoor.jsx
├── ui/
│   ├── HUD.jsx
│   ├── DialogUI.jsx
│   ├── ShopUI.jsx
│   └── LoadingScreen.jsx
└── data/
    ├── npcs.js
    └── shopItems.js
```

## 🔌 Integrazione con il tuo `GamePage.js` esistente

Il tuo codice attuale ha già esattamente la struttura giusta:

```jsx
{isInMaze ? (
  <Maze3D onExit={...} />
) : isInVillage ? (
  <Village3D onExit={() => setIsInVillage(false)} />   // ← Sostituisci con il nostro
) : (currentLocation.id === 'home' || isInHouse) ? (
  <House3D
    onExit={...}
    onGoToVillage={() => {
      setIsInHouse(false);
      setIsInVillage(true);   // ← Già funziona: porta apre il villaggio
    }}
    onGoToMaze={...}
  />
) : (
  // ...
)}
```

Importa il nuovo `Village3D` in cima a `GamePage.js`:

```jsx
import Village3D from './components/Village3D';
```

Tutto qui. Quando il giocatore attraversa la porta della casa (`onGoToVillage`), apparirà la piazza con dissolvenza. Quando torna alla porta (E o click sul bottone), `onExit` riporta il giocatore alla `House3D`.

## ⚙️ API del componente

```jsx
<Village3D
  onExit={() => setIsInVillage(false)}   // Required
  initialGold={500}                       // Optional, default 500
  onPurchase={({ item, shopKey, remainingGold }) => {
    // Sincronizza con il tuo inventario globale
    addItemToInventory(item);
    setGoldGlobal(remainingGold);
  }}
/>
```

### Sincronizzare l'oro col tuo gioco

Se hai già un sistema di oro globale (Redux/Context), puoi:

1. Passare `initialGold={globalGold}`.
2. In `onPurchase` aggiornare lo state globale.

### Aggiungere/modificare NPC e dialoghi

Apri `Village3D/data/npcs.js` e modifica `INTERACTIVE_NPCS` (dialoghi predefiniti) o `AMBIENT_NPCS` (numero/comportamento).

### Aggiungere/modificare items dei negozi

Apri `Village3D/data/shopItems.js` e modifica `SHOPS.fabbro.items`, `SHOPS.mago.items`, `SHOPS.cibo.items`.

## 🎨 Layout della mappa (rispetta la specifica)

```
        Case
 ┌─────────────────┐
 │   Mercato       │
 │                 │
 │ B       F      M│   B=Bancarella cibo  F=Fabbro  M=Mercante magico
 │                 │
 │    Fontana      │
 │                 │
 │ C       N      A│   C=Casa abitabile  N=NPC casuali  A=Alchimista
 │                 │
 │   Porta         │
 └─────────────────┘
```

- **Fontana** al centro (0,0)
- **Porta di uscita** sul lato sud (0,32) — il player spawna davanti ad essa
- **Negozi** ai lati (fabbro, mercante magico, bancarella cibo, alchimista)
- **Case** lungo i bordi (una è accessibile/cliccabile, le altre decorative)

## 🚀 Performance Tips

- ✅ NPC ambientali animati solo entro 45m dal player (LOD logico)
- ✅ Texture canvas riutilizzate (cobblestone, erba)
- ✅ Fog limita la distanza visiva (50–130m)
- ✅ Geometrie low-poly (cilindri/box/sfere) — ~3-4K poligoni totali
- ✅ Ombre solo dalla luce direzionale (sole/luna) con shadow map 2048²

Se serve girare su hardware molto debole:
- riduci `AMBIENT_NPCS` a 10 (in `data/npcs.js`)
- abbassa `shadow-mapSize` a 1024 in `Lighting.jsx`
- aumenta il near del fog a 30

## 🛠️ Sviluppo

Se vuoi vederlo girare in standalone (senza il resto del tuo gioco), il file di esempio `App.js` di questo repository monta `<Village3D />` direttamente.

## 📝 Note

- L'integrazione è puramente **client-side**. Nessun backend richiesto.
- Tutto il modulo è **self-contained**: nessuna dipendenza dal resto del tuo codice (oltre alle 3 librerie indicate).
- Gli stili dei dialoghi/HUD sono inline (no CSS esterno), quindi non interferiscono con il tuo design system.
