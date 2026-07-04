import { useState, useEffect } from "react";
import { initialCharacter } from '../data/initialCharacter';
import { validateLifepathSelection, validateSkillSelection } from "../utils/validators";

import { calculateBaseStatPools, calculateDerivedStats, getSkillBaseExponent, processSkillPointsAndSets } from "../data/characterDerivations";
import { useStatSubEngine } from "./useStatsEngine";
import { useSkillSubEngine } from "./useSkillsEngine";

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

  const subEngineContext = { rules, character, setCharacter, selectedStock };

  const statsEngine = useStatSubEngine({ rules, character, setCharacter, selectedStock });
  const skillsEngine = useSkillSubEngine(subEngineContext);

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
    setSelectedLifepathKey,


    // Trait Management
    totalTraitPoints,
    remainingTraitPoints,
    traitSearchQuery,
    setTraitSearchQuery,
    availableTraitOptions,
    buyTrait,
    removeTrait,
    eligibleLifepathTraitKeys,


    ...statsEngine,
    ...skillsEngine
  };
};

