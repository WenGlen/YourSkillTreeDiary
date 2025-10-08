// 將 Notion API 回傳的 diary 資料轉換成圖表需要的格式

export const transformDiaryData = (diaryDawData) => {

    // 轉化原本的skillrawData，擷取&創建必要的參數
    const diaryList = {};
    diaryDawData.results.forEach((item) => {
      const props = item.properties;
      const id = item.id;
      const kieStr = props["K-I-E"]?.rich_text?.[0]?.plain_text ?? "0-0-0";
      const [k = 0, i = 0, e = 0] = kieStr.split("-").map((s) => Number(String(s).trim()) || 0);

      diaryList[id] = {
        id,
        slug: props["Diary-slug"]?.unique_id?.number || "",
        title: props["Title"]?.title?.[0]?.plain_text || "未命名",
        content: (props["Content"]?.rich_text ?? []).map((t) => t.plain_text).join("\n"),
        date: props["Created Date"]?.created_time || "",
        state: props["State"]?.status?.name || "",
        kie: { k, i, e },
        linkName: props["Link-Name"]?.rich_text?.[0]?.plain_text || "",
        linkUrl: props["Link-URL"]?.url || "",
        skillsId: (props["Skill"]?.relation ?? []).map((rel) => rel.id),
      };
    });
    return {
        diaryList,
    };
};
