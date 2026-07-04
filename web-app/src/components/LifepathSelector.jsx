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
    setSelectedLifepathKey,
    validateLifepathSelection
  } = engine;

  const hasSelection = selectedStock && selectedSetting && selectedLifepathKey;

  const selectionCheck = hasSelection 
    ? validateLifepathSelection(selectedStock, selectedSetting, selectedLifepathKey, character)
    : { valid: false, errors: [] };

  const showErrorBanner = hasSelection && !selectionCheck.valid && selectionCheck.errors?.length > 0;

  return (
    <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px' }}>
      <h2 style={{ marginTop: 0 }}>Add Lifepaths</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
        
        <div style={{ flex: '1', minWidth: '150px' }}>
          <label style={{ display: 'block', textTransform: 'capitalize', fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>Stock</label>
          <select value={selectedStock} onChange={handleStockChange} style={{ width: '100%', padding: '8px' }}>
            <option value="">-- Choose Stock --</option>
            {stockOptions.map(stock => (
              <option key={stock} value={stock}>{stock.charAt(0).toUpperCase() + stock.slice(1)}</option>
            ))}
          </select>
        </div>

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

      {showErrorBanner && (
        <div style={{ 
          color: '#ff4444', 
          backgroundColor: '#2a1111', 
          border: '1px solid #5a1a1a',
          padding: '12px', 
          borderRadius: '4px', 
          marginBottom: '15px', 
          fontSize: '13px',
          lineHeight: '1.4'
        }}>
          <strong style={{ display: 'block', marginBottom: '4px' }}>Prerequisite Requirements:</strong> 
          {selectionCheck.errors.join(" ")}
        </div>
      )}

      <button 
        disabled={!selectionCheck?.valid}
        onClick={addLifepathToCharacter}
      >
        Burn Lifepath
      </button>
    </div>
  );
}