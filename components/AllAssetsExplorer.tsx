import React, { useState, useMemo } from 'react';
import { Asset, IP, AssetLibrary, User, UserRole, AssetCategory } from '../types';
import AssetCard from './AssetCard';
import LazyImage from './LazyImage';
import { AssetDetailModal } from './AssetDetailModal';
import PermissionConfigModal from './PermissionConfigModal';
import BatchRenameModal from './BatchRenameModal';
import { MOCK_USERS } from '../constants';

interface AllAssetsExplorerProps {
  ips: IP[];
  libraries: AssetLibrary[];
  assets: Asset[];
  currentUser: User;
  onSelectAsset?: (asset: Asset) => void;
  selectedAssetIds?: Set<string>;
  onToggleSelectAsset?: (assetId: string, e: React.MouseEvent) => void;
  onClearSelection?: () => void;
  onSelectAll?: (assetIds: string[]) => void;
  onBatchUpdateAssets?: (updatedAssets: Asset[]) => void;
  onUploadToCategory?: (ipId: string, libraryId: string, category: string) => void;
  initialIpId?: string | null;
  initialLibraryId?: string | null;
  initialCategory?: string | null;
  onUpdateAsset?: (updatedAsset: Asset) => void;
  onUpdateIP?: (updatedIP: IP) => void;
  onUpdateLibrary?: (updatedLibrary: AssetLibrary) => void;
  favoriteAssetIds?: Set<string>;
  onToggleFavorite?: (assetId: string, e: React.MouseEvent) => void;
}

export type CategoryKey = AssetCategory | 'ALL';

export interface CategoryFolderMeta {
  key: AssetCategory;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
  accentColor: string;
  badgeColor: string;
  formats: string[];
  description: string;
}

// 3. Fixed Default Presentation Order:
// 1. 2D -> 2. 3D -> 3. GRAPHIC (平面) -> 4. PACKAGING (包装) -> 5. DISPLAY (陈列) -> 6. PHOTO (实拍照片) -> 7. VIDEO (视频)
export const CATEGORY_DEFINITIONS: CategoryFolderMeta[] = [
  {
    key: '2D',
    title: '2D 资产',
    subtitle: '原画设定 / 角色立绘 / 概念草图',
    icon: 'fa-paintbrush',
    gradient: 'from-blue-600 to-indigo-700',
    accentColor: 'text-blue-600',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    formats: ['PSD', 'AI', 'PNG', 'SVG', 'CLIP'],
    description: '收录官方 2D 原画概念、角色三视图、矢量徽章及分层源文件'
  },
  {
    key: '3D',
    title: '3D 资产',
    subtitle: '高模雕刻 / 打印工程 / 模具图档',
    icon: 'fa-cube',
    gradient: 'from-purple-600 to-indigo-800',
    accentColor: 'text-purple-600',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    formats: ['OBJ', 'FBX', 'ZTL', 'STL', 'STEP', 'MAX'],
    description: '收录 3D 高精雕刻数模、3D 打印生产工程件、骨骼绑定及模具拆件'
  },
  {
    key: 'GRAPHIC',
    title: '平面',
    subtitle: '品牌规范 / 字体徽标 / 矢量元素',
    icon: 'fa-vector-square',
    gradient: 'from-cyan-600 to-blue-700',
    accentColor: 'text-cyan-600',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    formats: ['AI', 'PDF', 'EPS', 'SVG'],
    description: '品牌 VI 视觉手册、LOGO 徽标标准组合、官方色彩规范及排版模板'
  },
  {
    key: 'PACKAGING',
    title: '包装',
    subtitle: '刀版结构 / 礼盒彩盒 / 外箱延展',
    icon: 'fa-box-open',
    gradient: 'from-emerald-600 to-teal-800',
    accentColor: 'text-emerald-600',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    formats: ['PDF', 'AI', 'CAD', 'DXF', 'PSD'],
    description: '印刷展开刀版线、彩盒烫金专色图层、包装内衬打样与外包装箱规范'
  },
  {
    key: 'DISPLAY',
    title: '陈列',
    subtitle: '终端道具 / 快闪空间 / 橱窗地堆',
    icon: 'fa-shop',
    gradient: 'from-amber-600 to-orange-700',
    accentColor: 'text-amber-600',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    formats: ['PSD', '3DS', 'SKP', 'JPG', 'PDF'],
    description: '专卖店展陈施工图、快闪店效果图、货架地堆及橱窗美陈规范'
  },
  {
    key: 'PHOTO',
    title: '实拍照片',
    subtitle: '打样摄影 / 实体细节 / 宣发静物',
    icon: 'fa-camera',
    gradient: 'from-rose-600 to-pink-700',
    accentColor: 'text-rose-600',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    formats: ['CR3', 'RAW', 'JPG', 'TIFF', 'PNG'],
    description: '工模首样打样实拍、大货成品棚拍静物、产品细节特写及宣发实景'
  },
  {
    key: 'VIDEO',
    title: '视频',
    subtitle: '宣发短片 / 动态特效 / 渲染动画',
    icon: 'fa-film',
    gradient: 'from-violet-600 to-purple-900',
    accentColor: 'text-violet-600',
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
    formats: ['MP4', 'MOV', 'PRORES', 'PRPROJ', 'AEP'],
    description: '产品上市宣传短片、3D 转台渲染视频、动态主视觉及短视频物料'
  }
];

export const AllAssetsExplorer: React.FC<AllAssetsExplorerProps> = ({
  ips: initialIps,
  libraries: initialLibraries,
  assets: initialAssets,
  currentUser,
  onSelectAsset,
  selectedAssetIds: selectedAssetIdsProp,
  onToggleSelectAsset,
  onClearSelection,
  onSelectAll,
  onBatchUpdateAssets,
  onUploadToCategory,
  initialIpId = null,
  initialLibraryId = null,
  initialCategory = null,
  onUpdateAsset,
  favoriteAssetIds = new Set(),
  onToggleFavorite
}) => {
  // Local state for dynamic updates (permissions, etc.)
  const [localIps, setLocalIps] = useState<IP[]>(initialIps);
  const [localLibraries, setLocalLibraries] = useState<AssetLibrary[]>(initialLibraries);
  const [localAssets, setLocalAssets] = useState<Asset[]>(initialAssets);

  // Batch Operation and Selection states
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchRenameOpen, setIsBatchRenameOpen] = useState(false);
  const [batchToast, setBatchToast] = useState<string | null>(null);

  const effectiveSelectedIds = selectedAssetIdsProp !== undefined ? selectedAssetIdsProp : internalSelectedIds;

  const handleToggleSelect = (assetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelectAsset) {
      onToggleSelectAsset(assetId, e);
    } else {
      setInternalSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(assetId)) next.delete(assetId);
        else next.add(assetId);
        return next;
      });
    }
  };

  const handleSelectAllCategory = (categoryAssets: Asset[]) => {
    const catIds = categoryAssets.map(a => a.id);
    const allSelected = catIds.length > 0 && catIds.every(id => effectiveSelectedIds.has(id));
    if (allSelected) {
      if (onClearSelection) {
        onClearSelection();
      } else {
        setInternalSelectedIds(prev => {
          const next = new Set(prev);
          catIds.forEach(id => next.delete(id));
          return next;
        });
      }
    } else {
      if (onSelectAll) {
        onSelectAll(catIds);
      } else {
        setInternalSelectedIds(prev => {
          const next = new Set(prev);
          catIds.forEach(id => next.add(id));
          return next;
        });
      }
    }
  };

  const handleApplyBatchRename = (updatedAssets: Asset[]) => {
    const updatedMap = new Map(updatedAssets.map(a => [a.id, a]));
    setLocalAssets(prev => prev.map(a => updatedMap.get(a.id) || a));
    if (onBatchUpdateAssets) {
      onBatchUpdateAssets(updatedAssets);
    } else if (onUpdateAsset) {
      updatedAssets.forEach(a => onUpdateAsset(a));
    }

    if (onClearSelection) onClearSelection();
    setInternalSelectedIds(new Set());

    setBatchToast(`已成功批量重命名 ${updatedAssets.length} 个资产物料！`);
    setTimeout(() => setBatchToast(null), 3000);
  };

  // Sync if props change
  React.useEffect(() => { setLocalIps(initialIps); }, [initialIps]);
  React.useEffect(() => { setLocalLibraries(initialLibraries); }, [initialLibraries]);
  React.useEffect(() => { setLocalAssets(initialAssets); }, [initialAssets]);

  // ==========================================
  // NAVIGATION STATE HIERARCHY (NO POPUP MODALS)
  // Level 1: selectedIpId === null (All IP folders)
  // Level 2: selectedIpId !== null && selectedLibraryId === null (Theme Libraries under IP)
  // Level 3: selectedLibraryId !== null && selectedCategory === null && selectedAsset === null (7 Category Folders Overview)
  // Level 4: selectedCategory !== null && selectedAsset === null (Category Multi-Image Folder Browser View)
  // Level 5: selectedAsset !== null (Individual Asset Detail Page View)
  // ==========================================
  const [selectedIpId, setSelectedIpId] = useState<string | null>(initialIpId);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(initialLibraryId);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(
    (initialCategory as AssetCategory) || null
  );
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Permission Configuration Modal State
  const [permissionTarget, setPermissionTarget] = useState<{
    type: 'IP' | 'LIBRARY';
    item: IP | AssetLibrary;
  } | null>(null);

  // Filter & Search State (In-Page)
  const [searchQuery, setSearchQuery] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState<'ALL' | 'ORIGINAL' | 'LICENSED'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'SIZE' | 'NAME'>('NEWEST');
  const [filterOnlyWithLineage, setFilterOnlyWithLineage] = useState(false);
  const [folderViewMode, setFolderViewMode] = useState<'GRID' | 'LIST'>('GRID');

  // Quick Preview Hover Popup State
  const [quickPreviewAsset, setQuickPreviewAsset] = useState<Asset | null>(null);
  const [quickPreviewPos, setQuickPreviewPos] = useState<{ x: number; y: number; placement: 'left' | 'right' }>({ x: 0, y: 0, placement: 'right' });
  const hoverTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnterAsset = (asset: Asset, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Determine whether to show on left or right of the card
    const isRightSpaceEnough = windowWidth - rect.right > 360;
    const placement = isRightSpaceEnough ? 'right' : 'left';
    
    let x = isRightSpaceEnough ? rect.right + 12 : rect.left - 352;
    if (x < 12) x = 12;

    // Calculate Y position keeping within screen bounds
    let y = rect.top;
    if (y + 420 > windowHeight) {
      y = windowHeight - 430;
    }
    if (y < 20) y = 20;

    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setQuickPreviewPos({ x, y, placement });
      setQuickPreviewAsset(asset);
    }, 280); // Small 280ms deliberate hover delay for smooth UX
  };

  const handleMouseLeaveAsset = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setQuickPreviewAsset(null);
  };

  // Active IP Object
  const currentIP = useMemo(() => {
    return localIps.find(ip => ip.id === selectedIpId) || null;
  }, [localIps, selectedIpId]);

  // Active Library Object
  const currentLibrary = useMemo(() => {
    return localLibraries.find(lib => lib.id === selectedLibraryId) || null;
  }, [localLibraries, selectedLibraryId]);

  // Active Category Meta
  const currentCategoryMeta = useMemo(() => {
    if (!selectedCategory) return null;
    return CATEGORY_DEFINITIONS.find(c => c.key === selectedCategory) || null;
  }, [selectedCategory]);

  // Downstream count map for lineage
  const downstreamCountsMap = useMemo(() => {
    const map = new Map<string, number>();
    localAssets.forEach(a => {
      (a.upstreamAssetIds || []).forEach(upId => {
        map.set(upId, (map.get(upId) || 0) + 1);
      });
    });
    return map;
  }, [localAssets]);

  // Helper to resolve normalized category
  const getAssetCategory = (asset: Asset): AssetCategory => {
    if (asset.category) return asset.category;
    if (asset.type === '3D') return '3D';
    if (asset.type === 'PHOTO') return 'PHOTO';
    if (asset.type === 'VIDEO') return 'VIDEO';
    if (asset.type === 'PACKAGING') return 'PACKAGING';
    if (asset.type === 'DISPLAY') return 'DISPLAY';
    if (asset.type === 'GRAPHIC') return 'GRAPHIC';
    return '2D';
  };

  // IP Folder Stats Calculation
  const ipStatsMap = useMemo(() => {
    const map = new Map<string, { libraryCount: number; assetCount: number; totalSize: string }>();
    localIps.forEach(ip => {
      const ipLibs = localLibraries.filter(l => l.ipId === ip.id);
      const ipAssets = localAssets.filter(a => a.ipId === ip.id);
      
      let totalMB = 0;
      ipAssets.forEach(a => {
        const sizeNum = parseInt(a.fileSize, 10) || 15;
        totalMB += sizeNum;
      });

      map.set(ip.id, {
        libraryCount: ipLibs.length,
        assetCount: ipAssets.length,
        totalSize: totalMB > 1024 ? `${(totalMB / 1024).toFixed(1)} GB` : `${totalMB} MB`
      });
    });
    return map;
  }, [localIps, localLibraries, localAssets]);

  // Filtered IPs in Level 1
  const filteredIPs = useMemo(() => {
    return localIps.filter(ip => {
      const matchesSearch = ip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ip.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ip.categories || []).some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesOwnership = ownershipFilter === 'ALL' || ip.ownership === ownershipFilter;
      return matchesSearch && matchesOwnership;
    });
  }, [localIps, searchQuery, ownershipFilter]);

  // Libraries under current IP in Level 2
  const currentIpLibraries = useMemo(() => {
    if (!selectedIpId) return [];
    return localLibraries.filter(lib => {
      const matchesIp = lib.ipId === selectedIpId;
      const matchesSearch = !searchQuery.trim() || 
        lib.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lib.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesIp && matchesSearch;
    });
  }, [localLibraries, selectedIpId, searchQuery]);

  // Library Stats Calculation
  const getLibraryStats = (libId: string) => {
    const libAssets = localAssets.filter(a => a.libraryId === libId || (!a.libraryId && a.ipId === selectedIpId));
    let totalMB = 0;
    libAssets.forEach(a => {
      const sizeNum = parseInt(a.fileSize, 10) || 15;
      totalMB += sizeNum;
    });

    return {
      totalAssets: libAssets.length,
      totalSize: totalMB > 1024 ? `${(totalMB / 1024).toFixed(1)} GB` : `${totalMB} MB`
    };
  };

  // Category counts & assets in current library
  const libraryCategoryData = useMemo(() => {
    if (!selectedIpId || !selectedLibraryId) return { counts: {} as Record<string, number>, assetsByCategory: {} as Record<string, Asset[]> };
    
    const counts: Record<string, number> = {
      ALL: 0, '2D': 0, '3D': 0, 'GRAPHIC': 0, 'PACKAGING': 0, 'DISPLAY': 0, 'PHOTO': 0, 'VIDEO': 0
    };
    const assetsByCategory: Record<string, Asset[]> = {
      '2D': [], '3D': [], 'GRAPHIC': [], 'PACKAGING': [], 'DISPLAY': [], 'PHOTO': [], 'VIDEO': []
    };

    localAssets.forEach(a => {
      const matchIp = a.ipId === selectedIpId;
      const matchLib = !a.libraryId || a.libraryId === selectedLibraryId;
      if (matchIp && matchLib) {
        counts.ALL++;
        const cat = getAssetCategory(a);
        if (counts[cat] !== undefined) {
          counts[cat]++;
          assetsByCategory[cat].push(a);
        }
      }
    });

    return { counts, assetsByCategory };
  }, [localAssets, selectedIpId, selectedLibraryId]);

  // Level 4 Category Filtered Assets
  const currentCategoryAssets = useMemo(() => {
    if (!selectedIpId || !selectedLibraryId || !selectedCategory) return [];

    let list = localAssets.filter(asset => {
      if (asset.ipId !== selectedIpId) return false;
      if (asset.libraryId && asset.libraryId !== selectedLibraryId) return false;
      
      const cat = getAssetCategory(asset);
      if (cat !== selectedCategory) return false;

      // Filter by lineage
      if (filterOnlyWithLineage) {
        const hasUpstream = (asset.upstreamAssetIds || []).length > 0;
        const hasDownstream = (downstreamCountsMap.get(asset.id) || 0) > 0;
        if (!hasUpstream && !hasDownstream) return false;
      }

      // Filter by Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = asset.title.toLowerCase().includes(query);
        const matchesTags = (asset.tags || []).some(t => t.toLowerCase().includes(query));
        const matchesUploader = asset.uploader.toLowerCase().includes(query);
        if (!matchesTitle && !matchesTags && !matchesUploader) return false;
      }

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'SIZE') {
        return (parseInt(b.fileSize, 10) || 0) - (parseInt(a.fileSize, 10) || 0);
      }
      if (sortBy === 'NAME') {
        return a.title.localeCompare(b.title, 'zh-CN');
      }
      return 0;
    });

    return list;
  }, [localAssets, selectedIpId, selectedLibraryId, selectedCategory, filterOnlyWithLineage, searchQuery, sortBy, downstreamCountsMap]);

  // Navigation Resets
  const resetToRoot = () => {
    setSelectedIpId(null);
    setSelectedLibraryId(null);
    setSelectedCategory(null);
    setSelectedAsset(null);
    setSearchQuery('');
  };

  const selectIP = (ipId: string) => {
    setSelectedIpId(ipId);
    setSelectedLibraryId(null);
    setSelectedCategory(null);
    setSelectedAsset(null);
    setSearchQuery('');
  };

  const selectLibrary = (libId: string) => {
    setSelectedLibraryId(libId);
    setSelectedCategory(null);
    setSelectedAsset(null);
    setSearchQuery('');
  };

  const selectCategory = (categoryKey: AssetCategory) => {
    setSelectedCategory(categoryKey);
    setSelectedAsset(null);
    setSearchQuery('');
  };

  const handleSelectAssetItem = (asset: Asset) => {
    setSelectedAsset(asset);
    if (onSelectAsset) onSelectAsset(asset);
  };

  // Permission Save Handlers
  const handleSavePermissions = (newPermissions: {
    adminIds: string[];
    viewerIds: string[];
    uploaderIds: string[];
    downloaderIds: string[];
  }) => {
    if (!permissionTarget) return;

    if (permissionTarget.type === 'IP') {
      setLocalIps(prev => prev.map(ip => {
        if (ip.id === permissionTarget.item.id) {
          return {
            ...ip,
            adminIds: newPermissions.adminIds,
            viewerIds: newPermissions.viewerIds,
            uploaderIds: newPermissions.uploaderIds,
            downloaderIds: newPermissions.downloaderIds
          };
        }
        return ip;
      }));
    } else {
      setLocalLibraries(prev => prev.map(lib => {
        if (lib.id === permissionTarget.item.id) {
          return {
            ...lib,
            adminIds: newPermissions.adminIds,
            viewerIds: newPermissions.viewerIds,
            uploaderIds: newPermissions.uploaderIds,
            downloaderIds: newPermissions.downloaderIds
          };
        }
        return lib;
      }));
    }
  };

  // Update asset handler (e.g. from detail page)
  const handleUpdateAssetInternal = (updated: Asset) => {
    setLocalAssets(prev => prev.map(a => a.id === updated.id ? updated : a));
    setSelectedAsset(updated);
    if (onUpdateAsset) onUpdateAsset(updated);
  };

  // ==========================================
  // 2. CLEAN, UNBOXED SINGLE BREADCRUMB PATH INDICATOR
  // ==========================================
  const renderBreadcrumbTrail = () => {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 font-medium py-1">
        <button
          onClick={resetToRoot}
          className={`transition-colors cursor-pointer ${
            !selectedIpId 
              ? 'text-slate-900 font-bold' 
              : 'text-slate-500 hover:text-indigo-600 font-medium'
          }`}
        >
          全部资产
        </button>

        {currentIP && (
          <>
            <span className="text-slate-300 font-normal select-none">/</span>
            <button
              onClick={() => { setSelectedLibraryId(null); setSelectedCategory(null); setSelectedAsset(null); }}
              className={`transition-colors cursor-pointer truncate max-w-[200px] ${
                !selectedLibraryId ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-indigo-600 font-medium'
              }`}
              title={currentIP.name}
            >
              {currentIP.name}
            </button>
          </>
        )}

        {currentLibrary && (
          <>
            <span className="text-slate-300 font-normal select-none">/</span>
            <button
              onClick={() => { setSelectedCategory(null); setSelectedAsset(null); }}
              className={`transition-colors cursor-pointer truncate max-w-[200px] ${
                !selectedCategory && !selectedAsset ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-indigo-600 font-medium'
              }`}
              title={currentLibrary.name}
            >
              {currentLibrary.name}
            </button>
          </>
        )}

        {currentCategoryMeta && (
          <>
            <span className="text-slate-300 font-normal select-none">/</span>
            <button
              onClick={() => setSelectedAsset(null)}
              className={`transition-colors cursor-pointer ${
                !selectedAsset ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-indigo-600 font-medium'
              }`}
            >
              {currentCategoryMeta.title}
            </button>
          </>
        )}

        {selectedAsset && (
          <>
            <span className="text-slate-300 font-normal select-none">/</span>
            <span className="text-slate-900 font-bold truncate max-w-[260px]" title={selectedAsset.title}>
              {selectedAsset.title}
            </span>
          </>
        )}
      </nav>
    );
  };

  // =========================================================================
  // LEVEL 5: INDIVIDUAL ASSET DETAIL PAGE VIEW (NO MODAL, IN-PAGE DRILLDOWN)
  // =========================================================================
  if (selectedAsset) {
    return (
      <div className="space-y-4 pb-20 animate-fadeIn">
        <AssetDetailModal
          asset={selectedAsset}
          allAssets={localAssets}
          allIPs={localIps}
          allLibraries={localLibraries}
          currentUser={currentUser}
          isPageMode={true}
          breadcrumbsNode={renderBreadcrumbTrail()}
          onBack={() => setSelectedAsset(null)}
          onClose={() => setSelectedAsset(null)}
          onSelectAsset={(newAsset) => setSelectedAsset(newAsset)}
          onUpdateAsset={handleUpdateAssetInternal}
          isFavorited={favoriteAssetIds.has(selectedAsset.id)}
          onToggleFavorite={onToggleFavorite}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24 animate-fadeIn">
      {/* 2. Top Single Unboxed Breadcrumb & In-page Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1">
        <div className="flex-1 min-w-0">
          {renderBreadcrumbTrail()}
        </div>

        {/* In-Page Quick Filters & Search */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          {/* Level 1 IP Ownership Filter (Placed in Top Bar) */}
          {!selectedIpId && (
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setOwnershipFilter('ALL')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  ownershipFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                全部 ({localIps.length})
              </button>
              <button
                onClick={() => setOwnershipFilter('ORIGINAL')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  ownershipFilter === 'ORIGINAL' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                自有 IP ({localIps.filter(i => i.ownership === 'ORIGINAL').length})
              </button>
              <button
                onClick={() => setOwnershipFilter('LICENSED')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  ownershipFilter === 'LICENSED' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                三方授权 ({localIps.filter(i => i.ownership === 'LICENSED').length})
              </button>
            </div>
          )}

          {/* Level 3 Library Controls (Library Permission Config & Upload) */}
          {selectedIpId && selectedLibraryId && !selectedCategory && currentLibrary && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setPermissionTarget({ type: 'LIBRARY', item: currentLibrary })}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                title="配置图库专属权限"
              >
                <i className="fa-solid fa-gear text-xs text-purple-600"></i>
                <span>图库权限</span>
              </button>
              {onUploadToCategory && currentIP && (
                <button
                  onClick={() => onUploadToCategory(currentIP.id, currentLibrary.id, '2D')}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-cloud-arrow-up text-[11px]"></i>
                  <span>上传物料</span>
                </button>
              )}
            </div>
          )}

          {/* Search Filter Input */}
          <div className="relative">
            <i className="fa-solid fa-filter absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                !selectedIpId 
                  ? '当前目录内筛选 IP...' 
                  : !selectedLibraryId 
                    ? '当前 IP 内筛选图库...' 
                    : !selectedCategory
                      ? '图库内搜索物料/分类...'
                      : `搜索 ${currentCategoryMeta?.title || '分类'} 内资产ID、名称...`
              }
              className="bg-slate-50 border border-slate-200/90 rounded-xl pl-7 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all w-44 md:w-52"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LEVEL 1: ALL IP FOLDERS GRID VIEW                                         */}
      {/* ========================================================================= */}
      {!selectedIpId && (
        <div className="space-y-6">
          {/* 1. IP Cards Grid: 6 cards per row on PC (xl:grid-cols-6) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
            {filteredIPs.map(ip => {
              const stats = ipStatsMap.get(ip.id) || { libraryCount: 0, assetCount: 0, totalSize: '0 MB' };
              
              return (
                <div
                  key={ip.id}
                  onClick={() => selectIP(ip.id)}
                  className="group bg-white rounded-xl border border-slate-200/90 hover:border-indigo-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden relative flex flex-col"
                >
                  {/* Top Cover Box - 5:4 Aspect Ratio with Lazy Loading */}
                  <div className="aspect-[5/4] w-full bg-slate-100 relative overflow-hidden shrink-0">
                    <LazyImage
                      src={ip.coverImage}
                      alt={ip.name}
                      aspectRatio="aspect-[5/4]"
                      placeholderIcon="fa-folder-closed"
                      className="group-hover:scale-105 transition-transform duration-300"
                    >
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none"></div>

                      {/* 1(b) Top Right Settings Gear Button (Configures IP Permissions) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPermissionTarget({ type: 'IP', item: ip });
                        }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-slate-900/80 hover:bg-indigo-600 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-xs border border-white/20 hover:scale-105 z-10 cursor-pointer"
                        title="配置 IP 空间权限 (自动级联至下属图库)"
                      >
                        <i className="fa-solid fa-gear text-[10px]"></i>
                      </button>

                      {/* Top Left Ownership Badge */}
                      <div className="absolute top-2 left-2 flex items-center space-x-1 z-10">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs backdrop-blur-md ${
                          ip.ownership === 'ORIGINAL' 
                            ? 'bg-indigo-600/90 text-white' 
                            : 'bg-emerald-600/90 text-white'
                        }`}>
                          {ip.ownership === 'ORIGINAL' ? '自有 IP' : '三方授权'}
                        </span>
                      </div>

                      {/* Bottom Overlay Title & Subtitle */}
                      <div className="absolute bottom-2 left-2.5 right-2.5 z-10">
                        <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-indigo-200 transition-colors drop-shadow-md truncate">
                          {ip.name}
                        </h3>
                        {ip.englishName && (
                          <p className="text-[10px] font-mono font-medium text-slate-300 drop-shadow-xs truncate mt-0.5">
                            {ip.englishName}
                          </p>
                        )}
                      </div>
                    </LazyImage>
                  </div>

                  {/* 1(a) Bottom Bar: Library count + Asset count + Total Size */}
                  <div className="p-2 sm:p-2.5 flex items-center justify-between bg-white text-[11px] border-t border-slate-100">
                    <div className="flex items-center space-x-2 truncate">
                      {/* Library Count */}
                      <span className="font-bold text-slate-700 flex items-center space-x-1 shrink-0" title={`${stats.libraryCount} 本主题图库`}>
                        <i className="fa-solid fa-folder-open text-amber-500 text-[10px]"></i>
                        <span className="font-mono font-bold text-slate-900">{stats.libraryCount}</span>
                      </span>

                      {/* Asset Count */}
                      <span className="font-bold text-slate-700 flex items-center space-x-1 border-l border-slate-100 pl-2 shrink-0" title={`资产物料: ${stats.assetCount} 件`}>
                        <i className="fa-solid fa-layer-group text-indigo-500 text-[10px]"></i>
                        <span className="font-mono font-bold text-slate-900">{stats.assetCount}</span>
                      </span>

                      {/* Storage Size */}
                      <span className="font-bold text-slate-500 hidden 2xl:flex items-center space-x-1 border-l border-slate-100 pl-2 shrink-0" title={`总容量: ${stats.totalSize}`}>
                        <i className="fa-solid fa-hard-drive text-slate-400 text-[9px]"></i>
                        <span className="font-mono text-[10px] text-slate-600">{stats.totalSize}</span>
                      </span>
                    </div>

                    <div className="flex items-center text-indigo-600 font-bold space-x-1 text-[10px] shrink-0 group-hover:translate-x-0.5 transition-transform">
                      <i className="fa-solid fa-chevron-right text-[9px]"></i>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 2: THEME LIBRARIES UNDER SELECTED IP (SIMPLIFIED CLEAN GRID)         */}
      {/* ========================================================================= */}
      {selectedIpId && !selectedLibraryId && currentIP && (
        <div className="space-y-6">
          {/* Theme Libraries Grid: 6 cards per row on PC (xl:grid-cols-6) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
            {currentIpLibraries.map(lib => {
              const libStats = getLibraryStats(lib.id);
              return (
                <div
                  key={lib.id}
                  onClick={() => selectLibrary(lib.id)}
                  className="group bg-white rounded-xl border border-slate-200/90 hover:border-purple-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden relative flex flex-col"
                >
                  {/* Visual Cover Top - 5:4 Aspect Ratio with Lazy Loading */}
                  <div className="aspect-[5/4] w-full bg-slate-100 relative overflow-hidden shrink-0">
                    <LazyImage
                      src={lib.coverImage}
                      alt={lib.name}
                      aspectRatio="aspect-[5/4]"
                      placeholderIcon="fa-images"
                      className="group-hover:scale-105 transition-transform duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none"></div>

                      {/* Top Right Settings Gear Button for Library */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPermissionTarget({ type: 'LIBRARY', item: lib });
                        }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-slate-900/80 hover:bg-purple-600 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-xs border border-white/20 hover:scale-105 z-10 cursor-pointer"
                        title="配置该图库专属权限 (已级联继承 IP 权限)"
                      >
                        <i className="fa-solid fa-gear text-[10px]"></i>
                      </button>

                      {/* Top Left Version Tag */}
                      {lib.version && (
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded text-purple-700 text-[9px] font-mono font-black shadow-xs z-10">
                          {lib.version}
                        </div>
                      )}

                      {/* Bottom Title */}
                      <div className="absolute bottom-2 left-2.5 right-2.5 z-10">
                        <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-purple-200 transition-colors drop-shadow-md truncate">
                          {lib.name}
                        </h4>
                      </div>
                    </LazyImage>
                  </div>

                  {/* Clean Library Footer: Icon + Numbers */}
                  <div className="p-2 sm:p-2.5 flex items-center justify-between bg-white text-[11px] border-t border-slate-100">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="font-bold text-slate-700 flex items-center space-x-1 shrink-0" title={`资产数量: ${libStats.totalAssets} 件`}>
                        <i className="fa-solid fa-layer-group text-purple-600 text-[10px]"></i>
                        <span className="font-mono font-bold text-slate-900">{libStats.totalAssets}</span>
                      </span>
                      <span className="font-bold text-slate-500 flex items-center space-x-1 border-l border-slate-100 pl-2 shrink-0" title={`容量: ${libStats.totalSize}`}>
                        <i className="fa-solid fa-hard-drive text-slate-400 text-[9px]"></i>
                        <span className="font-mono text-[10px] text-slate-600">{libStats.totalSize}</span>
                      </span>
                    </div>

                    <div className="flex items-center text-purple-600 font-bold space-x-1 text-[10px] shrink-0 group-hover:translate-x-0.5 transition-transform">
                      <i className="fa-solid fa-chevron-right text-[9px]"></i>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 3: 7 CATEGORY FOLDERS OVERVIEW (IN STRICT PRESET ORDER)              */}
      {/* ========================================================================= */}
      {selectedIpId && selectedLibraryId && !selectedCategory && currentIP && currentLibrary && (
        <div className="space-y-6">
          {/* 3. 7 Fixed Category Folders in Preset Order:
              1. 2D -> 2. 3D -> 3. GRAPHIC -> 4. PACKAGING -> 5. DISPLAY -> 6. PHOTO -> 7. VIDEO */}
          <div>
            {/* 7 Category Cards: 6 cards per row on PC (xl:grid-cols-6) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
              {CATEGORY_DEFINITIONS.map(cat => {
                const count = libraryCategoryData.counts[cat.key] || 0;
                const catAssets = libraryCategoryData.assetsByCategory[cat.key] || [];
                const firstThumb = catAssets[0]?.thumbnail;
                
                let catTotalMB = 0;
                catAssets.forEach(a => { catTotalMB += parseInt(a.fileSize, 10) || 15; });
                const sizeStr = catTotalMB > 1024 ? `${(catTotalMB / 1024).toFixed(1)} GB` : `${catTotalMB} MB`;

                return (
                  <div
                    key={cat.key}
                    onClick={() => selectCategory(cat.key)}
                    className="group bg-white rounded-xl border border-slate-200/90 hover:border-indigo-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden relative flex flex-col justify-between"
                  >
                    {/* Visual Top Preview - 5:4 Aspect Ratio with Lazy Loading */}
                    <div className="aspect-[5/4] w-full bg-slate-100 relative overflow-hidden">
                      <LazyImage
                        src={firstThumb}
                        alt={cat.title}
                        category={cat.key}
                        aspectRatio="aspect-[5/4]"
                        placeholderIcon={cat.icon}
                        className="group-hover:scale-105 transition-transform duration-300"
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none"></div>

                        {/* Top Left Category Badge */}
                        <div className="absolute top-2 left-2 flex items-center space-x-1 z-10">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs border backdrop-blur-md ${cat.badgeColor}`}>
                            <i className={`fa-solid ${cat.icon} mr-1 text-[8px]`}></i>
                            {cat.title}
                          </span>
                        </div>

                        {/* Bottom Title */}
                        <div className="absolute bottom-2 left-2.5 right-2.5 z-10">
                          <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-indigo-200 transition-colors drop-shadow-md truncate">
                            {cat.title}
                          </h4>
                          <p className="text-[9px] text-slate-300 truncate">
                            {cat.subtitle}
                          </p>
                        </div>
                      </LazyImage>
                    </div>

                    {/* Middle Description & Formats */}
                    <div className="p-2 sm:p-2.5 space-y-1.5 flex-1">
                      <p className="text-[10px] text-slate-500 line-clamp-1 leading-snug">
                        {cat.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {cat.formats.slice(0, 3).map(fmt => (
                          <span key={fmt} className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1 py-0.2 rounded">
                            {fmt}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer: Count & Size */}
                    <div className="p-2 sm:p-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center space-x-2 truncate">
                        <span className="font-bold text-slate-700 flex items-center space-x-1 shrink-0" title={`${count} 件物料`}>
                          <i className="fa-solid fa-layer-group text-indigo-500 text-[10px]"></i>
                          <span className="font-mono font-bold text-slate-900">{count}</span>
                        </span>
                        <span className="font-bold text-slate-500 flex items-center space-x-1 border-l border-slate-200 pl-2 shrink-0" title={`容量: ${sizeStr}`}>
                          <i className="fa-solid fa-hard-drive text-slate-400 text-[9px]"></i>
                          <span className="font-mono text-[10px] text-slate-600">{sizeStr}</span>
                        </span>
                      </div>

                      <span className="text-indigo-600 font-bold text-[10px] flex items-center space-x-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform">
                        <span>进入</span>
                        <i className="fa-solid fa-chevron-right text-[8px]"></i>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 4: DIRECT IMAGE & FILENAME PREVIEW TILING (图片与文件名平铺预览)      */}
      {/* ========================================================================= */}
      {selectedIpId && selectedLibraryId && selectedCategory && !selectedAsset && currentIP && currentLibrary && currentCategoryMeta && (
        <div className="space-y-4 animate-fadeIn">
          {/* 1. Category Tabs Navigation & Batch Action Bar (横向分类快捷切换与批量操作) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/80">
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 mr-1"
                title="返回全部分类"
              >
                <i className="fa-solid fa-arrow-left text-[10px]"></i>
                <span>全部目录</span>
              </button>

              {CATEGORY_DEFINITIONS.map(cat => {
                const count = libraryCategoryData.counts[cat.key] || 0;
                const isActive = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => {
                      setSelectedCategory(cat.key);
                      setSearchQuery('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                    }`}
                  >
                    <i className={`fa-solid ${cat.icon} text-[10px] ${isActive ? 'text-white' : 'text-slate-400'}`}></i>
                    <span>{cat.title}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Batch Action Toolbar on Top Right */}
            {currentCategoryAssets.length > 0 && (
              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleSelectAllCategory(currentCategoryAssets)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border shadow-2xs ${
                    currentCategoryAssets.length > 0 && currentCategoryAssets.every(a => effectiveSelectedIds.has(a.id))
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <i className={`fa-solid ${
                    currentCategoryAssets.length > 0 && currentCategoryAssets.every(a => effectiveSelectedIds.has(a.id))
                      ? 'fa-square-check text-indigo-600'
                      : 'fa-square text-slate-400'
                  } text-xs`}></i>
                  <span>
                    {currentCategoryAssets.length > 0 && currentCategoryAssets.every(a => effectiveSelectedIds.has(a.id))
                      ? '取消本类全选'
                      : `全选本类 (${currentCategoryAssets.length})`}
                  </span>
                </button>

                {effectiveSelectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsBatchRenameOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs animate-fadeIn"
                  >
                    <i className="fa-solid fa-pen-to-square text-xs"></i>
                    <span>批量重命名 ({effectiveSelectedIds.size})</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 2. Direct Image & Filename Tiling Grid (直接平铺图片与文件名) */}
          {currentCategoryAssets.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
              {currentCategoryAssets.map(asset => {
                const isSelected = effectiveSelectedIds.has(asset.id);
                return (
                  <div
                    key={asset.id}
                    onClick={() => {
                      handleMouseLeaveAsset();
                      handleSelectAssetItem(asset);
                    }}
                    onMouseEnter={(e) => handleMouseEnterAsset(asset, e)}
                    onMouseLeave={handleMouseLeaveAsset}
                    className={`group bg-white rounded-xl border overflow-hidden transition-all cursor-pointer flex flex-col relative ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/80 shadow-md'
                        : 'border-slate-200 hover:border-indigo-500 hover:shadow-md'
                    }`}
                    title={asset.title}
                  >
                    {/* Top-Left Selection Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleSelect(asset.id, e)}
                      className={`absolute top-2 left-2 z-20 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                        isSelected
                          ? 'bg-indigo-600 text-white ring-2 ring-white scale-105 opacity-100'
                          : 'bg-slate-900/60 hover:bg-slate-900 text-white/80 border border-white/30 opacity-0 group-hover:opacity-100'
                      }`}
                      title={isSelected ? '取消勾选' : '勾选此物料'}
                    >
                      {isSelected ? (
                        <i className="fa-solid fa-check text-xs"></i>
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-xs border border-white/80"></div>
                      )}
                    </button>

                    {/* Top-Right Favorite Heart */}
                    {onToggleFavorite && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(asset.id, e);
                        }}
                        className={`absolute top-2 right-2 z-20 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                          favoriteAssetIds.has(asset.id)
                            ? 'bg-white text-rose-500 ring-1 ring-rose-500/20 scale-105 opacity-100'
                            : 'bg-slate-900/60 hover:bg-white text-white/90 hover:text-rose-500 opacity-0 group-hover:opacity-100'
                        }`}
                        title={favoriteAssetIds.has(asset.id) ? '取消收藏' : '加入我的收藏'}
                      >
                        <i className={`fa-${favoriteAssetIds.has(asset.id) ? 'solid' : 'regular'} fa-heart text-[10px]`}></i>
                      </button>
                    )}

                    {/* Image Thumbnail - 5:4 aspect ratio with Lazy Loading and skeleton placeholder */}
                    <LazyImage
                      src={asset.thumbnail}
                      alt={asset.title}
                      category={asset.category || asset.type}
                      aspectRatio="aspect-[5/4]"
                      className="group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Filename / Title & Asset ID */}
                    <div className="p-2 sm:p-2.5 bg-white">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-mono text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1 py-0.2 rounded truncate">
                          {asset.id}
                        </span>
                        {asset.version && (
                          <span className="text-[9px] font-mono text-slate-400 shrink-0">
                            {asset.version}
                          </span>
                        )}
                      </div>
                      <h4 className={`text-xs font-bold truncate transition-colors ${
                        isSelected ? 'text-indigo-600 font-black' : 'text-slate-800 group-hover:text-indigo-600'
                      }`}>
                        {asset.title}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center text-xl">
                <i className="fa-solid fa-folder-open"></i>
              </div>
              <h4 className="text-sm font-black text-slate-800">当前分类暂无物料</h4>
              <p className="text-xs text-slate-400">请切换其他分类或上传新文件</p>
            </div>
          )}
        </div>
      )}

      {/* 1(c) Permission Configuration Modal (Manage, View, Upload, Download with Cascade rule) */}
      {permissionTarget && (
        <PermissionConfigModal
          type={permissionTarget.type}
          targetItem={permissionTarget.item}
          parentIP={permissionTarget.type === 'LIBRARY' ? currentIP : null}
          allUsers={MOCK_USERS}
          onSave={handleSavePermissions}
          onClose={() => setPermissionTarget(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* QUICK PREVIEW HOVER FLOATING POPUP (轻量快速预览浮层)                       */}
      {/* ========================================================================= */}
      {quickPreviewAsset && (
        <div
          style={{
            position: 'fixed',
            top: `${quickPreviewPos.y}px`,
            left: `${quickPreviewPos.x}px`,
            width: '340px',
            zIndex: 9999,
          }}
          className="pointer-events-none animate-fadeIn select-none"
        >
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden p-3.5 text-white flex flex-col space-y-3 ring-1 ring-black/50">
            {/* Top High-Resolution Visual Preview */}
            <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-950 border border-white/10 flex items-center justify-center">
              <LazyImage
                src={quickPreviewAsset.thumbnail}
                alt={quickPreviewAsset.title}
                category={quickPreviewAsset.category || quickPreviewAsset.type}
                aspectRatio="aspect-[16/10]"
              >
                {/* Top Floaters */}
                <div className="absolute top-2 left-2 flex items-center space-x-1.5 z-10">
                  <span className="bg-indigo-600/90 text-white text-[9px] font-mono font-black px-2 py-0.5 rounded-md shadow-sm">
                    {quickPreviewAsset.category || quickPreviewAsset.type}
                  </span>
                  {quickPreviewAsset.version && (
                    <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                      {quickPreviewAsset.version}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-slate-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md z-10">
                  {quickPreviewAsset.fileSize}
                </div>
              </LazyImage>
            </div>

            {/* Core Metadata Information (Title, Creator, Specs, Stage, Lineage) */}
            <div className="space-y-2 text-left">
              <div>
                <h4 className="text-xs font-black text-white leading-tight line-clamp-2">
                  {quickPreviewAsset.title}
                </h4>
                {quickPreviewAsset.copyright && (
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">
                    {quickPreviewAsset.copyright.owner} · {quickPreviewAsset.copyright.code}
                  </p>
                )}
              </div>

              {/* Specs & Attributes Grid */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-white/5 p-2 rounded-xl border border-white/10">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">格式</span>
                  <span className="font-bold text-indigo-300">{quickPreviewAsset.type}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">制作阶段</span>
                  <span className="font-bold text-emerald-400">{quickPreviewAsset.stage}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">上传作者</span>
                  <span className="truncate max-w-[85px] text-slate-200">{quickPreviewAsset.uploader}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">血缘依赖</span>
                  <span className="font-bold text-amber-300">
                    {(quickPreviewAsset.upstreamAssetIds || []).length} 引用 / {downstreamCountsMap.get(quickPreviewAsset.id) || 0} 衍生
                  </span>
                </div>
              </div>

              {/* Tags Preview */}
              {quickPreviewAsset.tags && quickPreviewAsset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {quickPreviewAsset.tags.slice(0, 4).map(tag => (
                    <span key={tag} className="text-[9px] font-mono text-slate-300 bg-white/10 px-1.5 py-0.5 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Hover Quick Tip */}
              <div className="pt-1 flex items-center justify-between text-[9px] text-slate-400 border-t border-white/10 font-sans">
                <span>点击卡片进入完整全屏详情页</span>
                <span className="text-indigo-400 font-bold flex items-center space-x-1">
                  <i className="fa-solid fa-arrow-pointer text-[8px]"></i>
                  <span>快速预览中</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING BATCH ACTION BAR (批量操作悬浮底栏)                                */}
      {/* ========================================================================= */}
      {effectiveSelectedIds.size > 0 && !selectedAsset && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-fadeIn">
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-4 border border-slate-700/80 ring-1 ring-black/40">
            <div className="flex items-center space-x-2.5">
              <span className="flex items-center justify-center bg-indigo-600 w-6 h-6 rounded-full text-xs font-mono font-bold text-white shadow-xs">
                {effectiveSelectedIds.size}
              </span>
              <span className="text-xs font-bold text-slate-200">已选择物料</span>
            </div>

            <div className="w-px h-5 bg-slate-700"></div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsBatchRenameOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer hover:scale-102"
              >
                <i className="fa-solid fa-pen-to-square text-xs"></i>
                <span>批量重命名</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  alert(`开始打包下载选中的 ${effectiveSelectedIds.size} 个物料源工程文件...`);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer border border-slate-700"
              >
                <i className="fa-solid fa-download text-xs text-indigo-400"></i>
                <span>批量下载</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onClearSelection) onClearSelection();
                  setInternalSelectedIds(new Set());
                }}
                className="text-slate-400 hover:text-white p-2 transition-colors rounded-xl hover:bg-slate-800 cursor-pointer"
                title="清空已选"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BATCH RENAME MODAL (批量重命名弹窗)                                         */}
      {/* ========================================================================= */}
      {isBatchRenameOpen && (
        <BatchRenameModal
          selectedAssets={localAssets.filter(a => effectiveSelectedIds.has(a.id))}
          allIPs={localIps}
          allLibraries={localLibraries}
          currentUser={currentUser}
          onClose={() => setIsBatchRenameOpen(false)}
          onApplyRename={handleApplyBatchRename}
        />
      )}

      {/* Toast Notification */}
      {batchToast && (
        <div className="fixed top-6 right-6 z-50 animate-fadeIn">
          <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-indigo-500/30 flex items-center space-x-3 text-xs font-bold">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
              <i className="fa-solid fa-check text-xs"></i>
            </div>
            <span>{batchToast}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllAssetsExplorer;
