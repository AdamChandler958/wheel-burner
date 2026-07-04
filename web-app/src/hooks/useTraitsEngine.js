import { useState } from 'react';

export function useTraitSubEngine({ rules, character, setCharacter }) {
  const [traitSearchQuery, setTraitSearchQuery] = useState("");

  const chronology = character?.chosenLifepaths || [];

  const totalTraitPoints = chronology.reduce((sum, lp) => sum + (lp.trait_points || 0), 0);

  const eligibleLifepathTraitKeys = new Set();
  chronology.forEach(lp => {
    if (lp.traits) {
      lp.traits.forEach(t => eligibleLifepathTraitKeys.add(t));
    }
  });

  const mandatoryTraitsSet = new Set(character?.mandatoryTraits || []);
  const assignedTraits = character?.assignedTraits || {};

  const spentTraitPoints = Object.values(assignedTraits).reduce((sum, costValue) => {
    return sum + (Number(costValue) || 0);
  }, 0);

  const remainingTraitPoints = totalTraitPoints - spentTraitPoints;

  const availableTraitOptions = Object.entries(rules?.traits || {})
    .map(([key, def]) => {
      const isDiscounted = eligibleLifepathTraitKeys.has(key);
      const dynamicCost = isDiscounted ? 1 : (def.cost || 1);

      return {
        key,
        name: def.name || key,
        type: def.type || 'Character',
        description: def.description || "",
        dynamicCost 
      };
    })
    .filter(trait => {
      if (trait.key in assignedTraits) return false;
      
      if (!traitSearchQuery.trim()) return false;
      
      return trait.name.toLowerCase().includes(traitSearchQuery.toLowerCase()) || 
             trait.key.toLowerCase().includes(traitSearchQuery.toLowerCase());
    });

  const buyTrait = (traitKey) => {
    const isDiscounted = eligibleLifepathTraitKeys.has(traitKey);
    const traitDef = rules?.traits?.[traitKey];
    
    const cost = isDiscounted ? 1 : (traitDef?.cost || 1);

    if (remainingTraitPoints < cost) return;

    setCharacter(prev => ({
      ...prev,
      assignedTraits: {
        ...(prev.assignedTraits || {}),
        [traitKey]: cost
      }
    }));

    setTraitSearchQuery("");
  };

  const removeTrait = (traitKey) => {
    if (mandatoryTraitsSet.has(traitKey)) return;

    setCharacter(prev => {
      const updatedTraits = { ...(prev.assignedTraits || {}) };
      delete updatedTraits[traitKey];
      return {
        ...prev,
        assignedTraits: updatedTraits
      };
    });
  };

  return {
    rules,
    character,
    totalTraitPoints,
    remainingTraitPoints,
    traitSearchQuery,
    setTraitSearchQuery,
    availableTraitOptions,
    buyTrait,
    removeTrait,
    eligibleLifepathTraitKeys
  };
}