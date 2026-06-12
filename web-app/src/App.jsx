import { useState, useEffect } from 'react';

function App() {
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedStock, setSelectedStock] = useState('');
  const [selectedSetting, setSelectedSetting] = useState('');
  const [selectedLifepathKey, setSelectedLifepathKey] = useState('');

  const [pendingLifepath, setPendingLifepath] = useState(null);


  const [character, setCharacter] = useState({
    name: "New Character",
    chosenLifepaths: [] 
  });

  useEffect(() => {
    fetch('/master_rules.json')
      .then(res => res.json())
      .then(data => {
        setRules(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching ruleset:", err);
        setLoading(false);
      });
  }, []);

  const handleStockChange = (e) => {
    setSelectedStock(e.target.value);
    setSelectedSetting(''); 
    setSelectedLifepathKey(''); 
  };

  const handleSettingChange = (e) => {
    setSelectedSetting(e.target.value);
    setSelectedLifepathKey(''); 
  };


  const addLifepathToCharacter = () => {
    if (!selectedStock || !selectedSetting || !selectedLifepathKey) return;
      

    const lifepathDetails = rules.lifepaths[selectedStock][selectedSetting][selectedLifepathKey];
    let calculatedTimeCost = lifepathDetails.time;

    if (chronology.length > 0) {
      const previousSetting = lastChosenPath.setting;
      if (selectedSetting !== previousSetting) {
        calculatedTimeCost += 1; 
      }
    }

    const newPath = {
      stock: selectedStock,
      setting: selectedSetting,
      key: selectedLifepathKey,
      name: lifepathDetails.name,
      time: calculatedTimeCost,
      res: lifepathDetails.res,
      is_born: lifepathDetails.is_born,
      leads: lifepathDetails.leads || [] 
    };

    if (lifepathDetails.stat_choice) {
      setPendingLifepath({
        basePath: newPath,
        choices: lifepathDetails.stat_choice.options,
        amount: lifepathDetails.stat_choice.amount
      });
      return;
    }

    setCharacter(prev => ({
      ...prev,
      chosenLifepaths: [...prev.chosenLifepaths, newPath]
    }));

    setSelectedLifepathKey('');
  };

  const handleResolveStatChoice = (chosenStat) => {
    if (!pendingLifepath) return;

    try {
      const finalisedPath = {...pendingLifepath.basePath };

      if (!finalisedPath.stat_points) {
        finalisedPath.stat_points = {"physical": 0, "mental": 0}

      };

      const modifier = pendingLifepath.amount

      finalisedPath.stat_points = {
        ...finalisedPath.stat_points,
        [chosenStat]: (finalisedPath.stat_points[chosenStat] || 0) + modifier
      };

      finalisedPath.chosen_bonus = `${modifier > 0 ? '+' : '-'}${modifier} ${chosenStat}`;

      setCharacter(prev => ({
        ...prev,
        chosenLifepaths: [...prev.chosenLifepaths, finalisedPath]
      }));
    } catch (error) {
      console.error("Error setting choice attributes:", error);
    } finally {
      setPendingLifepath(null);
      setSelectedSetting('');
      setSelectedLifepathKey('');
    }
  };

  const abortPendingLifepath = () => {
    setPendingLifepath(null);
    setSelectedSetting('');
    setSelectedLifepathKey('');
  };

  const removeLifepath = (indexToRemove) => {
    setCharacter(prev => ({
      ...prev,
      chosenLifepaths: prev.chosenLifepaths.filter((_, index) => index !== indexToRemove)
    }));
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading Master Ruleset Assets...</div>;
  if (!rules || !rules.lifepaths) return <div style={{ padding: '20px' }}>Error: Data compilation missing or malformed.</div>;

  const chronology = character.chosenLifepaths;
  const isFirstLifepath = chronology.length === 0;
  const lastChosenPath = !isFirstLifepath ? chronology[chronology.length - 1] : null;

  const stockOptions = rules.lifepaths ? Object.keys(rules.lifepaths) : [];

  let settingOptions = [];
  if (selectedStock && rules.lifepaths[selectedStock]) {
    const allSettingsInStock = Object.keys(rules.lifepaths[selectedStock]);

    if (isFirstLifepath) {
      settingOptions = allSettingsInStock.filter(settingKey => {
        const lifepathsInSetting = rules.lifepaths[selectedStock][settingKey];
        return Object.values(lifepathsInSetting).some(lp => lp.is_born === true);
      });
    } else {
      const activeLeads = lastChosenPath?.leads || [];
      
      settingOptions = allSettingsInStock.filter(settingKey => {
        const isCurrentSetting = settingKey === lastChosenPath.setting;
        
        return isCurrentSetting || activeLeads.includes(settingKey);
      });
    }
  }



  let lifepathOptions = [];
  if (selectedStock && selectedSetting && rules.lifepaths[selectedStock][selectedSetting]) {
    const allLifepathsInSetting = Object.keys(rules.lifepaths[selectedStock][selectedSetting]);

    if (isFirstLifepath) {
      lifepathOptions = allLifepathsInSetting.filter(lpKey => {
        return rules.lifepaths[selectedStock][selectedSetting][lpKey].is_born === true;
      });
    } else {
      lifepathOptions = allLifepathsInSetting.filter(lpKey => {
        return rules.lifepaths[selectedStock][selectedSetting][lpKey].is_born !== true;
      });
    }
  }

  const totalYears = character.chosenLifepaths.reduce((sum, lp) => sum + lp.time, 0);
  const totalResources = character.chosenLifepaths.reduce((sum, lp) => sum + (lp.res || 0), 0);

  let baseMentalPool = 0;
  let basePhysicalPool = 0;

  const activeStockKey = selectedStock || 'human';
  const ageChart = rules?.ages?.[activeStockKey];

  if (ageChart && ageChart.bands) {
    const matchingBand = ageChart.bands.find(band =>
      totalYears >= band.min_age && totalYears <= band.max_age
    );

    if (matchingBand) {
      baseMentalPool = matchingBand.mental;
      basePhysicalPool = matchingBand.physical
    }
  }

  const lifepathMentalMod = character.chosenLifepaths.reduce((sum, lp) => sum + (lp.stat_points?.mental || 0), 0);
  const lifepathPhysicalMod = character.chosenLifepaths.reduce((sum, lp) => sum + (lp.stat_points?.physical || 0), 0);

  const finalMentalPool = baseMentalPool + lifepathMentalMod;
  const finalPhysicalPool = basePhysicalPool + lifepathPhysicalMod;

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