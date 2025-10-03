import { useState, useEffect } from "react";
import { NotionConfigDialog } from "@/components/NotionConfigDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings, Database, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface NotionConfig {
  notionToken: string;
  databaseId1: string;
  databaseId2: string;
}

const Index = () => {
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<NotionConfig | null>(null);
  const [database1Data, setDatabase1Data] = useState<any>(null);
  const [database2Data, setDatabase2Data] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 檢查是否已有儲存的設定
    const savedConfig = localStorage.getItem("notionConfig");
    if (!savedConfig) {
      setShowConfig(true);
    } else {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const handleConfigSaved = (newConfig: NotionConfig) => {
    setConfig(newConfig);
    setShowConfig(false);
    fetchNotionData(newConfig);
  };

  const fetchNotionData = async (configToUse: NotionConfig = config!) => {
    if (!configToUse) return;

    setLoading(true);
    try {
      // 呼叫第一個資料庫
      const { data: data1, error: error1 } = await supabase.functions.invoke(
        'notion-proxy',
        {
          body: {
            notionToken: configToUse.notionToken,
            databaseId: configToUse.databaseId1,
          },
        }
      );

      if (error1) throw error1;
      setDatabase1Data(data1);

      // 呼叫第二個資料庫
      const { data: data2, error: error2 } = await supabase.functions.invoke(
        'notion-proxy',
        {
          body: {
            notionToken: configToUse.notionToken,
            databaseId: configToUse.databaseId2,
          },
        }
      );

      if (error2) throw error2;
      setDatabase2Data(data2);

      toast.success("資料獲取成功！");
    } catch (error: any) {
      console.error("獲取 Notion 資料時發生錯誤:", error);
      toast.error(error.message || "獲取資料失敗，請檢查您的設定");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <NotionConfigDialog open={showConfig} onConfigSaved={handleConfigSaved} />
      
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Notion 資料整合
            </h1>
            <p className="text-muted-foreground">
              串接並展示您的 Notion 資料庫內容
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowConfig(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => fetchNotionData()}
              disabled={!config || loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              重新整理資料
            </Button>
          </div>
        </div>

        {!config && (
          <Card className="p-8 text-center">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">尚未設定 Notion</h2>
            <p className="text-muted-foreground mb-4">
              請先設定您的 Notion Token 和資料庫 ID
            </p>
            <Button onClick={() => setShowConfig(true)}>開始設定</Button>
          </Card>
        )}

        {config && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5" />
                資料庫 #1
              </h2>
              <div className="bg-card border border-border rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-sm text-foreground">
                  {database1Data
                    ? JSON.stringify(database1Data, null, 2)
                    : "尚未載入資料"}
                </pre>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5" />
                資料庫 #2
              </h2>
              <div className="bg-card border border-border rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-sm text-foreground">
                  {database2Data
                    ? JSON.stringify(database2Data, null, 2)
                    : "尚未載入資料"}
                </pre>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
