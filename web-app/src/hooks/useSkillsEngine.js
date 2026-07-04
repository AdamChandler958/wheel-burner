import { useState } from 'react';
import { processSkillPointsAndSets, getSkillBaseExponent } from '../data/characterDerivations';
import { validateSkillSelection } from '../utils/validators';

export function useSkillSubEngine({ rules, character, setCharacter }) {
  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const [selectedSearchSkillKey, setSelectedSearchSkillKey] = useState("");

  const chronology = character.chosenLifepaths;

  const {
    totalLifepathSkillPoints,
    totalGeneralPoints,
    autoOpenedSkillsSet,
    availableLifepathSkillsSet
  } = processSkillPointsAndSets(chronology);

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

  const handleValidateSkill = (skillKey, characterState, gmOverride = false) => {
    return validateSkillSelection(rules, skillKey, characterState, gmOverride);
  };

  return {
    totalGeneralPoints,
    totalLifepathSkillPoints,
    processedLifepathSkills,
    processedGlobalSkills,
    remainingLifepathSkillPoints,
    remainingGeneralPoints,
    availableLifepathSkillsSet,
    adjustSkillPoints,
    validateSkillSelection: handleValidateSkill,
    skillSearchQuery,
    setSkillSearchQuery,
    selectedSearchSkillKey,
    setSelectedSearchSkillKey,
    searchedSkillsResults
  };
}