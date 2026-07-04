export const calculateBaseStatPools = (rules, stock, totalYears) => {
  let baseMentalPool = 0;
  let basePhysicalPool = 0;

  const activeStockKey = stock || 'human';
  const ageChart = rules?.ages?.[activeStockKey];

  if (ageChart && ageChart.bands) {
    const matchingBand = ageChart.bands.find(band =>
      totalYears >= band.min_age && totalYears <= band.max_age
    );

    if (matchingBand) {
      baseMentalPool = matchingBand.mental;
      basePhysicalPool = matchingBand.physical;
    }
  }

  return { baseMentalPool, basePhysicalPool };
};

export const calculateDerivedStats = (assignedStats) => {
  const stats = assignedStats || {};
  
  const healthSum = (stats.will || 0) + (stats.perception || 0) + (stats.agility || 0) + (stats.speed || 0) + (stats.power || 0) + (stats.forte || 0);
  const calculatedHealth = healthSum > 0 ? Math.floor(healthSum / 6) : 0;

  const reflexesSum = (stats.perception || 0) + (stats.agility || 0) + (stats.speed || 0);
  const calculatedReflexes = reflexesSum > 0 ? Math.floor(reflexesSum / 3) : 0;

  const calculatedSteel = (stats.will || 0) > 0 ? Math.floor(((stats.will || 0) + (stats.perception || 0)) / 2) : 0;

  const hasZeroStats = Object.values(stats).some(value => value === 0);

  return { calculatedHealth, calculatedReflexes, calculatedSteel, hasZeroStats };
};


export const getSkillBaseExponent = (assignedStats, roots = []) => {
  if (roots.length === 1) {
    return Math.floor((assignedStats[roots[0]] || 0) / 2);
  } else if (roots.length === 2) {
    const v1 = assignedStats[roots[0]] || 0;
    const v2 = assignedStats[roots[1]] || 0;
    return Math.floor(((v1 + v2) / 2) / 2);
  }
  return 0;
};

export const processSkillPointsAndSets = (chosenLifepaths) => {
  let totalLifepathSkillPoints = 0;
  let totalGeneralPoints = 0;
  const autoOpenedSkillsSet = new Set();
  const availableLifepathSkillsSet = new Set();

  chosenLifepaths.forEach((lp) => {
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

  return {
    totalLifepathSkillPoints,
    totalGeneralPoints,
    autoOpenedSkillsSet,
    availableLifepathSkillsSet
  };
};