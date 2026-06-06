import React from 'react';
import { BookOpen, HelpCircle, CheckCircle, AlertTriangle, FlaskConical, CircleDot } from 'lucide-react';

export default function ReferenceHub() {
  return (
    <div className="space-y-6" id="reference-hub-section">
      {/* Overview Block */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
            <BookOpen size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">HFF-1 成纤维细胞标准培养与质控指南</h2>
            <p className="text-xs text-slate-500">提供 HFF-1 (Human Foreskin Fibroblast) 细胞的生物学知识与镜检指引</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <FlaskConical size={14} className="text-sky-500" />
              细胞系基础信息
            </h3>
            <ul className="space-y-1.5 text-slate-600 font-mono">
              <li><strong className="text-slate-800">官方名称：</strong>HFF-1</li>
              <li><strong className="text-slate-800">宿主来源：</strong>人类 (Homo sapiens)</li>
              <li><strong className="text-slate-800">组织来源：</strong>包皮成纤维 (Foreskin Fibroblast)</li>
              <li><strong className="text-slate-805">细胞形态：</strong>贴壁，典型的贴壁纺锤梭形</li>
              <li><strong className="text-slate-800">核型分型：</strong>正常二倍体男婴系</li>
            </ul>
          </div>

          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <CircleDot size={14} className="text-emerald-500" />
              标准配方与体系
            </h3>
            <ul className="space-y-1.5 text-slate-600">
              <li><strong className="text-slate-800">首选基础液：</strong>DMEM (High Glucose，含 L-glutamine 4.0 mM，丙酮酸钠 110 mg/L)</li>
              <li><strong className="text-slate-800">血清浓度：</strong>10% - 15% 优质胎牛血清 (FBS)</li>
              <li><strong className="text-slate-800">环境比例：</strong>37°C 恒温，5% CO₂ 饱和湿度培养</li>
              <li><strong className="text-slate-800">抗生素：</strong>双抗 (Penicillin-Streptomycin 100 U/mL)</li>
            </ul>
          </div>

          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-500" />
              培养与消化要点
            </h3>
            <ul className="space-y-1.5 text-slate-600">
              <li><strong className="text-slate-800">消化试剂：</strong>0.25% Trypsin-EDTA 溶液</li>
              <li><strong className="text-slate-800">消化时长：</strong>37°C，约 1~1.5 分钟（显微镜下见变圆脱离后立即加培养基终止）</li>
              <li><strong className="text-slate-800">常规分瓶比：</strong>1:3 至 1:5</li>
              <li><strong className="text-slate-800">换液周期：</strong>每 2 - 3 天更换一次新鲜完全培养基</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confluence Quality Assessment Matrix */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">微观鏡检细胞密度（汇合度）金标准对照表</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          作为贴壁成纤维细胞，HFF-1 对汇合度极度敏感。不适宜的密度将直接损害其生命力与后续实验效果：
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="confluence-standards">
          <div className="border border-slate-150 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-sky-600 block bg-sky-50 px-2 py-0.5 rounded-md w-max">30% - 50%</span>
            <h4 className="text-xs font-semibold text-slate-700">对数生长早期</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              细胞单独分布或点状群聚，形态高度舒展，两端或多段尖锐伪足充分展开。此时生长压力极低，但不适合直接做实验，需要持续观察。
            </p>
          </div>

          <div className="border border-slate-150 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-blue-600 block bg-blue-50 px-2 py-0.5 rounded-md w-max">75% - 85%</span>
            <h4 className="text-xs font-semibold text-slate-700">指数生长盛期</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold text-slate-600">
              细胞群连结成网但尚有极少缝隙。活力最强、膜完整度最好、代谢极旺盛。是进行转染、慢病毒感染、细胞损伤建模或冻存的黄金节点！
            </p>
          </div>

          <div className="border border-slate-150 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-emerald-600 block bg-emerald-50 px-2 py-0.5 rounded-md w-max">90% - 95%</span>
            <h4 className="text-xs font-semibold text-slate-700">完全汇合期</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              单层无缝覆盖，细胞呈大面积平行纤维束状排列。适用于制备饲养层（添加丝裂霉素C处理）或获取最高产量的细胞，必须在24小时内传代。
            </p>
          </div>

          <div className="border border-slate-150 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-rose-600 block bg-rose-50 px-2 py-0.5 rounded-md w-max">98% 以上</span>
            <h4 className="text-xs font-semibold text-slate-700">过饱和衰老期</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              细胞相互堆叠、局部由于挤压而萎缩变窄。胞内出现大量折光空泡，营养液酸化发黄。极易引起脱屑和不可逆性细胞凋亡、老化。
            </p>
          </div>
        </div>
      </div>

      {/* Pathological Warning indicators */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">镜检健康警戒与形态病理指示（Quality Control）</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="flex gap-3 bg-red-50/40 p-4 border border-red-100 rounded-xl">
            <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1.5">
              <h4 className="font-semibold text-rose-800">异常病理学特征（⚠ 需分批淘汰）</h4>
              <ul className="space-y-1 text-slate-600 list-disc pl-4 leading-relaxed">
                <li><strong className="text-slate-800">胞质颗粒/空泡：</strong>胞质内含黑色小杂质、空泡密集，极多是由营养匮乏、霉菌或支原体（Mycoplasma）隐性感染，或者长代数老化引起。</li>
                <li><strong className="text-slate-800">细胞变圆易脱：</strong>细胞体皱缩变圆，脱离贴壁表面，折光强烈，通常表明培养体系pH倾斜过度，或温度异常引起细胞凋亡危象。</li>
                <li><strong className="text-slate-800">丝状破裂：</strong>伪足变圆融并残缺，细胞间突起断裂不完整，细胞活性低劣。</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3 bg-emerald-50/40 p-4 border border-emerald-100 rounded-xl">
            <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1.5">
              <h4 className="font-semibold text-emerald-800">高品质成纤维形态指标（✓ 推荐扩培）</h4>
              <ul className="space-y-1 text-slate-600 list-disc pl-4 leading-relaxed">
                <li><strong className="text-slate-800">细胞对称展开：</strong>贴壁铺展呈宽广的扁平星状或扇贝形。</li>
                <li><strong className="text-slate-800">极化方向性：</strong>高密度下自发沿着细胞长轴流线型或排队式生长。</li>
                <li><strong className="text-slate-800">胞内清亮、核圆：</strong>细胞核居中或侧偏，内部极为干净，几乎不含任何黑点微粒。折光率温和匀称。</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
