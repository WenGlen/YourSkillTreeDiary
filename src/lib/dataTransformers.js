// 將 Notion API 回傳的資料轉換成圖表需要的格式

export const transformSkillData = (skillrawData) => {
    // 轉化原本的skillrawData，擷取必要的參數

    const skillList = {};
    skillrawData.results.forEach((item) => {
      const props = item.properties;
      const id = item.id;
      const parentId = props?.["Parent-Skill"]?.relation?.[0]?.id || null;

      skillList[id] = {
        slug: props?.["Skill-Slug"]?.unique_id?.number || "",
        name: props?.["Skill-Name"]?.title?.[0]?.plain_text || "未命名",
        description: (props?.["Skill-Description"]?.rich_text?.[0]?.plain_text || "").trim(),
        isMerged: props?.["Merge-State"]?.checkbox || false,
        hexcolor: props?.["color"]?.rich_text?.[0]?.text?.content || "",
        tier: null,
        id,
        parentId,
        mergedChildren: [],
        children: [],
      };
    });

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

    // 計算所有 tier
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

    // 處理顏色繼承
    processHexcolorInheritance();

    return rootsTemp;

};
  



  /*
  export const transformDiaryData = (diaryrawData) => {
    // 轉換邏輯
  };
  */