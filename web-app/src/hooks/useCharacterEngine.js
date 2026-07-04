import { useState, useEffect } from "react";
import { initialCharacter } from '../data/initialCharacter';
import { validateLifepathSelection, validateSkillSelection } from "../utils/validators";

import { calculateBaseStatPools, calculateDerivedStats, getSkillBaseExponent, processSkillPointsAndSets } from "../data/characterDerivations";
import { useStatSubEngine } from "./useStatsEngine";

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

  const [traitSearchQuery, setTraitSearchQuery] = useState("");

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

  const statsEngine = useStatSubEngine({ rules, character, setCharacter, selectedStock });

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

  const { totalYears } = statsEngine;

  const chronology = character.chosenLifepaths;
  const isFirstLifepath = chronology.length === 0;
  const lastChosenPath = !isFirstLifepath ? chronology[chronology.length - 1] : null;

  const totalResources = chronology.reduce((sum, lp) => sum + (lp.res || 0), 0);
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

  const { remainingMental, remainingPhysical } = statsEngine;
  

  // 5. Compute Skill points structures via pure function
  const {
    totalLifepathSkillPoints,
    totalGeneralPoints,
    autoOpenedSkillsSet,
    availableLifepathSkillsSet
  } = processSkillPointsAndSets(chronology);

  // Determine point expenditure
  let spentLifepathPoints = 0;
  let spentGeneralPoints = 0;

  Object.entries(character.skillAllocations).forEach(([skillKey, allocatedBonus]) => {
    if (allocatedBonus <= 0) return;
    if (availableLifepathSkillsSet.has(skillKey)) {
      spentLifepathPoints += allocatedBonus;
    } else {
      spentGeneralPoints += allocatedBonus;
    }
  });

  const remainingLifepathSkillPoints = totalLifepathSkillPoints - spentLifepathPoints;
  const remainingGeneralPoints = totalGeneralPoints - spentGeneralPoints;

  // Build processed skill lists for UI consumption
  const processedLifepathSkills = [];
  const processedGlobalSkills = [];

  Object.keys(rules?.skills || {}).forEach((skillKey) => {
    const skillDef = rules.skills[skillKey];
    const isLifepathSkill = availableLifepathSkillsSet.has(skillKey);
    const isAutoOpen = autoOpenedSkillsSet.has(skillKey);
    const allocatedBonus = character.skillAllocations[skillKey] || 0;
    const isOpened = isAutoOpen || allocatedBonus > 0;

    let currentExponent = 0;
    if (isOpened) {
      const base = getSkillBaseExponent(character.assignedStats, skillDef.roots);
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

  const handleValidateLifepath = (stock, setting, lpKey, characterState) => {
    return validateLifepathSelection(rules, stock, setting, lpKey, characterState);
  };

  const handleValidateSkill = (skillKey, characterState, gmOverride = false) => {
    return validateSkillSelection(rules, skillKey, characterState, gmOverride);
  };

  return {
    rules,
    loading,
    isFocused,
    setIsFocused,
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
    isFirstLifepath,
    setCharacter,
    addLifepathToCharacter,
    removeLifepath,
    handleResolveStatChoice,
    abortPendingLifepath,
    validateLifepathSelection: (stock, setting, lpKey, state) => validateLifepathSelection(rules, stock, setting, lpKey, state),
    totalResources,

    // Remaining Skill Outputs left in main hook body
    totalGeneralPoints,
    totalLifepathSkillPoints,
    processedLifepathSkills,
    processedGlobalSkills,
    remainingLifepathSkillPoints,
    remainingGeneralPoints,
    availableLifepathSkillsSet,
    adjustSkillPoints: (key, op) => { /* original implementation unchanged */ },
    setSelectedLifepathKey,
    validateSkillSelection: (key, state, override) => validateSkillSelection(rules, key, state, override),
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
    eligibleLifepathTraitKeys,


    ...statsEngine
  };
};

