import { useState, useRef, useCallback } from "react";
import { Upload, Trash2 } from "lucide-react";
import CodePreview from "../components/CodePreview";
import { useT } from "../i18n/LanguageContext";

export default function Video2Code() {
  const t = useT();
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [code, setCode] = useState("");
  const [fps, setFps] = useState(10);
  const [width, setWidth] = useState(128);
  const [height, setHeight] = useState(64);
  const [format, setFormat] = useState<"MONO" | "RGB565">("MONO");
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const vid = document.createElement("video");
    vid.src = url;
    vid.muted = true;
    vid.onloadedmetadata = () => {
      videoRef.current = vid;
      setVideo(vid);
      setWidth(vid.videoWidth);
      setHeight(vid.videoHeight);
    };
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleGenerate = async () => {
    const vid = videoRef.current;
    if (!vid) return;
    setGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const frameInterval = 1 / fps;
    const duration = vid.duration || 5;
    const totalFrames = Math.floor(duration * fps);
    const frames: string[] = [];

    for (let i = 0; i < totalFrames; i++) {
      vid.currentTime = i * frameInterval;
      await new Promise<void>((resolve) => {
        vid.onseeked = () => {
          ctx.drawImage(vid, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const pixels = imageData.data;
          let frameStr = "  {";
          if (format === "MONO") {
            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x += 8) {
                let byte = 0;
                for (let b = 0; b < 8; b++) {
                  const idx = (y * width + (x + b)) * 4;
                  const gray = pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114;
                  byte = (byte << 1) | (gray > 128 ? 1 : 0);
                }
                frameStr += "0x" + byte.toString(16).padStart(2, "0") + ", ";
              }
            }
          } else {
            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
                const rgb565 = ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
                frameStr += "0x" + rgb565.toString(16).padStart(4, "0") + ", ";
              }
            }
          }
          frameStr += "}";
          frames.push(frameStr);
          resolve();
        };
      });
    }

    const bytesPerFrame = format === "MONO" ? width * height / 8 : width * height * 2;
    const result = "// " + totalFrames + " frames, " + fps + " fps, " + width + "x" + height + "\n" +
      "const uint8_t video_frames[" + totalFrames + "][" + bytesPerFrame + "] = {\n" +
      frames.join(",\n") + "\n};";
    setCode(result);
    setGenerating(false);
  };

  return (
    <div className="flex h-full">
      <div className="w-80 flex-shrink-0 border-r overflow-y-auto p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
        <h2 className="text-lg font-semibold mb-4">{t("video.title")}</h2>

        <div
          onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer mb-4 transition-colors hover:opacity-80"
          style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
        >
          <Upload size={24} className="mx-auto mb-2" />
          <p className="text-xs">{t("video.drop")}</p>
          <input ref={fileRef} type="file" accept="video/*,image/gif" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>

        {video && (
          <button onClick={() => { videoRef.current = null; setVideo(null); setCode(""); }}
            className="w-full flex items-center justify-center gap-1 py-1.5 rounded text-xs mb-4"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
            <Trash2 size={12} /> {t("video.clear")}
          </button>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("video.format")}</label>
            <select value={format} onChange={(e) => setFormat(e.target.value as "MONO" | "RGB565")}
              className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
              <option value="MONO">{t("video.format.mono")}</option>
              <option value="RGB565">{t("video.format.rgb565")}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("video.fps")}</label>
            <input type="number" value={fps} onChange={(e) => setFps(Number(e.target.value))}
              className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("video.width")}</label>
              <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("video.height")}</label>
              <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            </div>
          </div>

          <button onClick={handleGenerate} disabled={!video || generating}
            className="w-full py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}>
            {generating ? t("video.generating") : t("video.generate")}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <canvas ref={canvasRef} className="hidden" />
        {code ? (
          <CodePreview code={code} filename="video_frames.h" />
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>
            {t("video.placeholder")}
          </div>
        )}
      </div>
    </div>
  );
}
