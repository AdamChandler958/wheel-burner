import React from "react";

export default function LifepathSelector({ engine }) {
  const {
    rules,
    selectedStock,
    selectedSetting,
    selectedLifepathKey,
    handleStockChange,
    handleSettingChange,
    stockOptions,
    settingOptions,
    lifepathOptions,
    character,
    addLifepathToCharacter,
    setSelectedLifepathKey
  } = engine;

  return (
    <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px' }}>
      <h2 style={{ marginTop: 0 }}>Add Lifepaths</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
        
        {/* Stock Select */}
        <div style={{ flex: '1', minWidth: '150px' }}>
          <label style={{ display: 'block', textTransform: 'capitalize', fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>Stock</label>
          <select value={selectedStock} onChange={handleStockChange} style={{ width: '100%', padding: '8px' }}>
            <option value="">-- Choose Stock --</option>
            {stockOptions.map(stock => (
              <option key={stock} value={stock}>{stock.charAt(0).toUpperCase() + stock.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Setting Select */}
        <div style={{ flex: '1', minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>Setting</label>
          <select 
            value={selectedSetting} 
            onChange={handleSettingChange} 
            disabled={!selectedStock}
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="">-- Choose Setting --</option>
            {settingOptions.map(setting => {
              const cleanName = setting.replace('_setting', '');
              const displayName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
              return (
                <option key={setting} value={setting}>
                  {displayName}
                </option>
              );
            })}
          </select>
        </div>

        {/* Lifepath Select */}
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>Lifepath</label>
          <select 
            value={selectedLifepathKey} 
            onChange={(e) => setSelectedLifepathKey(e.target.value)} 
            disabled={!selectedSetting}
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="">-- Choose Lifepath --</option>
            {lifepathOptions.map(lpKey => {
              const lp = rules.lifepaths[selectedStock][selectedSetting][lpKey];
              const isFirstSelection = character.chosenLifepaths.length === 0;
              const isIllegalStart = isFirstSelection && !lp.is_born;

              return (
                <option 
                  key={lpKey} 
                  value={lpKey}
                  disabled={isIllegalStart}
                >
                  {lp.name} ({lp.time} yrs) {isIllegalStart ? " [Requires Born]" : ""}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <button 
        onClick={addLifepathToCharacter}
        disabled={!selectedLifepathKey}
        style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        Burn Lifepath
      </button>
    </div>
  );
}