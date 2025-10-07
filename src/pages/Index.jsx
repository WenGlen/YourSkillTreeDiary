import { useState, useEffect, useMemo } from "react";
import { NotionConfigDialog } from "@/components/NotionConfigDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings, Database, RefreshCw, ChevronDown, ChevronRight, ExternalLink, Calendar } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchNotionData, loadNotionConfig } from "@/services/notionService";
// 在 Index.jsx 頂部引入
import { transformSkillData } from '@/lib/skillDataTransformers.js';
import { transformDiaryData } from '@/lib/diaryDataTransformers.js';
import { calculateAllSkillsKIE } from '@/lib/kieCalculator.js';
import { 
  getGlowConfig, 
  getStrokeColor, 
  getFillColor, 
  getFillOpacity,
  getStrokeWidth,
  renderGlowFilters,
  renderHaloGradients,
  renderHaloCircles,
  getTextStyle,
  truncateText,
  getNodeRadius,
  getSatelliteDistance
} from '@/lib/chartUtils.jsx';
import { getLevelLabel, getLevelDescription } from '@/lib/describeUtils.jsx';
//import { SkillTreeChart, SkillProgressChart, DiaryTimelineChart } from '@/components/charts';

const Index = () => {
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  const [skillRawData, setSkillRawData] = useState(null);
  const [diaryRawData, setDiaryRawData] = useState(null);

  const [skillList, setSkillList] = useState(null);
  const [rootsTemp, setRootsTemp] = useState(null);
  const [diaryList, setDiaryList] = useState(null);

  const [showSatelliteLabels, setShowSatelliteLabels] = useState(false); // 控制衛星技能文字顯示
  const [activeSkill, setActiveSkill] = useState(null);
  const [expandedDiaryId, setExpandedDiaryId] = useState(null); // 控制展開的日記

  // 檢查 Config 是否已有儲存的設定 //
  useEffect(() => { 
    
    const savedConfig = loadNotionConfig();
    if (!savedConfig) {
      setShowConfig(true);
    } else {
      setConfig(savedConfig);
    }
  }, []);

  // 儲存 Config 設定、根據設定抓取資料 //
  const handleConfigSaved = (newConfig) => {
    setConfig(newConfig);
    setShowConfig(false);
    handleFetchData(newConfig);
  };
  const handleFetchData = async (configToUse = config) => {
    if (!configToUse) return;
    setLoading(true);
    try {
      const { skillRawData, diaryRawData} = await fetchNotionData(configToUse);
      setSkillRawData(skillRawData);
      setDiaryRawData(diaryRawData);
      toast.success("資料獲取成功！");
    } catch (error) {
      toast.error(error.message || "獲取資料失敗，請檢查您的設定");
    } finally {
      setLoading(false);
    }
  };
  
  // 轉換 skill 的資料格式 //
  useEffect(() => {
    if (!skillRawData) return; // 還沒拿到資料就不做事
    const skillTransformed = transformSkillData(skillRawData);
    setSkillList(skillTransformed.skillList);
    setRootsTemp(skillTransformed.rootsTemp);
  }, [skillRawData]);

  // 轉換 diary 的資料格式 //
  useEffect(() => {
    if (!diaryRawData) return; // 還沒拿到資料就不做事
    const diaryTransformed = transformDiaryData(diaryRawData);
    setDiaryList(diaryTransformed.diaryList);
  }, [diaryRawData]);


  
  // 技能樹配置參數
  const skillTreeConfig = {
    centerX: 500,
    centerY: 500,
    radiusStep: 120,
    maxLevels: 4,
    satelliteNodeRadius: 4,  // 衛星節點的半徑（比普通節點小）
    // 節點半徑計算參數
    nodeBaseRadius: 2,      // 基礎半徑
    nodeScaleFactor: 1,     // KIE 比例常數
    satelliteGap: 8         // 衛星技能與父技能邊緣的間距
  };

  // 計算所有技能節點的笛卡爾座標和 KIE 值
  const skillNodes = useMemo(() => {
    if (!rootsTemp) return [];
    
    const nodes = [];
    const { centerX, centerY, radiusStep, nodeBaseRadius, nodeScaleFactor, satelliteGap } = skillTreeConfig;
    
    // 遞歸收集所有節點
    const collectNodes = (skills, level) => {
      skills.forEach(skill => {
        // 計算笛卡爾座標
      const radius = level * radiusStep;
        const x = centerX + Math.cos(skill.locationAngle) * radius;
        const y = centerY + Math.sin(skill.locationAngle) * radius;

      nodes.push({
        ...skill,
        level,
        x,
        y,
          radius,
          isMainNode: true
        });
        
        // 處理整合技能（mergedChildren）- 圍繞父技能
        // 先暫存整合技能資訊，稍後根據父技能半徑計算位置
        if (skill.mergedChildren && skill.mergedChildren.length > 0) {
          skill.mergedChildren.forEach(merged => {
            nodes.push({
              ...merged,
              level: level + 0.5, // 整合技能有特殊的層級
              x: 0, // 暫時設為 0，稍後更新
              y: 0, // 暫時設為 0，稍後更新
              radius: 0,
              isMainNode: false,
              parentSkillId: skill.id, // 記錄父技能ID
              parentX: x,
              parentY: y,
              satelliteRelativeAngle: merged.satelliteRelativeAngle
            });
          });
        }
        
        // 遞歸處理子節點
        if (skill.children && skill.children.length > 0) {
          collectNodes(skill.children, level + 1);
        }
      });
    };
    
    collectNodes(rootsTemp, 1);
    
    // 計算所有技能的 KIE 值
    if (skillList && diaryList) {
      const kieMap = calculateAllSkillsKIE(skillList, diaryList);
      // 將 KIE 值添加到每個節點
      nodes.forEach(node => {
        node.KIE = kieMap[node.id] || { k: 0, i: 0, e: 0 };
      });
    }
    
    // 現在根據父技能的半徑更新整合技能的位置
    nodes.forEach(node => {
      if (node.isMerged && node.parentSkillId) {
        // 找到父技能節點
        const parentNode = nodes.find(n => n.id === node.parentSkillId && n.isMainNode);
        if (parentNode) {
          // 使用 chartUtils 計算衛星距離
          const satelliteDistance = getSatelliteDistance(
            parentNode, 
            nodeBaseRadius, 
            nodeScaleFactor, 
            satelliteGap
          );
          
          // 計算整合技能的絕對角度（統一在正上方 180 度分布）
          const absoluteAngle = -Math.PI / 2 + node.satelliteRelativeAngle;
          
          // 更新整合技能的座標
          node.x = node.parentX + Math.cos(absoluteAngle) * satelliteDistance;
          node.y = node.parentY + Math.sin(absoluteAngle) * satelliteDistance;
          node.radius = satelliteDistance;
          node.parentNode = parentNode;
        }
      }
    });
    
    return nodes;
  }, [rootsTemp, skillList, diaryList]);
 
  // 處理點擊背景（空白處）關閉視窗
  const handleBackgroundClick = (e) => {
    if (e.target.tagName === "svg") {
      setActiveSkill(null);
    }
  };

  /* ====== 技能樹的介面 ====== */

  return (
    <div id="container" className="w-full h-screen bg-background p-6 ">
      <NotionConfigDialog open={showConfig} onOpenChange={setShowConfig} onConfigSaved={handleConfigSaved} />
      <div id="panel" 
           className="relative w-full h-full gap-6 flex 
                      flex-col 
                      md:flex-row ">

        {/* 左側 技能樹面板 */}
        <div id="skill-tree-panel" 
             className="relative h-full rounded-md bg-panel flex justify-center items-center
                        w-full 
                        md:min-w-[50vw]">
          <div id="skill-tree-header" 
               className="absolute top-0 left-0 py-4 px-8 rounded-br-md bg-background flex items-center gap-4">
            <h2 className="text-3xl font-semibold">
              Skill Tree
            </h2>

          </div>

          <div id="skill-tree-footer" 
              className="absolute bottom-0 right-0 
                         flex flex-col items-end justify-center">
                {/* 整合技能顯示開關 
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSatelliteLabels(!showSatelliteLabels)}
              className="text-xs my-0 py-0"
            >
              {showSatelliteLabels ? "隱藏" : "顯示"} 整合技能
            </Button>*/}
              {/* KIE 值顯示 */}
              <div className="py-2 px-4 bg-background rounded-tl-md">
                {skillNodes.length > 0 && (() => {
                  const totalKIE = skillNodes
                    .filter(n => n.level === 1) // 只計算根節點，避免重複計算
                    .reduce((acc, node) => ({
                      k: acc.k + (node.KIE?.k || 0),
                      i: acc.i + (node.KIE?.i || 0),
                      e: acc.e + (node.KIE?.e || 0)
                    }), { k: 0, i: 0, e: 0 });
                  return (
                    <div className="gap-3 text-sm flex ">
                      <span className="text-cyan-800">K: {totalKIE.k}</span>
                      <span className="text-fuchsia-800">I: {totalKIE.i}</span>
                      <span className="text-yellow-800">E: {totalKIE.e}</span>
                      <span className="text-subtle-foreground">
                           total: {totalKIE.k + totalKIE.i + totalKIE.e}
                      </span>
                    </div>
                  );
                })()}
              </div>
              {/* 技能數量顯示 */}
              <div className="py-2 px-4 bg-background rounded-tl-md text-sm text-gray-600 ">
                Total Skill: {skillNodes.length}  | 
                Domain: {skillNodes.filter(n => n.level === 1).length} |
                Merged: {skillNodes.filter(n => n.isMerged).length} |
                Max Tier: {Math.max(...skillNodes.map(n => n.level))}
              </div>

          </div>

          <div id="skill-tree-svg" 
               className="overflow-auto max-h-full w-full h-full rounded-md">
                 {skillNodes.length > 0 ? (
                      <svg viewBox="0 0 1000 1000" 
                           className="w-full h-full bg-panel "
                           onClick={handleBackgroundClick}>
                        {/* 定義發光濾鏡 */}
                        <defs>
                          {renderGlowFilters()}
                        </defs>
                        
                        {/* 繪製同心圓網格 */}
                        <g stroke="#36434a" strokeWidth="1" fill="none">
                         {Array.from({ length: skillTreeConfig.maxLevels }, (_, i) => {
                           const level = i + 1;
                           const radius = level * skillTreeConfig.radiusStep;
                           const labelY = skillTreeConfig.centerY + radius;
                           
                           return (
                             <g key={i}>
                               {/* 圓圈 */}
                               <circle 
                                 cx={skillTreeConfig.centerX} 
                                 cy={skillTreeConfig.centerY} 
                                 r={radius} 
                               />
                               {/* 層級標籤 */}
                               <g>
                                 {/* 文字背景 */}
                                 <rect
                                   x={skillTreeConfig.centerX - 35}
                                   y={labelY - 10}
                                   width={70}
                                   height={20}
                                   fill="var(--panel)"
                                   opacity="0.9"
                                   rx="4"
                                 />
                                 {/* 層級標籤文字 */}
                                 <text
                                   x={skillTreeConfig.centerX}
                                   y={labelY + 4}
                                   textAnchor="middle"
                                   fontSize="11"
                                   fill="#888888"
                                   className="select-none"
                                   fontWeight="600"
                                 >
                                   {getLevelLabel(level)}
                                 </text>
                               </g>
                             </g>
                           );
                         })}
                       </g>
                       
                        {/* 第 1 層：繪製連接線（最底層） */}
                        <g stroke="#666666" strokeWidth="2" fill="none" filter="url(#glowLine)">
                          {skillNodes.map(node => {
                            // 跳過根節點和整合技能
                            if (node.level === 1 || node.isMerged) return null;
                            
                            // 處理普通技能的連接
                            const parent = skillNodes.find(n => 
                              n.isMainNode &&
                              ((n.children && n.children.some(child => child.id === node.id)) ||
                               (n.mergedChildren && n.mergedChildren.some(child => child.id === node.id)))
                            );
                            
                            if (parent) {
                              return (
                                <line
                                  key={`line-${node.id}`}
                                  x1={parent.x}
                                  y1={parent.y}
                                  x2={node.x}
                                  y2={node.y}
                                  opacity="0.8"
                                />
                              );
                            }
                            
                            return null;
                          })}
                        </g>
                       
                        {/* 第 2 層：繪製技能名稱背景和文字（中間層） */}
                        <g>
                          {skillNodes.map(node => {
                            const textStyle = getTextStyle(node, showSatelliteLabels);
                            
                            // 只渲染需要顯示的文字
                            if (!textStyle.show) return null;
                            
                            return (
                              <g key={`text-${node.id}`}>
                                {/* 文字背景色塊 */}
                                <rect
                                  x={node.x - (node.isMerged ? 20 : 30)}
                                  y={textStyle.y - (node.isMerged ? 8 : 10)}
                                  width={node.isMerged ? 40 : 60}
                                  height={node.isMerged ? 12 : 14}
                                  fill="var(--panel)"
                                  opacity="0.9"
                                  rx="4"
                                />
                                {/* 文字 */}
                                <text
                                  x={node.x}
                                  y={textStyle.y}
                                  textAnchor="middle"
                                  fontSize={textStyle.fontSize}
                                  fill={textStyle.fill}
                                  className="select-none"
                                  backgroundColor="var(--panel)"
                                >
                                  {truncateText(node.name, textStyle.maxLength)}
                                </text>
                              </g>
                            );
                          })}
                        </g>
                       
                        {/* 第 3 層：繪製技能節點（最上層） */}
                        {skillNodes.map(node => {
                          const strokeColor = getStrokeColor(node);
                          const fillColor = getFillColor(node);
                          const fillOpacity = getFillOpacity(node);
                          const nodeRadius = getNodeRadius(node, skillTreeConfig.nodeBaseRadius, skillTreeConfig.nodeScaleFactor);
                          const glowConfig = getGlowConfig(node, nodeRadius, strokeColor);
                          
                          return (
                          <g key={node.id}>
                            {/* 光暈漸變定義 */}
                            {renderHaloGradients(node, glowConfig)}
                            
                            {/* 繪製光暈圓圈 */}
                            {renderHaloCircles(node, glowConfig)}
                            
                            {/* 技能節點圓圈 */}
                            <circle
                              cx={node.x}
                              cy={node.y}
                              r={nodeRadius}
                              fill={fillColor}
                              fillOpacity={fillOpacity}
                              stroke={strokeColor}
                              strokeWidth={activeSkill?.id === node.id ? 4 : 1}
                              filter={glowConfig.filter}
                              onClick={() => setActiveSkill(node)}
                              style={{ cursor: 'pointer' }}
                            />
                         </g>
                          );
                        })}
                       

                     </svg>
                  
                 ) : (
                   <div //等待技能資料載入...
                        className="flex items-center justify-center h-full text-gray-500">
                     等待技能資料載入...
                   </div>
                 )}
             </div>


        </div>

        {/* 右側 資訊面板 */}
        <div id="content-panel" 
             className="gap-6 flex flex-col 
                        md:w-[clamp(375px,40vw,480px)] md:h-full">
          {/* 右上 技能說明欄 */}
          <div id="skill-description-panel" 
               className="w-full bg-panel p-6 rounded-md overflow-auto
                          h-[320px] min-h-[320px]">

            {activeSkill ? (
              <div className="gap-8">
                <div className="space-y-4">
                  {/* 標題區域 */}
                  <div className="h-12 flex justify-between items-center">

                    {activeSkill.isMerged || activeSkill.parentNode ? (
                      <div className="">
                        <div className="text-xs text-muted-foreground">
                          {activeSkill.parentNode?.name || (skillList && skillList[activeSkill.parentId]?.name) || "父技能"}
                        </div>
                        <h3 className="text-xl font-bold text-foreground">↳ {activeSkill.name}</h3>
                      </div>
                    ) : (
                      <h3 className="text-2xl font-bold text-foreground">{activeSkill.name}</h3>
                    )}

                    <div className="flex flex-col justify-between">
                      {/* 技能層級資訊 */}
                      <div className="text-sm text-right text-muted-foreground">
                        {getLevelDescription(activeSkill.level)} {activeSkill.isMerged ? "- Merged" : ""}
                      </div>
                    
                      {/* KIE 值顯示 */}
                      {activeSkill.KIE && (
                        <div className="flex gap-4 text-sm font-semibold">
                          <span className="text-cyan-600">K: {activeSkill.KIE.k}</span>
                          <span className="text-fuchsia-600">I: {activeSkill.KIE.i}</span>
                          <span className="text-yellow-600">E: {activeSkill.KIE.e}</span>
                        </div>
                      )}
                    </div>

                  </div>
                  
                  {/* 技能描述 */}
                  
                    <p className="text-sm text-muted-foreground">
                      {activeSkill.description || "尚無描述"}
                    </p>
                  

                  {/* 整合技能列表 */}
                  {activeSkill.mergedChildren && activeSkill.mergedChildren.length > 0 && (
                    <div>
                      <h4 className="mt-6 mb-2 text-sm font-semibold text-foreground ">
                        整合技能 ({activeSkill.mergedChildren.length})
                      </h4>
                      <ul className="space-y-1">
                        {activeSkill.mergedChildren.map((child) => {
                          const fullNode = skillNodes.find(n => n.id === child.id);
                          const childKIE = fullNode?.KIE;
                          return (
                            <li
                              key={child.id}
                              className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1 rounded hover:bg-accent"
                              onClick={() => {
                                if (fullNode) setActiveSkill(fullNode);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span>• {child.name}</span>
                                {childKIE && (
                                  <span className="text-xs flex gap-2">
                                    <span className="text-cyan-400">K:{childKIE.k}</span>
                                    <span className="text-fuchsia-500">I:{childKIE.i}</span>
                                    <span className="text-yellow-400">E:{childKIE.e}</span>
                                  </span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* 子技能列表 - 只在達到最大層級時顯示 */}
                  {activeSkill.children && activeSkill.children.length > 0 && activeSkill.level >= skillTreeConfig.maxLevels && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">
                        子技能 ({activeSkill.children.length})
                      </h4>
                      <ul className="space-y-2">
                        {activeSkill.children.map((child) => {
                          const fullNode = skillNodes.find(n => n.id === child.id);
                          const childKIE = fullNode?.KIE;
                          return (
                            <li
                              key={child.id}
                              className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-2 rounded hover:bg-accent"
                              onClick={() => {
                                if (fullNode) setActiveSkill(fullNode);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span>• {child.name}</span>
                                {childKIE && (
                                  <span className="text-xs flex gap-2">
                                    <span className="text-cyan-400">K:{childKIE.k}</span>
                                    <span className="text-fuchsia-500">I:{childKIE.i}</span>
                                    <span className="text-yellow-400">E:{childKIE.e}</span>
                                  </span>
                                )}
                              </div>
                              {child.description && (
                                <span className="text-xs block ml-4 mt-1 text-muted-foreground/70">
                                  {child.description}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm">
                  點擊左側技能節點以查看詳細資訊
                </p>
              </div>
            )}
          
          </div>

          {/* 右中 日記欄 */}
          <div id="diary-panel" 
               className="rounded-md w-full flex flex-col overflow-auto 
                          flex-1">
            <div className="p-4 bg-panel">
              <h2 className="text-xl font-semibold">
                {activeSkill ? `${activeSkill.name} 的相關日記` : '日記列表'}
              </h2>
            </div>
            <div id="diary-list" 
                className="p-4 rounded-md bg-panel overflow-auto 
                            h-auto w-full
                            md:flex-1">

              
              {!activeSkill ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  請點擊左側技能節點以查看相關日記
                </div>
              ) : diaryList && Object.keys(diaryList).length > 0 ? (
                (() => {
                  // 過濾日記：只顯示狀態為 "done" 且與當前技能相關的日記
                  const filteredDiaries = Object.values(diaryList)
                    .filter(diary => {
                      // 只顯示狀態為 "done" 的日記（排除 "Writing" 和 "hide"）
                      const isDone = diary.state?.toLowerCase() === 'done';
                      // 檢查日記是否關聯到當前技能
                      const isRelated = diary.skillsId && diary.skillsId.includes(activeSkill.id);
                      return isDone && isRelated;
                    })
                    .sort((a, b) => new Date(b.date) - new Date(a.date)); // 按日期降序排序
                  
                  if (filteredDiaries.length === 0) {
                    return (
                      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                        該技能尚無已完成的日記
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-2">
                      {filteredDiaries.map((diary) => {
                        const isExpanded = expandedDiaryId === diary.id;
                        
                        return (
                          <Card key={diary.id} className="overflow-hidden">
                            {/* 日記標題列 */}
                            <div
                              className="p-3 cursor-pointer hover:bg-accent transition-colors"
                              onClick={() => setExpandedDiaryId(isExpanded ? null : diary.id)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  {/* 展開/收起圖標 */}
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 mt-2 flex-shrink-0 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 mt-2 flex-shrink-0 text-muted-foreground" />
                                  )}
                                  
                                  {/* 標題 */}
                                  <div className="mt-1 gap-2 flex-1 min-w-0 flex justify-between">
                                    <div>
                                    <h3 className="font-medium text-md whitespace-normal">{diary.title}</h3>
                                    {/* 連結 */}
                                    {diary.linkUrl && (
                                      <div className="mt-2 flex items-center gap-1">
                                        <a
                                          href={diary.linkUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 hover:underline"
                                          onClick={(e) => e.stopPropagation()} // 防止觸發展開
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          {diary.linkName || diary.linkUrl}
                                        </a>
                                      </div>
                                    )}
                                    </div>
                                    <div className=" flex flex-col justify-center">
                                      {/* 日期 */}
                                      <div className="flex items-center gap-1  text-xs text-muted-foreground">
                                        <Calendar className="w-3 h-3" />
                                        <span>{new Date(diary.date).toLocaleDateString('zh-TW')}</span>
                                      </div>
                                      {/* KIE 值 */}
                                      <div className="flex gap-2 text-xs font-medium flex-shrink-0">
                                        <span className="text-cyan-600">K:{diary.kie.k}</span>
                                        <span className="text-fuchsia-600">I:{diary.kie.i}</span>
                                        <span className="text-yellow-600">E:{diary.kie.e}</span>
                                      </div>
                                    </div>

                                  </div>
                                </div>
                              </div>
                              

                            </div>
                            
                            {/* 展開的內容 */}
                            {isExpanded && diary.content && (
                              <div className="border-t border-border p-4 bg-card animate-accordion-down">
                                <div className="prose prose-sm max-w-none dark:prose-invert
                                              prose-headings:text-foreground 
                                              prose-p:text-foreground 
                                              prose-strong:text-foreground
                                              prose-code:text-foreground
                                              prose-pre:bg-muted
                                              prose-a:text-blue-500 hover:prose-a:text-blue-700
                                              prose-li:text-foreground">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {diary.content}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  尚無日記資料
                </div>
              )}
            </div>
          </div>
          {/* 右下 設定欄 */}
          <div id="config-bar" 
               className="flex items-center justify-between
                          absolute top-0 right-0
                          md:static md:w-full md:h-12 md:pl-4 md:pr-2 md:bg-panel">
            <p className="text-subtle-foreground 
                          hidden 
                          md:block">
              v1-3.0
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
             className="hidden  absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                         w-[90vw] h-[90vh] bg-gray-700 z-50">
          <div className="h-full flex gap-6">

          <Card id="skillRawData" className="hidden h-full w-1/2 p-12">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                skill raw data 
              </h2>
              <div className="bg-card border border-border rounded-lg p-2 overflow-auto max-h-full">
                <pre className="text-sm text-foreground">
                  {skillRawData
                    ? JSON.stringify(skillRawData, null, 2)
                    : "尚未載入資料"}
                </pre>
              </div>
            </Card>

          <Card id="skillList" className="hidden h-full w-1/2 p-12">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              Skill List
              </h2>
              <div className="bg-card border border-border rounded-lg p-2 overflow-auto max-h-full">
                <pre className="text-sm text-foreground">
                  {!skillList ? (
                    <p>Loading...</p>
                  ) : (
                  <div>
                    <pre className="text-xs">{JSON.stringify(skillList, null, 2)}</pre>
                  </div>
                  )}
                </pre>
              </div>
            </Card>
            
          <Card id="rootsTemp" className="hidden h-full w-1/2 p-12">
            <h2 className="text-xl font-semibold mb-4">
              Roots Temp
            </h2>
            <div className="bg-card border border-border rounded-lg p-2 overflow-auto max-h-full">
              <pre className="text-sm text-foreground">
                {!rootsTemp ? (
                  <p>Loading...</p>
                ) : (
                  <div>
                    <pre className="text-xs">{JSON.stringify(rootsTemp, null, 2)}</pre>
                  </div>
                )}
              </pre>
            </div>
          </Card>

          <Card id="diaryRawData" className="h-full w-1/2 p-12">
            <h2 className="text-xl font-semibold mb-4">
              Diary Raw Data
            </h2>
            <div className="bg-card border border-border rounded-lg p-2 overflow-auto max-h-full">
              <pre className="text-sm text-foreground">
                {!diaryRawData ? (
                  <p>Loading...</p>
                ) : (
                  <div>
                    <pre className="text-xs">{JSON.stringify(diaryRawData, null, 2)}</pre>
                  </div>
                )}
              </pre>
            </div>
          </Card>

          <Card id="diaryList" className="h-full w-1/2 p-12">
            <h2 className="text-xl font-semibold mb-4">
              Diary List
            </h2>
            <div className="bg-card border border-border rounded-lg p-2 overflow-auto max-h-full">
              <pre className="text-sm text-foreground">
                {!diaryList ? (
                  <p>Loading...</p>
                ) : (
                  <div>
                    <pre className="text-xs">{JSON.stringify(diaryList, null, 2)}</pre>
                  </div>
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
