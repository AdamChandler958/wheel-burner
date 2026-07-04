import { useCharacterEngine } from "./hooks/useCharacterEngine";
import SkillAllocation from "./components/SkillAllocation";

function App() {

  const engine = useCharacterEngine();
  

 if (engine.loading) {
    return <div style={{ padding: '20px' }}>Loading Master Ruleset Assets...</div>;
  }
  if (!engine.rules || !engine.rules.lifepaths) {
    return <div style={{ padding: '20px' }}>Error: Data compilation missing or malformed.</div>;
  }

  const {
    rules,
    selectedStock,
    selectedSetting,
    selectedLifepathKey,
    pendingLifepath,
    handleStockChange,
    handleSettingChange,
    stockOptions,
    settingOptions,
    lifepathOptions,
    character,
    availableLifepathSkillsSet,
    setCharacter,
    addLifepathToCharacter,
    removeLifepath,
    handleResolveStatChoice,
    abortPendingLifepath,
    setSelectedLifepathKey,
    isFirstLifepath,
    totalYears,
    totalResources,
    finalMentalPool,
    remainingMental,
    finalPhysicalPool,
    remainingPhysical,
    adjustStatValue,
    calculatedHealth,
    calculatedReflexes,
    calculatedSteel,
    hasZeroStats,
    totalGeneralPoints,
    totalLifepathSkillPoints,
    processedLifepathSkills,
    processedGlobalSkills,
    remainingLifepathSkillPoints,
    remainingGeneralPoints,
    adjustSkillPoints,
    skillSearchQuery,
    setSkillSearchQuery,
    selectedSearchSkillKey,
    setSelectedSearchSkillKey,
    searchedSkillsResults
  } = engine;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ lineHeight: '1.2', marginBottom: '20px' }}>Burning Wheel Character Burner</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Character Name:</label>
        <input 
          type="text" 
          value={character.name} 
          onChange={(e) => setCharacter(prev => ({ ...prev, name: e.target.value }))}
          style={{ width: '100%', padding: '8px', fontSize: '16px' }}
        />
      </div>

      <hr />

      <h2>Add Lifepaths</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
        
        <div style={{ flex: '1', minWidth: '150px' }}>
          <label style={{ display: 'block', textTransform: 'capitalize' }}>Stock</label>
          <select value={selectedStock} onChange={handleStockChange} style={{ width: '100%', padding: '8px' }}>
            <option value="">-- Choose Stock --</option>
            {stockOptions.map(stock => (
              <option key={stock} value={stock}>{stock.charAt(0).toUpperCase() + stock.slice(1)}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1', minWidth: '150px' }}>
          <label style={{ display: 'block' }}>Setting</label>
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
          <label style={{ display: 'block' }}>Lifepath</label>
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
        style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Burn Lifepath
      </button>

      <hr style={{ margin: '30px 0' }} />

      <div style={{ 
            background: 'transparent', 
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '20px', 
            borderRadius: '8px',
            marginTop: '30px'
          }}>
        <h2>{character.name || "Unnamed Concept"}</h2>
        <p><strong>Total Age:</strong> {totalYears} years | <strong>Resource Pool:</strong> {totalResources} rps | <strong>Mental Pool:</strong> {finalMentalPool} | <strong>Physical Pool:</strong> {finalPhysicalPool} </p>
        <hr></hr>
        
        <h3>Chosen Lifepaths Chronology</h3>
          {character.chosenLifepaths.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              No lifepaths selected yet. Use the configuration selectors above to burn paths.
            </p>
          ) : (
            <ol style={{ paddingLeft: '20px' }}>
              {character.chosenLifepaths.map((lp, index) => {
                
                const formattedStock = lp.stock.charAt(0).toUpperCase() + lp.stock.slice(1);

                const cleanSetting = lp.setting.replace('_setting', '');
                const formattedSetting = cleanSetting.charAt(0).toUpperCase() + cleanSetting.slice(1);

                return (
                  <li key={index} style={{ marginBottom: '10px' }}>
                    <strong>{lp.name}</strong> 
                    <span style={{ color: '#888', fontSize: '14px' }}> 
                      {' '}({formattedStock} — {formattedSetting}) | Time: {lp.time} yrs
                    </span>
                    <button 
                      onClick={() => removeLifepath(index)}
                      style={{ 
                        marginLeft: '15px', 
                        color: '#ff4d4d', 
                        border: 'none', 
                        background: 'none', 
                        cursor: 'pointer', 
                        fontSize: '12px' 
                      }}
                    >
                      [Remove]
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
      </div>
      {!isFirstLifepath && (
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
                const statValue = character.assignedStats[stat.key];
                const isZero = statValue === 0;

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
              );})}
            </div>

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
          
      )}

      <SkillAllocation engine = {engine}/>

      {pendingLifepath && (
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
      )}
    </div>
  );
}

export default App;