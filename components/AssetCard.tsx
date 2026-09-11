
import React from 'react';
import { Asset } from '../types';
import LazyImage from './LazyImage';

interface AssetCardProps {
  asset: Asset;
  onClick: (asset: Asset) => void;
  isSelected?: boolean;
  onToggleSelect?: (assetId: string, e: React.MouseEvent) => void;
  downstreamCount?: number;
  isFavorited?: boolean;
  onToggleFavorite?: (assetId: string, e: React.MouseEvent) => void;
}

const CATEGORY_STYLE: Record<string, { label: string; icon: string; badge: string }> = {
  '2D': { label: '2D', icon: 'fa-paintbrush', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  '3D': { label: '3D', icon: 'fa-cube', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  'GRAPHIC': { label: '平面', icon: 'fa-vector-square', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  'PACKAGING': { label: '包装', icon: 'fa-box-open', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'DISPLAY': { label: '陈列', icon: 'fa-shop', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  'PHOTO': { label: '实拍', icon: 'fa-camera', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  'VIDEO': { label: '视频', icon: 'fa-film', badge: 'bg-violet-50 text-violet-700 border-violet-200' }
};

const AssetCard: React.FC<AssetCardProps> = ({ 
  asset, 
  onClick, 
  isSelected = false, 
  onToggleSelect,
  downstreamCount = 0,
  isFavorited = false,
  onToggleFavorite
}) => {
  const catKey = asset.category || asset.type;
  const catStyle = CATEGORY_STYLE[catKey] || { 
    label: asset.type, 
    icon: 'fa-file-image', 
    badge: 'bg-slate-50 text-slate-700 border-slate-200' 
  };

  const upstreamCount = (asset.upstreamAssetIds || []).length;

  return (
    <div 
      onClick={() => onClick(asset)}
      className={`group bg-white rounded-2xl border ${
        isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md' : 'border-slate-200/90'
      } overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative flex flex-col justify-between`}
    >
      {/* Visual Media Thumbnail Box with Lazy Loading & Skeleton Placeholder */}
      <LazyImage
        src={asset.thumbnail}
        alt={asset.title}
        category={catKey}
        aspectRatio="aspect-[5/4]"
        className="group-hover:scale-105 transition-transform duration-500"
      >
        {/* Top-Left Category Badge */}
        <div className={`absolute top-2.5 left-2.5 z-10 flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black backdrop-blur-md shadow-xs border ${catStyle.badge}`}>
          <i className={`fa-solid ${catStyle.icon} mr-1 text-[9px]`}></i>
          <span>{catStyle.label}</span>
        </div>

        {/* Top-Right Heart Favorite Button */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(asset.id, e);
            }}
            className={`absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-xs ${
              isFavorited 
                ? 'bg-white text-rose-500 shadow-rose-500/20 ring-2 ring-rose-500/20 scale-105 opacity-100' 
                : 'bg-slate-900/50 hover:bg-white text-white hover:text-rose-500 opacity-80 group-hover:opacity-100'
            }`}
            title={isFavorited ? '取消收藏' : '加入我的收藏'}
          >
            <i className={`fa-${isFavorited ? 'solid' : 'regular'} fa-heart text-xs ${isFavorited ? 'text-rose-500' : ''}`}></i>
          </button>
        )}

        {/* Bottom-Left Version Pill */}
        <div className="absolute bottom-2.5 left-2.5 z-10 bg-slate-900/80 backdrop-blur-md text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-white/20 shadow-xs">
          {asset.version || 'v1.0'}
        </div>

        {/* Selection Checkbox (if enabled) */}
        {onToggleSelect && (
          <div 
            onClick={(e) => onToggleSelect(asset.id, e)}
            className={`absolute bottom-2.5 right-2.5 w-5 h-5 rounded-md flex items-center justify-center transition-all z-10 
              ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/80 backdrop-blur-sm border border-slate-300 text-transparent hover:border-indigo-400 group-hover:bg-white'}`}
          >
            <i className="fa-solid fa-check text-[10px]"></i>
          </div>
        )}
      </LazyImage>

      {/* Content Meta Body - concise layout */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
            <span className="truncate">{asset.uploader}</span>
            <span className="shrink-0 ml-1 font-mono">{asset.fileSize}</span>
          </div>
          <h3 className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-600 transition-colors" title={asset.title}>
            {asset.title}
          </h3>
        </div>

        {/* Compact Lineage & Tags Bar */}
        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px]">
          {/* Lineage Indicators: Concise Icon + Number */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {upstreamCount > 0 && (
              <span className="bg-blue-50 text-blue-600 border border-blue-200/60 font-bold px-1.5 py-0.5 rounded flex items-center space-x-0.5" title={`引用 ${upstreamCount} 个上游原型`}>
                <i className="fa-solid fa-arrow-up-long text-[8px]"></i>
                <span className="font-mono">{upstreamCount}</span>
              </span>
            )}
            {downstreamCount > 0 && (
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200/60 font-bold px-1.5 py-0.5 rounded flex items-center space-x-0.5" title={`衍生 ${downstreamCount} 个下游资产`}>
                <i className="fa-solid fa-arrow-down-long text-[8px]"></i>
                <span className="font-mono">{downstreamCount}</span>
              </span>
            )}
            {upstreamCount === 0 && downstreamCount === 0 && (
              <span className="text-slate-300 font-mono text-[9px]">-</span>
            )}
          </div>

          {/* Compact Tag preview */}
          <div className="flex items-center space-x-1 overflow-hidden">
            {asset.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[9px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-100 font-medium truncate max-w-[70px]">
                #{tag}
              </span>
            ))}
            {asset.tags.length > 2 && (
              <span className="text-[9px] text-slate-400 font-mono font-bold">+{asset.tags.length - 2}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetCard;

