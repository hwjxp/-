import React, { useState } from 'react';

interface PDFViewerProps {
  title: string;
  fileSize?: string;
  coverImage?: string;
  onDownload?: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  title,
  fileSize = '45 MB',
  coverImage,
  onDownload,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 4;
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [fitMode, setFitMode] = useState<'actual' | 'width' | 'page'>('actual');

  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));
  const handleRotate = () => setRotation(r => (r + 90) % 360);

  const zoomIn = () => setZoomLevel(z => Math.min(250, z + 25));
  const zoomOut = () => setZoomLevel(z => Math.max(50, z - 25));
  const resetZoom = () => {
    setZoomLevel(100);
    setFitMode('actual');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-xl select-none">
      {/* Top Toolbar */}
      <div className="bg-slate-800 border-b border-slate-700 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200">
        {/* Left: Page Navigation */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showThumbnails 
                ? 'bg-indigo-600 text-white border-indigo-500' 
                : 'bg-slate-700/80 text-slate-300 border-slate-600 hover:bg-slate-700'
            }`}
            title="切换缩略图侧边栏"
          >
            <i className="fa-solid fa-table-cells text-xs"></i>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1"></div>

          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-bold transition-colors cursor-pointer"
            title="上一页"
          >
            <i className="fa-solid fa-chevron-left text-[11px]"></i>
          </button>

          <span className="font-mono font-bold px-2 py-0.5 bg-slate-900/60 rounded text-slate-300">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-bold transition-colors cursor-pointer"
            title="下一页"
          >
            <i className="fa-solid fa-chevron-right text-[11px]"></i>
          </button>
        </div>

        {/* Center: Zoom Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={zoomOut}
            className="w-7 h-7 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            title="缩小"
          >
            <i className="fa-solid fa-magnifying-glass-minus text-[11px]"></i>
          </button>
          
          <button
            onClick={resetZoom}
            className="px-2 py-1 bg-slate-900/60 hover:bg-slate-900 rounded font-mono font-bold text-indigo-400 cursor-pointer text-xs"
            title="点击恢复 100%"
          >
            {zoomLevel}%
          </button>

          <button
            onClick={zoomIn}
            className="w-7 h-7 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            title="放大"
          >
            <i className="fa-solid fa-magnifying-glass-plus text-[11px]"></i>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block"></div>

          <button
            onClick={handleRotate}
            className="w-7 h-7 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors cursor-pointer hidden sm:flex"
            title="顺时针旋转 90°"
          >
            <i className="fa-solid fa-rotate-right text-[11px]"></i>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/80 font-bold hidden md:inline-block">
            PDF 1.7 · {fileSize}
          </span>
          {onDownload && (
            <button
              onClick={onDownload}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center space-x-1 transition-colors cursor-pointer"
              title="下载源 PDF"
            >
              <i className="fa-solid fa-download text-[11px]"></i>
              <span className="hidden sm:inline">下载</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative bg-slate-950/90">
        {/* Left Thumbnails Drawer */}
        {showThumbnails && (
          <div className="w-28 sm:w-36 bg-slate-900/95 border-r border-slate-800 p-2 overflow-y-auto custom-scrollbar space-y-3 shrink-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">页面列表</p>
            {[1, 2, 3, 4].map(pg => (
              <div
                key={pg}
                onClick={() => setCurrentPage(pg)}
                className={`group cursor-pointer rounded-lg p-1.5 border transition-all ${
                  currentPage === pg 
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-sm' 
                    : 'border-slate-800 hover:border-slate-700 bg-slate-800/50'
                }`}
              >
                <div className="aspect-[3/4] bg-white rounded flex items-center justify-center text-slate-800 text-[9px] font-mono shadow-xs overflow-hidden relative">
                  <div className="absolute inset-0 p-1.5 flex flex-col justify-between opacity-80 pointer-events-none">
                    <div className="space-y-1">
                      <div className="h-1 bg-slate-300 rounded w-3/4"></div>
                      <div className="h-1 bg-slate-200 rounded w-full"></div>
                      <div className="h-1 bg-slate-200 rounded w-1/2"></div>
                    </div>
                    {coverImage && pg === 1 && (
                      <img src={coverImage} alt="" className="w-full h-8 object-cover rounded opacity-75" />
                    )}
                    <span className="text-[8px] text-slate-400 font-bold self-end">{pg}</span>
                  </div>
                </div>
                <p className="text-center text-[10px] font-mono mt-1 text-slate-400 group-hover:text-slate-200 font-bold">
                  第 {pg} 页
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Center PDF Viewport */}
        <div className="flex-1 overflow-auto custom-scrollbar flex items-center justify-center p-4 sm:p-8">
          <div
            style={{
              transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
            }}
            className="bg-white text-slate-900 rounded-lg shadow-2xl p-6 sm:p-10 w-full max-w-xl aspect-[1/1.414] relative flex flex-col justify-between overflow-hidden"
          >
            {/* Watermark / Header */}
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  <i className="fa-solid fa-file-pdf"></i>
                </div>
                <span className="text-xs font-black tracking-wider uppercase text-slate-800">
                  BRAND VI & PRODUCTION SPECIFICATIONS
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">CONFIDENTIAL</span>
            </div>

            {/* Page Dynamic Content */}
            <div className="my-auto space-y-4 py-4">
              {currentPage === 1 && (
                <div className="space-y-4">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">CHAPTER 01</span>
                    <h2 className="text-lg font-black text-slate-900 mt-1">{title}</h2>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      本技术文档为官方授权与物料生产执行标准手册。包含色彩规范、刀模工艺与质检准则。
                    </p>
                  </div>
                  {coverImage && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 aspect-[16/9] shadow-inner bg-slate-100">
                      <img src={coverImage} alt={title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>文档格式: PDF / X-4:2010</div>
                    <div>色彩管理: CMYK FOGRA39</div>
                    <div>输出分辨率: 300 DPI 矢量</div>
                    <div>核对状态: 已通过华纳官方签署</div>
                  </div>
                </div>
              )}

              {currentPage === 2 && (
                <div className="space-y-3 text-xs">
                  <h3 className="font-bold text-slate-800 flex items-center gap-1.5 border-b pb-1.5">
                    <i className="fa-solid fa-palette text-indigo-600"></i>
                    <span>标准色值与印刷色盘规范 (Pantone Matching System)</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2.5 rounded-lg bg-amber-500 text-white font-mono text-[10px] shadow-xs">
                      <p className="font-black">PANTONE 123 C</p>
                      <p className="text-[9px] opacity-90 mt-1">C0 M24 Y94 K0</p>
                      <p className="text-[9px] opacity-90">#FFC72C</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-red-700 text-white font-mono text-[10px] shadow-xs">
                      <p className="font-black">PANTONE 200 C</p>
                      <p className="text-[9px] opacity-90 mt-1">C0 M100 Y63 K12</p>
                      <p className="text-[9px] opacity-90">#BA0C2F</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-800 text-white font-mono text-[10px] shadow-xs">
                      <p className="font-black">PANTONE 349 C</p>
                      <p className="text-[9px] opacity-90 mt-1">C90 M0 Y100 K40</p>
                      <p className="text-[9px] opacity-90">#046A38</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800 text-white font-mono text-[10px] shadow-xs">
                      <p className="font-black">PANTONE 426 C</p>
                      <p className="text-[9px] opacity-90 mt-1">C94 M77 Y53 K94</p>
                      <p className="text-[9px] opacity-90">#25282A</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pt-2">
                    注：印刷时请使用德国海德堡 8 色印刷机，实物色差 ΔE 必须严格控制在 ≤ 1.5 范围内。
                  </p>
                </div>
              )}

              {currentPage === 3 && (
                <div className="space-y-3 text-xs">
                  <h3 className="font-bold text-slate-800 flex items-center gap-1.5 border-b pb-1.5">
                    <i className="fa-solid fa-shapes text-indigo-600"></i>
                    <span>包装刀模线与出血位工程剖析图 (Die-Cut Blueprint)</span>
                  </h3>
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center space-y-2">
                    <div className="w-48 h-28 border-2 border-red-500 relative flex items-center justify-center bg-white shadow-xs">
                      <div className="absolute inset-1 border border-dashed border-blue-500"></div>
                      <span className="text-[10px] font-mono text-slate-500">主展示面 (Front Panel)</span>
                      <span className="absolute -top-3.5 right-1 text-[9px] font-mono text-red-600 font-bold bg-white px-1">出血 3.0mm</span>
                      <span className="absolute -bottom-3.5 left-1 text-[9px] font-mono text-blue-600 font-bold bg-white px-1">压痕折线</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1">
                    <p>• 红色实线：外轮廓模切线（Cut Line）</p>
                    <p>• 蓝色虚线：对折内压痕线（Crease Line）</p>
                    <p>• 绿色点线：烫金工艺遮罩层（Hot Stamping Foil Layer）</p>
                  </div>
                </div>
              )}

              {currentPage === 4 && (
                <div className="space-y-3 text-xs">
                  <h3 className="font-bold text-slate-800 flex items-center gap-1.5 border-b pb-1.5">
                    <i className="fa-solid fa-stamp text-indigo-600"></i>
                    <span>品牌授权签署与最终审核确认章 (Sign-off & QC)</span>
                  </h3>
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800">终审状态: APPROVED</span>
                      <span className="text-[10px] font-mono text-emerald-700">2024-05-18 16:30</span>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      所有版面设计、矢量线条与印刷打样测试均已通过知识产权法务部门与创意监修组审阅，准予下发量产线。
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <div className="text-[10px] font-mono text-slate-400">
                      SUPER PICOOL ASSET MANAGEMENT SYSTEM
                    </div>
                    <div className="w-16 h-16 rounded-full border-2 border-red-500/70 text-red-600 flex flex-col items-center justify-center rotate-[-12deg] text-[9px] font-black leading-tight">
                      <span>AUDIT</span>
                      <span>PASSED</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>PAGE {currentPage} OF {totalPages}</span>
              <span>ISO 216 STANDARD A4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
