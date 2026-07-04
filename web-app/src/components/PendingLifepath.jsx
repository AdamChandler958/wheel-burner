import React from "react";

export default function PendingLifepath({ engine }) {

    const {
        pendingLifepath,
        abortPendingLifepath,
        handleResolveStatChoice
    } = engine;

    if (!pendingLifepath) return null;


    return(
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
            }}>
            <div style={{
                position: 'relative',
                backgroundColor: '#2a2a2a',
                padding: '30px',
                borderRadius: '8px',
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center',
                border: '1px solid #444',
                boxShadow: '0px 4px 20px rgba(0,0,0,0.5)'
            }}>
                <button
                onClick={abortPendingLifepath}
                style={{
                    position: 'absolute',
                    top: '12px',
                    right: '15px',
                    background: 'none',
                    border: 'none',
                    color: '#888',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    padding: '5px',
                    lineHeight: '1'
                }}
                title="Abort and Cancel Selection"
                onMouseEnter={(e) => e.target.style.color = '#ff4d4d'}
                onMouseLeave={(e) => e.target.style.color = '#888'}
                >
                ✕
                </button>
                <h3 style={{ marginTop: 0, color: '#888' }}>Attribute Decision Required</h3>
                <p style={{ color: '#eee' }}>
                The lifepath <strong>{pendingLifepath.basePath.name}</strong> requires you to modify an attribute focus:
                </p>
                
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px' }}>
                {pendingLifepath.choices.map(stat => {
                    const displayModifier = pendingLifepath.amount > 0 ? `+${pendingLifepath.amount}` : `${pendingLifepath.amount}`;
                    return (
                    <button
                        key={stat}
                        onClick={() => handleResolveStatChoice(stat)}
                        style={{
                        padding: '12px 24px',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        backgroundColor: pendingLifepath.amount > 0 ? '#0070f3' : '#d32f2f',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px'
                        }}
                    >
                        {displayModifier} {stat}
                    </button>
                    );
                })}
                </div>
            </div>
        </div>
    );
}