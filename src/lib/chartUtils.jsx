// 技能樹圖表相關的工具函數和配置

// ==================== 發光效果配置 ====================

/**
 * 獲取節點的發光配置
 * @param {Object} node - 技能節點
 * @param {number} nodeRadius - 節點半徑
 * @param {string} glowColor - 發光顏色（預設為白色）
 * @returns {Object} 發光配置物件
 */
export const getGlowConfig = (node, nodeRadius, glowColor = '#ffffff') => {
  // 統一的光暈效果：光暈半徑 = 節點半徑 + 節點半徑的一半
  const haloRadius = nodeRadius * 1.5;
  
  return {
    filter: 'url(#glowMedium)',
    haloRadius: haloRadius,
    haloColor: glowColor,
    haloOpacity: 0.7,  // 統一的光暈透明度
    glowIntensity: 'medium'
  };
};

// ==================== 顏色配置 ====================

/**
 * 獲取節點的框線顏色
 * @param {Object} node - 技能節點
 * @returns {string} 框線顏色（hex）
 */
export const getStrokeColor = (node) => {
  // 優先使用自定義顏色（未來擴展）
  if (node.customStrokeColor) {
    return node.customStrokeColor;
  }
  
  if (node.isMerged) {
    return "#aaddff";  // 整合技能 - 橙色
  } else if (node.level === 1) {
    return "#ffffff";  // 根節點 - 白色
  } else {
    return "#dddddd";  // 普通節點 - 深灰色
  }
};

/**
 * 獲取節點的填充顏色
 * @param {Object} node - 技能節點
 * @returns {string} 填充顏色（hex）
 */
export const getFillColor = (node) => {
  if (node.hexcolor) {
    // 檢查是否為 CSS 變數
    if (node.hexcolor.startsWith('var(')) {
      // CSS 變數不能直接用於 SVG，使用預設顏色
      if (node.isMerged) {
        return "#f59e0b";
      }
      return "#3b82f6";
    }
    // 如果有實際的 hex 顏色，使用它
    return node.hexcolor;
  }
  // 預設顏色
  if (node.isMerged) {
    return "#f59e0b";  // 整合技能 - 橙色
  }
  return "#3b82f6";  // 預設藍色
};

/**
 * 獲取節點的填充透明度
 * @param {Object} node - 技能節點
 * @returns {number} 透明度（0-1）
 */
export const getFillOpacity = (node) => {
  // 只有實際的顏色值才套用 30% 透明度
  if (node.hexcolor && !node.hexcolor.startsWith('var(')) {
    return 0.7;  // 70% 不透明度（30% 透明）
  }
  // 整合技能保持原有透明度
  if (node.isMerged) {
    return 0.9;
  }
  return 1;  // 預設完全不透明
};

/**
 * 獲取節點的框線寬度
 * @param {Object} node - 技能節點
 * @returns {number} 框線寬度
 */
export const getStrokeWidth = (node) => {
  if (node.isMerged) {
    return 1;
  } else if (node.level === 1) {
    return 3;
  } else {
    return 2;
  }
};

// ==================== SVG 濾鏡定義 ====================

/**
 * 生成 SVG 發光濾鏡定義
 * @returns {JSX.Element} SVG defs 元素
 */
export const renderGlowFilters = () => {
  return (
    <>
      {/* 強發光效果 - 用於根節點 */}
      <filter id="glowStrong" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur1"/>
        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur2"/>
        <feMerge>
          <feMergeNode in="blur2"/>
          <feMergeNode in="blur1"/>
          <feMergeNode in="blur1"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      {/* 中等發光效果 - 用於普通節點 */}
      <filter id="glowMedium" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      {/* 微弱發光效果 - 用於衛星技能 */}
      <filter id="glowWeak" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      {/* 線條發光效果 */}
      <filter id="glowLine" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </>
  );
};

// ==================== 光暈漸變生成 ====================

/**
 * 生成光暈漸變定義（為每個節點生成獨立的漸變）
 * @param {Object} node - 技能節點
 * @param {Object} glowConfig - 發光配置
 * @returns {JSX.Element} radialGradient 元素
 */
export const renderHaloGradients = (node, glowConfig) => {
  if (Array.isArray(glowConfig.haloRadius)) {
    // 多層光暈（根節點）
    return glowConfig.haloRadius.map((radius, i) => (
      <radialGradient 
        key={`gradient-${node.id}-${i}`} 
        id={`halo-${node.id}-${i}`}
      >
        <stop offset="0%" stopColor={glowConfig.haloColor} stopOpacity={glowConfig.haloOpacity[i] * 0.8}/>
        <stop offset="50%" stopColor={glowConfig.haloColor} stopOpacity={glowConfig.haloOpacity[i] * 0.4}/>
        <stop offset="100%" stopColor={glowConfig.haloColor} stopOpacity="0"/>
      </radialGradient>
    ));
  } else {
    // 單層光暈（普通節點和衛星）
    return (
      <radialGradient 
        key={`gradient-${node.id}`}
        id={`halo-${node.id}`}
      >
        <stop offset="0%" stopColor={glowConfig.haloColor} stopOpacity={glowConfig.haloOpacity * 0.6}/>
        <stop offset="70%" stopColor={glowConfig.haloColor} stopOpacity={glowConfig.haloOpacity * 0.2}/>
        <stop offset="100%" stopColor={glowConfig.haloColor} stopOpacity="0"/>
      </radialGradient>
    );
  }
};

/**
 * 渲染光暈圓圈
 * @param {Object} node - 技能節點
 * @param {Object} glowConfig - 發光配置
 * @returns {JSX.Element} circle 元素
 */
export const renderHaloCircles = (node, glowConfig) => {
  if (Array.isArray(glowConfig.haloRadius)) {
    return glowConfig.haloRadius.map((radius, i) => (
      <circle
        key={`halo-circle-${i}`}
        cx={node.x}
        cy={node.y}
        r={radius}
        fill={`url(#halo-${node.id}-${i})`}
      />
    ));
  } else {
    return (
      <circle
        cx={node.x}
        cy={node.y}
        r={glowConfig.haloRadius}
        fill={`url(#halo-${node.id})`}
      />
    );
  }
};

// ==================== 文字樣式配置 ====================

/**
 * 獲取技能名稱的文字樣式
 * @param {Object} node - 技能節點
 * @param {boolean} showSatelliteLabels - 是否顯示衛星技能文字
 * @returns {Object} 文字樣式配置
 */
export const getTextStyle = (node, showSatelliteLabels = false) => {
  if (!node.isMerged) {
    return {
      fontSize: "12",
      fill: "#aaaaaa",
      y: node.y + 40,
      maxLength: 8,
      show: true  // 主技能始終顯示
    };
  
  } else {
    
    return {
      fontSize: "7",
      fill: "#92400e",
      y: node.y + 16,
      maxLength: 6,
      show: showSatelliteLabels  // 衛星技能根據開關決定
    };
    
  }
};

/**
 * 截斷文字並加上省略號
 * @param {string} text - 原始文字
 * @param {number} maxLength - 最大長度
 * @returns {string} 處理後的文字
 */
export const truncateText = (text, maxLength) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

// ==================== 節點半徑計算 ====================

/**
 * 根據 KIE 值計算節點半徑
 * 公式: radius = baseRadius + scaleFactor × (√K + √I + √E)
 * @param {Object} node - 技能節點
 * @param {number} baseRadius - 基礎半徑
 * @param {number} scaleFactor - 比例常數
 * @returns {number} 節點半徑
 */
export const getNodeRadius = (node, baseRadius = 8, scaleFactor = 1.5) => {
  // 整合技能使用固定的小半徑
  if (node.isMerged) {
    const kie = node.KIE || { k: 0, i: 0, e: 0 };
    const kieSum = Math.sqrt(kie.k) + Math.sqrt(kie.i) + Math.sqrt(kie.e);
    return Math.max(4, baseRadius * 0.4 + scaleFactor * 0.3 * kieSum); // 整合技能的最小半徑為 4
  }
  
  // 普通節點根據 KIE 值計算
  const kie = node.KIE || { k: 0, i: 0, e: 0 };
  const kieSum = Math.sqrt(kie.k) + Math.sqrt(kie.i) + Math.sqrt(kie.e);
  
  return baseRadius + scaleFactor * kieSum;
};

/**
 * 計算衛星技能與父技能的距離
 * 公式: distance = parentRadius + satelliteGap
 * @param {Object} parentNode - 父技能節點
 * @param {number} baseRadius - 基礎半徑
 * @param {number} scaleFactor - 比例常數
 * @param {number} satelliteGap - 衛星技能與父技能邊緣的間距（預設 8px）
 * @returns {number} 衛星技能距離父技能中心的距離
 */
export const getSatelliteDistance = (parentNode, baseRadius = 8, scaleFactor = 1.5, satelliteGap = 8) => {
  const parentRadius = getNodeRadius(parentNode, baseRadius, scaleFactor);
  return parentRadius + satelliteGap;
};

