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

interface NotionConfig {
  notionToken: string;
  databaseId1: string;
  databaseId2: string;
}

interface NotionConfigDialogProps {
  open: boolean;
  onConfigSaved: (config: NotionConfig) => void;
}

export function NotionConfigDialog({ open, onConfigSaved }: NotionConfigDialogProps) {
  const [notionToken, setNotionToken] = useState("");
  const [databaseId1, setDatabaseId1] = useState("");
  const [databaseId2, setDatabaseId2] = useState("");

  useEffect(() => {
    // 從 localStorage 讀取已儲存的設定
    const savedConfig = localStorage.getItem("notionConfig");
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setNotionToken(config.notionToken || "");
      setDatabaseId1(config.databaseId1 || "");
      setDatabaseId2(config.databaseId2 || "");
    }
  }, [open]);

  const handleSave = () => {
    if (!notionToken || !databaseId1 || !databaseId2) {
      toast.error("請填寫所有欄位");
      return;
    }

    const config = { notionToken, databaseId1, databaseId2 };
    // 儲存到 localStorage
    localStorage.setItem("notionConfig", JSON.stringify(config));
    toast.success("設定已儲存！");
    onConfigSaved(config);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notion API 設定</DialogTitle>
          <DialogDescription>
            請輸入您的 Notion Integration Token 和資料庫 ID
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="token">Notion Token</Label>
            <Input
              id="token"
              placeholder="secret_xxxxxxxxxxxxx"
              value={notionToken}
              onChange={(e) => setNotionToken(e.target.value)}
              type="password"
            />
            <p className="text-xs text-muted-foreground">
              如何取得：在 Notion → Settings & Members → Integrations → Create new integration
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="db1">資料庫 ID #1</Label>
            <Input
              id="db1"
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={databaseId1}
              onChange={(e) => setDatabaseId1(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="db2">資料庫 ID #2</Label>
            <Input
              id="db2"
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={databaseId2}
              onChange={(e) => setDatabaseId2(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              如何取得資料庫 ID：開啟 Notion 資料庫頁面，URL 中的 32 位英數字元即為資料庫 ID
            </p>
          </div>
        </div>
        <Button onClick={handleSave} className="w-full">
          儲存設定
        </Button>
      </DialogContent>
    </Dialog>
  );
}
