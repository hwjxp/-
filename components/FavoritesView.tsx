import React, { useState, useMemo } from 'react';
import { Asset, IP, AssetCategory } from '../types';
import AssetCard from './AssetCard';
import { CATEGORY_DEFINITIONS } from './AllAssetsExplorer';

interface FavoritesViewProps {
  assets: Asset[];
  favoriteAssetIds: Set<string>;
  onToggleFavorite: (assetId: string, e: React.MouseEvent) => void;
  onSelectAsset: (asset: Asset) => void;
  allIPs: IP[];
  selectedAssetIds?: Set<string>;
  onToggleSelectAsset?: (assetId: string, e: React.MouseEvent) => void;
  onClearAllFavorites?: () => void;
  onExploreAllAssets: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  assets,
  favoriteAssetIds,
  onToggleFavorite,
  onSelectAsset,
  allIPs,
  selectedAssetIds = new Set(),
  onToggleSelectAsset,
  onClearAllFavorites,
  onExploreAllAssets,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedIpFilter, setSelectedIpFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'TITLE' | 'SIZE'>('NEWEST');

  // Filter only favorited assets
  const favoritedAssets = useMemo(() => {
    return assets.filter(a => favoriteAssetIds.has(a.id));
  }, [assets, favoriteAssetIds]);

  // Apply search, category, IP filter, and sorting
  const displayedAssets = useMemo(() => {
    let list = favoritedAssets.filter(asset => {
      // Category filter
      if (selectedCategory !== 'ALL') {
        const cat = asset.category || asset.type;
        if (cat !== selectedCategory) return false;
      }

      // IP filter
      if (selectedIpFilter !== 'ALL' && asset.ipId !== selectedIpFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = asset.title.toLowerCase().includes(q);
        const matchesId = asset.id.toLowerCase().includes(q);
        const matchesTags = (asset.tags || []).some(t => t.toLowerCase().includes(q));
        const matchesUploader = (asset.uploader || '').toLowerCase().includes(q);
        const ipName = allIPs.find(i => i.id === asset.ipId)?.name.toLowerCase() || '';
        const matchesIp = ipName.includes(q);
        if (!matchesTitle && !matchesId && !matchesTags && !matchesUploader && !matchesIp) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'TITLE') {
        return a.title.localeCompare(b.title, 'zh-CN');
      }
      if (sortBy === 'SIZE') {
        const parseSize = (s: string) => {
          const num = parseFloat(s) || 0;
          if (s.includes('GB')) return num * 1024 * 1024 * 1024;
          if (s.includes('MB')) return num * 1024 * 1024;
          if (s.includes('KB')) return num * 1024;
          return num;
        };
        return parseSize(b.fileSize) - parseSize(a.fileSize);
      }
      // NEWEST
      return (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '');
    });

    return list;
  }, [favoritedAssets, selectedCategory, selectedIpFilter, searchQuery, sortBy, allIPs]);

  // Category counts within favorites
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: favoritedAssets.length };
    favoritedAssets.forEach(a => {
      const cat = a.category || a.type || '2D';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [favoritedAssets]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
          <i className="fa-solid fa-heart text-[220px]"></i>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/30">
              <i className="fa-solid fa-bookmark"></i>
              <span>个人资产专属收藏夹</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">我的收藏</h1>
            <p className="text-rose-100 text-xs sm:text-sm font-medium max-w-xl">
              收集并整理您在各个 IP 库与物料中心标星心标的物料，支持快速筛选、版本查阅及批量打包下载。
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shrink-0">
            <div className="text-center px-3 border-r border-white/20">
              <span className="block text-2xl font-black font-mono">{favoritedAssets.length}</span>
              <span className="text-[10px] text-rose-100 uppercase tracking-wider font-bold">收藏总数</span>
            </div>
            <div className="text-center px-3">
              <span className="block text-2xl font-black font-mono">
                {new Set(favoritedAssets.map(a => a.ipId)).size}
              </span>
              <span className="text-[10px] text-rose-100 uppercase tracking-wider font-bold">涵盖 IP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Search and Dropdowns */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              placeholder="搜索收藏物料 (标题、资产ID、标签 #)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-rose-400 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          {/* Selectors and Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* IP Filter */}
            <select
              value={selectedIpFilter}
              onChange={(e) => setSelectedIpFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-rose-400 cursor-pointer"
            >
              <option value="ALL">全部所属 IP</option>
              {allIPs.map(ip => (
                <option key={ip.id} value={ip.id}>{ip.name}</option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-rose-400 cursor-pointer"
            >
              <option value="NEWEST">按更新时间排序</option>
              <option value="TITLE">按名称字母排序</option>
              <option value="SIZE">按文件大小排序</option>
            </select>

            {/* Clear All Favorites */}
            {favoritedAssets.length > 0 && onClearAllFavorites && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('确定要清空所有收藏物料吗？')) {
                    onClearAllFavorites();
                  }
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                title="清空所有收藏"
              >
                <i className="fa-solid fa-trash-can mr-1"></i>
                <span>清空</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span>全部类别</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              selectedCategory === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {categoryCounts['ALL'] || 0}
            </span>
          </button>

          {CATEGORY_DEFINITIONS.map(cat => {
            const count = categoryCounts[cat.key] || 0;
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <i className={`fa-solid ${cat.icon} text-[10px] ${isActive ? 'text-white' : 'text-slate-400'}`}></i>
                <span>{cat.title}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Favorited Assets (PC 6 Columns Layout) */}
      {displayedAssets.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
          {displayedAssets.map(asset => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onClick={onSelectAsset}
              isSelected={selectedAssetIds.has(asset.id)}
              onToggleSelect={onToggleSelectAsset}
              isFavorited={true}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-2xl mx-auto shadow-inner">
            <i className="fa-regular fa-heart"></i>
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800">
              {favoritedAssets.length === 0 ? '收藏夹还是空的' : '未匹配到符合条件的收藏资产'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {favoritedAssets.length === 0
                ? '在任意资产卡片或物料详情上点击心形图标即可加入个人收藏，随时便捷查看与快速调取。'
                : '请尝试清空筛选标签或修改搜索关键词。'}
            </p>
          </div>
          {favoritedAssets.length === 0 ? (
            <button
              type="button"
              onClick={onExploreAllAssets}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md hover:shadow-indigo-600/20 cursor-pointer inline-flex items-center space-x-2"
            >
              <i className="fa-solid fa-compass"></i>
              <span>浏览探索所有资产</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedIpFilter('ALL');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              重置筛选条件
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FavoritesView;
