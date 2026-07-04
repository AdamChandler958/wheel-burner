import { useState, useEffect } from 'react';

function App() {
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedStock, setSelectedStock] = useState('');
  const [selectedSetting, setSelectedSetting] = useState('');
  const [selectedLifepathKey, setSelectedLifepathKey] = useState('');

  const [pendingLifepath, setPendingLifepath] = useState(null);

  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const [selectedSearchSkillKey, setSelectedSearchSkillKey] = useState("");


  const [character, setCharacter] = useState({
    name: "New Character",
    chosenLifepaths: [],
    assignedStats: {
      will: 0,
      perception: 0,
      agility: 0,
      speed: 0,
      power: 0,
      forte: 0
    },
    skillAllocations: {}
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
      skills: lifepathDetails.skills || [], 
      skill_points: lifepathDetails.skill_points || 0,
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

  const adjustStatValue = (statName, direction, poolType) => {
    const currentVal = character.assignedStats[statName];
    const poolRemaining = poolType === 'mental' ? remainingMental : remainingPhysical;

    if (direction === 'dec' && currentVal <= 0) return;
    
    if (direction === 'inc' && poolRemaining <= 0) return;

    const modifier = direction === 'inc' ? 1 : -1;

    setCharacter(prev => ({
      ...prev,
      assignedStats: {
        ...prev.assignedStats,
        [statName]: currentVal + modifier
      }
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

  // Attribute Section
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

  // Stat section
  const stats = character.assignedStats;
  
  const spentMental = stats.will + stats.perception;
  const remainingMental = finalMentalPool - spentMental;

  const spentPhysical = stats.agility + stats.speed + stats.power + stats.forte;
  const remainingPhysical = finalPhysicalPool - spentPhysical;

  const healthSum = stats.will + stats.perception + stats.agility + stats.speed + stats.power + stats.forte;
  const calculatedHealth = healthSum > 0 ? Math.floor(healthSum / 6) : 0;

  const reflexesSum = stats.perception + stats.agility + stats.speed;
  const calculatedReflexes = reflexesSum > 0 ? Math.floor(reflexesSum / 3) : 0;

  const calculatedSteel = stats.will > 0 ? Math.floor((stats.will + stats.perception) / 2) : 0;

  const hasZeroStats = Object.values(character.assignedStats).some(value => value === 0);

  // Skill Section

  let totalLifepathSkillPoints = 0;
  let totalGeneralPoints = 0;
  
  const autoOpenedSkillsSet = new Set();
  const availableLifepathSkillsSet = new Set();

  character.chosenLifepaths.forEach((lp) => {
    const points = lp.skill_points || 0;
    const skillList = lp.skills || [];
    const isGeneralPath = skillList.length === 1 && skillList[0] === 'general';

    if (isGeneralPath || skillList.length === 0) {
      totalGeneralPoints += points;
      return;
    }

    totalLifepathSkillPoints += points;
    skillList.forEach(sk => availableLifepathSkillsSet.add(sk));

    let primarySkill = skillList[0];
    let secondarySkill = skillList[1];

    if (primarySkill && primarySkill !== 'general') {
      if (!autoOpenedSkillsSet.has(primarySkill)) {
        autoOpenedSkillsSet.add(primarySkill);
      } else if (secondarySkill && !autoOpenedSkillsSet.has(secondarySkill)) {
        autoOpenedSkillsSet.add(secondarySkill);
      }
    }
  });

  let spentLifepathPoints = 0;
  let spentGeneralPoints = 0;
  const processedLifepathSkills = [];
  const processedGlobalSkills = [];

  const getSkillBaseExponent = (roots = []) => {
    if (roots.length === 1) {
      return Math.floor((character.assignedStats[roots[0]] || 0) / 2);
    } else if (roots.length === 2) {
      const v1 = character.assignedStats[roots[0]] || 0;
      const v2 = character.assignedStats[roots[1]] || 0;
      return Math.floor(((v1 + v2) / 2) / 2);
    }
    return 0;
  };

  Object.entries(character.skillAllocations).forEach(([skillKey, allocatedBonus]) => {
    if (allocatedBonus <= 0) return;

    const isLifepathSkill = availableLifepathSkillsSet.has(skillKey);

    if (isLifepathSkill) {
      spentLifepathPoints += allocatedBonus;
    } else {
      spentGeneralPoints += allocatedBonus;
    }
  });

  const remainingLifepathSkillPoints = totalLifepathSkillPoints - spentLifepathPoints;
  const remainingGeneralPoints = totalGeneralPoints - spentGeneralPoints;

  Object.keys(rules?.skills || {}).forEach((skillKey) => {
    const skillDef = rules.skills[skillKey];
    const isLifepathSkill = availableLifepathSkillsSet.has(skillKey);
    const isAutoOpen = autoOpenedSkillsSet.has(skillKey);
    const allocatedBonus = character.skillAllocations[skillKey] || 0;
    const isOpened = isAutoOpen || allocatedBonus > 0;

    let currentExponent = 0;
    if (isOpened) {
      const base = getSkillBaseExponent(skillDef.roots);
      currentExponent = base + (isAutoOpen ? allocatedBonus : (allocatedBonus - 1));
    }

    const payload = {
      key: skillKey,
      name: skillDef.name,
      roots: (skillDef.roots || []).map(r => r.charAt(0).toUpperCase() + r.slice(1)).join('/'),
      isOpened,
      isAutoOpen,
      allocatedBonus,
      exponent: currentExponent
    };

    if (isLifepathSkill) {
      processedLifepathSkills.push(payload);
    } else if (allocatedBonus > 0) {
      processedGlobalSkills.push(payload);
    }
  });

  const searchedSkillsResults = Object.entries(rules?.skills || {})
    .filter(([key, def]) => {
      if (availableLifepathSkillsSet.has(key)) return false; 
      if (character.skillAllocations[key] > 0) return false; 
      if (!skillSearchQuery.trim()) return false;            
      
      return def.name.toLowerCase().includes(skillSearchQuery.toLowerCase());
    })
    .map(([key, def]) => ({ key, ...def }));

  const adjustSkillPoints = (skillKey, operation) => {
    const isLifepathSkill = availableLifepathSkillsSet.has(skillKey);
    const currentAllocation = character.skillAllocations[skillKey] || 0;

    if (operation === 'inc') {
      if (isLifepathSkill && remainingLifepathSkillPoints <= 0) return;
      if (!isLifepathSkill && remainingGeneralPoints <= 0) return;

      setCharacter(prev => ({
        ...prev,
        skillAllocations: { ...prev.skillAllocations, [skillKey]: currentAllocation + 1 }
      }));
    } else if (operation === 'dec') {
      if (currentAllocation <= 0) return;

      setCharacter(prev => {
        const updated = { ...prev.skillAllocations };
        if (currentAllocation - 1 === 0) {
          delete updated[skillKey];
        } else {
          updated[skillKey] = currentAllocation - 1;
        }
        return { ...prev, skillAllocations: updated };
      });
    }
  };

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

      <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              Skills Management
            </h3>

            <div style={{ display: 'flex', gap: '20px', margin: '0 0 20px 0', padding: '12px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '6px', justifyContent: 'center' }}>
              <div>
                <span style={{ color: '#aaa', fontSize: '12px', textTransform: 'uppercase', display: 'block' }}>Lifepath Skill Pool</span>
                <strong style={{ fontSize: '18px'}}>
                  {remainingLifepathSkillPoints} / {totalLifepathSkillPoints} pts
                </strong>
              </div>
              <div style={{ borderLeft: '1px solid #444', paddingLeft: '20px' }}>
                <span style={{ color: '#aaa', fontSize: '12px', textTransform: 'uppercase', display: 'block' }}>General Skill Pool</span>
                <strong style={{ fontSize: '18px'}}>{remainingGeneralPoints} / {totalGeneralPoints} pts</strong>
              </div>
            </div>

            <div style={{ 
              marginBottom: '30px', 
              padding: '15px', 
              backgroundColor: 'rgba(255,255,255,0.01)', 
              border: '1px solid rgba(255,255,255,0.05)', 
              borderRadius: '6px' 
            }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#ccc', marginBottom: '8px' }}>
                Open General Skills from Rulebook Registry
              </label>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input 
                    type="text"
                    placeholder="Type to search skills... (e.g., Mending, Sewing)"
                    value={skillSearchQuery}
                    onChange={(e) => {
                      setSkillSearchQuery(e.target.value);
                      setSelectedSearchSkillKey(""); 
                    }}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      backgroundColor: '#111', 
                      border: '1px solid #444', 
                      borderRadius: '6px', 
                      color: '#fff', 
                      boxSizing: 'border-box' 
                    }}
                  />

                  {searchedSkillsResults.length > 0 && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '100%', 
                      left: 0, 
                      right: 0, 
                      backgroundColor: '#151515', 
                      border: '1px solid #333', 
                      borderRadius: '0 0 6px 6px', 
                      maxHeight: '180px', 
                      overflowY: 'auto', 
                      zIndex: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}>
                      {searchedSkillsResults.map((sk) => {
                        const isCurrentlySelected = selectedSearchSkillKey === sk.key;
                        return (
                          <div 
                            key={sk.key} 
                            onClick={() => {
                              setSelectedSearchSkillKey(sk.key);
                              setSkillSearchQuery(sk.name); 
                            }}
                            style={{ 
                              padding: '10px 15px', 
                              cursor: 'pointer', 
                              backgroundColor: isCurrentlySelected ? '#0070f3' : 'transparent',
                              color: isCurrentlySelected ? '#fff' : '#aaa',
                              borderBottom: '1px solid #222',
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}
                          >
                            <span style={{ fontWeight: 'bold' }}>{sk.name}</span>
                            <span style={{ fontSize: '10px', opacity: 0.6 }}>Roots: {(sk.roots || []).join('/')}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  disabled={!selectedSearchSkillKey || remainingGeneralPoints <= 0}
                  onClick={() => {
                    adjustSkillPoints(selectedSearchSkillKey, 'inc');
                    setSkillSearchQuery("");
                    setSelectedSearchSkillKey("");
                  }}
                  style={{ 
                    padding: '0 20px', 
                    backgroundColor: (selectedSearchSkillKey && remainingGeneralPoints > 0) ? '#0070f3' : '#333', 
                    color: '#000', 
                    fontWeight: 'bold', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: (selectedSearchSkillKey && remainingGeneralPoints > 0) ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Add Skill
                </button>
              </div>

              {selectedSearchSkillKey && remainingGeneralPoints <= 0 && (
                <p style={{ color: '#ff4d4d', fontSize: '12px', margin: '8px 0 0 0' }}>
                  Insufficient General Skill Points to open this skill.
                </p>
              )}
            </div>

            {processedLifepathSkills.length + processedGlobalSkills.length === 0 ? (
              <p style={{ color: '#555', fontStyle: 'italic', fontSize: '14px' }}>
                No skills found in your current lifepath choices.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {[...processedLifepathSkills, ...processedGlobalSkills].map((skill) => {
                  const canMinus = skill.allocatedBonus > 0;
                  const isGeneralChoice = !availableLifepathSkillsSet.has(skill.key);
                  const canPlus = isGeneralChoice 
                    ? remainingGeneralPoints > 0 
                    : remainingLifepathSkillPoints > 0;

                  return (
                    <div 
                      key={skill.key} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '12px 15px', 
                        backgroundColor: skill.isOpened ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.01)', 
                        borderRadius: '6px',
                        borderLeft: skill.isOpened ? '4px solid #444' : '4px solid #aaa',
                        opacity: skill.isOpened ? 1 : 0.6,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '16px', color: skill.isOpened ? '#fff' : '#aaa' }}>
                          {skill.name}
                        </strong>
                        <span style={{ display: 'block', fontSize: '11px', color: '#555', marginTop: '2px' }}>
                          Roots: {skill.roots} {skill.isAutoOpen && <span style={{ color: '#444', fontStyle: 'italic' }}>(Opened by Lifepath)</span>}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            disabled={!canMinus}
                            onClick={() => adjustSkillPoints(skill.key, 'dec')}
                            style={{ 
                              width: '24px', height: '24px', cursor: canMinus ? 'pointer' : 'not-allowed', 
                              backgroundColor: '#222', color: canMinus ? '#fff' : '#444', border: '1px solid #444', borderRadius: '4px' 
                            }}
                          >
                            -
                          </button>
                          <button 
                            disabled={!canPlus}
                            onClick={() => adjustSkillPoints(skill.key, 'inc')}
                            style={{ 
                              width: '24px', height: '24px', cursor: remainingLifepathSkillPoints > 0 ? 'pointer' : 'not-allowed', 
                              backgroundColor: '#222', color: remainingLifepathSkillPoints > 0 ? '#fff' : '#444', border: '1px solid #444', borderRadius: '4px' 
                            }}
                          >
                            +
                          </button>
                        </div>

                        <div style={{ textAlign: 'center', minWidth: '40px' }}>
                          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#555' }}>
                            {skill.isOpened ? `B${skill.exponent}` : '---'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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