// 將 Notion API 回傳的 skill 資料轉換成圖表需要的格式

export const transformSkillData = (skillRawData) => {

    // 轉化原本的skillRawData，擷取&創建必要的參數
    const skillList = {};
    skillRawData.results.forEach((item) => {
      const props = item.properties;
      const id = item.id;
      const parentId = props?.["Parent-Skill"]?.relation?.[0]?.id || null;

      skillList[id] = {
        slug: props?.["Skill-Slug"]?.unique_id?.number || "",
        name: props?.["Skill-Name"]?.title?.[0]?.plain_text || "未命名",
        description: (props?.["Skill-Description"]?.rich_text?.[0]?.plain_text || "").trim(),
        isMerged: props?.["Merge-State"]?.checkbox || false,
        hexcolor: props?.["Color"]?.rich_text?.[0]?.text?.content || "",
        tier: null,
        locationAngle: null,
        distributionAngle: null,
        satelliteRelativeAngle: null,
        satelliteRadius: 40, // 環繞父技能的半徑（可調整）
        KIE:null,
        id,
        parentId,
        mergedChildren: [],
        children: [],
      };
    });

    // 建立層級關係，逐一檢查技能，把自己放進父技能的子技能欄位中；若無父技能則設定為 rootsTemp 的元素。
    const rootsTemp = [];
    Object.values(skillList).forEach((s) => {
      if (s.parentId && skillList[s.parentId]) {
        if (s.isMerged){ 
            skillList[s.parentId].mergedChildren.push(s); 
        } 
        else { 
            skillList[s.parentId].children.push(s); 
        }
      } else {
        rootsTemp.push(s);
        s.tier = 1; // 根節點 tier 為 1
      }
    });

    // 計算所有節點的 tier - 使用迭代方式確保父節點先被計算
    const calculateAllTiers = () => {
      let hasChanges = true;
      let iterations = 0;
      const maxIterations = 10; // 防止無限循環
      
      while (hasChanges && iterations < maxIterations) {
        hasChanges = false;
        iterations++;
        
        Object.values(skillList).forEach(node => {
          if (node.tier === null && node.parentId && skillList[node.parentId]) {
            const parentTier = skillList[node.parentId].tier;
            if (parentTier !== null) {
              node.tier = parentTier + 1;
              // 如果是 merged 狀態，再減 0.5
              if (node.isMerged) {
                node.tier -= 0.5;
              }
              hasChanges = true;
            }
          }
        });
      }
    };
    calculateAllTiers();

    // 處理 hexcolor 繼承邏輯
    const processHexcolorInheritance = () => {
      // 首先處理根節點 - 如果沒有顏色就給定預設顏色
      rootsTemp.forEach(root => {
        if (!root.hexcolor || root.hexcolor === "") {
          root.hexcolor = "var(--skill-default-color)";
        }
      });

      // 使用迭代方式處理所有節點的顏色繼承
      let hasChanges = true;
      let iterations = 0;
      const maxIterations = 10;
      
      while (hasChanges && iterations < maxIterations) {
        hasChanges = false;
        iterations++;
        
        Object.values(skillList).forEach(node => {
          // 如果節點沒有顏色且有父節點
          if ((!node.hexcolor || node.hexcolor === "") && node.parentId && skillList[node.parentId]) {
            const parentColor = skillList[node.parentId].hexcolor;
            if (parentColor && parentColor !== "") {
              node.hexcolor = parentColor;
              hasChanges = true;
            }
          }
        });
      }
    };
    processHexcolorInheritance();

    // 計算技能的角度位置
    calculateSkillAngles(rootsTemp);

    // 計算整合技能（mergedChildren）的衛星角度
    calculateMergedSkillAngles(skillList);

    return {
        skillList,
        rootsTemp
    };

};

// 計算技能的角度位置函數
export const calculateSkillAngles = (rootsTemp) => {
    if (!rootsTemp || rootsTemp.length === 0) return;

    // 根技能均分 360 度 (2π)
    const totalAngle = 2 * Math.PI;
    const angleStep = totalAngle / rootsTemp.length;
    const startAngle = -Math.PI / 2; // 從正上方開始（-90度）

    rootsTemp.forEach((root, index) => {
        // 計算根技能的角度位置（中心角度），從正上方開始
        root.locationAngle = startAngle + angleStep * index + angleStep / 2;
        // 計算根技能可分配的角度空間
        root.distributionAngle = angleStep;
        
        // 遞歸計算子技能的角度
        calculateChildrenAngles(root);
    });
};

// 遞歸計算子技能的角度
const calculateChildrenAngles = (parent) => {
    if (!parent.children || parent.children.length === 0) return;

    // 子技能均分父技能的角度空間
    const childAngleStep = parent.distributionAngle / parent.children.length;
    
    parent.children.forEach((child, index) => {
        // 計算子技能的角度位置
        child.locationAngle = parent.locationAngle - parent.distributionAngle / 2 + childAngleStep * index + childAngleStep / 2;
        // 計算子技能可分配的角度空間
        child.distributionAngle = childAngleStep;
        
        // 遞歸處理子技能的子技能
        calculateChildrenAngles(child);
    });

    // 處理 merged children
    if (parent.mergedChildren && parent.mergedChildren.length > 0) {
        const mergedAngleStep = parent.distributionAngle / parent.mergedChildren.length;
        
        parent.mergedChildren.forEach((child, index) => {
            child.locationAngle = parent.locationAngle - parent.distributionAngle / 2 + mergedAngleStep * index + mergedAngleStep / 2;
            child.distributionAngle = mergedAngleStep;
            
            // 遞歸處理 merged children 的子技能
            calculateChildrenAngles(child);
        });
    }
};

// 計算整合技能（mergedChildren）的衛星角度
// 統一在正上方 180 度分布，不受父技能位置影響
export const calculateMergedSkillAngles = (skillList) => {
    // 遍歷所有技能，處理每個技能的 mergedChildren
    Object.values(skillList).forEach(skill => {
        if (!skill.mergedChildren || skill.mergedChildren.length === 0) return;
        
        const mergedCount = skill.mergedChildren.length;
        const angleRange = Math.PI; // 180度（正上方範圍）
        const angleStep = angleRange / mergedCount;
        
        // 為每個整合技能分配角度（統一在正上方分布）
        skill.mergedChildren.forEach((merged, index) => {
            // 平分正上方 180 度（從左上 -π/2 到右上 π/2）
            // 相對於父技能的相對角度，統一向上
            merged.satelliteRelativeAngle = -Math.PI / 2 + angleStep * index + angleStep / 2;
        });
    });
};
  

