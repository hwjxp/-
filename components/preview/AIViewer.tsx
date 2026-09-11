import React, { useState } from 'react';

interface AIViewerProps {
  title: string;
  thumbnail: string;
  fileSize?: string;
  onDownload?: () => void;
}

interface Artboard {
  id: number;
  name: string;
  dimensions: string;
}

interface ColorSwatch {
  name: string;
  pantone: string;
  hex: string;
  cmyk: string;
}

const ARTBOARDS: Artboard[] = [
  { id: 1, name: '画板 1: 官方标准全彩矢量稿', dimensions: '800 × 600 pt' },
  { id: 2, name: '画板 2: 品牌单色反白与轮廓稿', dimensions: '800 × 600 pt' },
  { id: 3, name: '画板 3: 特殊工艺烫金与局部 UV 层', dimensions: '800 × 600 pt' },
];

const SWATCHES: ColorSwatch[] = [
  { name: '格兰芬多金', pantone: 'PANTONE 123 C', hex: '#FFC72C', cmyk: 'C0 M24 Y94 K0' },
  { name: '格兰芬多红', pantone: 'PANTONE 200 C', hex: '#BA0C2F', cmyk: 'C0 M100 Y63 K12' },
  { name: '斯莱特林绿', pantone: 'PANTONE 349 C', hex: '#046A38', cmyk: 'C90 M0 Y100 K40' },
  { name: '拉文克劳蓝', pantone: 'PANTONE 281 C', hex: '#00205B', cmyk: 'C100 M85 Y5 K36' },
  { name: '金属纯黑', pantone: 'PANTONE Black C', hex: '#2D2926', cmyk: 'C0 M0 Y0 K100' },
];

export const AIViewer: React.FC<AIViewerProps> = ({
  title,
  thumbnail,
  fileSize = '48 MB',
  onDownload,
}) => {
  const [isOutlineMode, setIsOutlineMode] = useState<boolean>(false); // Ctrl+Y mode
  const [currentArtboard, setCurrentArtboard] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(100);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [showSwatches, setShowSwatches] = useState<boolean>(true);

  const handleCopy = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-700 shadow-xl select-none">
      {/* Illustrator Top Toolbar */}
      <div className="bg-[#2a1c0c] border-b border-amber-900/60 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-100">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 rounded bg-[#ff9a00]/20 text-[#ff9a00] border border-[#ff9a00]/40 flex items-center justify-center font-black text-xs font-mono">
            Ai
          </span>
          <span className="font-bold text-slate-100 truncate max-w-xs">{title}</span>
          <span className="font-mono text-[10px] text-amber-400/80 bg-black/40 px-2 py-0.5 rounded border border-amber-800/40">
            @ {zoom}% (矢量贝塞尔曲线 · CMYK)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Outline Mode Toggle (Ctrl+Y) */}
          <button
            onClick={() => setIsOutlineMode(!isOutlineMode)}
            className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              isOutlineMode 
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm' 
                : 'bg-black/40 text-amber-200 border-amber-800/60 hover:bg-black/60'
            }`}
            title="切换轮廓模式 (Ctrl+Y 观察矢量路径与锚点)"
          >
            <i className={`fa-solid ${isOutlineMode ? 'fa-bezier-curve' : 'fa-pen-nib'} text-[11px]`}></i>
            <span>{isOutlineMode ? '轮廓模式 (Outline)' : 'GPU 渲染 (Preview)'}</span>
          </button>

          {/* Artboard Switcher */}
          <div className="flex items-center space-x-1 bg-black/40 px-2 py-1 rounded-lg border border-amber-800/60 text-xs">
            <span className="text-amber-400 font-bold mr-1 hidden sm:inline">画板:</span>
            {ARTBOARDS.map(ab => (
              <button
                key={ab.id}
                onClick={() => setCurrentArtboard(ab.id)}
                className={`w-6 h-6 rounded font-mono font-bold text-xs transition-colors cursor-pointer ${
                  currentArtboard === ab.id 
                    ? 'bg-[#ff9a00] text-slate-900' 
                    : 'text-amber-200 hover:bg-white/10'
                }`}
                title={ab.name}
              >
                {ab.id}
              </button>
            ))}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center space-x-1 bg-black/40 px-1.5 py-0.5 rounded-lg border border-amber-800/60">
            <button
              onClick={() => setZoom(z => Math.max(50, z - 25))}
              className="w-6 h-6 hover:bg-white/10 rounded text-amber-200 flex items-center justify-center cursor-pointer"
            >
              <i className="fa-solid fa-minus text-[10px]"></i>
            </button>
            <span className="font-mono text-[11px] font-bold text-amber-300 px-1">{zoom}%</span>
            <button
              onClick={() => setZoom(z => Math.min(400, z + 25))}
              className="w-6 h-6 hover:bg-white/10 rounded text-amber-200 flex items-center justify-center cursor-pointer"
            >
              <i className="fa-solid fa-plus text-[10px]"></i>
            </button>
          </div>

          {/* Color swatches drawer toggle */}
          <button
            onClick={() => setShowSwatches(!showSwatches)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showSwatches ? 'bg-amber-600 text-white border-amber-500' : 'bg-black/40 text-amber-300 border-amber-800/60 hover:bg-black/60'
            }`}
            title="切换色板检查器"
          >
            <i className="fa-solid fa-swatchbook text-xs"></i>
          </button>

          {onDownload && (
            <button
              onClick={onDownload}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold flex items-center space-x-1 transition-colors cursor-pointer"
              title="下载矢量 AI 原文件"
            >
              <i className="fa-solid fa-download text-[11px]"></i>
              <span className="hidden sm:inline">下载 AI</span>
            </button>
          )}
        </div>
      </div>

      {/* Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative bg-[#1c1815]">
        {/* Center Vector Canvas */}
        <div className="flex-1 overflow-auto custom-scrollbar flex items-center justify-center p-4 sm:p-8">
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
            }}
            className={`relative rounded shadow-2xl p-8 max-h-[62vh] aspect-[4/3] flex items-center justify-center transition-colors border ${
              isOutlineMode 
                ? 'bg-white border-slate-400' 
                : currentArtboard === 2 
                  ? 'bg-slate-900 border-slate-700' 
                  : 'bg-white border-slate-300'
            }`}
          >
            {/* Outline Mode (Ctrl+Y) Vector wireframe simulation */}
            {isOutlineMode ? (
              <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                {/* SVG vector path lines and anchors */}
                <svg className="w-full h-full" viewBox="0 0 400 300">
                  <rect x="20" y="20" width="360" height="260" fill="none" stroke="#000" strokeWidth="0.8" strokeDasharray="4 2" />
                  <circle cx="200" cy="140" r="90" fill="none" stroke="#000" strokeWidth="1" />
                  <path d="M 140 140 Q 200 60 260 140 T 200 230 Z" fill="none" stroke="#000" strokeWidth="1.2" />
                  <path d="M 170 120 L 230 120 L 200 180 Z" fill="none" stroke="#000" strokeWidth="1" />
                  {/* Anchors (Illustrator blue control points) */}
                  <rect x="198" y="58" width="4" height="4" fill="#00f" stroke="#fff" strokeWidth="0.5" />
                  <rect x="138" y="138" width="4" height="4" fill="#00f" stroke="#fff" strokeWidth="0.5" />
                  <rect x="258" y="138" width="4" height="4" fill="#00f" stroke="#fff" strokeWidth="0.5" />
                  <rect x="198" y="228" width="4" height="4" fill="#00f" stroke="#fff" strokeWidth="0.5" />
                  <rect x="168" y="118" width="4" height="4" fill="#00f" stroke="#fff" strokeWidth="0.5" />
                  <rect x="228" y="118" width="4" height="4" fill="#00f" stroke="#fff" strokeWidth="0.5" />
                  <rect x="198" y="178" width="4" height="4" fill="#00f" stroke="#fff" strokeWidth="0.5" />
                </svg>
                <div className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 rounded font-mono text-[9px] font-bold">
                  贝塞尔曲线路径 (Paths: 428 / 锚点: 1,842)
                </div>
              </div>
            ) : (
              /* Full Colored Render */
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={thumbnail}
                  alt={title}
                  className={`max-h-[88%] object-contain rounded drop-shadow-md filter ${
                    currentArtboard === 2 ? 'invert brightness-125' : ''
                  }`}
                />
                {currentArtboard === 3 && (
                  <div className="absolute inset-0 bg-amber-500/20 mix-blend-color-dodge pointer-events-none flex items-center justify-center">
                    <span className="bg-black/70 text-amber-300 font-mono text-[10px] font-bold px-3 py-1 rounded-full border border-amber-400">
                      烫金工艺遮罩已叠加 (Hot Stamping Foil Preview)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Artboard Border & Dimensions Pill */}
            <div className="absolute -top-3 left-4 bg-slate-800 text-slate-300 font-mono text-[9px] px-2 py-0.5 rounded border border-slate-600 font-bold">
              {ARTBOARDS[currentArtboard - 1].name} · {ARTBOARDS[currentArtboard - 1].dimensions}
            </div>
          </div>
        </div>

        {/* Right Swatches Palette Panel */}
        {showSwatches && (
          <div className="w-64 bg-[#231b14] border-l border-amber-900/50 flex flex-col shrink-0 text-slate-300 text-xs">
            <div className="p-3 bg-[#1c150f] border-b border-amber-900/50 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-bold text-amber-200">
                <i className="fa-solid fa-palette text-amber-500 text-xs"></i>
                <span>矢量专色盘 (Swatches)</span>
              </div>
              <span className="text-[10px] font-mono text-amber-400/80">Pantone®</span>
            </div>

            <div className="p-3 space-y-2.5 flex-1 overflow-y-auto custom-scrollbar">
              <p className="text-[11px] text-amber-200/60 leading-relaxed">
                点击颜色可复制色值，印刷下发时将严格锁定该 PANTONE 编号：
              </p>

              {SWATCHES.map((swatch, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCopy(swatch.hex)}
                  className="bg-black/30 hover:bg-black/60 border border-amber-900/40 hover:border-amber-500/60 rounded-xl p-2.5 cursor-pointer transition-all flex items-center space-x-3 group"
                >
                  <div
                    style={{ backgroundColor: swatch.hex }}
                    className="w-9 h-9 rounded-lg shadow-sm border border-white/20 shrink-0"
                  ></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-amber-100 text-xs truncate">{swatch.name}</p>
                      <span className="text-[10px] font-mono font-bold text-amber-400 group-hover:underline">
                        {copiedHex === swatch.hex ? '已复制 ✓' : swatch.hex}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-amber-300/80">{swatch.pantone}</p>
                    <p className="text-[9px] font-mono text-slate-400">{swatch.cmyk}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#1c150f] border-t border-amber-900/50 text-[11px] font-mono text-amber-300/70 space-y-1">
              <div className="flex justify-between">
                <span>矢量对象:</span>
                <span className="text-amber-100 font-bold">100% 路径无光栅化</span>
              </div>
              <div className="flex justify-between">
                <span>文字转曲:</span>
                <span className="text-emerald-400 font-bold">已转曲 (Create Outlines)</span>
              </div>
              <div className="flex justify-between">
                <span>文件大小:</span>
                <span className="text-amber-100">{fileSize}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
