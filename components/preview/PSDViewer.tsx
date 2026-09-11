import React, { useState } from 'react';

interface PSDLayer {
  id: string;
  name: string;
  type: 'pixel' | 'text' | 'vector' | 'adjustment' | 'group';
  visible: boolean;
  opacity: number;
  blendMode: string;
  colorTag?: string;
  hasMask?: boolean;
}

interface PSDViewerProps {
  title: string;
  thumbnail: string;
  fileSize?: string;
  dimensions?: string;
  onDownload?: () => void;
}

const DEFAULT_PSD_LAYERS: PSDLayer[] = [
  { id: 'l-adj', name: '曲线调色 & 色相饱和度 [调整层]', type: 'adjustment', visible: true, opacity: 90, blendMode: 'Normal', colorTag: '#ec4899' },
  { id: 'l-glow', name: '魔法光晕特效粒子 [FX]', type: 'pixel', visible: true, opacity: 85, blendMode: 'Screen', colorTag: '#f59e0b' },
  { id: 'l-title', name: '主标题烫金排版矢量字', type: 'text', visible: true, opacity: 100, blendMode: 'Normal', colorTag: '#6366f1' },
  { id: 'l-char', name: '角色立绘高清精修层', type: 'pixel', visible: true, opacity: 100, blendMode: 'Normal', colorTag: '#10b981', hasMask: true },
  { id: 'l-shadow', name: '角色地面接触阴影与闭塞', type: 'pixel', visible: true, opacity: 75, blendMode: 'Multiply' },
  { id: 'l-bg', name: '赛场全景渐变绘制背景', type: 'pixel', visible: true, opacity: 100, blendMode: 'Normal' },
];

export const PSDViewer: React.FC<PSDViewerProps> = ({
  title,
  thumbnail,
  fileSize = '124 MB',
  dimensions = '6000 × 4000 px 300DPI',
  onDownload,
}) => {
  const [layers, setLayers] = useState<PSDLayer[]>(DEFAULT_PSD_LAYERS);
  const [showLayerPanel, setShowLayerPanel] = useState<boolean>(true);
  const [selectedLayerId, setSelectedLayerId] = useState<string>(layers[0].id);
  const [zoom, setZoom] = useState<number>(100);

  const toggleLayerVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const isCharVisible = layers.find(l => l.id === 'l-char')?.visible ?? true;
  const isGlowVisible = layers.find(l => l.id === 'l-glow')?.visible ?? true;
  const isTitleVisible = layers.find(l => l.id === 'l-title')?.visible ?? true;
  const isBgVisible = layers.find(l => l.id === 'l-bg')?.visible ?? true;
  const isAdjVisible = layers.find(l => l.id === 'l-adj')?.visible ?? true;

  const visibleLayerCount = layers.filter(l => l.visible).length;

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-700 shadow-xl select-none">
      {/* Photoshop Header Bar */}
      <div className="bg-[#1f2430] border-b border-slate-700 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 rounded bg-[#31a8ff]/20 text-[#31a8ff] border border-[#31a8ff]/40 flex items-center justify-center font-black text-xs font-mono">
            Ps
          </span>
          <span className="font-bold text-slate-100 truncate max-w-xs">{title}</span>
          <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            @ {zoom}% (RGB/8#)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom controls */}
          <div className="flex items-center space-x-1 bg-slate-800 px-1.5 py-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setZoom(z => Math.max(50, z - 25))}
              className="w-6 h-6 hover:bg-slate-700 rounded text-slate-300 flex items-center justify-center cursor-pointer"
            >
              <i className="fa-solid fa-minus text-[10px]"></i>
            </button>
            <span className="font-mono text-[11px] font-bold text-slate-300 px-1">{zoom}%</span>
            <button
              onClick={() => setZoom(z => Math.min(250, z + 25))}
              className="w-6 h-6 hover:bg-slate-700 rounded text-slate-300 flex items-center justify-center cursor-pointer"
            >
              <i className="fa-solid fa-plus text-[10px]"></i>
            </button>
          </div>

          {/* Toggle Layers Drawer */}
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              showLayerPanel 
                ? 'bg-[#31a8ff] text-slate-900 border-[#31a8ff] shadow-sm' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <i className="fa-solid fa-layer-group text-[11px]"></i>
            <span className="hidden sm:inline">图层 ({visibleLayerCount}/{layers.length})</span>
          </button>

          {onDownload && (
            <button
              onClick={onDownload}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center space-x-1 transition-colors cursor-pointer"
              title="下载完整分层 PSD 源文件"
            >
              <i className="fa-solid fa-download text-[11px]"></i>
              <span className="hidden sm:inline">下载 PSD</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative bg-[#181a20]">
        {/* Center Canvas Viewport */}
        <div className="flex-1 overflow-auto custom-scrollbar flex items-center justify-center p-4 sm:p-8">
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
            }}
            className="relative rounded-lg shadow-2xl overflow-hidden border border-slate-700 max-h-[62vh] aspect-[3/2] flex items-center justify-center bg-slate-900"
          >
            {/* Background checkerboard for transparency */}
            <div className="absolute inset-0 bg-[linear-gradient(45deg,#242833_25%,transparent_25%),linear-gradient(-45deg,#242833_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#242833_75%),linear-gradient(-45deg,transparent_75%,#242833_75%)] [background-size:16px_16px] [background-position:0_0,0_8px,8px_-8px,-8px_0px] opacity-40"></div>

            {/* Simulated Dynamic Layers Rendering */}
            {isBgVisible && (
              <img
                src={thumbnail}
                alt=""
                className={`w-full h-full object-cover transition-opacity duration-200 ${
                  isAdjVisible ? 'brightness-105 contrast-105' : 'brightness-90 contrast-95'
                }`}
              />
            )}

            {!isBgVisible && isCharVisible && (
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={thumbnail}
                  alt=""
                  className="max-h-[85%] object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)] filter transition-all"
                />
              </div>
            )}

            {/* Glow overlay */}
            {isGlowVisible && (
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-indigo-500/10 to-transparent pointer-events-none mix-blend-screen animate-pulse"></div>
            )}

            {/* Vector Title Overlay */}
            {isTitleVisible && (
              <div className="absolute bottom-4 left-6 right-6 pointer-events-none">
                <div className="inline-block bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20">
                  <span className="text-white font-black tracking-wider text-xs sm:text-sm drop-shadow-md">
                    {title}
                  </span>
                </div>
              </div>
            )}

            {/* No Layers Visible Fallback */}
            {visibleLayerCount === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-900/90 z-20">
                <i className="fa-solid fa-eye-slash text-3xl mb-2 text-slate-600"></i>
                <p className="text-xs font-bold">所有图层均已隐藏</p>
                <button
                  onClick={() => setLayers(prev => prev.map(l => ({ ...l, visible: true })))}
                  className="mt-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  显示所有图层
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Photoshop Layers Panel */}
        {showLayerPanel && (
          <div className="w-64 sm:w-72 bg-[#232834] border-l border-slate-700 flex flex-col shrink-0 text-slate-300 text-xs">
            {/* Layers Panel Header */}
            <div className="p-3 bg-[#1e222c] border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-bold text-slate-200">
                <i className="fa-solid fa-layer-group text-[#31a8ff] text-xs"></i>
                <span>图层面板 (Layers)</span>
              </div>
              <button
                onClick={() => setLayers(prev => prev.map(l => ({ ...l, visible: !l.visible })))}
                className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
                title="反转可见性"
              >
                反转可见
              </button>
            </div>

            {/* Layer Blend Mode & Opacity Status */}
            <div className="p-2.5 bg-[#1a1d26] border-b border-slate-700/80 flex items-center justify-between text-[11px]">
              <span className="font-mono text-slate-400">混合: 正常 (Normal)</span>
              <span className="font-mono text-slate-400">不透明度: 100%</span>
            </div>

            {/* Layer List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {layers.map(layer => {
                const isSelected = selectedLayerId === layer.id;
                return (
                  <div
                    key={layer.id}
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors border ${
                      isSelected 
                        ? 'bg-[#31a8ff]/20 border-[#31a8ff]/40 text-white' 
                        : 'bg-slate-800/40 border-transparent hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      {/* Visibility Eyeball */}
                      <button
                        type="button"
                        onClick={(e) => toggleLayerVisibility(layer.id, e)}
                        className={`w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer ${
                          layer.visible 
                            ? 'text-slate-200 hover:text-white' 
                            : 'text-slate-600 hover:text-slate-400'
                        }`}
                        title={layer.visible ? '隐藏此图层' : '显示此图层'}
                      >
                        <i className={`fa-solid ${layer.visible ? 'fa-eye' : 'fa-eye-slash'} text-xs`}></i>
                      </button>

                      {/* Layer Type Icon */}
                      <div className="w-5 h-5 rounded bg-slate-700/80 flex items-center justify-center text-[10px] text-slate-400 shrink-0">
                        {layer.type === 'text' && <i className="fa-solid fa-font"></i>}
                        {layer.type === 'adjustment' && <i className="fa-solid fa-circle-half-stroke"></i>}
                        {layer.type === 'pixel' && <i className="fa-solid fa-image"></i>}
                        {layer.type === 'vector' && <i className="fa-solid fa-draw-polygon"></i>}
                      </div>

                      {/* Layer Name */}
                      <span className={`truncate text-xs ${!layer.visible ? 'line-through opacity-50' : 'font-medium'}`}>
                        {layer.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {layer.blendMode !== 'Normal' && (
                        <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {layer.blendMode}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-slate-400">
                        {layer.opacity}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PSD Technical Info Footer */}
            <div className="p-3 bg-[#1e222c] border-t border-slate-700 text-[11px] font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>画布规格:</span>
                <span className="text-slate-200">{dimensions}</span>
              </div>
              <div className="flex justify-between">
                <span>色彩模式:</span>
                <span className="text-emerald-400 font-bold">CMYK / 8-bit</span>
              </div>
              <div className="flex justify-between">
                <span>图层总数:</span>
                <span className="text-slate-200">{layers.length} 个分层 (含蒙版)</span>
              </div>
              <div className="flex justify-between">
                <span>文件大小:</span>
                <span className="text-slate-200">{fileSize}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
