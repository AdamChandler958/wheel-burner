import React from "react";

export default function IdentityHeader({ engine }) {
  const { character, setCharacter } = engine;

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
        Character Name:
      </label>
      <input 
        type="text" 
        value={character.name} 
        onChange={(e) => setCharacter(prev => ({ ...prev, name: e.target.value }))}
        style={{ width: '100%', padding: '8px', fontSize: '16px' }}
      />
    </div>
  );
}