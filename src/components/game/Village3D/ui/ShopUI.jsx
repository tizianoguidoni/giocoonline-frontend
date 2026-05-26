import React, { useState } from 'react';
import { SHOPS } from '../data/shopItems';

export default function ShopUI({ shopKey, gold = 500, onClose, onBuy }) {
  const shop = SHOPS[shopKey];
  const [feedback, setFeedback] = useState(null);
  if (!shop) return null;

  const handleBuy = (item) => {
    if (gold < item.price) {
      setFeedback({ type: 'error', text: 'Oro insufficiente!' });
      setTimeout(() => setFeedback(null), 1500);
      return;
    }
    onBuy?.(item);
    setFeedback({ type: 'ok', text: `Acquistato: ${item.name}` });
    setTimeout(() => setFeedback(null), 1500);
  };

  return (
    <div
      data-testid="shop-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
      }}
    >
      <div
        style={{
          width: 'min(640px, 92%)',
          background:
            'linear-gradient(180deg, rgba(28,18,10,0.98) 0%, rgba(14,8,4,0.99) 100%)',
          border: '2px solid #c2933a',
          borderRadius: 10,
          padding: 22,
          color: '#f4e4c2',
          fontFamily: 'Cinzel, Georgia, serif',
          boxShadow: '0 16px 50px rgba(0,0,0,0.7), 0 0 24px rgba(194,147,58,0.35)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #6b4f1f',
            paddingBottom: 10,
            marginBottom: 14,
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: '#ffd76a', fontSize: 22 }}>{shop.name}</h2>
            <small style={{ color: '#a08a5e' }}>{shop.keeper}</small>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span data-testid="shop-gold" style={{ color: '#ffd76a', fontSize: 15 }}>
              💰 {gold}
            </span>
            <button
              data-testid="shop-close-btn"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid #6b4f1f',
                color: '#ffd76a',
                padding: '4px 12px',
                cursor: 'pointer',
                borderRadius: 4,
                fontFamily: 'inherit',
              }}
            >
              ✕ Chiudi
            </button>
          </div>
        </div>

        <p style={{ fontStyle: 'italic', color: '#c4a880', margin: '0 0 16px' }}>
          “{shop.greeting}”
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
            gap: 10,
          }}
        >
          {shop.items.map((item) => (
            <div
              key={item.id}
              data-testid={`shop-item-${item.id}`}
              style={{
                background: 'rgba(60,40,20,0.4)',
                border: '1px solid #6b4f1f',
                borderRadius: 6,
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ fontSize: 14, color: '#ffe0a0', fontWeight: 600 }}>
                {item.name}
              </div>
              {item.effect && (
                <div style={{ fontSize: 11, color: '#9ad6a8' }}>{item.effect}</div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 4,
                }}
              >
                <span style={{ color: '#ffd76a', fontSize: 13 }}>💰 {item.price}</span>
                <button
                  data-testid={`buy-${item.id}-btn`}
                  onClick={() => handleBuy(item)}
                  style={{
                    background: '#3a2515',
                    color: '#ffd76a',
                    border: '1px solid #c2933a',
                    borderRadius: 4,
                    padding: '4px 10px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 12,
                  }}
                >
                  Compra
                </button>
              </div>
            </div>
          ))}
        </div>

        {feedback && (
          <div
            data-testid="shop-feedback"
            style={{
              marginTop: 14,
              padding: '8px 12px',
              background:
                feedback.type === 'error'
                  ? 'rgba(140,30,30,0.4)'
                  : 'rgba(30,100,40,0.4)',
              border: `1px solid ${feedback.type === 'error' ? '#c44' : '#4c4'}`,
              borderRadius: 4,
              textAlign: 'center',
              fontSize: 14,
            }}
          >
            {feedback.text}
          </div>
        )}
      </div>
    </div>
  );
}
