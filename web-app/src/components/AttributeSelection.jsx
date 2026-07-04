import React from "react";

export default function AttributeSelection({ engine }) {

    const {
        character,
        remainingMental,
        remainingPhysical,
        adjustStatValue,
        calculatedHealth,
        calculatedReflexes,
        calculatedSteel,
        hasZeroStats,
        isFirstLifepath
    } = engine;

    if (isFirstLifepath) return null;

    return (
    <>
      {hasZeroStats && (
        <div style={{
          backgroundColor: 'rgba(230, 126, 34, 0.15)',
          border: '1px solid #e67e22',
          borderRadius: '6px',
          padding: '12px 15px',
          margin: '20px 0',
          fontSize: '14px',
          color: '#f39c12',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>⚠️</span>
          <span>
            <strong>Invalid Attribute Setup:</strong> Every core stat must have an exponent value of at least <strong>1</strong> before finalising your character concept profile.
          </span>
        </div>    
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px', 
        marginTop: '25px',
        marginBottom: '30px'
      }}> 
        {/* Assigned Stats Column */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            Assigned Stats
          </h3> 
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '15px', padding: '5px 10px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
            <span style={{ color: remainingMental < 0 ? '#ff4d4d' : '#aaa' }}>
              Mental Remaining: <strong>{remainingMental}</strong>
            </span>
            <span style={{ color: remainingPhysical < 0 ? '#ff4d4d' : '#aaa' }}>
              Physical Remaining: <strong>{remainingPhysical}</strong>
            </span>
          </div>
          {[
            { key: 'will', name: 'Will', type: 'mental' },
            { key: 'perception', name: 'Perception', type: 'mental' },
            { key: 'agility', name: 'Agility', type: 'physical' },
            { key: 'speed', name: 'Speed', type: 'physical' },
            { key: 'power', name: 'Power', type: 'physical' },
            { key: 'forte', name: 'Forte', type: 'physical' }
          ].map(stat =>  { 
            return (
              <div key={stat.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <strong style={{ textTransform: 'capitalize' }}>{stat.name}</strong>
                  <span style={{ fontSize: '11px', color: '#666', marginLeft: '8px' }}>({stat.type})</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    onClick={() => adjustStatValue(stat.key, 'dec', stat.type)}
                    style={{ width: '28px', height: '28px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: '#fff' }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', minWidth: '20px', textAlign: 'center', color:  '#888'}}>
                    {character.assignedStats[stat.key]}
                  </span>
                  <button 
                    onClick={() => adjustStatValue(stat.key, 'inc', stat.type)}
                    style={{ width: '28px', height: '28px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: '#fff' }}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Calculated Attributes Column */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            Calculated Attributes
          </h3>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '-5px', marginBottom: '20px' }}>
            Derived automatically from your active exponents above using system formulas.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Health</strong>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#888' }}>B{calculatedHealth}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#666', display: 'block', marginTop: '4px' }}>
                Formula: Average of all six base stats (rounded down)
                  </span>
            </div>

            <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Reflexes</strong>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#888' }}>B{calculatedReflexes}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#666', display: 'block', marginTop: '4px' }}>
                Formula: Average of Perception, Agility, and Speed (rounded down)
              </span>
            </div>

            <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Steel</strong>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#888'  }}>B{calculatedSteel}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#666', display: 'block', marginTop: '4px' }}>
                Formula: Average of Will and Perception (rounded down)
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}