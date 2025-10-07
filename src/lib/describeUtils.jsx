// 層級標籤相關的工具函數

/**
 * 獲取層級對應的英文標籤
 * @param {number} level - 技能層級（1-4）
 * @returns {string} 層級標籤（例如：1-Domain）
 */
export const getLevelLabel = (level) => {
  const levelMap = {
    1: "1-Domain",
    2: "2-Core", 
    3: "3-Branch",
    4: "4-Refined"
  };
  
  const floorLevel = Math.floor(level);
  return levelMap[floorLevel] || `${floorLevel}-Unknown`;
};

/**
 * 獲取層級的完整描述（帶中文說明）
 * @param {number} level - 技能層級（1-4）
 * @returns {string} 完整描述（例如：層級: 1-Domain (領域)）
 */
export const getLevelDescription = (level) => {
  const descriptionMap = {
    1: { label: "1 - Domain", desc: "領域" },
    2: { label: "2 - Core", desc: "核心" },
    3: { label: "3 - Branch", desc: "分支" },
    4: { label: "4 - Refined", desc: "精煉" }
  };
  
  const floorLevel = Math.floor(level);
  const info = descriptionMap[floorLevel];
  
  if (info) {
    return ` ${info.label}`;
  }
  return ` ${floorLevel}`;
};

/**
 * 僅獲取層級英文名稱（不含數字）
 * @param {number} level - 技能層級（1-4）
 * @returns {string} 層級英文名稱（例如：Domain）
 */
export const getLevelName = (level) => {
  const nameMap = {
    1: "Domain",
    2: "Core",
    3: "Branch",
    4: "Refined"
  };
  
  const floorLevel = Math.floor(level);
  return nameMap[floorLevel] || "Unknown";
};

/**
 * 獲取層級的顏色（可選功能，用於未來擴展）
 * @param {number} level - 技能層級（1-4）
 * @returns {string} 十六進制顏色代碼
 */
export const getLevelColor = (level) => {
  const colorMap = {
    1: "#ffffff", // Domain - 白色
    2: "#60a5fa", // Core - 藍色
    3: "#34d399", // Branch - 綠色
    4: "#fbbf24"  // Refined - 黃色
  };
  
  const floorLevel = Math.floor(level);
  return colorMap[floorLevel] || "#888888";
};

