import React, { useState, useEffect, useRef } from 'react';
import { Camera, Sliders, Zap, Check, FlaskConical, Target, Layers, Activity } from 'lucide-react';

export default function FluorescenceAnalyzer() {
  const [assayType, setAssayType] = useState<'ros' | 'senescence' | 'ihc'>('ros');
  const [uploadMode, setUploadMode] = useState<boolean>(false);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);

  const [threshold, setThreshold] = useState<number>(50);
  const [brightness, setBrightness] = useState<number>(100);
  
  // Stats
  const [mfi, setMfi] = useState<number>(0);
  const [positiveArea, setPositiveArea] = useState<number>(0);

  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenImageRef = useRef<HTMLImageElement | null>(null);

  const drawProceduralFluorescence = (ctx: CanvasRenderingContext2D, width: number, height: number, type: string) => {
    // Dark background for fluorescence
    ctx.fillStyle = type === 'ihc' ? "#110000" : "#050f05";
    ctx.fillRect(0, 0, width, height);

    let seed = type === 'ros' ? 100 : type === 'senescence' ? 200 : 300;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const cellCount = type === 'senescence' ? 30 : 60; // Senescent cells are larger, fewer

    for (let i = 0; i < cellCount; i++) {
      const cx = random() * width;
      const cy = random() * height;
      const size = type === 'senescence' ? (random() * 20 + 30) : (random() * 15 + 10);
      
      const intensity = type === 'ros' 
        ? random() > 0.6 ? 255 : 80  // Spikes in ROS
        : type === 'senescence' 
        ? random() > 0.7 ? 200 : 40  // Senescence SA-b-gal (fluorescent analogue)
        : random() * 200 + 55;       // IHC/IF even spread

      ctx.save();
      ctx.translate(cx, cy);

      const radGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      if (type === 'ros') {
        // Green DCFDA
        radGrad.addColorStop(0, `rgba(50, ${intensity}, 50, 1)`);
        radGrad.addColorStop(1, `rgba(10, ${intensity * 0.2}, 10, 0)`);
      } else if (type === 'senescence') {
        // Cyan/Blue or strong green for senescence-associated probe
        radGrad.addColorStop(0, `rgba(20, ${intensity * 0.9}, ${intensity}, 1)`);
        radGrad.addColorStop(1, `rgba(0, 0, 0, 0)`);
      } else {
        // Red IF like TRITC for Cytoskeleton or specific target
        radGrad.addColorStop(0, `rgba(${intensity}, 40, 40, 1)`);
        radGrad.addColorStop(1, `rgba(0, 0, 0, 0)`);
      }

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      // Irregular shapes
      ctx.moveTo(size * Math.cos(0), size * Math.sin(0));
      for (let a = 1; a < 6; a++) {
        const rad = size * (0.5 + 0.5 * random());
        ctx.lineTo(rad * Math.cos(a * Math.PI / 3), rad * Math.sin(a * Math.PI / 3));
      }
      ctx.closePath();
      ctx.fill();

      // Nucleus (DAPI usually blue, but let's keep it simple or distinct)
      if (type === 'ihc' || type === 'senescence') {
        ctx.fillStyle = `rgba(40, 100, 200, 0.6)`;
        ctx.beginPath();
        ctx.arc(random() * 4 - 2, random() * 4 - 2, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  };

  const processImage = () => {
    const srcCanvas = sourceCanvasRef.current;
    const destCanvas = displayCanvasRef.current;
    if (!srcCanvas || !destCanvas) return;

    const ctxSrc = srcCanvas.getContext('2d');
    const ctxDest = destCanvas.getContext('2d');
    if (!ctxSrc || !ctxDest) return;

    const width = srcCanvas.width;
    const height = srcCanvas.height;

    destCanvas.width = width;
    destCanvas.height = height;

    const imgData = ctxSrc.getImageData(0, 0, width, height);
    const data = imgData.data;
    const outputImgData = ctxDest.createImageData(width, height);
    const outData = outputImgData.data;

    let totalIntensity = 0;
    let positivePixels = 0;
    let validPixels = 0;

    const bMul = brightness / 100;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i] * bMul;
      let g = data[i+1] * bMul;
      let b = data[i+2] * bMul;
      const a = data[i+3];

      r = Math.min(255, r);
      g = Math.min(255, g);
      b = Math.min(255, b);

      // We extract intensity based on channel
      let targetIntensity = g; // Default to green (ROS)
      if (assayType === 'ihc') targetIntensity = r; // Red channel focus
      if (assayType === 'senescence') targetIntensity = Math.max(g, b); // Cyan

      validPixels++;
      totalIntensity += targetIntensity;

      if (targetIntensity >= threshold) {
        positivePixels++;
        // Highlight logic
        outData[i] = r;
        outData[i+1] = g;
        outData[i+2] = b;
        outData[i+3] = 255;
      } else {
        // Dim negative regions
        outData[i] = r * 0.2;
        outData[i+1] = g * 0.2;
        outData[i+2] = b * 0.2;
        outData[i+3] = 255;
      }
    }

    ctxDest.putImageData(outputImgData, 0, 0);

    if (validPixels > 0) {
      setMfi(Math.round(totalIntensity / validPixels));
      setPositiveArea(Math.round((positivePixels / validPixels) * 1000) / 10);
    }
  };

  useEffect(() => {
    const canvas = sourceCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (uploadMode && uploadedImageSrc) {
      const img = hiddenImageRef.current;
      if (img) {
        img.onload = () => {
          canvas.width = 450;
          canvas.height = 450;
          ctx.drawImage(img, 0, 0, 450, 450);
          processImage();
        };
        if (img.complete) {
          canvas.width = 450;
          canvas.height = 450;
          ctx.drawImage(img, 0, 0, 450, 450);
          processImage();
        }
      }
    } else {
      canvas.width = 450;
      canvas.height = 450;
      drawProceduralFluorescence(ctx, 450, 450, assayType);
      processImage();
    }
  }, [assayType, uploadMode, uploadedImageSrc]);

  useEffect(() => {
    processImage();
  }, [threshold, brightness]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImageSrc(event.target.result as string);
          setUploadMode(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveToLabDiary = () => {
    const newLog = {
      id: "FLUO-" + Date.now().toString().slice(-6),
      date: new Date().toLocaleDateString("zh-CN", {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      }),
      dishName: `荧光测定 - ${assayType.toUpperCase()}`,
      passage: "P14",
      confluence: positiveArea, // Hijacking field for display
      mediaStatus: "特定染色孵育",
      cellStatus: "定量分析完毕",
      notes: `MFI: ${mfi}, 阳性率: ${positiveArea}%. 对应目标荧光通道读取成功。`
    };
    const existingLogs = JSON.parse(localStorage.getItem('hff1_lab_logs') || '[]');
    localStorage.setItem('hff1_lab_logs', JSON.stringify([newLog, ...existingLogs]));
    window.dispatchEvent(new Event('hff1_logs_updated'));
    alert(`成功将荧光定量结果（阳性率：${positiveArea}%）保存至实验本！`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      <div className="lg:col-span-12">
        <div className="bg-slate-900 rounded-2xl p-6 relative overflow-hidden shadow-xl border border-slate-800 text-slate-200">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-violet-500/20 rounded-xl text-violet-400">
                  <Zap size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100">高内涵荧光定量分析 (Fluorescence)</h2>
                  <p className="text-xs text-slate-400">进行 ROS, 衰老探针 (SA-β-gal) 与免疫荧光 (IF/IHC) 的靶向定量测定</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6 bg-slate-800/50 p-2 rounded-xl">
                {[{id: 'ros', label: "ROS 活性氧"}, {id: 'senescence', label: "Senescence 衰老染色"}, {id: 'ihc', label: "IF/IHC 免疫荧光"}].map(t => (
                  <button 
                    key={t.id}
                    onClick={() => { setAssayType(t.id as any); setUploadMode(false); setThreshold(50); }}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition ${
                      assayType === t.id && !uploadMode ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="space-y-5 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
                  <Sliders size={14} className="text-violet-400" />
                  <span>定量参数提取与掩膜</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[10px] text-slate-400">
                    <span>阳性判断阈值 (Threshold)</span><span className="text-violet-400 font-bold">{threshold}</span>
                  </div>
                  <input type="range" min="10" max="250" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} className="w-full accent-violet-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[10px] text-slate-400">
                    <span>通道全局亮度 (Brightness)</span><span>{brightness}%</span>
                  </div>
                  <input type="range" min="50" max="200" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} className="w-full accent-slate-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer" />
                </div>

                <div className="pt-2 border-t border-slate-700/60 mt-3 flex gap-3">
                  <label className="flex-1 flex flex-col items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl py-3 cursor-pointer transition">
                    <Camera size={16} className="text-sky-400 mb-1" />
                    <span className="text-[10px] text-slate-300">载入荧光图谱</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button onClick={saveToLabDiary} className="flex-1 flex flex-col items-center justify-center bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded-xl py-3 cursor-pointer transition">
                    <Check size={16} className="mb-1" />
                    <span className="text-[10px] font-semibold">记录数据提取结果</span>
                  </button>
                </div>
                {uploadMode && <div className="text-[10px] text-emerald-400 text-center">✅ 外源荧光图像已加载并替代模拟通道</div>}
              </div>
            </div>

            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="relative w-[340px] h-[340px] bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-700">
                <canvas ref={sourceCanvasRef} className="hidden" width="450" height="450" />
                <canvas ref={displayCanvasRef} className="w-full h-full object-cover" width="450" height="450" style={{ mixBlendMode: 'screen' }} />
                
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md border border-white/10 text-[10px] font-mono text-white">
                  {assayType.toUpperCase()} CHANNEL FILTER
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full mt-4">
                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                  <div className="text-[10px] text-slate-400 mb-0.5">平均荧光强度 (MFI)</div>
                  <div className="text-xl font-bold font-mono text-violet-400">{mfi}</div>
                </div>
                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                  <div className="text-[10px] text-slate-400 mb-0.5">阳性面积占比</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">{positiveArea}%</div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      {uploadedImageSrc && <img ref={hiddenImageRef} src={uploadedImageSrc} className="hidden" alt="hidden upload" />}
    </div>
  );
}
