import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser with 25MB limit for cell micro-imaging uploads
  app.use(express.json({ limit: "25mb" }));

  // Initialize the Google GenAI SDK
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API endpoint for analyzing cell culture micrographs
  app.post("/api/gemini/analyze", async (req, res) => {
    try {
      const { image, prompt } = req.body;
      if (!image) {
        return res.status(400).json({ error: "未检测到图像数据，请上传微观镜检图。" });
      }

      if (!apiKey) {
        return res.status(500).json({ 
          error: "未检测到 GEMINI_API_KEY，请确保在 AI Studio 侧边的 Secrets 面板中设置了 API 密钥。" 
        });
      }

      // Check for base64 image prefixes
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let mimeType = "image/png";
      let base64Data = image;

      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Data = matches[2];
      }

      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      };

      const defaultPrompt = `你是一位严谨的资深细胞生物学专家。请分析这张HFF-1（人皮肤成纤维细胞）的显微镜图像：
1. 评估其形态：成纤维细胞通常呈纺锤形、扁平星状，两端或多端有突起，核大、轮廓清楚。请评估画面中细胞是否符合HFF-1典型的健康形态。
2. 估计细胞汇合度 (Confluence)：即细胞在培养表面所占面积百分比（0-100的整数）。
3. 细胞状态评估：判断现在是处于「对数生长早期」、「对数生长中期（最适合实验）」、「完全汇合（需要立即传代）」还是「过度生长/开始老化」。
4. 给出具体的下一步培养建议。
请生成以下JSON格式结果，并且所有分析和建议必须使用中文，语气专业客观：`;

      const textPart = {
        text: prompt ? `${defaultPrompt}\n\n附加提示语/要求: ${prompt}` : defaultPrompt,
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isHFF1: {
                type: Type.BOOLEAN,
                description: "是否呈现符合HFF-1成纤维细胞形态的细胞"
              },
              confluencePct: {
                type: Type.INTEGER,
                description: "估计的细胞汇合度百分比(数值在0到100之间)"
              },
              morphologyCommentary: {
                type: Type.STRING,
                description: "对细胞形态、排列完整度、细胞核状态及贴附状况的专业中文描述"
              },
              confluenceEvaluation: {
                type: Type.STRING,
                description: "对当前培养密度的评估，例如「低密度生长」、「中等贴附期」、「完全汇合/饱和传代期」等"
              },
              cultureAdvice: {
                type: Type.STRING,
                description: "为科研工作者提供的下一步操作建议，如：立即传代（1:3）、更换培养基、维持观察或可用于细胞实验"
              }
            },
            required: ["isHFF1", "confluencePct", "morphologyCommentary", "confluenceEvaluation", "cultureAdvice"],
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("模型未返回非空结果。");
      }

      const parsedResult = JSON.parse(text.trim());
      res.json(parsedResult);
    } catch (error: any) {
      console.error("Gemini analysis server-side error:", error);
      res.status(500).json({ 
        error: error?.message || "服务器在运行 Gemini 分析期间遇到错误。" 
      });
    }
  });

  // Serve static assets and forward roots to Vite in Development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production bundle static files path
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CellAnalyzer Server] Server started, running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start custom backend server:", err);
});
