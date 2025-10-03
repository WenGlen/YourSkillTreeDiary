/**
 * Notion API Proxy Edge Function
 * 
 * 這個 Edge Function 作為 Notion API 的代理伺服器
 * 因為 Notion API 不允許直接從瀏覽器呼叫（CORS 限制）
 * 所以我們需要透過後端來轉發請求
 * 
 * 使用方式：
 * 1. 不需要手動部署，Lovable 會自動部署這個 function
 * 2. 前端呼叫這個 function 時，會自動使用正確的 URL
 * 3. 這個 function 是公開的，不需要身份驗證
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 處理 CORS preflight 請求
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { notionToken, databaseId } = await req.json();

    console.log('開始呼叫 Notion API，資料庫 ID:', databaseId);

    // 呼叫 Notion API 來查詢資料庫
    const notionResponse = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      console.error('Notion API 錯誤:', errorText);
      throw new Error(`Notion API 返回錯誤: ${notionResponse.status} - ${errorText}`);
    }

    const data = await notionResponse.json();
    console.log('成功獲取資料，項目數量:', data.results?.length || 0);

    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Edge Function 錯誤:', error);
    const errorMessage = error instanceof Error ? error.message : '發生未知錯誤';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: '請確認您的 Notion Token 和資料庫 ID 是否正確' 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
})
