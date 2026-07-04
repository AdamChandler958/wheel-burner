import { useState, useEffect } from "react";
import { initialCharacter } from '../data/initialCharacter';

export function useCharacterEngine() {
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  const [selectedStock, setSelectedStock] = useState('');
  const [selectedSetting, setSelectedSetting] = useState('');
  const [selectedLifepathKey, setSelectedLifepathKey] = useState('');

  const [pendingLifepath, setPendingLifepath] = useState(null);

  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const [selectedSearchSkillKey, setSelectedSearchSkillKey] = useState("");


  const [character, setCharacter] = useState(initialCharacter);


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

    const lpData = rules.lifepaths[selectedStock][selectedSetting][selectedLifepathKey];

    if (lpData.traits && lpData.traits.length > 0) {
      const firstTraitKey = lpData.traits[0];
      
      setCharacter(prev => {
        const updatedTraits = { ...prev.assignedTraits };
        const updatedMandatory = [...prev.mandatoryTraits];
        
        updatedTraits[firstTraitKey] = 0; 
        if (!updatedMandatory.includes(firstTraitKey)) {
          updatedMandatory.push(firstTraitKey);
        }
        
        return {
          ...prev,
          assignedTraits: updatedTraits,
          mandatoryTraits: updatedMandatory
        };
      });
    }

    const newPath = {
      stock: selectedStock,
      setting: selectedSetting,
      key: selectedLifepathKey,
      name: lifepathDetails.name,
      time: calculatedTimeCost,
      skills: lifepathDetails.skills || [],
      traits: lifepathDetails.traits || [],
      skill_points: lifepathDetails.skill_points || 0,
      trait_points: lifepathDetails.trait_points || 0,
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

    commitLifepathWithTraits(newPath);
    setSelectedLifepathKey('');

  };

  const commitLifepathWithTraits = (newPath) => {
    setCharacter(prev => {
      const updatedTraits = { ...prev.assignedTraits };
      const updatedMandatory = [...prev.mandatoryTraits];

      if (newPath.traits && newPath.traits.length > 0) {
        const firstTraitKey = newPath.traits[0];
        updatedTraits[firstTraitKey] = 0; 
        if (!updatedMandatory.includes(firstTraitKey)) {
          updatedMandatory.push(firstTraitKey);
        }
      }

      return {
        ...prev,
        chosenLifepaths: [...prev.chosenLifepaths, newPath],
        assignedTraits: updatedTraits,
        mandatoryTraits: updatedMandatory
      };
    });
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
    setCharacter(prev => {
      const updatedLifepaths = prev.chosenLifepaths.filter((_, idx) => idx !== indexToRemove);

      const remainingMandatoryKeys = [];
      updatedLifepaths.forEach(lp => {
        if (lp.traits && lp.traits.length > 0) {
          const firstTraitKey = lp.traits[0];
          if (!remainingMandatoryKeys.includes(firstTraitKey)) {
            remainingMandatoryKeys.push(firstTraitKey);
          }
        }
      });


      const updatedTraits = { ...prev.assignedTraits };


      prev.mandatoryTraits.forEach(oldMandatoryKey => {
        if (!remainingMandatoryKeys.includes(oldMandatoryKey)) {

          delete updatedTraits[oldMandatoryKey];
        }
      });

      
      remainingMandatoryKeys.forEach(mandatoryKey => {
        updatedTraits[mandatoryKey] = 0;
      });

      return {
        ...prev,
        chosenLifepaths: updatedLifepaths,
        assignedTraits: updatedTraits,
        mandatoryTraits: remainingMandatoryKeys
      };
    });
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

  const chronology = character.chosenLifepaths;
  const isFirstLifepath = chronology.length === 0;
  const lastChosenPath = !isFirstLifepath ? chronology[chronology.length - 1] : null;

  const stockOptions = rules?.lifepaths ? Object.keys(rules.lifepaths) : [];

  let settingOptions = [];
  if (rules?.lifepaths && selectedStock && rules.lifepaths[selectedStock]) {
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

  const PATH_VALIDATORS = {
    exact_index: (reqIndex, context) => {
      return context.currentHistory.length === reqIndex;
    },


    any_lifepath: (allowedKeys, context) => {
      return context.currentHistory.some(lp => allowedKeys.includes(lp.key));
    },


    any_trait: (allowedTraits, context) => {
      const assignedKeys = Object.keys(context.character.assignedTraits || {});
      return allowedTraits.some(tKey => assignedKeys.includes(tKey));
    },


    required_setting: (settingKey, context) => {
      return context.currentHistory.some(lp => lp.setting === settingKey);
    },

    any_of: (subRulesArray, context) => {

    return subRulesArray.some(subRule => {

      return Object.entries(subRule).every(([ruleType, rulePayload]) => {
        const validator = PATH_VALIDATORS[ruleType];
        if (!validator) return false;
        return validator(rulePayload, context);
      });
    });
  },

  exclude_index: (bannedIndex, context) => {
    return context.currentHistory.length !== bannedIndex;
  }
};

const validateLifepathSelection = (stock, setting, lpKey, characterState) => {
  const lpData = rules?.lifepaths?.[stock]?.[setting]?.[lpKey];
  if (!lpData) return { valid: false, errors: ["Lifepath rules definition not found."] };
  if (!lpData.prereqs) return { valid: true, errors: [] }; 

  const errors = [];
  const context = {
    character: characterState,
    currentHistory: characterState.chosenLifepaths || []
  };

  Object.entries(lpData.prereqs).forEach(([ruleType, rulePayload]) => {

    if (ruleType === "note") return;

    const validator = PATH_VALIDATORS[ruleType];
    
    if (!validator) {
      console.warn(`Missing engine validator implementation for rule type: "${ruleType}"`);
      return;
    }


    const passes = validator(rulePayload, context);
    if (!passes) {
      errors.push(lpData.prereqs.note || `Fails requirement: ${ruleType}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

const SKILL_VALIDATORS = {
  required_stock: (allowedStock, context) => {
    return context.character.stock === allowedStock;
  },

  required_setting: (settingKey, context) => {
    return context.currentHistory.some(lp => lp.setting === settingKey);
  }
};

const validateSkillSelection = (skillKey, characterState, gmOverride = false) => {
  if (gmOverride) return { valid: true, errors: [] };

  const skillData = rules?.skills?.[skillKey];
  if (!skillData) return { valid: false, errors: ["Skill rules definition not found."] };
  if (!skillData.prereqs) return { valid: true, errors: [] }; 

  const errors = [];
  const context = {
    character: characterState,
    currentHistory: characterState.chosenLifepaths || []
  };


  Object.entries(skillData.prereqs).forEach(([ruleType, rulePayload]) => {
    if (ruleType === "note") return;

    const validator = SKILL_VALIDATORS[ruleType];
    if (!validator) {
      console.warn(`Missing engine validator implementation for skill rule: "${ruleType}"`);
      return;
    }

    const passes = validator(rulePayload, context);
    if (!passes) {
      errors.push(skillData.prereqs.note || `Fails skill requirement: ${ruleType}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};



  let lifepathOptions = [];
  if (rules?.lifepaths && selectedStock && selectedSetting && rules.lifepaths[selectedStock]?.[selectedSetting]) {
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

  // Trait section

  const totalTraitPoints = character.chosenLifepaths.reduce((total, chosen) => {

    const lpMasterData = rules?.lifepaths?.[chosen.stock]?.[chosen.setting]?.[chosen.key];
    
    const pointsFromLP = Number(lpMasterData?.trait_points || 0);
    
    return total + pointsFromLP;
  }, 0);

  const eligibleLifepathTraitKeys = new Set();
  character.chosenLifepaths.forEach(chosen => {
    const lp = rules.lifepaths?.[chosen.stock]?.[chosen.setting]?.[chosen.key];
      lp?.traits?.forEach(tKey => {
        if (tKey) eligibleLifepathTraitKeys.add(tKey);
      });
  });

  const currentBurnedLifepathsSet = new Set(character.chosenLifepaths.map(lp => lp.key));

  const spentTraitPoints = Object.entries(character.assignedTraits).reduce((total, [tKey, cost]) => {
    const isMandatory = character.mandatoryTraits?.includes(tKey);
    if (isMandatory) return total;

    return total + Number(cost || 0);
  }, 0);

  const remainingTraitPoints = totalTraitPoints - spentTraitPoints;

  const [traitSearchQuery, setTraitSearchQuery] = useState("");

  const availableTraitOptions = Object.entries(rules?.traits || {})
  .filter(([tKey, trait]) => {
    if (!trait || !trait.name) return false;

    if (character.assignedTraits[tKey] !== undefined) return false;

    if (trait.lifepaths && Array.isArray(trait.lifepaths) && trait.lifepaths.length > 0) {
      const hasRequiredLP = trait.lifepaths.some(reqLp => currentBurnedLifepathsSet.has(reqLp));
      if (!hasRequiredLP) return false;
    }
    
    return trait.name.toLowerCase().includes(traitSearchQuery.toLowerCase());
  })
  .map(([tKey, trait]) => {
    const dynamicCost = eligibleLifepathTraitKeys?.has(tKey) ? 1 : Number(trait.cost || 0);
    return { key: tKey, ...trait, dynamicCost };
  });

  const buyTrait = (traitKey) => {
    const traitData = rules.traits[traitKey];
    if (!traitData) return;

    const cost = eligibleLifepathTraitKeys.has(traitKey) ? 1 : Number(traitData.cost || 0);
    if (remainingTraitPoints < cost) {
      alert("Insufficient Trait Points available!");
      return;
    }

    setCharacter(prev => ({
      ...prev,
      assignedTraits: { ...prev.assignedTraits, [traitKey]: cost }
    }));
    setTraitSearchQuery(""); 
  };

  const removeTrait = (traitKey) => {
    if (character.mandatoryTraits.includes(traitKey)) {
      alert("Mandatory traits cannot be removed.");
      return;
    }

    setCharacter(prev => {
      const updatedTraits = { ...prev.assignedTraits };
      delete updatedTraits[traitKey];
      return { ...prev, assignedTraits: updatedTraits };
    });
  };

  return {
    // Structural System States
    rules,
    loading,
    isFocused,
    setIsFocused,

    // Form/Selection Selections & Handlers
    selectedStock,
    selectedSetting,
    selectedLifepathKey,
    pendingLifepath,
    handleStockChange,
    handleSettingChange,
    
    // UI Dropdown Options Arrays
    stockOptions,
    settingOptions,
    lifepathOptions,

    // Core Lifepath Sheet Modification Triggers
    character,
    isFirstLifepath,
    setCharacter,
    addLifepathToCharacter,
    removeLifepath,
    handleResolveStatChoice,
    abortPendingLifepath,
    validateLifepathSelection,

    // Aggregated Character Background Information
    totalYears,
    totalResources,

    // Attribute Pool Balances & Interactive Modifiers
    finalMentalPool,
    remainingMental,
    finalPhysicalPool,
    remainingPhysical,
    adjustStatValue,

    // Calculated Derived Character Statistics
    calculatedHealth,
    calculatedReflexes,
    calculatedSteel,
    hasZeroStats,

    // Integrated Skill Management Engine
    totalGeneralPoints,
    totalLifepathSkillPoints,
    processedLifepathSkills,
    processedGlobalSkills,
    remainingLifepathSkillPoints,
    remainingGeneralPoints,
    availableLifepathSkillsSet,
    adjustSkillPoints,
    setSelectedLifepathKey,
    validateSkillSelection,
    

    // Skill Lookup/Search Utilities
    skillSearchQuery,
    setSkillSearchQuery,
    selectedSearchSkillKey,
    setSelectedSearchSkillKey,
    searchedSkillsResults,

    // Trait Management
    totalTraitPoints,
    remainingTraitPoints,
    traitSearchQuery,
    setTraitSearchQuery,
    availableTraitOptions,
    buyTrait,
    removeTrait,
    eligibleLifepathTraitKeys
  };
};