import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, Edit2, Search, ArrowDownAZ, Heart, FileDown, Plus } from 'lucide-react';
import { LabLog } from '../types';

export default function LabDiary() {
  const [logs, setLogs] = useState<LabLog[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Create state form
  const [dishName, setDishName] = useState<string>('');
  const [passage, setPassage] = useState<string>('P13');
  const [confluence, setConfluence] = useState<number>(80);
  const [mediaStatus, setMediaStatus] = useState<string>('DMEM 高糖 + 10% FBS');
  const [cellStatus, setCellStatus] = useState<'Healthy' | 'Denser' | 'Stressed' | 'Senescent'>('Healthy');
  const [notes, setNotes] = useState<string>('');
  
  const [showAddLog, setShowAddLog] = useState<boolean>(false);

  // Initial dummy log data to give a perfect realistic look
  const initialLogs: LabLog[] = [
    {
      id: "LOG-98711",
      date: "2026/05/29 14:32",
      dishName: "HFF-1 T25瓶 #C1",
      passage: "P13",
      confluence: 95,
      mediaStatus: "DMEM + 10% FBS",
      cellStatus: "Denser",
      notes: "已达到95%汇合。成纤维细胞平行取向完整，指纹状旋涡饱满，决定今日下午使用1.5mL 0.25% Trypsin 进行消化，消化时长约1.5分钟。按1:4比例传代分装入4个T25瓶，标记传代为P14代。"
    },
    {
      id: "LOG-98612",
      date: "2026/05/28 10:10",
      dishName: "HFF-1 六孔板 A1",
      passage: "P12",
      confluence: 80,
      mediaStatus: "DMEM + 10% FBS",
      cellStatus: "Healthy",
      notes: "细胞形态舒展呈两端突起的典型长梭状。胞浆丰富无气泡颗粒。准备作为明日转染实验的目标盘，今日更换新鲜无抗生素培养基。"
    },
    {
      id: "LOG-98501",
      date: "2026/05/26 15:45",
      dishName: "HFF-1 T75瓶 #A",
      passage: "P12",
      confluence: 45,
      mediaStatus: "DMEM + 12% FBS",
      cellStatus: "Healthy",
      notes: "复苏后第2天。贴壁率大于90%，多数贴壁细胞已伸展出伪足，呈现对数生长早期分布模式。更换培养液去除未贴附的多余死细胞。生长状态优秀。"
    }
  ];

  const loadLogs = () => {
    const saved = localStorage.getItem('hff1_lab_logs');
    if (saved) {
      setLogs(JSON.parse(saved));
    } else {
      localStorage.setItem('hff1_lab_logs', JSON.stringify(initialLogs));
      setLogs(initialLogs);
    }
  };

  useEffect(() => {
    loadLogs();
    
    // Listen for custom events when on other tabs logs gets updated:
    const handleLogsUpdate = () => {
      loadLogs();
    };
    window.addEventListener('hff1_logs_updated', handleLogsUpdate);
    return () => {
      window.removeEventListener('hff1_logs_updated', handleLogsUpdate);
    };
  }, []);

  const handleAddLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName) {
      alert("请填写培养皿ID/名称！");
      return;
    }

    const newLog: LabLog = {
      id: "LOG-" + Math.floor(Math.random() * 90000 + 10000).toString(),
      date: new Date().toLocaleDateString("zh-CN", {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      dishName,
      passage,
      confluence,
      mediaStatus,
      cellStatus,
      notes: notes || "无特别注释"
    };

    const updated = [newLog, ...logs];
    setLogs(updated);
    localStorage.setItem('hff1_lab_logs', JSON.stringify(updated));

    // Reset fields
    setDishName('');
    setNotes('');
    setShowAddLog(false);
  };

  const deleteLog = (id: string) => {
    if (window.confirm("确定要删除这条细胞监测记录吗？")) {
      const updated = logs.filter(log => log.id !== id);
      setLogs(updated);
      localStorage.setItem('hff1_lab_logs', JSON.stringify(updated));
    }
  };

  const filteredLogs = logs.filter(log => 
    log.dishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.passage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 space-y-6" id="lab-diary-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">成纤维细胞培养日志</h2>
          <p className="text-xs text-slate-500">记录和统计细胞系的代数、当前汇合密度及传代表型分析，用于质量控制</p>
        </div>

        <button
          id="toggle-add-log"
          onClick={() => setShowAddLog(!showAddLog)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition self-start w-auto"
        >
          <Plus size={14} />
          {showAddLog ? "收起栏目" : "手动录入新监测"}
        </button>
      </div>

      {showAddLog && (
        <form onSubmit={handleAddLogSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4" id="log-form">
          <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase">实验测定记录手动创建</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">培养皿标号/批次 ID</label>
              <input
                type="text"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="例如：HFF-1 C1瓶"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400">代数 (Passage Number)</label>
              <input
                type="text"
                value={passage}
                onChange={(e) => setPassage(e.target.value)}
                placeholder="例如: P13"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400">预估细胞汇合度 (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={confluence}
                onChange={(e) => setConfluence(parseInt(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400">培养状态初判</label>
              <select
                value={cellStatus}
                onChange={(e) => setCellStatus(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-sky-500"
              >
                <option value="Healthy">健康生长期 (70%-85%)</option>
                <option value="Denser">致密满载层 (85%-100%)</option>
                <option value="Stressed">营养稍匮乏/有压力</option>
                <option value="Senescent">老化空泡化/衰亡趋势</option>
              </select>
            </div>

            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">培养体系基液状态</label>
              <input
                type="text"
                value={mediaStatus}
                onChange={(e) => setMediaStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400">实验室备注与消化处理决策</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="记录观察到的核糖体空泡、细胞碎片或传代决策建议..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-sky-500 leading-relaxed"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer w-auto"
          >
            保存该观察日志
          </button>
        </form>
      )}

      {/* SEARCH AND CONTROL ROW */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索批次、代数或镜检评语..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 focus:outline-sky-500"
          />
        </div>

        {/* Growth Curves / Passages Statistics (Dynamic SVG) */}
        <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <span className="text-slate-500">累计监测数:</span>
          <span className="font-bold text-slate-800">{filteredLogs.length}次</span>
          <span className="border-l border-slate-300 h-3 mx-1"></span>
          <span className="text-slate-500">平均汇合:</span>
          <span className="font-bold text-emerald-600">
            {logs.length > 0 ? Math.round(logs.reduce((acc, log) => acc + log.confluence, 0) / logs.length) : 0}%
          </span>
        </div>
      </div>

      {/* SVG GRAPHIC DISPLAY OF CELL CONFLUENCE DENSITIES TREND */}
      <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl" id="svg-trend-chart">
        <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-3">
          成纤维细胞生长密度（Confluence）各批次监测历史
        </h4>
        
        {logs.length > 0 ? (
          <div className="relative h-28 w-full">
            {/* Draw nice SVG Line Chart */}
            <svg viewBox="0 0 600 100" className="w-full h-full" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="600" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
              <line x1="0" y1="50" x2="600" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
              <line x1="0" y1="80" x2="600" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />

              {/* Draw Line and points based on logs (reversed to show chronological left-to-right) */}
              {(() => {
                const step = 600 / Math.max(2, logs.length);
                const reversedLogs = [...logs].reverse();
                
                // Construct points
                const points = reversedLogs.map((log, index) => {
                  const x = index * step + (step / 2);
                  // Scale: confluence 100% -> y=10 (top), 0% -> y=90 (bottom)
                  const y = 90 - (log.confluence / 100) * 80;
                  return { x, y, log };
                });

                const polylinePath = points.map(p => `${p.x},${p.y}`).join(' ');

                return (
                  <>
                    {/* Fill underneath */}
                    <path
                      d={`M ${points[0]?.x},95 L ${points.map(p => `${p.x},${p.y}`).join(' L ')} L ${points[points.length-1]?.x},95 Z`}
                      fill="url(#chart-gradient)"
                      opacity="0.15"
                    />

                    {/* Gradient definition */}
                    <defs>
                      <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#ffffff" />
                      </linearGradient>
                    </defs>

                    {/* Connection Stroke */}
                    <polyline
                      fill="none"
                      stroke="#0ea5e9"
                      strokeWidth="2"
                      points={polylinePath}
                    />

                    {/* Individual nodes */}
                    {points.map((p, idx) => (
                      <g key={idx}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          fill="#ffffff"
                          stroke="#0ea5e9"
                          strokeWidth="2.5"
                          className="cursor-pointer hover:r-5 transition"
                        />
                        <text
                          x={p.x}
                          y={p.y - 10}
                          textAnchor="middle"
                          fill="#1e293b"
                          fontSize="8px"
                          fontWeight="bold"
                        >
                          {p.log.confluence}%
                        </text>
                        <text
                          x={p.x}
                          y="98"
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="7px"
                        >
                          {p.log.passage}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        ) : (
          <div className="h-20 flex items-center justify-center text-[10px] text-slate-400">
            暂无趋势图线
          </div>
        )}
      </div>

      {/* TABLE LISTING */}
      <div className="overflow-x-auto" id="logs-container">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3">测定ID</th>
              <th className="py-2.5 px-3">测定时间</th>
              <th className="py-2.5 px-3">培养皿型号 / 批次</th>
              <th className="py-2.5 px-3">代数 (Passage)</th>
              <th className="py-2.5 px-3 text-center">汇合百分比</th>
              <th className="py-2.5 px-3">判定状态</th>
              <th className="py-2.5 px-3">镜检详细日志与下一步处理</th>
              <th className="py-2.5 px-3 text-right">管理</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-3 font-mono text-[10px] text-slate-400 font-semibold">{log.id}</td>
                  <td className="py-3 px-3 text-slate-400 font-mono whitespace-nowrap">{log.date}</td>
                  <td className="py-3 px-3 font-semibold text-slate-700">{log.dishName}</td>
                  <td className="py-3 px-3 font-mono text-slate-800 font-semibold">{log.passage}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-bold text-slate-800">{log.confluence}%</span>
                    <div className="w-16 bg-slate-100 h-1 rounded-full mx-auto mt-1 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${log.confluence > 90 ? "bg-rose-500" : log.confluence > 70 ? "bg-emerald-500" : "bg-sky-400"}`}
                        style={{ width: `${log.confluence}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      log.cellStatus === 'Healthy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      log.cellStatus === 'Denser' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                      log.cellStatus === 'Stressed' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      log.cellStatus === 'Senescent' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {log.cellStatus === 'Healthy' ? "贴壁致密健康" :
                       log.cellStatus === 'Denser' ? "汇合饱和需分瓶" :
                       log.cellStatus === 'Stressed' ? "面临缺氧营养黄化" :
                       log.cellStatus === 'Senescent' ? "大体积老化细胞" :
                       log.cellStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 leading-relaxed max-w-sm truncate" title={log.notes}>
                    {log.notes}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      id={`delete-log-${log.id}`}
                      onClick={() => deleteLog(log.id)}
                      className="text-slate-400 hover:text-rose-500 p-1.5 transition rounded-lg hover:bg-rose-50"
                      title="删除单条"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  没有找到与 “{searchQuery}” 匹配的细胞观测日志纪录。可以使用上方的加号或者切片保存按钮进行测定。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
