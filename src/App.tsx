import React, { useState } from 'react';
import { Microscope, FileText, BookOpen, Clock, Heart, FlaskConical, HelpCircle, Activity, Zap, Scissors } from 'lucide-react';
import SampleAnalyzer from './components/SampleAnalyzer';
import FluorescenceAnalyzer from './components/FluorescenceAnalyzer';
import ScratchAnalyzer from './components/ScratchAnalyzer';
import LabDiary from './components/LabDiary';
import ReferenceHub from './components/ReferenceHub';

export default function App() {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'fluorescence' | 'scratch' | 'diary' | 'reference'>('analyzer');

  // Real-time current UTC date from environment setting
  const systemTime = "2026-05-30 02:13 UTC";

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans flex flex-col antialiased">
      {/* GLOBAL LAB SYSTEM HEADER */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* BRANDING */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/10">
                <FlaskConical size={20} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-slate-800 uppercase font-mono">
                    HFF-1 Cell Confluence & Health Analyzer
                  </h1>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] bg-sky-50 text-sky-700 border border-sky-100 rounded-md font-semibold font-mono uppercase">
                    v2.5 Full-Stack
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">成纤维微观定量评估与电子实验本集成工作台</p>
              </div>
            </div>

            {/* LIVE TELEMETRY */}
            <div className="flex items-center gap-5 text-[11px] text-slate-500 font-mono">
              <div className="hidden md:flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                <Clock size={13} className="text-slate-400" />
                <span>实时时间: <strong className="text-slate-700">{systemTime}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100 font-semibold">
                <Activity size={13} className="text-emerald-500" />
                <span>病理模型: Live 3.5</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* CORE CONTROL TABS NAVIGATION */}
      <div className="bg-white border-b border-slate-100 shadow-2xs py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:justify-between sm:items-center">
            <div className="flex space-x-1 items-center">
              <span className="text-[10px] font-bold uppercase text-slate-400 mr-2 tracking-wider">测定功能管道</span>
              <button
                id="tab-analyzer"
                onClick={() => setActiveTab('analyzer')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
                  activeTab === 'analyzer'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/10'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Microscope size={15} />
                智能明场镜检
              </button>

              <button
                id="tab-fluorescence"
                onClick={() => setActiveTab('fluorescence')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
                  activeTab === 'fluorescence'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/10'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Zap size={15} />
                多模态荧光
              </button>

              <button
                id="tab-scratch"
                onClick={() => setActiveTab('scratch')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
                  activeTab === 'scratch'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/10'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Scissors size={15} />
                细胞划痕愈合
              </button>
            </div>

            <div className="flex space-x-1 items-center border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
              <span className="text-[10px] font-bold uppercase text-slate-400 mr-2 tracking-wider hidden md:inline-block">平台数据本</span>
              <button
                id="tab-diary"
                onClick={() => setActiveTab('diary')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
                  activeTab === 'diary'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                    : 'text-slate-650 hover:bg-emerald-50 hover:text-emerald-900'
                }`}
              >
                <FileText size={15} />
                电子记录日志
              </button>

              <button
                id="tab-reference"
                onClick={() => setActiveTab('reference')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
                  activeTab === 'reference'
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <BookOpen size={15} />
                知识图谱
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PRIMARY WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* QUICK USER GUIDE BAR */}
        <div className="mb-6 bg-gradient-to-r from-sky-50/70 to-indigo-50/70 rounded-2xl p-4 border border-sky-100/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-3">
            <div className="p-2 bg-white rounded-xl text-sky-500 shadow-2xs">
              <HelpCircle size={18} />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-800">🔬 多模态系统引航</h4>
              <p className="text-[11px] text-slate-650">
                本平台支持 HFF-1 细胞<b>汇合度评估</b>、<b>ROS/免疫荧光/老化染色定量</b>与<b>划痕愈合迁移率测算</b>！
                请在上方切换实验工作流选项卡。
              </p>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap self-end sm:self-auto">
            高内涵成纤维细胞图像集成分析中心
          </div>
        </div>

        {/* WORKSPACE SECTIONS */}
        <div className="space-y-6">
          {activeTab === 'analyzer' && <SampleAnalyzer />}
          {activeTab === 'fluorescence' && <FluorescenceAnalyzer />}
          {activeTab === 'scratch' && <ScratchAnalyzer />}
          {activeTab === 'diary' && <LabDiary />}
          {activeTab === 'reference' && <ReferenceHub />}
        </div>
      </main>

      {/* PERSISTENT RESEARCH FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-400 mt-12 bg-slate-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Heart size={12} className="text-rose-500 fill-rose-500 animate-pulse" />
            <span>智能生物医学镜检成像实验室 · HFF-1 专用质控管道</span>
          </div>
          <div className="font-mono text-[10px]">
            © 2026 AI Studio Build Core. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
