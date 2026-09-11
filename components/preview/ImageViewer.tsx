import React, { useState, useRef, useEffect } from 'react';

interface ImageViewerProps {
  src: string;
  alt: string;
  format?: string;
  fileSize?: string;
  dimensions?: string;
  onFullscreen?: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  src,
  alt,
  format = 'PNG',
  fileSize = '48 MB',
  dimensions = '6000 × 4000 px',
  onFullscreen,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isFlippedH, setIsFlippedH] = useState<boolean>(false);
  const [isFlippedV, setIsFlippedV] = useState<boolean>(false);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showCheckerboard, setShowCheckerboard] = useState<boolean>(true);
  const [showInfoHud, setShowInfoHud] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset transform
  const resetTransform = () => {
    setZoom(100);
    setRotation(0);
    setIsFlippedH(false);
    setIsFlippedV(false);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setZoom(z => Math.min(500, z + 25));
  const handleZoomOut = () => setZoom(z => Math.max(10, z - 25));
  const handleFit = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };
  const handleActualPixels = () => {
    setZoom(200);
    setPan({ x: 0, y: 0 });
  };

  // Rotate
  const handleRotateCW = () => setRotation(r => (r + 90) % 360);
  const handleRotateCCW = () => setRotation(r => (r - 90 + 360) % 360);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom(z => Math.min(500, z + 15));
    } else {
      setZoom(z => Math.max(10, z - 15));
    }
  };

  // Mouse drag pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pan & pinch support for mobile
  const touchState = useRef<{
    startDistance: number;
    startZoom: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  }>({
    startDistance: 0,
    startZoom: 100,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchState.current.startX = e.touches[0].clientX - pan.x;
      touchState.current.startY = e.touches[0].clientY - pan.y;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchState.current.startDistance = Math.hypot(dx, dy);
      touchState.current.startZoom = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setPan({
        x: e.touches[0].clientX - touchState.current.startX,
        y: e.touches[0].clientY - touchState.current.startY,
      });
    } else if (e.touches.length === 2 && touchState.current.startDistance > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / touchState.current.startDistance;
      const newZoom = Math.min(500, Math.max(20, Math.round(touchState.current.startZoom * ratio)));
      setZoom(newZoom);
    }
  };

  return (
    <div 
      className="relative w-full h-full flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 select-none shadow-xl"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        {/* Left Format & Specs Pill */}
        <div className="flex items-center space-x-1.5 pointer-events-auto bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 shadow-md text-slate-200">
          <span className="font-mono text-[11px] font-bold text-indigo-400">
            .{format.toUpperCase()}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] font-mono text-slate-300 font-bold">{fileSize}</span>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">{dimensions}</span>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center space-x-1.5 pointer-events-auto bg-slate-900/85 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-700 shadow-md text-slate-300 text-xs">
          {/* Transparency Grid Toggle */}
          <button
            onClick={() => setShowCheckerboard(!showCheckerboard)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              showCheckerboard ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="切换透明棋盘格背景 (PNG / SVG 透明通道检查)"
          >
            <i className="fa-solid fa-chess-board text-[11px]"></i>
          </button>

          {/* Info HUD */}
          <button
            onClick={() => setShowInfoHud(!showInfoHud)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              showInfoHud ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="查看图像参数与色彩信息"
          >
            <i className="fa-solid fa-circle-info text-[11px]"></i>
          </button>

          <div className="w-px h-4 bg-slate-700 my-auto"></div>

          {/* Fullscreen if handler provided */}
          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="w-7 h-7 hover:bg-slate-800 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-slate-300 hover:text-white"
              title="全屏预览"
            >
              <i className="fa-solid fa-expand text-[11px]"></i>
            </button>
          )}
        </div>
      </div>

      {/* Info HUD Panel */}
      {showInfoHud && (
        <div className="absolute top-14 left-3 z-30 w-64 bg-slate-900/95 backdrop-blur-lg border border-slate-700 rounded-xl p-3 shadow-2xl text-slate-200 text-xs space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold flex items-center gap-1.5 text-indigo-400">
              <i className="fa-solid fa-sliders text-[10px]"></i>
              <span>图像参数检查</span>
            </span>
            <button 
              onClick={() => setShowInfoHud(false)}
              className="text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">分辨率:</span>
              <span className="font-bold text-slate-200">{dimensions}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">色彩空间:</span>
              <span className="text-emerald-400 font-bold">Display P3 (Wide)</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">输出 DPI:</span>
              <span className="text-slate-200">300 DPI 印刷级</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">Alpha 通道:</span>
              <span className="text-indigo-400">支持 8-bit 透明</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">文件大小:</span>
              <span className="text-slate-200">{fileSize}</span>
            </div>
          </div>
        </div>
      )}

      {/* Center Image Canvas */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className={`flex-1 w-full h-full relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing ${
          showCheckerboard 
            ? 'bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] [background-size:20px_20px] [background-position:0_0,0_10px,10px_-10px,-10px_0px] bg-slate-950'
            : 'bg-slate-950'
        }`}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100}) rotate(${rotation}deg) scaleX(${isFlippedH ? -1 : 1}) scaleY(${isFlippedV ? -1 : 1})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.12s ease-out',
          }}
          className="max-w-[90%] max-h-[90%] flex items-center justify-center select-none pointer-events-none"
        >
          <img
            src={src}
            alt={alt}
            className="max-h-[60vh] sm:max-h-[70vh] object-contain rounded-lg shadow-2xl drop-shadow-md select-none"
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom Floating Toolbar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700 shadow-xl flex items-center space-x-1 sm:space-x-2 text-slate-300 text-xs">
        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="w-7 h-7 hover:bg-slate-800 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-slate-300 hover:text-white"
          title="缩小 (快捷滚动滑轮向下)"
        >
          <i className="fa-solid fa-minus text-[11px]"></i>
        </button>

        {/* Zoom Percentage / Reset */}
        <button
          onClick={handleFit}
          className="px-2 py-0.5 rounded-md hover:bg-slate-800 font-mono font-bold text-indigo-400 text-xs cursor-pointer"
          title="点击重置缩放与位置"
        >
          {zoom}%
        </button>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="w-7 h-7 hover:bg-slate-800 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-slate-300 hover:text-white"
          title="放大 (快捷滚动滑轮向上)"
        >
          <i className="fa-solid fa-plus text-[11px]"></i>
        </button>

        <div className="w-px h-4 bg-slate-700 mx-0.5"></div>

        {/* Fit to Screen */}
        <button
          onClick={handleFit}
          className="px-2 py-1 hover:bg-slate-800 rounded-lg flex items-center space-x-1 text-[11px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="适应窗口"
        >
          <i className="fa-solid fa-compress text-[10px]"></i>
          <span className="hidden sm:inline">自适应</span>
        </button>

        {/* 1:1 Actual Pixels */}
        <button
          onClick={handleActualPixels}
          className="px-2 py-1 hover:bg-slate-800 rounded-lg text-[11px] font-mono font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="100% 原始像素呈现"
        >
          1:1
        </button>

        <div className="w-px h-4 bg-slate-700 mx-0.5"></div>

        {/* Rotate CCW */}
        <button
          onClick={handleRotateCCW}
          className="w-7 h-7 hover:bg-slate-800 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-slate-300 hover:text-white"
          title="逆时针旋转 90°"
        >
          <i className="fa-solid fa-rotate-left text-[11px]"></i>
        </button>

        {/* Rotate CW */}
        <button
          onClick={handleRotateCW}
          className="w-7 h-7 hover:bg-slate-800 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-slate-300 hover:text-white"
          title="顺时针旋转 90°"
        >
          <i className="fa-solid fa-rotate-right text-[11px]"></i>
        </button>

        {/* Flip Horizontal */}
        <button
          onClick={() => setIsFlippedH(!isFlippedH)}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            isFlippedH ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
          }`}
          title="水平翻转镜像"
        >
          <i className="fa-solid fa-arrows-left-right text-[11px]"></i>
        </button>

        {/* Reset All */}
        <button
          onClick={resetTransform}
          className="w-7 h-7 hover:bg-slate-800 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-slate-400 hover:text-slate-200"
          title="重置视角"
        >
          <i className="fa-solid fa-arrow-rotate-left text-[11px]"></i>
        </button>
      </div>
    </div>
  );
};
