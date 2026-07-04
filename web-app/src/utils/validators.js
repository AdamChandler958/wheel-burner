export const PATH_VALIDATORS = {
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

export const validateLifepathSelection = (rules, stock, setting, lpKey, characterState) => {
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

export const SKILL_VALIDATORS = {
  required_stock: (allowedStock, context) => {
    return context.character.stock === allowedStock;
  },

  required_setting: (settingKey, context) => {
    return context.currentHistory.some(lp => lp.setting === settingKey);
  }
};

export const validateSkillSelection = (rules, skillKey, characterState, gmOverride = false) => {
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