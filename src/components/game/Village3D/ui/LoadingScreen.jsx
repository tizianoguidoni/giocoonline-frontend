import React from 'react';

export default function LoadingScreen({ visible, message = 'Caricamento del villaggio...' }) {
  return (
    <div
      data-testid="village-loading"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, #1a0e05 0%, #000 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.6s ease',
        fontFamily: 'Cinzel, Georgia, serif',
        color: '#ffd76a',
      }}
    >
      <div style={{ fontSize: 28, letterSpacing: 2, marginBottom: 18 }}>
        🏰 Piazza Centrale
      </div>
      <div style={{ fontSize: 14, color: '#a08a5e', marginBottom: 26 }}>
        {message}
      </div>
      <div
        style={{
          width: 220,
          height: 4,
          background: 'rgba(255,215,106,0.15)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #c2933a, #ffd76a, #c2933a)',
            animation: 'villageLoadingBar 1.4s infinite linear',
            width: '40%',
          }}
        />
      </div>
      <style>{`
        @keyframes villageLoadingBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(550%); }
        }
      `}</style>
    </div>
  );
}
