import React, { useState, useEffect, useRef } from 'react';
import { Camera, Image as ImageIcon, Sliders, Play, Info, Check, RefreshCw, BarChart, FileText, Microscope, BrainCircuit, Loader2 } from 'lucide-react';
import { CellSample, GeminiRefResponse } from '../types';
import { HFF_SAMPLES } from '../data/samples';

export default function SampleAnalyzer() {
  const [selectedSample, setSelectedSample] = useState<CellSample>(HFF_SAMPLES[0]);
  const [uploadMode, setUploadMode] = useState<boolean>(false);
  
  // Slide controls
  const [threshold, setThreshold] = useState<number>(115);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [showContours, setShowContours] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'original' | 'binary' | 'contour'>('original');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Dynamic calculated confluence
  const [calculatedConfluence, setCalculatedConfluence] = useState<number>(80);

  // Upload state
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  
  // Gemini AI state
  const [aiAnalysisResult, setAiAnalysisResult] = useState<GeminiRefResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiStatusText, setAiStatusText] = useState<string>('');

  // Canvas Refs
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenImageRef = useRef<HTMLImageElement | null>(null);

  // Status updates during AI run
  const aiStatusSteps = [
    "正在与高效实验室通道建立流式管道...",
    "正在加载微观图像，解析HFF-1成纤维细胞极组分布...",
    "正在提取明场相差(Phase-Contrast)形态边缘和细胞核特征...",
    "调用 Gemini-3.5-flash 智能病理级分析模型中...",
    "校对纺锤梭形排列和融汇密度的微观比例...",
    "正在生成定量分析报告与下一步传代操作处方..."
  ];

  // Draw procedural cells for sample images
  const drawProceduralCells = (ctx: CanvasRenderingContext2D, width: number, height: number, seed: number, targetConfluence: number) => {
    // Fill deep orange/yellow medium background
    ctx.fillStyle = "#ffecd9";
    ctx.fillRect(0, 0, width, height);

    // Apply uneven illumination / central spot light (microscope effect)
    const gd = ctx.createRadialGradient(width/2, height/2, width/6, width/2, height/2, width * 0.48);
    gd.addColorStop(0, "rgba(255, 235, 210, 1)");
    gd.addColorStop(0.5, "rgba(235, 175, 120, 0.95)");
    gd.addColorStop(1, "rgba(180, 100, 30, 0.95)");
    ctx.fillStyle = gd;
    ctx.fillRect(0, 0, width, height);

    // Seed state
    let state = seed;
    const random = () => {
      const x = Math.sin(state++) * 10000;
      return x - Math.floor(x);
    };

    // Draw cells
    const cellCount = Math.floor(targetConfluence * 2.8); // Scale cells to represent density
    const alignmentStrength = targetConfluence > 90 ? 0.95 : targetConfluence > 80 ? 0.6 : 0.2;
    const baseAngle = random() * Math.PI * 2; // Main flow direction

    // Draw some granular medium noise/debris first
    ctx.fillStyle = "rgba(125, 70, 20, 0.2)";
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(random() * width, random() * height, random() * 2 + 1, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < cellCount; i++) {
      const cx = random() * width;
      const cy = random() * height;
      
      // Determine length and thickness of spindle cell
      const length = random() * 50 + 75; // Elongated spindle
      const isConfluent = targetConfluence > 90;
      // High confluence squeezes cells thinner
      const thickness = isConfluent ? (random() * 5 + 9) : (random() * 8 + 14);

      // Alignment angle
      const angleDeviation = (random() - 0.5) * (1 - alignmentStrength) * Math.PI * 1.5;
      const angle = baseAngle + angleDeviation;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // 1. Draw light halo outline (microscope refraction boundary)
      ctx.shadowBlur = 4;
      ctx.shadowColor = "rgba(255, 255, 230, 0.7)";
      ctx.strokeStyle = "rgba(255, 251, 235, 0.45)";
      ctx.lineWidth = 1.5;

      // Draw elongated spindle shape using Bezier curves: (left tip) to (center fat body) to (right tip)
      ctx.beginPath();
      ctx.moveTo(-length / 2, 0);
      ctx.quadraticCurveTo(0, -thickness, length / 2, 0);
      ctx.quadraticCurveTo(0, thickness, -length / 2, 0);
      ctx.closePath();
      ctx.stroke();

      // 2. Clear shadow & Fill cell cytoplasm
      ctx.shadowBlur = 0;
      // Cell bodies are translucent brown-grey with slight green hints under phase contrast
      ctx.fillStyle = "rgba(155, 110, 60, 0.4)";
      ctx.fill();

      // Add a slight gradient for 3D spindle effect
      const cellGrad = ctx.createLinearGradient(0, -thickness/2, 0, thickness/2);
      cellGrad.addColorStop(0, "rgba(255, 255, 255, 0.15)");
      cellGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.05)");
      cellGrad.addColorStop(1, "rgba(0, 0, 0, 0.2)");
      ctx.fillStyle = cellGrad;
      ctx.fill();

      // 3. Draw cellular nucleus in center (large, lighter or darker oval)
      ctx.beginPath();
      ctx.ellipse(0, 0, length * 0.12, thickness * 0.35, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(100, 60, 20, 0.6)"; // Dark nucleus
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Nucleolus (tiny speck inside nucleus)
      ctx.beginPath();
      ctx.arc(length * 0.02, 0, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(30, 15, 5, 0.8)";
      ctx.fill();

      ctx.restore();
    }

    // Draw circular dark border frame to simulate microscope objective viewing circle
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = width * 0.14; 
    ctx.beginPath();
    ctx.arc(width/2, height/2, width/2 + (ctx.lineWidth/2) - 2, 0, Math.PI * 2);
    ctx.stroke();

    // Dark vignette edge
    const vignette = ctx.createRadialGradient(width/2, height/2, width/2 - 20, width/2, height/2, width/2);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.85)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  };

  // Run image processing on canvases
  const processImage = () => {
    const srcCanvas = sourceCanvasRef.current;
    const destCanvas = displayCanvasRef.current;
    if (!srcCanvas || !destCanvas) return;

    const ctxSrc = srcCanvas.getContext('2d');
    const ctxDest = destCanvas.getContext('2d');
    if (!ctxSrc || !ctxDest) return;

    const width = srcCanvas.width;
    const height = srcCanvas.height;

    // Set destination canvas size matches source
    destCanvas.width = width;
    destCanvas.height = height;

    // Get input pixels
    const imgData = ctxSrc.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Create a matching output array for filters
    const outputImgData = ctxDest.createImageData(width, height);
    const outData = outputImgData.data;

    // Variables for confluence counting
    let whitePixelCount = 0;
    let totalRegionPixels = 0;

    // Apply brightness, contrast, and thresholding
    const bMul = brightness / 100;
    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i+1];
      let b = data[i+2];
      const a = data[i+3];

      // Brightness filter
      r *= bMul;
      g *= bMul;
      b *= bMul;

      // Contrast filter
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;

      // Handle clipping limits
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));

      // Calculate Grayscale
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Check if pixel is part of the focal inspection area (inside the microscope circular viewport, to remain accurate)
      // Standardize coords: dx, dy from center
      const pixelIdx = i / 4;
      const py = Math.floor(pixelIdx / width);
      const px = pixelIdx % width;
      const dx = px - width / 2;
      const dy = py - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isInsideCircularView = dist < (width / 2 * 0.86);

      if (viewMode === 'binary') {
        // Binary Thresholding
        // Fibroblast cells in this light setting are typically categorized by darker bodies and outline ridges compared to the brightest light paths
        // Or vice-versa. We check gray level < threshold relative to standard backlighting
        // Specifically, phase-contrast cell bodies are darker brown/amber, and background is high-exposure light orange.
        // Therefore, gray value below the backlighting threshold indicates "cell cell density present".
        const isCell = gray < threshold;

        if (isInsideCircularView) {
          totalRegionPixels++;
          if (isCell) whitePixelCount++;
        }

        // Set output view: White for cell surface detected, black for empty background
        const val = isCell ? 255 : 0;
        outData[i] = val; // R
        outData[i+1] = val; // G
        outData[i+2] = val; // B
        outData[i+3] = isInsideCircularView ? 255 : 40; // High transparency outside telescope
      } else if (viewMode === 'contour') {
        // Simple Sobel edge detection mockup for outline mode
        let edgeVal = 0;
        if (px > 0 && px < width - 1 && py > 0 && py < height - 1) {
          // Simple horizontal / vertical gradient
          const idxRight = i + 4;
          const idxDown = i + width * 4;
          const grayRight = 0.299 * data[idxRight] + 0.587 * data[idxRight+1] + 0.114 * data[idxRight+2];
          const grayDown = 0.299 * data[idxDown] + 0.587 * data[idxDown+1] + 0.114 * data[idxDown+2];
          const diff = Math.abs(gray - grayRight) + Math.abs(gray - grayDown);
          edgeVal = diff > (threshold * 0.18) ? 255 : 0;
        }

        if (isInsideCircularView) {
          totalRegionPixels++;
          // High contours correlate directly with surface coverage
          if (gray < threshold) whitePixelCount++;
        }

        if (edgeVal > 0 && isInsideCircularView) {
          outData[i] = 16;
          outData[i+1] = 185;
          outData[i+2] = 129; // Green-500 edge lines
          outData[i+3] = 255;
        } else {
          // Display dim phase bg
          outData[i] = r * 0.45;
          outData[i+1] = g * 0.45;
          outData[i+2] = b * 0.45;
          outData[i+3] = isInsideCircularView ? 255 : 40;
        }
      } else {
        // Original view with brightness and contrast adjustments
        outData[i] = r;
        outData[i+1] = g;
        outData[i+2] = b;
        outData[i+3] = a;

        if (isInsideCircularView) {
          totalRegionPixels++;
          if (gray < threshold) whitePixelCount++;
        }
      }
    }

    // Write back to display canvas
    ctxDest.putImageData(outputImgData, 0, 0);

    // Calculate percent
    if (totalRegionPixels > 0) {
      const pct = Math.round((whitePixelCount / totalRegionPixels) * 100);
      setCalculatedConfluence(Math.min(100, Math.max(0, pct)));
    }
  };

  // Re-draw source canvas whenever selected sample / upload image is loaded
  useEffect(() => {
    const canvas = sourceCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (uploadMode && uploadedImageSrc) {
      // Draw uploaded image
      const img = hiddenImageRef.current;
      if (img) {
        img.onload = () => {
          canvas.width = 450;
          canvas.height = 450;
          // Center crops and draw circular vignette
          ctx.drawImage(img, 0, 0, 450, 450);
          processImage();
        };
        // In case image is already cached
        if (img.complete) {
          canvas.width = 450;
          canvas.height = 450;
          ctx.drawImage(img, 0, 0, 450, 450);
          processImage();
        }
      }
    } else {
      // Procedural sample draw
      canvas.width = 450;
      canvas.height = 450;
      drawProceduralCells(ctx, 450, 450, selectedSample.proceduralSeed, selectedSample.confluence);
      
      // Auto-set slider threshold to match the optimal segmentation for this sample
      // High confluence benefits from slightly different binary thresholds
      if (selectedSample.confluence > 90) {
        setThreshold(124);
      } else {
        setThreshold(114);
      }
      
      processImage();
    }
  }, [selectedSample, uploadMode, uploadedImageSrc]);

  // Re-process on sliders change
  useEffect(() => {
    processImage();
  }, [threshold, brightness, contrast, viewMode]);

  // Handle local file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAiAnalysisResult(null); // Clear previous AI analysis
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

  // Request server-side Gemini 3.5-flash vision analysis
  const requestGeminiAnalysis = async () => {
    const canvas = sourceCanvasRef.current;
    if (!canvas) return;

    const imageBase64 = canvas.toDataURL("image/jpeg", 0.85);

    setIsAnalyzing(true);
    setAiAnalysisResult(null);
    
    // Cycle status messages for premium feel
    let statusIdx = 0;
    setAiStatusText(aiStatusSteps[statusIdx]);
    const statusInterval = setInterval(() => {
      if (statusIdx < aiStatusSteps.length - 1) {
        statusIdx++;
        setAiStatusText(aiStatusSteps[statusIdx]);
      }
    }, 2800);

    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image: imageBase64,
          prompt: uploadMode ? "请仔细评估这盘上传培养物的汇合度和贴附健康状态。" : `当前选中的是：${selectedSample.title}。请核实评估结果。`
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "请求智能分析服务器失败");
      }

      setAiAnalysisResult(data);
    } catch (err: any) {
      console.error(err);
      alert("智能分析失败: " + err.message);
    } finally {
      clearInterval(statusInterval);
      setIsAnalyzing(false);
    }
  };

  // Save results to user's Local Log
  const saveToLabDiary = () => {
    const confluenceToSave = uploadMode ? calculatedConfluence : selectedSample.confluence;
    const notesToSave = uploadMode 
      ? (aiAnalysisResult?.morphologyCommentary || "自主镜检图像分析笔记")
      : `${selectedSample.title}: ${selectedSample.advice}`;

    const newLog = {
      id: "LOG-" + Date.now().toString().slice(-6),
      date: new Date().toLocaleDateString("zh-CN", {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      dishName: uploadMode ? "外源镜检录入" : `样品测定 #${selectedSample.id}`,
      passage: "P14",
      confluence: confluenceToSave,
      mediaStatus: "DMEM 高糖 + 10% FBS",
      cellStatus: confluenceToSave > 95 ? "Denser" : confluenceToSave > 70 ? "Healthy" : "Stressed",
      notes: notesToSave
    };

    const existingLogs = JSON.parse(localStorage.getItem('hff1_lab_logs') || '[]');
    localStorage.setItem('hff1_lab_logs', JSON.stringify([newLog, ...existingLogs]));
    
    // Broadcast event to refresh logs component
    window.dispatchEvent(new Event('hff1_logs_updated'));
    
    alert(`成功将细胞状态测定日志（汇合度：${confluenceToSave}%）保存至共享实验本！`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="sample-analyzer">
      {/* LEFT: Photo selector and microscopes feed */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-5 p-r-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600">
                <Microscope size={22} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">微观鏡检工作台</h2>
                <p className="text-xs text-slate-500">
                  {uploadMode ? "预览外源上传镜检图像并运行阈值分析" : "点击下方显微镜切片，分析HFF-1成纤维细胞分布"}
                </p>
              </div>
            </div>

            {/* Toggle view mode triggers */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button 
                id="view-orig"
                onClick={() => setViewMode('original')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${viewMode === 'original' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
              >
                原始明场
              </button>
              <button 
                id="view-binary"
                onClick={() => setViewMode('binary')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${viewMode === 'binary' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                测定掩膜
              </button>
              <button 
                id="view-contour"
                onClick={() => setViewMode('contour')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${viewMode === 'contour' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                描边缘线
              </button>
            </div>
          </div>

          {/* Micro Samples Selector */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6" id="sample-selector-grid">
            {HFF_SAMPLES.map((sample) => (
              <button
                key={sample.id}
                id={`btn-sample-${sample.id}`}
                onClick={() => {
                  setSelectedSample(sample);
                  setUploadMode(false);
                }}
                className={`relative overflow-hidden rounded-xl border p-2 text-left transition ${
                  !uploadMode && selectedSample.id === sample.id
                    ? 'border-sky-500 bg-sky-50/50 shadow-xs'
                    : 'border-slate-100 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 block uppercase">
                  片号 #{sample.id}
                </div>
                <div className="text-xs font-semibold text-slate-700 truncate mt-0.5">
                  {sample.confluence}% 汇合
                </div>
                <div className={`text-[9px] mt-1 inline-block px-1.5 py-0.5 rounded-md font-medium text-center ${
                  sample.state === 'exponential' ? 'bg-blue-100 text-blue-700' :
                  sample.state === 'dense' ? 'bg-emerald-100 text-emerald-700' :
                  sample.state === 'saturated' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  {sample.stateLabel}
                </div>
              </button>
            ))}
          </div>

          {/* Visual Workspace: Left original render (invisible source), Center active analyzed image */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 bg-slate-900 rounded-2xl p-6 relative overflow-hidden">
            {/* Real circular objective visualization */}
            <div className="relative w-[340px] h-[340px] sm:w-[380px] sm:h-[380px] bg-black rounded-full overflow-hidden shadow-2xl border-4 border-slate-700">
              {/* Actual source canvas (calculated in background / resized coordinates) */}
              <canvas 
                ref={sourceCanvasRef} 
                className="hidden" 
                width="450" 
                height="450" 
              />
              
              {/* Display Canvas with filter overlays applied */}
              <canvas 
                ref={displayCanvasRef} 
                className="w-full h-full object-cover"
                width="450" 
                height="450" 
              />

              {/* View mode HUD Badge inside telescope */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-mono text-white tracking-widest uppercase">
                {viewMode === 'original' && "💡 BF Brightfield"}
                {viewMode === 'binary' && "🧪 Binary Mask"}
                {viewMode === 'contour' && "🔬 Morphological Contours"}
              </div>

              {/* Confluence calculated dynamic percentage overlay */}
              <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-sky-400/40 shadow-lg text-center min-w-[140px]">
                <div className="text-[9px] text-slate-400 uppercase tracking-wider">测算汇合Confluence</div>
                <div className="text-xl font-bold bg-gradient-to-r from-sky-400 to-sky-200 bg-clip-text text-transparent">
                  {calculatedConfluence}%
                </div>
              </div>
            </div>

            {/* Sidebar quick tuning within workspace */}
            <div className="w-full md:w-56 space-y-4">
              <div className="bg-slate-850/80 backdrop-blur-md rounded-xl p-4 border border-slate-700/60 text-slate-200 text-xs space-y-3.5">
                <div className="flex items-center gap-2 text-slate-300 font-semibold border-b border-slate-700 pb-2 mb-2">
                  <Sliders size={14} className="text-sky-400" />
                  <span>定量图像细分</span>
                </div>

                {/* Slider Threshold */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[10px] text-slate-400">
                    <span>二值化阈值</span>
                    <span className="text-sky-400 font-bold">{threshold} L</span>
                  </div>
                  <input 
                    type="range" 
                    min="60" 
                    max="180" 
                    value={threshold}
                    onChange={(e) => setThreshold(parseInt(e.target.value))}
                    className="w-full accent-sky-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-500 pt-0.5 leading-tight">
                    增减该值可改变判定为细胞的暗度范围。高度拥挤细胞适宜提高阈值。
                  </div>
                </div>

                {/* Brightness */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[10px] text-slate-400">
                    <span>镜检亮度</span>
                    <span>{brightness}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="150" 
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full accent-slate-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[10px] text-slate-400">
                    <span>相差对比度</span>
                    <span>{contrast}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="20" 
                    max="180" 
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="w-full accent-slate-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Calibration advice button */}
                <button
                  id="reset-calib"
                  onClick={() => {
                    setThreshold(115);
                    setBrightness(100);
                    setContrast(100);
                  }}
                  className="w-full mt-1.5 py-1 text-center bg-slate-800 text-[10px] text-slate-400 border border-slate-700/85 hover:text-slate-200 rounded-lg transition"
                >
                  重置光学参数
                </button>
              </div>

              {/* Upload interface */}
              <div className="bg-slate-850/80 backdrop-blur-md rounded-xl p-4 border border-slate-700/60 space-y-3 text-slate-200">
                <div className="text-xs font-semibold text-slate-300">导入自主微观拍图</div>
                
                <label className="flex flex-col items-center justify-center border border-dashed border-slate-600 rounded-xl py-3 px-2 cursor-pointer hover:bg-slate-800/40 transition">
                  <Camera size={18} className="text-sky-400 mb-1" />
                  <span className="text-[10px] text-slate-400">选择或拖拽细胞图片</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                </label>

                {uploadMode && uploadedImageSrc && (
                  <div className="pt-1 flex items-center justify-between text-[10px] bg-slate-800/60 px-2 py-1.5 rounded-lg border border-slate-700">
                    <span className="text-emerald-400 font-semibold">● 外部样本已加载</span>
                    <button 
                      onClick={() => {
                        setUploadedImageSrc(null);
                        setUploadMode(false);
                      }}
                      className="text-slate-400 hover:text-slate-200 text-[8px] underline"
                    >
                      清除
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Analytical details & Gemini AI Integration */}
      <div className="lg:col-span-5 space-y-6">
        {/* Descriptive details card */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-5 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">
                {uploadMode ? "上传样本定量推断" : `显微样品测定 — #${selectedSample.id}`}
              </h3>
              <p className="text-xs text-slate-500">
                {uploadMode ? "系统前台基于实时图像直方图计算汇合度" : "经典 HFF-1 成纤维细胞群特征解读"}
              </p>
            </div>
          </div>

          {/* Morphological stats sheet */}
          <div className="grid grid-cols-2 gap-3" id="metric-grid">
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">原始测量汇合</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">
                {uploadMode ? calculatedConfluence : selectedSample.confluence}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {uploadMode ? "电脑视觉积分估计" : "图像基准真值"}
              </div>
            </div>

            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">生长状态分型</div>
              <div className="text-base font-semibold text-sky-700 mt-2 truncate">
                {uploadMode 
                  ? (calculatedConfluence > 95 ? "汇合过盛" : calculatedConfluence > 85 ? "融合晚期" : calculatedConfluence > 70 ? "旺盛生长期" : "低密度贴附期") 
                  : selectedSample.stateLabel
                }
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                成纤维生长周期定位
              </div>
            </div>
          </div>

          {/* Commentary blocks */}
          <div className="space-y-3.5 text-xs text-slate-600">
            <div className="space-y-1">
              <span className="font-semibold text-slate-800 block">🔬 微观形态描写:</span>
              <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-100/80 leading-relaxed text-slate-600">
                {uploadMode ? "贴附在基底上，形态大致为极性纺锤形或梭状长条，部分区域正在形成指纹样有序结构，贴壁牢固。" : selectedSample.description}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-800 block">🌱 下一步传代建议:</span>
              <p className="bg-sky-50/50 p-2.5 rounded-lg border border-sky-100/60 leading-relaxed text-slate-700">
                {uploadMode 
                  ? (calculatedConfluence > 90 
                      ? "汇合度在90%以上，应尽快安排胰酶消化（1-2分钟）传代。传代比例推荐1:3，DMEM+10%FBS培养基可于第3天再次形成连续致密层。" 
                      : "汇合度尚佳，可保持观察和每天的细胞换液，等待覆盖率达到85-90%时再安排标准传代程序。")
                  : selectedSample.advice
                }
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-1 border-t border-slate-100">
            <button
              id="save-log-btn"
              onClick={saveToLabDiary}
              className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Check size={14} />
              写入电子实验日志
            </button>
          </div>
        </div>

        {/* Gemini Pathological AI review box */}
        <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3.5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
                <BrainCircuit size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Gemini 智能病理审核</h3>
                <p className="text-[10px] text-slate-400">利用大语言模型微观视觉深度分析细胞状态</p>
              </div>
            </div>

            <button
              id="gemini-trigger"
              disabled={isAnalyzing}
              onClick={requestGeminiAnalysis}
              className="px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1 w-auto shadow-md shadow-sky-500/10 border-0 disabled:opacity-50 cursor-pointer"
            >
              {isAnalyzing ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <RefreshCw size={13} />
              )}
              {uploadMode ? "分析上传图像" : "核验当前样品"}
            </button>
          </div>

          {/* Hidden image element to allow uploaded base64 data to draw correctly */}
          {uploadedImageSrc && (
            <img 
              ref={hiddenImageRef} 
              src={uploadedImageSrc} 
              alt="uploaded hidden helper" 
              className="hidden" 
            />
          )}

          {/* AI Result placeholder or actual outcome */}
          {isAnalyzing ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3" id="ai-loading">
              <Loader2 size={32} className="text-sky-400 animate-spin" />
              <div className="space-y-1 z-10">
                <p className="text-xs text-sky-300 font-semibold animate-pulse">正在生成细胞审核处方...</p>
                <p className="text-[9px] text-slate-400 px-6 max-w-[280px]">
                  {aiStatusText}
                </p>
              </div>
            </div>
          ) : aiAnalysisResult ? (
            <div className="space-y-3 text-xs" id="ai-result">
              <div className="flex items-center gap-1.5 bg-slate-850 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px]">
                <span className="text-slate-400 uppercase tracking-widest text-[9px] font-mono">线系鉴定 (Line Verification):</span>
                <span className={`font-semibold ${aiAnalysisResult.isHFF1 ? "text-emerald-400" : "text-amber-400"}`}>
                  {aiAnalysisResult.isHFF1 ? "✓ 极为符合典型成纤维外观" : "⚠ 存在不一致或杂质形态"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-850 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px]">
                <span className="text-slate-400 uppercase tracking-widest text-[9px] font-mono">AI评定汇合 (AI Estimate):</span>
                <span className="font-bold text-sky-400">
                  {aiAnalysisResult.confluencePct}% AREA COVERED
                </span>
              </div>

              <div className="space-y-1.5 bg-slate-850/50 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-medium block text-[10px]">病理形态解读:</span>
                <p className="leading-relaxed text-slate-300 font-mono text-[11px]">
                  {aiAnalysisResult.morphologyCommentary}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-850 p-2 rounded-lg border border-slate-800 text-[10px]">
                  <span className="text-slate-400 block mb-0.5">密度等级:</span>
                  <span className="font-semibold text-slate-200">{aiAnalysisResult.confluenceEvaluation}</span>
                </div>
                <div className="bg-slate-850 p-2 rounded-lg border border-slate-800 text-[10px]">
                  <span className="text-slate-400 block mb-0.5">细胞处方建议:</span>
                  <span className="font-semibold text-sky-300">{aiAnalysisResult.cultureAdvice}</span>
                </div>
              </div>

              <div className="pt-2 text-[9px] text-slate-500 text-center">
                * 本分析基于 Gemini 3.5 多模大模型运行，测量数据及形态建议仅供细胞实验室科研参考
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl text-xs space-y-1">
              <BrainCircuit size={28} className="mx-auto text-slate-600 mb-1" />
              <p>尚未运行智能 AI 分析核对</p>
              <p className="text-[10px] text-slate-600">选择样品或上传自己的拍图，点击「核验当前样品」开始分析</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
