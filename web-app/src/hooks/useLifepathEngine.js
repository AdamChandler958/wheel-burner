import { useState } from "react";

export function useLifepathSubEngine({ rules, character, setCharacter }) {
  const [selectedStock, setSelectedStock] = useState('');
  const [selectedSetting, setSelectedSetting] = useState('');
  const [selectedLifepathKey, setSelectedLifepathKey] = useState('');
  const [pendingLifepath, setPendingLifepath] = useState(null);

  const chronology = character.chosenLifepaths || [];
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
      const finalisedPath = { ...pendingLifepath.basePath };

      if (!finalisedPath.stat_points) {
        finalisedPath.stat_points = { "physical": 0, "mental": 0 };
      }

      const modifier = pendingLifepath.amount;

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

  return {
    selectedStock,
    selectedSetting,
    selectedLifepathKey,
    pendingLifepath,
    setSelectedLifepathKey,
    isFirstLifepath,
    totalResources,
    stockOptions,
    settingOptions,
    lifepathOptions,
    handleStockChange,
    handleSettingChange,
    addLifepathToCharacter,
    removeLifepath,
    handleResolveStatChoice,
    abortPendingLifepath
  };
}