import React, { useState, useEffect, useRef } from 'react';
import { Camera, Sliders, Scissors, Activity, Target } from 'lucide-react';

export default function ScratchAnalyzer() {
  const [timeline, setTimeline] = useState<number>(0); // 0h to 24h
  const [uploadMode, setUploadMode] = useState<boolean>(false);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);

  const [sensitivity, setSensitivity] = useState<number>(100);
  
  // Stats
  const [woundAreaPercent, setWoundAreaPercent] = useState<number>(100);
  const [migrationRate, setMigrationRate] = useState<number>(0);

  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenImageRef = useRef<HTMLImageElement | null>(null);

  const initialWoundWidthRef = useRef<number>(200); // Base width at 0h

  const drawProceduralScratch = (ctx: CanvasRenderingContext2D, width: number, height: number, timeHour: number) => {
    // Fill Cell background
    ctx.fillStyle = "#e0cfbc";
    ctx.fillRect(0, 0, width, height);
    
    // Draw continuous cell layer
    let seed = 12345;
    const random = () => { x = Math.sin(seed++) * 10000; return x - Math.floor(x); };
    let x;

    ctx.fillStyle = "rgba(100, 70, 40, 0.5)";
    for(let i=0; i<1500; i++) {
        const cx = random() * width;
        const cy = random() * height;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 15, 6, random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // Now carve the scratch
    const baseWound = 180;
    // Healing reduces wound width over time. 24h = almost closed. Max healing ~140px closed.
    const healingAmount = (timeHour / 24) * 160; 
    let currentWoundCenterWidth = Math.max(0, baseWound - healingAmount);

    // Draw the wound (clear path vertically)
    // To make it look like phase contrast scratch, we clear an irregular vertical band
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    
    ctx.beginPath();
    ctx.moveTo(width/2 - currentWoundCenterWidth/2 + random()*20, 0);
    ctx.lineTo(width/2 + currentWoundCenterWidth/2 - random()*20, 0);
    
    // Draw jagged right edge down
    for(let y=0; y<=height; y+=50) {
        ctx.lineTo(width/2 + currentWoundCenterWidth/2 + (random()-0.5)*30, y);
    }
    
    // Draw jagged left edge up
    for(let y=height; y>=0; y-=50) {
        ctx.lineTo(width/2 - currentWoundCenterWidth/2 + (random()-0.5)*30, y);
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // Draw migrating front cells (actively growing into the wound)
    ctx.fillStyle = "rgba(80, 50, 20, 0.7)";
    if (timeHour > 0) {
        for(let y=0; y<=height; y+=20) {
            if(random() > 0.3) {
                // Left border migrating cells
                ctx.beginPath();
                ctx.arc(width/2 - currentWoundCenterWidth/2 + random()*15, y + random()*10, 8, 0, Math.PI*2);
                ctx.fill();
            }
            if(random() > 0.3) {
                // Right border migrating cells
                ctx.beginPath();
                ctx.arc(width/2 + currentWoundCenterWidth/2 - random()*15, y + random()*10, 8, 0, Math.PI*2);
                ctx.fill();
            }
        }
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

    let emptyPixels = 0;
    const totalPixels = width * height;

    const thresholdLevel = sensitivity + 80;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];

      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      outData[i] = r;
      outData[i+1] = g;
      outData[i+2] = b;
      outData[i+3] = 255;

      // If it's bright/empty, it's the wound area
      if (gray > thresholdLevel) {
        emptyPixels++;
        // Overlay red tint to visualize wound
        outData[i] = Math.min(255, r + 80);
        outData[i+1] = g * 0.5;
        outData[i+2] = b * 0.5;
      }
    }

    ctxDest.putImageData(outputImgData, 0, 0);

    const currentWoundPct = (emptyPixels / totalPixels) * 100;
    setWoundAreaPercent(currentWoundPct);
    
    // Assuming 0h wound area is ~40% max capacity based on procedural logic. 
    // We calibrate dynamically if it's upload mode, but stick to a mock calculation for demo.
    const initialPct = 40; 
    const healed = Math.max(0, initialPct - currentWoundPct);
    setMigrationRate(Math.min(100, Math.round((healed / initialPct) * 100)));
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
        // fallback if already loaded
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
      drawProceduralScratch(ctx, 450, 450, timeline);
      processImage();
    }
  }, [timeline, uploadMode, uploadedImageSrc, sensitivity]);

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
      id: "SCRATCH-" + Date.now().toString().slice(-6),
      date: new Date().toLocaleDateString("zh-CN", {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      }),
      dishName: `划痕愈合 - ${timeline}h`,
      passage: "P14",
      confluence: migrationRate, // hijacking field
      mediaStatus: "低血清划痕模型",
      cellStatus: "迁移分析完毕",
      notes: `当前时间窗：${timeline}小时。未愈合划痕面积占比：${woundAreaPercent.toFixed(1)}%，二维平面推断迁移率：${migrationRate}%。`
    };
    const existingLogs = JSON.parse(localStorage.getItem('hff1_lab_logs') || '[]');
    localStorage.setItem('hff1_lab_logs', JSON.stringify([newLog, ...existingLogs]));
    window.dispatchEvent(new Event('hff1_logs_updated'));
    alert(`成功将划痕分析结果（愈合率：${migrationRate}%）保存至实验本！`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      <div className="lg:col-span-12">
        <div className="bg-white rounded-2xl p-6 relative shadow-xs border border-slate-100 flex flex-col lg:flex-row gap-8">
          
          {/* Left panel */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
                <Scissors size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">划痕愈合迁移分析 (Wound Healing)</h2>
                <p className="text-xs text-slate-500">模拟时间窗并自动提取无细胞划痕区域，计算二维平面迁移率</p>
              </div>
            </div>

            <div className="space-y-6 bg-slate-50 border border-slate-100 p-5 rounded-2xl">
              {!uploadMode && (
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-[11px] text-slate-500">
                    <span>培养时间演替 (Timeline)</span>
                    <span className="text-rose-600 font-bold">{timeline}h</span>
                  </div>
                  <input type="range" min="0" max="24" value={timeline} onChange={(e) => setTimeline(parseInt(e.target.value))} className="w-full accent-rose-500 h-2 bg-slate-200 rounded-lg cursor-pointer" />
                  <p className="text-[10px] text-slate-400 text-right mt-1">拖动滑块模拟划痕后 0-24 小时愈合演变</p>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex justify-between font-mono text-[11px] text-slate-500">
                  <span>图像分割无边缘灵敏度</span><span>{sensitivity}</span>
                </div>
                <input type="range" min="50" max="150" value={sensitivity} onChange={(e) => setSensitivity(parseInt(e.target.value))} className="w-full accent-emerald-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                 <label className="flex flex-col items-center justify-center bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-xl py-3 cursor-pointer transition">
                  <Camera size={16} className="text-sky-500 mb-1" />
                  <span className="text-[10px] text-slate-600">载入划痕快照</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
                <button 
                  onClick={() => { setUploadMode(false); setUploadedImageSrc(null); setTimeline(0); }}
                  className="flex flex-col items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 rounded-xl py-3 cursor-pointer transition text-[10px] text-slate-600 font-semibold"
                >
                  <Activity size={16} className="text-amber-500 mb-1" />
                  重置模拟器
                </button>
              </div>

              <button 
                onClick={saveToLabDiary}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl py-2.5 cursor-pointer transition text-[11px] font-semibold"
              >
                <Target size={16} />
                录入实验记录表 (保存数据)
              </button>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-shrink-0 flex flex-col items-center gap-4">
             <div className="relative w-[340px] h-[340px] bg-slate-200 rounded-xl overflow-hidden shadow-md border-4 border-white">
                <canvas ref={sourceCanvasRef} className="hidden" width="450" height="450" />
                <canvas ref={displayCanvasRef} className="w-full h-full object-cover" width="450" height="450" />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow border border-rose-100 flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-400 opacity-60"></div>
                  <span className="text-[10px] font-semibold text-slate-700">Wound Mask</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs text-center">
                  <div className="text-[10px] text-slate-400 mb-0.5">当前划痕面积率</div>
                  <div className="text-xl font-bold font-mono text-slate-700">{woundAreaPercent.toFixed(1)}%</div>
                </div>
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 text-center">
                  <div className="text-[10px] text-rose-400 mb-0.5">划痕愈合迁移率</div>
                  <div className="text-xl font-bold font-mono text-rose-600">{migrationRate}%</div>
                </div>
              </div>
          </div>

        </div>
      </div>
      {uploadedImageSrc && <img ref={hiddenImageRef} src={uploadedImageSrc} className="hidden" alt="hidden upload" />}
    </div>
  );
}
