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
    <div style={{ marginTop: '30px', borderTop: '1px solid #444', paddingTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>Trait Management</h2>
        <span style={{ fontSize: '16px', fontWeight: 'bold', backgroundColor: '#222', padding: '6px 12px', borderRadius: '4px', border: '1px solid #444' }}>
          Trait Points: {remainingTraitPoints} / {totalTraitPoints} Remaining
        </span>
      </div>

      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>
          Search & Add Traits:
        </label>
        <input
          type="text"
          placeholder="Type to filter master traits list..."
          value={traitSearchQuery}
          onChange={(e) => setTraitSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '10px', fontSize: '14px', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', boxSizing: 'border-box' }}
        />

        {traitSearchQuery && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#2a2a2a', border: '1px solid #555', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: '50', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
            {availableTraitOptions.length === 0 ? (
              <div style={{ padding: '10px', color: '#888', fontSize: '14px' }}>No eligible traits matched query.</div>
            ) : (
              availableTraitOptions.map(trait => (
                <div
                  key={trait.key}
                  onClick={() => buyTrait(trait.key)}
                  style={{ padding: '10px', borderBottom: '1px solid #333', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div>
                    <strong style={{ color: '#0070f3' }}>{trait.name || trait.key}</strong> 
                    <span style={{ fontSize: '12px', color: '#aaa', marginLeft: '8px' }}>({trait.type})</span>
                  </div>
                  <button style={{ backgroundColor: '#0070f3', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                    Buy ({trait.dynamicCost} pts)
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {currentTraits.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#888' }}>No traits selected yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #555', color: '#aaa' }}>
              <th style={{ padding: '8px' }}>Name</th>
              <th style={{ padding: '8px' }}>Cost</th>
              <th style={{ padding: '8px' }}>Type</th>
              <th style={{ padding: '8px' }}>Description</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentTraits.map(trait => (
              <tr key={trait.key} style={{ borderBottom: '1px solid #333', color: '#eee' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>
                  {trait.name || trait.key}
                  {trait.isMandatory && <span style={{ block: 'inline', fontSize: '10px', color: '#ffb300', marginLeft: '6px', textTransform: 'uppercase', padding: '1px 4px', border: '1px solid #ffb300', borderRadius: '3px' }}>Mandatory</span>}
                </td>
                <td style={{ padding: '8px' }}>{trait.displayCost}</td>
                <td style={{ padding: '8px', fontStyle: 'italic' }}>{trait.type}</td>
                <td style={{ padding: '8px', color: '#ccc', maxWidth: '300px', fontSize: '13px', lineHeight: '1.4' }}>
                  {trait.description || <span style={{ color: '#666' }}>No context profile documented.</span>}
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <button
                    disabled={trait.isMandatory}
                    onClick={() => removeTrait(trait.key)}
                    style={{ backgroundColor: trait.isMandatory ? '#333' : '#d32f2f', color: trait.isMandatory ? '#777' : '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: trait.isMandatory ? 'not-allowed' : 'pointer', fontSize: '12px' }}
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