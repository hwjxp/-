import React, { useState, useMemo } from 'react';
import { IP, User, UserRole, Asset } from '../types';
import { getTagStats, TagInfo } from '../utils/tagUtils';
import TagAutocompleteInput from './TagAutocompleteInput';
import LazyImage from './LazyImage';

interface IPGalleryProps {
  ips: IP[];
  currentUser: User;
  allAssets?: Asset[];
  onSelect: (ip: IP) => void;
  onCreate: () => void;
  onGoToLibrary: (ip: IP) => void;
  onCreateLibrary: (ipId: string) => void;
}

type SortOption = 'DEFAULT' | 'ZH_NAME' | 'EN_NAME';
type ViewMode = 'GRID' | 'LIST';

const IPGallery: React.FC<IPGalleryProps> = ({ 
  ips, 
  currentUser, 
  allAssets = [],
  onSelect, 
  onCreate, 
  onGoToLibrary, 
  onCreateLibrary 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [ownershipFilter, setOwnershipFilter] = useState<'ALL' | 'ORIGINAL' | 'LICENSED'>('ALL');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCustomTags, setSelectedCustomTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('DEFAULT');
  const [tagFilterInput, setTagFilterInput] = useState('');

  // Comprehensive tag statistics
  const tagStats = useMemo(() => {
    return getTagStats(ips, allAssets);
  }, [ips, allAssets]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ips.forEach(ip => {
      ip.categories.forEach(c => counts[c] = (counts[c] || 0) + 1);
    });
    return counts;
  }, [ips]);

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ips.forEach(ip => {
      ip.regions.forEach(r => counts[r] = (counts[r] || 0) + 1);
    });
    return counts;
  }, [ips]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const toggleRegion = (reg: string) => {
    setSelectedRegions(prev => prev.includes(reg) ? prev.filter(r => r !== reg) : [...prev, reg]);
  };

  const toggleCustomTag = (tag: string) => {
    setSelectedCustomTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSelectTagFromSearch = (tag: TagInfo) => {
    if (tag.type === 'CATEGORY') {
      if (!selectedCategories.includes(tag.name)) {
        setSelectedCategories(prev => [...prev, tag.name]);
      }
    } else if (tag.type === 'REGION') {
      if (!selectedRegions.includes(tag.name)) {
        setSelectedRegions(prev => [...prev, tag.name]);
      }
    } else {
      if (!selectedCustomTags.includes(tag.name)) {
        setSelectedCustomTags(prev => [...prev, tag.name]);
      }
    }
  };

  const processedIps = useMemo(() => {
    let result = ownershipFilter === 'ALL' ? [...ips] : ips.filter(ip => ip.ownership === ownershipFilter);
    
    if (selectedCategories.length > 0) {
      result = result.filter(ip => selectedCategories.some(c => ip.categories.includes(c)));
    }

    if (selectedRegions.length > 0) {
      result = result.filter(ip => selectedRegions.some(r => ip.regions.includes(r)));
    }

    if (selectedCustomTags.length > 0) {
      result = result.filter(ip => {
        const matchesCategory = selectedCustomTags.some(t => ip.categories.includes(t));
        const matchesRegion = selectedCustomTags.some(t => ip.regions.includes(t));
        // Check if any asset in this IP has the tag
        const ipAssets = allAssets.filter(a => a.ipId === ip.id);
        const matchesAssetTag = ipAssets.some(a => (a.tags || []).some(t => selectedCustomTags.includes(t)));
        return matchesCategory || matchesRegion || matchesAssetTag;
      });
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(ip => 
        ip.name.toLowerCase().includes(lowerQuery) || 
        ip.englishName.toLowerCase().includes(lowerQuery) ||
        ip.categories.some(c => c.toLowerCase().includes(lowerQuery)) ||
        ip.regions.some(r => r.toLowerCase().includes(lowerQuery))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'ZH_NAME') {
        return a.name.localeCompare(b.name, 'zh-Hans-CN', { sensitivity: 'accent' });
      }
      if (sortBy === 'EN_NAME') {
        return a.englishName.localeCompare(b.englishName);
      }
      return 0;
    });

    return result;
  }, [ips, ownershipFilter, selectedCategories, selectedRegions, selectedCustomTags, searchQuery, sortBy, allAssets]);

  const canEditIP = currentUser.role === UserRole.SUPER_ADMIN || !!currentUser.canEditIP;
  const canManageAssetLibrary = currentUser.role === UserRole.SUPER_ADMIN || !!currentUser.canManageAssetLibrary;

  const canView = (ip: IP) => {
    if (ip.visibility === 'PUBLIC') return true;
    if (currentUser.role === UserRole.SUPER_ADMIN) return true;
    return (ip.viewerIds || []).includes(currentUser.id) || (ip.adminIds || []).includes(currentUser.id) || (ip.downloaderIds || []).includes(currentUser.id);
  };

  const renderCover = (ip: IP, hasAccess: boolean, isThumbnail = false) => {
    const baseClasses = isThumbnail 
      ? `w-12 h-12 aspect-square rounded-xl flex-shrink-0 transition-transform duration-700 ${hasAccess ? 'group-hover:scale-105' : 'blur-sm grayscale'}`
      : `absolute inset-0 w-full h-full transition-transform duration-700 ${hasAccess ? 'group-hover:scale-110' : 'blur-md grayscale'}`;
    
    if (ip.coverImage) {
      return (
        <LazyImage 
          src={ip.coverImage} 
          alt={ip.name} 
          className={baseClasses} 
          aspectRatio={isThumbnail ? 'aspect-square' : undefined}
          placeholderIcon="fa-image"
        />
      );
    }
    
    const colors = ['bg-indigo-500', 'bg-rose-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500'];
    const charCode = ip.id.charCodeAt(ip.id.length - 1) || 0;
    const colorClass = colors[charCode % colors.length];
    const initial = ip.englishName ? ip.englishName.charAt(0).toUpperCase() : ip.name.charAt(0);
    const textSize = isThumbnail ? 'text-xl' : 'text-[120px]';
    
    return (
      <div className={`${baseClasses} ${colorClass} flex flex-col items-center justify-center`}>
        <span className={`${textSize} leading-none font-black text-white/40 uppercase tracking-widest`}>{initial}</span>
      </div>
    );
  };

  const hasActiveFilters = ownershipFilter !== 'ALL' || selectedCategories.length > 0 || selectedRegions.length > 0 || selectedCustomTags.length > 0 || searchQuery !== '';

  const clearAllFilters = () => {
    setOwnershipFilter('ALL');
    setSelectedCategories([]);
    setSelectedRegions([]);
    setSelectedCustomTags([]);
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Advanced Header and Controls */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 space-y-6">
        
        {/* Top Row: Search & Create */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex-1 md:max-w-xl">
            <TagAutocompleteInput
              value={searchQuery}
              onChange={setSearchQuery}
              tagStats={tagStats}
              placeholder="搜索中英文名称、或输入标签自动补全 (含 IP 统计)..."
              mode="search"
              onSelectTag={(tag) => {
                setSearchQuery(tag.name);
              }}
            />
          </div>
          {canEditIP && (
            <button 
              onClick={onCreate}
              className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-md transition-colors shrink-0"
            >
              <i className="fa-solid fa-plus"></i>
              <span>创建新 IP</span>
            </button>
          )}
        </div>

        {/* Filter Groups */}
        <div className="space-y-5 pt-4 border-t border-slate-100">
          
          {/* Ownership */}
          <div className="flex flex-col md:flex-row md:items-start gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 shrink-0 md:mt-2">IP 类型</span>
            <div className="flex flex-wrap gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100 w-fit">
              <button 
                onClick={() => setOwnershipFilter('ALL')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${ownershipFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 border border-transparent'}`}
              >
                全部 IP
              </button>
              <button 
                onClick={() => setOwnershipFilter('ORIGINAL')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${ownershipFilter === 'ORIGINAL' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 border border-transparent'}`}
              >
                自有 IP
              </button>
              <button 
                onClick={() => setOwnershipFilter('LICENSED')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${ownershipFilter === 'LICENSED' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 border border-transparent'}`}
              >
                三方授权 IP
              </button>
            </div>
          </div>

          {/* Categories */}
          {Object.keys(categoryCounts).length > 0 && (
            <div className="flex flex-col md:flex-row md:items-start gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 shrink-0 md:mt-2">IP 类别</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, count]) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-lg font-black ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                        {count} IP
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Regions */}
          {Object.keys(regionCounts).length > 0 && (
            <div className="flex flex-col md:flex-row md:items-start gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 shrink-0 md:mt-2">区域标签</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(regionCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([reg, count]) => {
                  const isSelected = selectedRegions.includes(reg);
                  return (
                    <button
                      key={reg}
                      onClick={() => toggleRegion(reg)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-pink-50 text-pink-700 border-pink-200 shadow-sm'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-pink-300 hover:text-pink-600'
                      }`}
                    >
                      <span>{reg}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-lg font-black ${isSelected ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-400'}`}>
                        {count} IP
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Tag Autocomplete Dropdown Search Filter */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 pt-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 shrink-0">标签精准筛选</span>
            <div className="flex-1 max-w-md">
              <TagAutocompleteInput
                value={tagFilterInput}
                onChange={setTagFilterInput}
                tagStats={tagStats}
                placeholder="按现有标签搜索（自动补全并显示已关联 IP 数量）..."
                mode="single"
                onSelectTag={(tag) => {
                  handleSelectTagFromSearch(tag);
                  setTagFilterInput('');
                }}
                onEnterPress={() => {
                  if (tagFilterInput.trim()) {
                    toggleCustomTag(tagFilterInput.trim());
                    setTagFilterInput('');
                  }
                }}
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center space-x-1 py-1.5 px-3 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <i className="fa-solid fa-rotate-left text-[11px]"></i>
                <span>重置所有筛选</span>
              </button>
            )}
          </div>

          {/* Active Custom Selected Tags */}
          {selectedCustomTags.length > 0 && (
            <div className="flex items-center space-x-2 pt-2">
              <span className="text-[10px] font-bold text-slate-400">已选自定标签:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedCustomTags.map(tag => {
                  const stat = tagStats.find(t => t.name === tag);
                  const ipCount = stat ? stat.ipCount : 0;
                  return (
                    <span
                      key={tag}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-sm"
                    >
                      <span>#{tag}</span>
                      <span className="text-[9px] bg-indigo-700 px-1 py-0.2 rounded font-black">
                        {ipCount} IP
                      </span>
                      <button 
                        onClick={() => toggleCustomTag(tag)}
                        className="hover:text-red-200 ml-1"
                      >
                        <i className="fa-solid fa-xmark text-xs"></i>
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Row: Sorting & View Mode */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t border-slate-100 gap-4">
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">排序选项</span>
            <div className="relative flex-1 md:flex-none md:w-48">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none"
              >
                <option value="DEFAULT">默认排序</option>
                <option value="ZH_NAME">按中文名 (A-Z)</option>
                <option value="EN_NAME">按英文名 (A-Z)</option>
              </select>
              <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none"></i>
            </div>
            <span className="text-xs text-slate-400 font-bold">
              共找到 <strong className="text-slate-800">{processedIps.length}</strong> 个 IP
            </span>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0">
            <button 
              onClick={() => setViewMode('LIST')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'LIST' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="列表视图"
            >
              <i className="fa-solid fa-list-ul px-1"></i>
            </button>
            <button 
              onClick={() => setViewMode('GRID')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'GRID' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="网格视图"
            >
              <i className="fa-solid fa-border-all px-1"></i>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {processedIps.map(ip => {
            const hasAccess = canView(ip);
            return (
              <div 
                key={ip.id}
                onClick={() => hasAccess ? onSelect(ip) : alert('您没有权限查看此私密库，请在权限管理中申请。')}
                className="relative h-80 rounded-[2.5rem] overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 bg-white"
              >
                <div className="absolute inset-0 h-48 overflow-hidden rounded-b-[2rem]">
                  {renderCover(ip, hasAccess)}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                </div>
                
                <div className="absolute top-4 left-4 flex space-x-2">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg ${
                    ip.ownership === 'ORIGINAL' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    {ip.ownership === 'ORIGINAL' ? '自有 IP' : '三方 IP'}
                  </span>
                  {!hasAccess && (
                    <span className="bg-slate-900 text-slate-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg border border-slate-700 flex items-center">
                      <i className="fa-solid fa-lock mr-1.5"></i> 私密
                    </span>
                  )}
                </div>

                <div className="absolute top-48 inset-x-0 bottom-0 p-6 flex flex-col bg-white">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-slate-900 mb-1">{ip.name}</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3 line-clamp-1">{ip.englishName}</p>
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {ip.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {ip.categories.slice(0, 2).map(cat => (
                      <span key={cat} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                        {cat}
                      </span>
                    ))}
                    {ip.regions.slice(0, 2).map(region => (
                      <span key={region} className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">
                        {region}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100">
                    {ip.hasAssetLibrary ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onGoToLibrary(ip); }}
                        className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-black rounded-xl transition-colors flex items-center justify-center space-x-2"
                      >
                        <i className="fa-solid fa-folder-open"></i>
                        <span>浏览关联图库</span>
                      </button>
                    ) : canManageAssetLibrary ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onCreateLibrary(ip.id); }}
                        className="w-full py-2 bg-white border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:text-indigo-500 text-slate-400 text-xs font-black rounded-xl transition-colors flex items-center justify-center space-x-2"
                      >
                        <i className="fa-solid fa-folder-plus"></i>
                        <span>创建图库</span>
                      </button>
                    ) : (
                      <div className="w-full py-2 bg-slate-50 text-slate-400 text-xs font-bold rounded-xl text-center">
                        未开启图库
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest w-1/3">IP 标识</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">权属性质</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">类别标签</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">区域标签</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">关联图库</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedIps.map(ip => {
                  const hasAccess = canView(ip);
                  return (
                    <tr 
                      key={ip.id} 
                      onClick={() => hasAccess ? onSelect(ip) : alert('您没有权限查看此私密库，请在权限管理中申请。')}
                      className="group hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          {renderCover(ip, hasAccess, true)}
                          <div>
                            <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{ip.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{ip.englishName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                          ip.ownership === 'ORIGINAL' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {ip.ownership === 'ORIGINAL' ? '自有 IP' : '三方 IP'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {ip.categories.map(cat => (
                            <span key={cat} className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-sm">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {ip.regions.map(region => (
                            <span key={region} className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                              <i className="fa-solid fa-globe mr-1 text-slate-400"></i>
                              {region}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {ip.hasAssetLibrary ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onGoToLibrary(ip); }}
                            className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center w-fit"
                          >
                            <i className="fa-solid fa-folder-open mr-1.5"></i>
                            一键跳转
                          </button>
                        ) : canManageAssetLibrary ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onCreateLibrary(ip.id); }}
                            className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 border border-dashed border-slate-300 hover:border-indigo-400 bg-white px-3 py-1.5 rounded-lg transition-colors flex items-center w-fit"
                          >
                            <i className="fa-solid fa-folder-plus mr-1.5"></i>
                            创建图库
                          </button>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">未开启</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default IPGallery;
