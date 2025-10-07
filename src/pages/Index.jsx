import { useState, useEffect } from "react";
import { NotionConfigDialog } from "@/components/NotionConfigDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings, Database, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { fetchNotionData, loadNotionConfig } from "@/services/notionService";
// 在 Index.jsx 頂部引入
import { transformSkillData } from '@/lib/dataTransformers';
//import { SkillTreeChart, SkillProgressChart, DiaryTimelineChart } from '@/components/charts';



const Index = () => {
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState(null);
  const [skillOriginalData, setSkillOriginalData] = useState(null);
  const [diaryOriginalData, setDiaryOriginalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [skillList, setSkillData] = useState(null);




  // 檢查Config是否已有儲存的設定 //
  useEffect(() => { 
    
    const savedConfig = loadNotionConfig();
    if (!savedConfig) {
      setShowConfig(true);
    } else {
      setConfig(savedConfig);
    }
  }, []);

  // 儲存Config設定、根據設定抓取資料 //
  
  const handleConfigSaved = (newConfig) => {
    setConfig(newConfig);
    setShowConfig(false);
    handleFetchData(newConfig);
  };

  const handleFetchData = async (configToUse = config) => {
    if (!configToUse) return;
    setLoading(true);
    try {
      const { skillOriginalData, diaryOriginalData} = await fetchNotionData(configToUse);
      setSkillOriginalData(skillOriginalData);
      setDiaryOriginalData(diaryOriginalData);
      toast.success("資料獲取成功！");
    } catch (error) {
      toast.error(error.message || "獲取資料失敗，請檢查您的設定");
    } finally {
      setLoading(false);
    }
  };
  
  // 轉換資料格式 //
  useEffect(() => {
    if (!skillOriginalData) return; // 還沒拿到資料就不做事
    const transformed = transformSkillData(skillOriginalData);
    setSkillData(transformed);
  }, [skillOriginalData]);
  
  
  /* ====== 輸入API的介面 ====== */


  return (
    <div id="container" className="w-full h-screen bg-background p-6 ">
      <NotionConfigDialog open={showConfig} onOpenChange={setShowConfig} onConfigSaved={handleConfigSaved} />
      <div id="panel" 
           className="relative w-full h-full gap-6 flex 
                      flex-col 
                      md:flex-row ">

        {/*  */}
        <div id="skill-tree-panel" 
             className="h-full bg-panel
                        w-full 
                        md:min-w-[50vw]">
        
        </div>

        <div id="content-panel" 
             className="gap-6 flex flex-col 
                        w-full h-auto
                        md:w-[clamp(375px,40vw,480px)] md:h-full">
          <div id="skill-description-panel" 
               className="w-full bg-panel
                          h-auto
                          md:h-[400px]">

          </div>
          <div id="diary-panel"
               className="bg-panel
                          h-auto
                          md:flex-1">

          </div>

          <div id="config-bar" 
               className="flex items-center justify-between
                          absolute top-0 right-0
                          md:static md:w-full md:h-12 md:pl-4 md:pr-2 md:bg-panel">
            <p className="text-subtle-foreground 
                          hidden 
                          md:block">
              v2-0.2
            </p>         
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="icon"
                onClick={() => setShowConfig(true)}
              >
                <Settings className=""/>
              </Button>

              <Button
                onClick={() => handleFetchData()}
                disabled={!config || loading}
                variant="outline"
                size="icon"
              >
                {loading ? (<RefreshCw className="text-foreground animate-spin"/>) : (<RefreshCw className="" />)}
              </Button>
            </div>
          </div>

        </div>

        {/* 測試區 */}
        <div id="tester" 
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                         w-[90vw] h-[90vh] bg-gray-700 z-50">
          <div className="h-full flex gap-6">

          <Card className="h-full w-1/2 p-12">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5" />
                skill raw data 
              </h2>
              <div className="bg-card border border-border rounded-lg p-2 overflow-auto max-h-full">
                <pre className="text-sm text-foreground">
                  {skillOriginalData
                    ? JSON.stringify(skillOriginalData, null, 2)
                    : "尚未載入資料"}
                </pre>
              </div>
            </Card>

            <Card className="h-full w-1/2 p-12">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5" />
                轉換後資料
              </h2>
              <div className="bg-card border border-border rounded-lg p-2 overflow-auto max-h-full">
                <pre className="text-sm text-foreground">
                  {/*
                  {diaryOriginalData
                    ? JSON.stringify(diaryOriginalData, null, 2)
                    : "尚未載入資料"}
                  */}
                  {!skillList ? (
                    <p>Loading...</p>
                  ) : (
                    <pre>{JSON.stringify(skillList, null, 2)}</pre>
                  )}
                </pre>
              </div>
            </Card>

          </div>
        </div>
      </div>



    </div>
  );
};

export default Index;
