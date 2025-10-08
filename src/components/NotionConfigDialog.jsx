import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function NotionConfigDialog({ open, onOpenChange, onConfigSaved }) {
  const [notionToken, setNotionToken] = useState("");
  const [databaseIdSkill, setDatabaseIdSkill] = useState("");
  const [databaseIdDiary, setDatabaseIdDiary] = useState("");

  useEffect(() => {
    // 從 localStorage 讀取已儲存的設定
    const savedConfig = localStorage.getItem("notionConfig");
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setNotionToken(config.notionToken || "");
      setDatabaseIdSkill(config.databaseIdSkill || config.databaseId1 || "");
      setDatabaseIdDiary(config.databaseIdDiary || config.databaseId2 || "");
    }
  }, [open]);

  const handleSave = () => {
    if (!notionToken || !databaseIdSkill || !databaseIdDiary) {
      toast.error("請填寫所有欄位");
      return;
    }

    const config = { notionToken, databaseIdSkill, databaseIdDiary };
    // 儲存到 localStorage
    localStorage.setItem("notionConfig", JSON.stringify(config));
    toast.success("設定已儲存！");
    onConfigSaved(config);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">

        <DialogHeader>
          <DialogTitle>Notion API 設定</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            請輸入您的 Notion Integration Token 和資料庫 ID。
            <br />本網頁會自動記錄你的 API 設定。
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-8">
          <div className="space-y-4">
            <Label htmlFor="token">Notion Token</Label>
            <Input
              id="token"
              placeholder="ntn_xxxxxxxxxxxxx"
              value={notionToken}
              onChange={(e) => setNotionToken(e.target.value)}
              type="password"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              如何取得 token：<br />
              請先到 <a href="https://www.notion.so/profile/integrations" target="_blank">integrations</a> 上建立專屬的 API，並在 Notion 頁面中完成連結。
              <br />詳細教學可參考 <a href="https://glenwen.notion.site/27faa54a35aa80b7b82ec418a55648fd?source=copy_link" target="_blank">模板</a> 下方的說明。
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-4">
              <Label htmlFor="db-skill">Skill 資料庫 ID</Label>
              <Input
                id="db-skill"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={databaseIdSkill}
                onChange={(e) => setDatabaseIdSkill(e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <Label htmlFor="db-diary">Diary 資料庫 ID</Label>
              <Input
                id="db-diary"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={databaseIdDiary}
                onChange={(e) => setDatabaseIdDiary(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              如何取得資料庫 ID：
              <br />開啟 Notion 資料庫頁面，URL 中的 32 位英數字元即為資料庫 ID。
              <br />例如：notion.so/使用者帳號/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=oooooo
              <br />其中的 32 位 xxx 即為 ID 。
            </p>
          </div>
        </div>

        <Button onClick={handleSave} className="mt-8 w-full ">
          儲存設定
        </Button>

      </DialogContent>
    </Dialog>
  );
}
