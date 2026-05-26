import React from 'react';

export default function DialogUI({ npc, onClose }) {
  if (!npc) return null;
  return (
    <div
      data-testid="dialog-overlay"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 30,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          maxWidth: 720,
          width: '90%',
          background:
            'linear-gradient(180deg, rgba(28,18,10,0.96) 0%, rgba(14,8,4,0.97) 100%)',
          border: '2px solid #c2933a',
          borderRadius: 8,
          padding: '18px 22px 22px',
          color: '#f4e4c2',
          fontFamily: 'Cinzel, Georgia, serif',
          boxShadow: '0 10px 30px rgba(0,0,0,0.55), 0 0 18px rgba(194,147,58,0.25)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
            borderBottom: '1px solid #6b4f1f',
            paddingBottom: 6,
          }}
        >
          <h3
            data-testid="dialog-name"
            style={{ margin: 0, color: '#ffd76a', fontSize: 18, letterSpacing: 1 }}
          >
            {npc.name}
          </h3>
          <button
            data-testid="dialog-close-btn"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid #6b4f1f',
              color: '#ffd76a',
              padding: '2px 10px',
              cursor: 'pointer',
              borderRadius: 4,
              fontFamily: 'inherit',
            }}
          >
            ✕
          </button>
        </div>
        <p
          data-testid="dialog-text"
          style={{ margin: 0, fontSize: 15, lineHeight: 1.55, fontStyle: 'italic' }}
        >
          “{npc.dialog}”
        </p>
        <div
          style={{
            marginTop: 14,
            textAlign: 'right',
            color: '#a08a5e',
            fontSize: 11,
          }}
        >
          Premi ESC o ✕ per chiudere
        </div>
      </div>
    </div>
  );
}
