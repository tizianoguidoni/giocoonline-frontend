import React from 'react';

export default function HUD({ isNight, onToggleDayNight, gold, onExit }) {
  return (
    <>
      {/* HUD superiore */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          display: 'flex',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          zIndex: 40,
          fontFamily: 'Cinzel, Georgia, serif',
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            background: 'rgba(20,12,6,0.78)',
            border: '1px solid #6b4f1f',
            borderRadius: 6,
            padding: '8px 14px',
            color: '#ffd76a',
            display: 'flex',
            gap: 18,
            alignItems: 'center',
          }}
        >
          <span data-testid="hud-village-title" style={{ fontSize: 14, letterSpacing: 1 }}>
            🏰 Piazza Centrale del Villaggio
          </span>
          <span data-testid="hud-gold" style={{ fontSize: 13, color: '#ffd76a' }}>
            💰 {gold}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
          <button
            data-testid="toggle-daynight-btn"
            onClick={onToggleDayNight}
            style={{
              background: 'rgba(20,12,6,0.85)',
              color: '#ffd76a',
              border: '1px solid #6b4f1f',
              borderRadius: 6,
              padding: '8px 14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
            }}
          >
            {isNight ? '☀️ Giorno' : '🌙 Notte'}
          </button>
          <button
            data-testid="hud-exit-btn"
            onClick={onExit}
            style={{
              background: 'rgba(80,20,20,0.85)',
              color: '#ffd76a',
              border: '1px solid #c44',
              borderRadius: 6,
              padding: '8px 14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
            }}
          >
            ← Esci dal villaggio
          </button>
        </div>
      </div>

      {/* Istruzioni in basso */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          background: 'rgba(20,12,6,0.78)',
          border: '1px solid #6b4f1f',
          borderRadius: 6,
          padding: '8px 14px',
          color: '#d4b890',
          fontFamily: 'Cinzel, Georgia, serif',
          fontSize: 12,
          lineHeight: 1.6,
          zIndex: 40,
          pointerEvents: 'none',
          maxWidth: 280,
        }}
      >
        <div data-testid="hud-controls">
          <strong style={{ color: '#ffd76a' }}>Controlli:</strong>
          <br />
          <kbd>W A S D</kbd> muovi · <kbd>Shift</kbd> corri
          <br />
          <kbd>Mouse</kbd> guarda (click per attivare)
          <br />
          <kbd>Click</kbd> NPC/Negozi per interagire
          <br />
          <kbd>E</kbd> uscire (vicino alla porta)
        </div>
      </div>
    </>
  );
}
