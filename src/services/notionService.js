import { supabase } from "@/integrations/supabase/client";

/**
 * 獲取 Notion 資料庫資料的服務
 * @param {Object} config - Notion 設定物件
 * @param {string} config.notionToken - Notion API Token
 * @param {string} config.databaseIdSkill - 技能資料庫 ID
 * @param {string} config.databaseIdDiary - 日記資料庫 ID
 * @returns {Promise<{skillRawData: any, diaryRawData: any}>} 回傳技能和日記資料
 */
export const fetchNotionData = async (config) => {
  if (!config) {
    throw new Error("設定物件不能為空");
  }

  try {
    // 呼叫 Skill 資料庫
    const skillDatabaseId = config.databaseIdSkill || config.databaseId1;
    const { data: skillOriginalData, error: skillError } = await supabase.functions.invoke(
      'notion-proxy',
      {
        body: {
          notionToken: config.notionToken,
          databaseId: skillDatabaseId,
        },
      }
    );

    if (skillError) throw skillError;

    // 呼叫 Diary 資料庫
    const diaryDatabaseId = config.databaseIdDiary || config.databaseId2;
    const { data: diaryOriginalData, error: diaryError } = await supabase.functions.invoke(
      'notion-proxy',
      {
        body: {
          notionToken: config.notionToken,
          databaseId: diaryDatabaseId,
        },
      }
    );

    if (diaryError) throw diaryError;

    return {
      skillRawData: skillOriginalData,
      diaryRawData: diaryOriginalData
    };
  } catch (error) {
    console.error("獲取 Notion 資料時發生錯誤:", error);
    throw new Error(error.message || "獲取資料失敗，請檢查您的設定");
  }
};

/**
 * 從 localStorage 載入儲存的 Notion 設定
 * @returns {Object|null} 回傳解析後的設定物件，如果沒有則回傳 null
 */
export const loadNotionConfig = () => {
  const savedConfig = localStorage.getItem("notionConfig");
  if (!savedConfig) {
    return null;
  }
  
  const parsed = JSON.parse(savedConfig);
  // 向後相容舊版 key：databaseId1/databaseId2
  return {
    ...parsed,
    databaseIdSkill: parsed.databaseIdSkill || parsed.databaseId1,
    databaseIdDiary: parsed.databaseIdDiary || parsed.databaseId2,
  };
};

/**
 * 儲存 Notion 設定到 localStorage
 * @param {Object} config - 要儲存的設定物件
 */
export const saveNotionConfig = (config) => {
  localStorage.setItem("notionConfig", JSON.stringify(config));
};
