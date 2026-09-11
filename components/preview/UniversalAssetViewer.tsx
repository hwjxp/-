import React, { useState, useMemo } from 'react';
import { Asset } from '../../types';
import { PDFViewer } from './PDFViewer';
import { ImageViewer } from './ImageViewer';
import { PSDViewer } from './PSDViewer';
import { AIViewer } from './AIViewer';
import { VideoViewer } from './VideoViewer';
import { ThreeDViewer } from './ThreeDViewer';

export type PreviewMode = 'IMAGE' | 'PDF' | 'PSD' | 'AI' | 'VIDEO' | '3D';

interface UniversalAssetViewerProps {
  asset: Asset;
  onFullscreen?: () => void;
  onDownload?: () => void;
  className?: string;
}

export const UniversalAssetViewer: React.FC<UniversalAssetViewerProps> = ({
  asset,
  onFullscreen,
  onDownload,
  className = '',
}) => {
  // Infer primary mode from asset metadata, category, and type
  const defaultMode = useMemo<PreviewMode>(() => {
    const cat = (asset.category || '').toUpperCase();
    const typeStr = `${asset.type || ''} ${asset.metadata?.format || ''} ${asset.title || ''} ${(asset.tags || []).join(' ')}`.toUpperCase();

    if (cat === 'VIDEO' || typeStr.includes('MP4') || typeStr.includes('VIDEO') || typeStr.includes('MOV') || typeStr.includes('WEBM')) {
      return 'VIDEO';
    }
    if (cat === '3D' || typeStr.includes('3D') || typeStr.includes('FBX') || typeStr.includes('OBJ') || typeStr.includes('STL') || typeStr.includes('ZTL') || typeStr.includes('GLTF')) {
      return '3D';
    }
    if (typeStr.includes('PDF') || typeStr.includes('手册') || typeStr.includes('规范') || typeStr.includes('GUIDELINE')) {
      return 'PDF';
    }
    if (typeStr.includes('PSD') || typeStr.includes('PHOTOSHOP')) {
      return 'PSD';
    }
    if (typeStr.includes('AI') || typeStr.includes('ILLUSTRATOR') || typeStr.includes('矢量') || typeStr.includes('EPS')) {
      return 'AI';
    }
    return 'IMAGE';
  }, [asset]);

  const [activeMode, setActiveMode] = useState<PreviewMode>(defaultMode);

  // Sync mode when asset changes
  React.useEffect(() => {
    setActiveMode(defaultMode);
  }, [defaultMode]);

  const fileFormatStr = asset.metadata?.format || asset.type || 'PNG';

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {/* Top Universal Mode Switcher & Format Badge Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        {/* Format Pill */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
            <i className="fa-solid fa-eye text-indigo-600"></i>
            <span>浏览器专业预览器</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
            原文件: .{fileFormatStr}
          </span>
        </div>

        {/* Quick Preview Mode Tabs (All 6 format engines available) */}
        <div className="flex items-center space-x-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveMode('IMAGE')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer shrink-0 ${
              activeMode === 'IMAGE' 
                ? 'bg-white text-indigo-600 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="高清图片预览 (支持平移/缩放/翻转/透明通道检查)"
          >
            <i className="fa-regular fa-image text-[11px]"></i>
            <span>图片</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('PDF')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer shrink-0 ${
              activeMode === 'PDF' 
                ? 'bg-white text-red-600 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="PDF 文档阅读器 (翻页/缩放/旋转/缩略图/印章)"
          >
            <i className="fa-solid fa-file-pdf text-[11px]"></i>
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('PSD')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer shrink-0 ${
              activeMode === 'PSD' 
                ? 'bg-white text-blue-600 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Photoshop PSD 分层预览器 (图层树/可见性/混合模式)"
          >
            <i className="fa-solid fa-layer-group text-[11px]"></i>
            <span>PSD分层</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('AI')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer shrink-0 ${
              activeMode === 'AI' 
                ? 'bg-white text-amber-600 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Illustrator AI 矢量预览器 (Ctrl+Y轮廓模式/画板/Pantone色板)"
          >
            <i className="fa-solid fa-pen-nib text-[11px]"></i>
            <span>AI矢量</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('VIDEO')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer shrink-0 ${
              activeMode === 'VIDEO' 
                ? 'bg-white text-purple-600 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="4K 视频播放器 (逐帧质检/倍速/时间码/音量/循环)"
          >
            <i className="fa-solid fa-film text-[11px]"></i>
            <span>视频</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('3D')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer shrink-0 ${
              activeMode === '3D' 
                ? 'bg-white text-emerald-600 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Three.js 交互式 3D 渲染器 (PBR/线框/白模/法线/转台/三点光)"
          >
            <i className="fa-solid fa-cube text-[11px]"></i>
            <span>3D模型</span>
          </button>
        </div>
      </div>

      {/* Embedded Viewport Frame */}
      <div className="w-full h-[360px] sm:h-[460px] md:h-[520px] rounded-2xl overflow-hidden shadow-inner">
        {activeMode === 'PDF' && (
          <PDFViewer
            title={asset.title}
            fileSize={asset.fileSize}
            coverImage={asset.thumbnail}
            onDownload={onDownload}
          />
        )}

        {activeMode === 'IMAGE' && (
          <ImageViewer
            src={asset.thumbnail}
            alt={asset.title}
            format={fileFormatStr}
            fileSize={asset.fileSize}
            dimensions={asset.metadata?.resolution || '6000 × 4000 px'}
            onFullscreen={onFullscreen}
          />
        )}

        {activeMode === 'PSD' && (
          <PSDViewer
            title={asset.title}
            thumbnail={asset.thumbnail}
            fileSize={asset.fileSize}
            dimensions={asset.metadata?.resolution || '6000 × 4000 px 300DPI'}
            onDownload={onDownload}
          />
        )}

        {activeMode === 'AI' && (
          <AIViewer
            title={asset.title}
            thumbnail={asset.thumbnail}
            fileSize={asset.fileSize}
            onDownload={onDownload}
          />
        )}

        {activeMode === 'VIDEO' && (
          <VideoViewer
            title={asset.title}
            thumbnail={asset.thumbnail}
            fileSize={asset.fileSize}
            onDownload={onDownload}
          />
        )}

        {activeMode === '3D' && (
          <ThreeDViewer
            title={asset.title}
            format={asset.metadata?.format || 'FBX / OBJ'}
            fileSize={asset.fileSize}
            polyCount={asset.metadata?.polyCount || 850000}
            onDownload={onDownload}
          />
        )}
      </div>
    </div>
  );
};
