import { calculateBaseStatPools, calculateDerivedStats } from '../data/characterDerivations';

export function useStatSubEngine({ rules, character, setCharacter, selectedStock }) {
  const chronology = character.chosenLifepaths;
  const totalYears = chronology.reduce((sum, lp) => sum + lp.time, 0);


  const { baseMentalPool, basePhysicalPool } = calculateBaseStatPools(rules, selectedStock, totalYears);

  const lifepathMentalMod = chronology.reduce((sum, lp) => sum + (lp.stat_points?.mental || 0), 0);
  const lifepathPhysicalMod = chronology.reduce((sum, lp) => sum + (lp.stat_points?.physical || 0), 0);

  const finalMentalPool = baseMentalPool + lifepathMentalMod;
  const finalPhysicalPool = basePhysicalPool + lifepathPhysicalMod;


  const stats = character.assignedStats;
  const spentMental = stats.will + stats.perception;
  const remainingMental = finalMentalPool - spentMental;

  const spentPhysical = stats.agility + stats.speed + stats.power + stats.forte;
  const remainingPhysical = finalPhysicalPool - spentPhysical;

  const { 
    calculatedHealth, 
    calculatedReflexes, 
    calculatedSteel, 
    hasZeroStats 
  } = calculateDerivedStats(character.assignedStats);

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

  return {
    totalYears,
    finalMentalPool,
    remainingMental,
    finalPhysicalPool,
    remainingPhysical,
    calculatedHealth,
    calculatedReflexes,
    calculatedSteel,
    hasZeroStats,
    adjustStatValue
  };
}