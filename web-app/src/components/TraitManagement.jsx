import React from "react";

export default function TraitManagement({ engine }) {

  const isFirstLifepath = engine.character.chosenLifepaths.length === 0;
  if (isFirstLifepath) return null;

  const {
    rules,
    character,
    totalTraitPoints,
    remainingTraitPoints,
    traitSearchQuery,
    setTraitSearchQuery,
    availableTraitOptions,
    buyTrait,
    removeTrait,
    eligibleLifepathTraitKeys
  } = engine;

  const currentTraits = Object.keys(character.assignedTraits).map(tKey => {
    const trait = rules.traits[tKey] || { name: tKey, cost: 0, type: "Unknown", description: "" };
    const isMandatory = character.mandatoryTraits?.includes(tKey);
    const isDiscounted = eligibleLifepathTraitKeys.has(tKey);
    
    return {
      key: tKey,
      ...trait,
      isMandatory,
      displayCost: isMandatory ? "Forced (0)" : (isDiscounted ? "1 (LP)" : trait.cost)
    };
  });

  return (
    <div style={{ marginTop: '50px', borderTop: '1px solid #333', paddingTop: '30px' }}>
      

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'baseline', 
        marginBottom: '25px' 
      }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
          Trait Management
        </h2>
        <span style={{ 
          fontSize: '15px', 
          color: '#aaa', 
          letterSpacing: '0.5px' 
        }}>
          Trait Points Remaining: <strong style={{ color: '#aaa', fontSize: '18px', marginLeft: '6px' }}>{remainingTraitPoints}</strong> <span style={{ color: '#666' }}>/ {totalTraitPoints}</span>
        </span>
      </div>

      <div style={{ marginBottom: '30px', position: 'relative' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Search & Add Traits
        </label>
        <input
          type="text"
          placeholder="Type to filter master traits list..."
          value={traitSearchQuery}
          onChange={(e) => setTraitSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '12px', fontSize: '14px', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #444', borderRadius: '4px', boxSizing: 'border-box' }}
        />

        {traitSearchQuery && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#222', border: '1px solid #444', borderRadius: '4px', maxHeight: '220px', overflowY: 'auto', zIndex: '50', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
            {availableTraitOptions.length === 0 ? (
              <div style={{ padding: '12px', color: '#666', fontSize: '14px', fontStyle: 'italic' }}>No eligible traits matched query.</div>
            ) : (
              availableTraitOptions.map(trait => (
                <div
                  key={trait.key}
                  onClick={() => buyTrait(trait.key)}
                  style={{ padding: '12px', borderBottom: '1px solid #333', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div>
                    <strong style={{ color: '#0070f3' }}>{trait.name || trait.key}</strong> 
                    <span style={{ fontSize: '12px', color: '#888', marginLeft: '8px' }}>({trait.type})</span>
                  </div>
                  <button style={{ backgroundColor: '#0070f3', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                    Buy ({trait.dynamicCost} pts)
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {currentTraits.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#666', margin: '20px 0' }}>No traits assigned yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #444', color: '#888', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
              <th style={{ padding: '10px 8px' }}>Name</th>
              <th style={{ padding: '10px 8px' }}>Cost</th>
              <th style={{ padding: '10px 8px' }}>Type</th>
              <th style={{ padding: '10px 8px' }}>Description</th>
              <th style={{ padding: '10px 8px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentTraits.map(trait => (
              <tr key={trait.key} style={{ borderBottom: '1px solid #2a2a2a', color: '#eee' }}>
                <td style={{ padding: '12px 8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  {trait.name || trait.key}
                  {trait.isMandatory && (
                    <span style={{ fontSize: '9px', color: '#ffb300', marginLeft: '8px', textTransform: 'uppercase', padding: '2px 5px', border: '1px solid #ffb300', borderRadius: '3px', fontWeight: 'normal', letterSpacing: '0.5px' }}>
                      Mandatory
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px 8px', color: '#ccc' }}>{trait.displayCost}</td>
                <td style={{ padding: '12px 8px', fontStyle: 'italic', color: '#aaa' }}>{trait.type}</td>
                <td style={{ padding: '12px 8px', color: '#bbb', fontSize: '13px', lineHeight: '1.5' }}>
                  {trait.description || <span style={{ color: '#444', fontStyle: 'italic' }}>No rules description provided.</span>}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  <button
                    disabled={trait.isMandatory}
                    onClick={() => removeTrait(trait.key)}
                    style={{ backgroundColor: trait.isMandatory ? 'transparent' : '#d32f2f', color: trait.isMandatory ? '#444' : '#fff', border: trait.isMandatory ? '1px solid #333' : 'none', padding: '6px 12px', borderRadius: '4px', cursor: trait.isMandatory ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: trait.isMandatory ? 'normal' : 'bold' }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

}