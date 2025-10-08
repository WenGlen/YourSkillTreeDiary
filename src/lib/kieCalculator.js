// 計算技能的 KIE 值

/**
 * 遞迴計算一個技能的 KIE 值
 * @param {string} skillId - 技能 ID
 * @param {Object} skillList - 技能列表物件
 * @param {Object} diaryList - 日記列表物件
 * @param {Object} cache - 快取物件，避免重複計算
 * @returns {Object} { k, i, e } - 該技能的總 KIE 值
 */
export const calculateSkillKIE = (skillId, skillList, diaryList, cache = {}) => {
  // 如果已經計算過，直接返回快取結果
  if (cache[skillId]) {
    return cache[skillId];
  }

  const skill = skillList[skillId];
  if (!skill) {
    return { k: 0, i: 0, e: 0 };
  }

  // 1. 計算該技能直接關聯的所有日記的 KIE 總和
  let totalK = 0;
  let totalI = 0;
  let totalE = 0;

  if (diaryList) {
    Object.values(diaryList).forEach((diary) => {
      // 檢查這個日記是否關聯到當前技能，且狀態不是 Writing
      if (diary.skillsId && diary.skillsId.includes(skillId) && diary.state !== 'Writing') {
        totalK += diary.kie.k || 0;
        totalI += diary.kie.i || 0;
        totalE += diary.kie.e || 0;
      }
    });
  }

  // 2. 遞迴計算所有子技能（普通子技能）的 KIE
  if (skill.children && skill.children.length > 0) {
    skill.children.forEach((child) => {
      const childKIE = calculateSkillKIE(child.id, skillList, diaryList, cache);
      totalK += childKIE.k;
      totalI += childKIE.i;
      totalE += childKIE.e;
    });
  }

  // 3. 遞迴計算所有整合技能（merged children）的 KIE
  if (skill.mergedChildren && skill.mergedChildren.length > 0) {
    skill.mergedChildren.forEach((mergedChild) => {
      const mergedKIE = calculateSkillKIE(mergedChild.id, skillList, diaryList, cache);
      totalK += mergedKIE.k;
      totalI += mergedKIE.i;
      totalE += mergedKIE.e;
    });
  }

  const result = { k: totalK, i: totalI, e: totalE };
  cache[skillId] = result; // 快取結果
  return result;
};

/**
 * 為所有技能計算 KIE 值
 * @param {Object} skillList - 技能列表物件
 * @param {Object} diaryList - 日記列表物件
 * @returns {Object} 每個技能 ID 對應的 KIE 值
 */
export const calculateAllSkillsKIE = (skillList, diaryList) => {
  if (!skillList || !diaryList) {
    return {};
  }

  const kieMap = {};
  const cache = {}; // 用於快取已計算的結果

  // 為每個技能計算 KIE
  Object.keys(skillList).forEach((skillId) => {
    kieMap[skillId] = calculateSkillKIE(skillId, skillList, diaryList, cache);
  });

  return kieMap;
};

