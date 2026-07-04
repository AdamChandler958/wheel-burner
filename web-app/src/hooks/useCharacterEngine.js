import { useState, useEffect } from "react";
import { initialCharacter } from '../data/initialCharacter';
import { validateLifepathSelection, validateSkillSelection } from "../utils/validators";

import { calculateBaseStatPools, calculateDerivedStats, getSkillBaseExponent, processSkillPointsAndSets } from "../data/characterDerivations";
import { useStatSubEngine } from "./useStatsEngine";
import { useSkillSubEngine } from "./useSkillsEngine";
import { useTraitSubEngine } from "./useTraitsEngine";
import { useLifepathSubEngine } from "./useLifepathEngine";

export function useCharacterEngine() {
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

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

  const subEngineContext = { rules, character, setCharacter, selectedStock: "" };


  const lifepathEngine = useLifepathSubEngine(subEngineContext);
  

  subEngineContext.selectedStock = lifepathEngine.selectedStock;

  const statsEngine = useStatSubEngine(subEngineContext);
  const skillsEngine = useSkillSubEngine(subEngineContext);
  const traitsEngine = useTraitSubEngine(subEngineContext);

  const { totalYears, remainingMental, remainingPhysical } = statsEngine;

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
    character,
    setCharacter,
    validateLifepathSelection: (stock, setting, lpKey, state) => validateLifepathSelection(rules, stock, setting, lpKey, state),
    
    ...lifepathEngine,
    ...statsEngine,
    ...skillsEngine,
    ...traitsEngine
  };
}