import React, { useState, useMemo, useEffect } from 'react';
import { Asset, IP, AssetLibrary, User, UserRole, AssetCategory, ProjectStage, AssetVersionRecord, AssetOperationRecord } from '../types';
import { CATEGORY_DEFINITIONS } from './AllAssetsExplorer';
import { AssetCommentsSection } from './AssetCommentsSection';
import { UniversalAssetViewer } from './preview/UniversalAssetViewer';
import LazyImage from './LazyImage';
import { MOCK_USERS } from '../constants';

// Ordered standard 7-stage design & production pipeline
export const PIPELINE_STAGES: { key: AssetCategory; title: string; icon: string; shortDesc: string }[] = [
  { key: '2D', title: '2D 资产', icon: 'fa-paintbrush', shortDesc: '概念原画 / 设定稿' },
  { key: '3D', title: '3D 资产', icon: 'fa-cube', shortDesc: '数模雕刻 / 打印件' },
  { key: 'GRAPHIC', title: '平面', icon: 'fa-vector-square', shortDesc: '品牌 VI / 视觉排版' },
  { key: 'PACKAGING', title: '包装', icon: 'fa-box-open', shortDesc: '彩盒刀版 / 打样结构' },
  { key: 'DISPLAY', title: '陈列', icon: 'fa-shop', shortDesc: '美陈道具 / 展架方案' },
  { key: 'PHOTO', title: '实拍照片', icon: 'fa-camera', shortDesc: '打样摄影 / 实体静物' },
  { key: 'VIDEO', title: '视频', icon: 'fa-film', shortDesc: '宣发短片 / 3D 动效' },
];

const STAGE_LABELS: Record<string, string> = {
  [ProjectStage.SKETCH]: '概念草图',
  [ProjectStage.TOY_2D_COLORED]: '2D 上色',
  [ProjectStage.TOY_3D_MODEL]: '3D 建模',
  [ProjectStage.PACKAGING]: '包装设计',
  [ProjectStage.MARKETING]: '宣发营销',
  [ProjectStage.CARD_IP_SOURCE]: 'IP 图源',
  [ProjectStage.CARD_FRONT_BACK]: '卡牌正背面',
  [ProjectStage.CARD_PRODUCTION]: '生产文件',
};

interface AssetDetailProps {
  asset: Asset;
  allAssets: Asset[];
  allIPs: IP[];
  allLibraries: AssetLibrary[];
  currentUser: User;
  onClose: () => void;
  onSelectAsset: (asset: Asset) => void;
  onUpdateAsset?: (updatedAsset: Asset) => void;
  isPageMode?: boolean;
  onBack?: () => void;
  breadcrumbsNode?: React.ReactNode;
  isFavorited?: boolean;
  onToggleFavorite?: (assetId: string, e: React.MouseEvent) => void;
}

function getSuggestedNextVersion(current: string, type: 'minor' | 'major' = 'minor'): string {
  const match = current.match(/v?(\d+)(\.(\d+))?/i);
  if (!match) return 'v1.1';
  const major = parseInt(match[1] || '1', 10);
  const minor = parseInt(match[3] || '0', 10);
  if (type === 'major') {
    return `v${major + 1}.0`;
  }
  return `v${major}.${minor + 1}`;
}

export const AssetDetailModal: React.FC<AssetDetailProps> = ({
  asset,
  allAssets,
  allIPs,
  allLibraries,
  currentUser,
  onClose,
  onSelectAsset,
  onUpdateAsset,
  isPageMode = false,
  onBack,
  breadcrumbsNode,
  isFavorited = false,
  onToggleFavorite
}) => {
  const [isLinkingParent, setIsLinkingParent] = useState(false);
  const [parentSearch, setParentSearch] = useState('');
  const [parentCategoryFilter, setParentCategoryFilter] = useState<string>('ALL');
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  const [showFullImageViewer, setShowFullImageViewer] = useState(false);
  const [copiedAssetId, setCopiedAssetId] = useState(false);

  const [activeDetailTab, setActiveDetailTab] = useState<'DETAIL' | 'OPERATION_HISTORY'>('DETAIL');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<'ALL' | 'CREATE_AND_EDIT' | 'VERSION' | 'DOWNLOAD' | 'PERMISSION'>('ALL');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Version management states
  const [viewingVersion, setViewingVersion] = useState<string | null>(null);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [versionMode, setVersionMode] = useState<'CREATE_NEW' | 'OVERWRITE'>('CREATE_NEW');
  const [versionUploadFile, setVersionUploadFile] = useState<File | null>(null);
  const [versionUploadPreview, setVersionUploadPreview] = useState<string | null>(null);
  const [versionUploadFileName, setVersionUploadFileName] = useState('');
  const [versionUploadFileSize, setVersionUploadFileSize] = useState('');
  const [versionTagInput, setVersionTagInput] = useState('');
  const [targetOverwriteVersion, setTargetOverwriteVersion] = useState('');
  const [versionChangeLog, setVersionChangeLog] = useState('');
  const [isDraggingVersionFile, setIsDraggingVersionFile] = useState(false);
  const versionFileInputRef = useRef<HTMLInputElement>(null);

  // Quick copy Asset ID helper
  const handleCopyAssetId = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(asset.id);
    setCopiedAssetId(true);
    setDownloadSuccessToast(`已复制全局资产ID: ${asset.id}`);
    setTimeout(() => {
      setCopiedAssetId(false);
      setDownloadSuccessToast(null);
    }, 2500);
  };

  const ip = allIPs.find(i => i.id === asset.ipId);
  const library = allLibraries.find(l => l.id === asset.libraryId);

  // Derive explicit file format
  const fileFormat = asset.metadata?.format || (
    asset.category === '3D' ? 'OBJ' :
    asset.category === 'VIDEO' ? 'MP4' :
    asset.category === 'PHOTO' ? 'JPG' :
    asset.category === 'GRAPHIC' ? 'AI' :
    asset.category === 'PACKAGING' ? 'PSD' :
    asset.category === 'DISPLAY' ? 'DWG' :
    'PSD'
  );

  // Helper to get user profile by name
  const getUserProfile = (name?: string, avatar?: string) => {
    const found = MOCK_USERS.find(u => u.name === name || (name && u.name.includes(name)));
    return {
      name: name || '资产库设计员',
      avatar: avatar || found?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      department: found?.department || '研发中心',
      role: found?.role === UserRole.SUPER_ADMIN ? '超级管理员' : found?.role === UserRole.DEPT_ADMIN ? '部门主管' : '设计专员'
    };
  };

  // Compile comprehensive operation history for this asset
  const fullOperationHistory = useMemo(() => {
    const logs: AssetOperationRecord[] = [];

    // 1. Initial Creation Record
    const creatorUser = getUserProfile(asset.uploader, asset.uploaderAvatar);
    logs.push({
      id: `op-create-${asset.id}`,
      type: 'CREATE',
      operatorName: creatorUser.name,
      operatorAvatar: creatorUser.avatar,
      operatorRole: '设计专员 / 原建档人',
      operatorDepartment: asset.department || '潮玩研发中心',
      timestamp: asset.createdAt,
      summary: `物料初始建档入库，生成全局唯一资产ID 【${asset.id}】`,
      details: `完成 ${STAGE_LABELS[asset.stage] || asset.stage} 阶段规范录入。源工程格式: .${fileFormat}，初始体积: ${asset.fileSize}。初始标签: ${(asset.tags || []).map(t => `#${t}`).join(' ') || '无'}。`,
      badge: '新建入库',
      badgeColor: 'emerald',
      extraMeta: {
        version: 'v1.0',
        fileSize: asset.fileSize,
        fieldsChanged: ['id', 'title', 'stage', 'category', 'fileSize']
      }
    });

    // 2. Version Upgrades
    if (asset.versionHistory && asset.versionHistory.length > 0) {
      asset.versionHistory.forEach((v, idx) => {
        const u = getUserProfile(v.updater, v.updaterAvatar);
        logs.push({
          id: `op-ver-${asset.id}-${v.version}-${idx}`,
          type: 'VERSION_UPGRADE',
          operatorName: u.name,
          operatorAvatar: u.avatar,
          operatorRole: '主美 / 审核设计师',
          operatorDepartment: '研发中心',
          timestamp: v.updatedAt,
          summary: `发布物料迭代新版本 【${v.version}】`,
          details: v.changeLog || '更新源工程高模面数与纹理贴图，修复边缘倒角精度。',
          badge: '版本升级',
          badgeColor: 'amber',
          extraMeta: {
            version: v.version,
            fileSize: v.fileSize
          }
        });
      });
    }

    // 3. Upstream Lineage Linkages
    if (asset.upstreamAssetIds && asset.upstreamAssetIds.length > 0) {
      asset.upstreamAssetIds.forEach((pId, idx) => {
        const parent = allAssets.find(a => a.id === pId);
        logs.push({
          id: `op-link-${asset.id}-${pId}-${idx}`,
          type: 'LINK_UPSTREAM',
          operatorName: 'Alex (Super Admin)',
          operatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          operatorRole: '资产管理员',
          operatorDepartment: '资产中台',
          timestamp: asset.updatedAt || asset.createdAt,
          summary: `关联上游设计源物料 【${parent?.title || pId}】`,
          details: `已将上游 ${parent?.category || '2D'} 资产纳入当前物料的 7 阶段全生命周期链路映射关系，确立溯源谱系。`,
          badge: '链路关联',
          badgeColor: 'indigo'
        });
      });
    }

    // 4. Realistic Download Logs
    logs.push(
      {
        id: `op-dl-1-${asset.id}`,
        type: 'DOWNLOAD',
        operatorName: 'Sarah (PM)',
        operatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        operatorRole: '项目经理 (PM)',
        operatorDepartment: '玩具研发事业部',
        timestamp: '2026-08-15 17:42:10',
        summary: `调取下载最新定稿源文件 (.${fileFormat} · ${asset.fileSize})`,
        details: '下载用途: 提交制造工厂进行第一轮首板打样与开模核验。',
        badge: '物料调取',
        badgeColor: 'emerald',
        extraMeta: {
          downloadPurpose: '工厂生产首板打样核对',
          downloadFormat: fileFormat,
          version: asset.version || 'v1.0'
        }
      },
      {
        id: `op-dl-2-${asset.id}`,
        type: 'DOWNLOAD',
        operatorName: 'Elena (Marketing)',
        operatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
        operatorRole: '营销主创',
        operatorDepartment: '品牌与营销视觉中心',
        timestamp: '2026-08-14 14:15:30',
        summary: `调取下载物料渲染图与高清源文件 (.${fileFormat})`,
        details: '下载用途: 制作全球线上首发宣发海报、发布会 Keynote 主视觉与电商详情页物料。',
        badge: '物料调取',
        badgeColor: 'emerald',
        extraMeta: {
          downloadPurpose: '全球线上首发宣发海报设计',
          downloadFormat: fileFormat,
          version: asset.version || 'v1.0'
        }
      }
    );

    // 5. Permission Change History
    logs.push(
      {
        id: `op-perm-1-${asset.id}`,
        type: 'PERMISSION_CHANGE',
        operatorName: 'Alex (Super Admin)',
        operatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        operatorRole: '企业超级管理员',
        operatorDepartment: '资产治理中台',
        timestamp: asset.createdAt,
        summary: '初始化资产安全访问策略与图库鉴权',
        details: `继承所属 IP 【${ip?.name || '主图库'}】的访问策略。已授权研发部、营销中心为查看者，授权 PM 为下载者。`,
        badge: '权限初始化',
        badgeColor: 'purple',
        extraMeta: {
          permissionScope: '全公司认证员工可见，特定部门可下载'
        }
      },
      {
        id: `op-perm-2-${asset.id}`,
        type: 'PERMISSION_CHANGE',
        operatorName: 'Alex (Super Admin)',
        operatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        operatorRole: '企业超级管理员',
        operatorDepartment: '资产治理中台',
        timestamp: '2026-08-15 10:20:00',
        summary: '授权【星火签约合作工作室】外部团队有限访问权限',
        details: '审批通过工单 #REQ-20260815-08，开放外部协作原画师只读预览权限，禁用批量原始工程下载。',
        badge: '安全授权变更',
        badgeColor: 'purple',
        extraMeta: {
          permissionScope: '外部签约工作室预览鉴权'
        }
      }
    );

    // Merge any custom stored operation history records
    if (asset.operationHistory && asset.operationHistory.length > 0) {
      asset.operationHistory.forEach(rec => {
        if (!logs.some(l => l.id === rec.id)) {
          logs.unshift(rec);
        }
      });
    }

    // Sort by timestamp desc
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [asset, allAssets, fileFormat, ip]);

  // Filtered operation history based on selected filter and search query
  const filteredOperationHistory = useMemo(() => {
    return fullOperationHistory.filter(item => {
      // Category filter
      if (historyCategoryFilter === 'CREATE_AND_EDIT' && item.type !== 'CREATE' && item.type !== 'EDIT_INFO' && item.type !== 'LINK_UPSTREAM' && item.type !== 'UNLINK_UPSTREAM') {
        return false;
      }
      if (historyCategoryFilter === 'VERSION' && item.type !== 'VERSION_UPGRADE') {
        return false;
      }
      if (historyCategoryFilter === 'DOWNLOAD' && item.type !== 'DOWNLOAD') {
        return false;
      }
      if (historyCategoryFilter === 'PERMISSION' && item.type !== 'PERMISSION_CHANGE') {
        return false;
      }

      // Search query
      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase().trim();
        const matchText = `${item.operatorName} ${item.operatorDepartment || ''} ${item.summary} ${item.details || ''} ${item.badge || ''}`.toLowerCase();
        if (!matchText.includes(q)) return false;
      }

      return true;
    });
  }, [fullOperationHistory, historyCategoryFilter, historySearchQuery]);

  // Export asset operation history as CSV
  const handleExportAssetHistoryCSV = () => {
    const headers = ['记录ID', '操作类型', '操作人', '部门', '时间戳', '摘要说明', '详细变更', '相关版本/参数'];
    const rows = filteredOperationHistory.map(item => [
      `"${item.id}"`,
      `"${item.badge || item.type}"`,
      `"${item.operatorName}"`,
      `"${item.operatorDepartment || ''}"`,
      `"${item.timestamp}"`,
      `"${item.summary.replace(/"/g, '""')}"`,
      `"${(item.details || '').replace(/"/g, '""')}"`,
      `"${item.extraMeta?.version || item.extraMeta?.downloadPurpose || item.extraMeta?.permissionScope || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ASSET_${asset.id}_OPERATION_HISTORY_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccessToast('已成功导出该资产操作历史审计报告 (CSV)');
    setTimeout(() => setDownloadSuccessToast(null), 3000);
  };

  // Quick edit state for basic information & tags
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [editTitle, setEditTitle] = useState(asset.title);
  const [editDescription, setEditDescription] = useState(asset.description || '');
  const [editCategory, setEditCategory] = useState<AssetCategory>((asset.category || asset.type || '2D') as AssetCategory);
  const [editStage, setEditStage] = useState<ProjectStage>(asset.stage);
  const [editFileSize, setEditFileSize] = useState(asset.fileSize || '');
  const [editFormat, setEditFormat] = useState(asset.metadata?.format || '');
  const [editResolution, setEditResolution] = useState(asset.metadata?.resolution || '');
  const [editPolyCount, setEditPolyCount] = useState<number | string>(asset.metadata?.polyCount || '');
  const [editTags, setEditTags] = useState<string[]>(asset.tags || []);
  const [newTagInput, setNewTagInput] = useState('');

  // Sync edit form whenever current asset changes
  useEffect(() => {
    setEditTitle(asset.title);
    setEditDescription(asset.description || '');
    setEditCategory((asset.category || asset.type || '2D') as AssetCategory);
    setEditStage(asset.stage);
    setEditFileSize(asset.fileSize || '');
    setEditFormat(asset.metadata?.format || (asset.category === '3D' ? 'OBJ' : asset.category === 'VIDEO' ? 'MP4' : asset.category === 'PHOTO' ? 'JPG' : 'PSD'));
    setEditResolution(asset.metadata?.resolution || '3840 x 2160 px');
    setEditPolyCount(asset.metadata?.polyCount || '');
    setEditTags(asset.tags || []);
    setIsEditingBasicInfo(false);
  }, [asset.id, asset]);

  // Check download permission
  const canDownload = currentUser.role === UserRole.SUPER_ADMIN || 
    currentUser.role === UserRole.DEPT_ADMIN || 
    currentUser.canManageAssetLibrary || 
    ip?.ownership === 'ORIGINAL';

  // Direct Parent Assets
  const parentAssets = useMemo(() => {
    return (asset.upstreamAssetIds || [])
      .map(id => allAssets.find(a => a.id === id))
      .filter((a): a is Asset => !!a);
  }, [asset.upstreamAssetIds, allAssets]);

  // Direct Child Assets
  const childAssets = useMemo(() => {
    return allAssets.filter(a => (a.upstreamAssetIds || []).includes(asset.id));
  }, [allAssets, asset.id]);

  // Category metadata for current asset
  const categoryMeta = CATEGORY_DEFINITIONS.find(c => c.key === (asset.category || asset.type));

  // Compute full 7-stage lineage pipeline map for this asset context
  const pipelineData = useMemo(() => {
    const relatedMap: Record<string, Asset[]> = {
      '2D': [],
      '3D': [],
      'GRAPHIC': [],
      'PACKAGING': [],
      'DISPLAY': [],
      'PHOTO': [],
      'VIDEO': [],
    };

    const addAssetToMap = (item: Asset) => {
      const cat = (item.category || item.type) as AssetCategory;
      if (relatedMap[cat] && !relatedMap[cat].some(a => a.id === item.id)) {
        relatedMap[cat].push(item);
      }
    };

    // 1. Add current asset
    addAssetToMap(asset);

    // 2. Add upstream parents
    parentAssets.forEach(p => addAssetToMap(p));

    // 3. Add downstream children
    childAssets.forEach(c => addAssetToMap(c));

    // 4. Find same IP / Library related assets in the chain if any
    allAssets.forEach(cand => {
      if (cand.id === asset.id) return;
      if (cand.ipId === asset.ipId && (cand.libraryId === asset.libraryId || cand.upstreamAssetIds?.includes(asset.id) || asset.upstreamAssetIds?.includes(cand.id))) {
        addAssetToMap(cand);
      }
    });

    return PIPELINE_STAGES.map((stage, idx) => {
      const stageAssets = relatedMap[stage.key] || [];
      return {
        stageIndex: idx + 1,
        ...stage,
        assets: stageAssets,
        hasCurrent: stageAssets.some(a => a.id === asset.id),
      };
    });
  }, [asset, parentAssets, childAssets, allAssets]);

  // Compile full version history with complete updater avatars and names
  const versionRecords = useMemo(() => {
    const list: AssetVersionRecord[] = [];
    const currentVersionNum = asset.version || 'v1.0';
    const currentUpdater = getUserProfile(asset.uploader, asset.uploaderAvatar);

    // If explicit versionHistory is provided, use it
    if (asset.versionHistory && asset.versionHistory.length > 0) {
      asset.versionHistory.forEach(v => {
        const profile = getUserProfile(v.updater, v.updaterAvatar);
        list.push({
          ...v,
          updater: profile.name,
          updaterAvatar: profile.avatar,
        });
      });
      // If currentVersionNum is not in the list, prepend it
      if (!list.some(v => v.version === currentVersionNum)) {
        list.unshift({
          version: currentVersionNum,
          updatedAt: asset.updatedAt || asset.createdAt,
          updater: currentUpdater.name,
          updaterAvatar: currentUpdater.avatar,
          fileSize: asset.fileSize,
          changeLog: '生产定稿最新版本归档入库，完成规格质检与链路核验。',
          downloadUrl: asset.thumbnail
        });
      }
    } else {
      // Default initial version
      list.push({
        version: currentVersionNum,
        updatedAt: asset.updatedAt || asset.createdAt,
        updater: currentUpdater.name,
        updaterAvatar: currentUpdater.avatar,
        fileSize: asset.fileSize,
        changeLog: '生产定稿最新版本归档入库，完成规格质检与链路核验。',
        downloadUrl: asset.thumbnail
      });

      if (currentVersionNum !== 'v1.0') {
        const initUpdater = getUserProfile('Alex (Super Admin)');
        list.push({
          version: 'v1.0',
          updatedAt: asset.createdAt,
          updater: initUpdater.name,
          updaterAvatar: initUpdater.avatar,
          fileSize: '78 MB',
          changeLog: '初始物料初审建档入库，完成合规与正版溯源记录。',
          downloadUrl: asset.thumbnail
        });
      }
    }

    return list;
  }, [asset]);

  // Derived asset based on viewingVersion (for historical version preview)
  const displayedAsset = useMemo(() => {
    if (!viewingVersion || viewingVersion === (asset.version || 'v1.0')) {
      return asset;
    }
    const matchedRecord = versionRecords.find(v => v.version === viewingVersion);
    if (!matchedRecord) return asset;
    return {
      ...asset,
      version: matchedRecord.version,
      fileSize: matchedRecord.fileSize || asset.fileSize,
      updatedAt: matchedRecord.updatedAt,
      thumbnail: matchedRecord.downloadUrl || asset.thumbnail,
    };
  }, [asset, viewingVersion, versionRecords]);

  // Open Version Management Modal
  const openVersionModal = (mode: 'CREATE_NEW' | 'OVERWRITE' = 'CREATE_NEW', targetVer?: string) => {
    setVersionMode(mode);
    setVersionUploadFile(null);
    setVersionUploadPreview(null);
    setVersionUploadFileName('');
    setVersionUploadFileSize('');
    setVersionTagInput(getSuggestedNextVersion(asset.version || 'v1.0', 'minor'));
    setTargetOverwriteVersion(targetVer || asset.version || 'v1.0');
    setVersionChangeLog('');
    setIsVersionModalOpen(true);
  };

  // Handle file select in version modal
  const handleVersionFileSelect = (file: File) => {
    setVersionUploadFile(file);
    setVersionUploadFileName(file.name);
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(file.size) / Math.log(k));
    const sizeStr = parseFloat((file.size / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    setVersionUploadFileSize(sizeStr);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setVersionUploadPreview(url);
    } else {
      setVersionUploadPreview(null);
    }

    if (!versionChangeLog) {
      if (versionMode === 'CREATE_NEW') {
        setVersionChangeLog(`优化物料源文件与导出规格，同步提交 ${file.name}`);
      } else {
        setVersionChangeLog(`修正源文件规格瑕疵，同名替换重导出：${file.name}`);
      }
    }
  };

  // Save new version or overwrite existing
  const handleSaveVersion = () => {
    const finalVerTag = versionMode === 'CREATE_NEW' 
      ? (versionTagInput.trim().startsWith('v') ? versionTagInput.trim() : `v${versionTagInput.trim()}`)
      : targetOverwriteVersion;

    if (!finalVerTag) {
      alert('请指定有效的版本号！');
      return;
    }

    const effectiveFileSize = versionUploadFileSize || asset.fileSize;
    const effectiveChangeLog = versionChangeLog.trim() || (
      versionMode === 'CREATE_NEW' ? `常规版本迭代更新（${finalVerTag}）` : `覆盖更新版本（${finalVerTag}）`
    );

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let updatedVersionHistory: AssetVersionRecord[] = [...(asset.versionHistory || [])];

    if (versionMode === 'CREATE_NEW') {
      const oldActiveVersion = asset.version || 'v1.0';
      const existsInHistory = updatedVersionHistory.some(v => v.version === oldActiveVersion);
      if (!existsInHistory) {
        updatedVersionHistory.push({
          version: oldActiveVersion,
          updatedAt: asset.updatedAt || asset.createdAt,
          updater: asset.uploader || currentUser.name,
          updaterAvatar: asset.uploaderAvatar || currentUser.avatar,
          fileSize: asset.fileSize,
          changeLog: '初始/前序发布版本归档。',
          downloadUrl: asset.thumbnail
        });
      }

      const newRecord: AssetVersionRecord = {
        version: finalVerTag,
        updatedAt: formattedDate,
        updater: currentUser.name,
        updaterAvatar: currentUser.avatar,
        fileSize: effectiveFileSize,
        changeLog: effectiveChangeLog,
        downloadUrl: versionUploadPreview || asset.thumbnail
      };
      updatedVersionHistory = [newRecord, ...updatedVersionHistory.filter(v => v.version !== finalVerTag)];

      const updatedAsset: Asset = {
        ...asset,
        version: finalVerTag,
        updatedAt: formattedDate,
        fileSize: effectiveFileSize,
        thumbnail: versionUploadPreview || asset.thumbnail,
        versionHistory: updatedVersionHistory,
        operationHistory: [
          {
            id: `hist_${Date.now()}_ver`,
            assetId: asset.id,
            actionType: 'VERSION_UPGRADE',
            operatorName: currentUser.name,
            operatorAvatar: currentUser.avatar,
            operatorRole: currentUser.role,
            timestamp: formattedDate,
            details: `创建新版本 ${finalVerTag}（源文件: ${versionUploadFileName || asset.title}，说明: ${effectiveChangeLog}）`
          },
          ...(asset.operationHistory || [])
        ]
      };

      if (onUpdateAsset) {
        onUpdateAsset(updatedAsset);
      }
      setViewingVersion(null);
      setIsVersionModalOpen(false);
      setDownloadSuccessToast(`🎉 成功发布并生效新版本 ${finalVerTag}！`);
      setTimeout(() => setDownloadSuccessToast(null), 3500);

    } else {
      // OVERWRITE EXISTING VERSION
      const targetVer = targetOverwriteVersion;
      let matched = false;
      updatedVersionHistory = updatedVersionHistory.map(v => {
        if (v.version === targetVer) {
          matched = true;
          return {
            ...v,
            updatedAt: `${formattedDate} (已覆盖更新)`,
            updater: currentUser.name,
            updaterAvatar: currentUser.avatar,
            fileSize: effectiveFileSize,
            changeLog: effectiveChangeLog,
            downloadUrl: versionUploadPreview || v.downloadUrl || asset.thumbnail
          };
        }
        return v;
      });

      if (!matched) {
        updatedVersionHistory.unshift({
          version: targetVer,
          updatedAt: `${formattedDate} (已覆盖更新)`,
          updater: currentUser.name,
          updaterAvatar: currentUser.avatar,
          fileSize: effectiveFileSize,
          changeLog: effectiveChangeLog,
          downloadUrl: versionUploadPreview || asset.thumbnail
        });
      }

      const isCurrentOverwritten = targetVer === (asset.version || 'v1.0');
      const updatedAsset: Asset = {
        ...asset,
        updatedAt: formattedDate,
        fileSize: isCurrentOverwritten ? effectiveFileSize : asset.fileSize,
        thumbnail: (isCurrentOverwritten && versionUploadPreview) ? versionUploadPreview : asset.thumbnail,
        versionHistory: updatedVersionHistory,
        operationHistory: [
          {
            id: `hist_${Date.now()}_ver_over`,
            assetId: asset.id,
            actionType: 'VERSION_UPGRADE',
            operatorName: currentUser.name,
            operatorAvatar: currentUser.avatar,
            operatorRole: currentUser.role,
            timestamp: formattedDate,
            details: `就地覆盖更新版本 ${targetVer}（源文件: ${versionUploadFileName || '新版文件'}，说明: ${effectiveChangeLog}）`
          },
          ...(asset.operationHistory || [])
        ]
      };

      if (onUpdateAsset) {
        onUpdateAsset(updatedAsset);
      }
      setIsVersionModalOpen(false);
      setDownloadSuccessToast(`✅ 成功就地覆盖更新版本 ${targetVer}！`);
      setTimeout(() => setDownloadSuccessToast(null), 3500);
    }
  };

  // Rollback to historical version
  const handleRollbackToVersion = (verTag: string) => {
    const targetRecord = versionRecords.find(v => v.version === verTag);
    if (!targetRecord) return;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const updatedAsset: Asset = {
      ...asset,
      version: targetRecord.version,
      updatedAt: formattedDate,
      fileSize: targetRecord.fileSize || asset.fileSize,
      thumbnail: targetRecord.downloadUrl || asset.thumbnail,
      operationHistory: [
        {
          id: `hist_${Date.now()}_ver_rollback`,
          assetId: asset.id,
          actionType: 'VERSION_ROLLBACK',
          operatorName: currentUser.name,
          operatorAvatar: currentUser.avatar,
          operatorRole: currentUser.role,
          timestamp: formattedDate,
          details: `回滚/切换生效版本至历史版本 ${targetRecord.version}`
        },
        ...(asset.operationHistory || [])
      ]
    };

    if (onUpdateAsset) {
      onUpdateAsset(updatedAsset);
    }
    setViewingVersion(null);
    setDownloadSuccessToast(`🔄 已成功将资产生效版本切换至 ${targetRecord.version}！`);
    setTimeout(() => setDownloadSuccessToast(null), 3500);
  };

  // Handle version-specific download
  const handleDownloadVersion = (ver: AssetVersionRecord) => {
    if (!canDownload) {
      alert('已提交该版本的下载申请，请等待管理员审核。');
      return;
    }
    setDownloadSuccessToast(`已启动下载【${asset.title}】版本 ${ver.version} - ${fileFormat} · ${ver.fileSize || asset.fileSize}`);
    setTimeout(() => setDownloadSuccessToast(null), 4000);
  };

  // Handle latest version download
  const handleDownloadLatest = () => {
    if (!canDownload) {
      alert('已提交该资产最新版本的下载申请，请等待管理员审核。');
      return;
    }
    const currentVersion = asset.version || 'v1.0';
    setDownloadSuccessToast(`已启动下载【${asset.title}】最新版 (${currentVersion}) - ${fileFormat} · ${asset.fileSize}`);
    setTimeout(() => setDownloadSuccessToast(null), 4000);
  };

  // Add parent reference
  const handleAddParent = (parentId: string) => {
    const currentParents = asset.upstreamAssetIds || [];
    if (currentParents.includes(parentId)) return;
    const parent = allAssets.find(a => a.id === parentId);
    
    const newOp: AssetOperationRecord = {
      id: `op-link-${Date.now()}`,
      type: 'LINK_UPSTREAM',
      operatorName: currentUser.name,
      operatorAvatar: currentUser.avatar,
      operatorRole: currentUser.role === UserRole.SUPER_ADMIN ? '超级管理员' : '设计管理员',
      operatorDepartment: currentUser.department || '资产治理中台',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      summary: `关联上游设计源物料 【${parent?.title || parentId}】`,
      details: `确立与上游 ${parent?.category || '2D'} 资产的 7 阶段全流程血缘追溯谱系。`,
      badge: '链路关联',
      badgeColor: 'indigo'
    };

    const updated: Asset = {
      ...asset,
      upstreamAssetIds: [...currentParents, parentId],
      operationHistory: [newOp, ...(asset.operationHistory || [])]
    };
    if (onUpdateAsset) onUpdateAsset(updated);
    setIsLinkingParent(false);
    setParentSearch('');
    setDownloadSuccessToast(`已成功建立与【${parent?.title || parentId}】的上游链路映射`);
    setTimeout(() => setDownloadSuccessToast(null), 3000);
  };

  // Remove parent reference
  const handleRemoveParent = (parentId: string) => {
    const currentParents = asset.upstreamAssetIds || [];
    const parent = allAssets.find(a => a.id === parentId);

    const newOp: AssetOperationRecord = {
      id: `op-unlink-${Date.now()}`,
      type: 'UNLINK_UPSTREAM',
      operatorName: currentUser.name,
      operatorAvatar: currentUser.avatar,
      operatorRole: currentUser.role === UserRole.SUPER_ADMIN ? '超级管理员' : '设计管理员',
      operatorDepartment: currentUser.department || '资产治理中台',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      summary: `解绑上游设计源物料 【${parent?.title || parentId}】`,
      details: `已移除该物料与上游 ${parent?.title || parentId} 的直接血缘依赖。`,
      badge: '链路解绑',
      badgeColor: 'amber'
    };

    const updated: Asset = {
      ...asset,
      upstreamAssetIds: currentParents.filter(id => id !== parentId),
      operationHistory: [newOp, ...(asset.operationHistory || [])]
    };
    if (onUpdateAsset) onUpdateAsset(updated);
    setDownloadSuccessToast(`已解绑上游资产【${parent?.title || parentId}】`);
    setTimeout(() => setDownloadSuccessToast(null), 3000);
  };

  // Add a new tag
  const handleAddTag = () => {
    const val = newTagInput.trim().replace(/^#/, '');
    if (!val) return;
    if (!editTags.includes(val)) {
      setEditTags([...editTags, val]);
    }
    setNewTagInput('');
  };

  // Remove a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(t => t !== tagToRemove));
  };

  // Save basic information updates
  const handleSaveBasicInfo = () => {
    if (!editTitle.trim()) {
      alert('标题不能为空');
      return;
    }

    const changes: string[] = [];
    if (editTitle.trim() !== asset.title) changes.push(`标题: "${asset.title}" ➔ "${editTitle.trim()}"`);
    if (editStage !== asset.stage) changes.push(`阶段: "${STAGE_LABELS[asset.stage] || asset.stage}" ➔ "${STAGE_LABELS[editStage] || editStage}"`);
    if (editCategory !== (asset.category || asset.type)) changes.push(`类别: "${asset.category || asset.type}" ➔ "${editCategory}"`);
    if (editFileSize.trim() && editFileSize.trim() !== asset.fileSize) changes.push(`文件大小: "${asset.fileSize}" ➔ "${editFileSize.trim()}"`);
    if (JSON.stringify(editTags) !== JSON.stringify(asset.tags)) changes.push(`标签: [${(asset.tags || []).join(', ')}] ➔ [${editTags.join(', ')}]`);

    const newOp: AssetOperationRecord = {
      id: `op-edit-${Date.now()}`,
      type: 'EDIT_INFO',
      operatorName: currentUser.name,
      operatorAvatar: currentUser.avatar,
      operatorRole: currentUser.role === UserRole.SUPER_ADMIN ? '超级管理员' : currentUser.role === UserRole.DEPT_ADMIN ? '部门主管' : '设计专员',
      operatorDepartment: currentUser.department || '资产中台',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      summary: '更新物料基本信息与属性标签',
      details: changes.length > 0 ? changes.join('； ') : '更新了物料的描述信息与元数据参数。',
      badge: '属性编辑',
      badgeColor: 'indigo',
      extraMeta: {
        fieldsChanged: changes
      }
    };

    const updated: Asset = {
      ...asset,
      title: editTitle.trim(),
      description: editDescription.trim(),
      category: editCategory,
      type: editCategory,
      stage: editStage,
      fileSize: editFileSize.trim() || asset.fileSize,
      tags: editTags,
      operationHistory: [newOp, ...(asset.operationHistory || [])],
      metadata: {
        ...asset.metadata,
        format: editFormat.trim().toUpperCase() || fileFormat,
        resolution: editResolution.trim() || asset.metadata?.resolution,
        polyCount: editPolyCount ? Number(editPolyCount) : asset.metadata?.polyCount,
      }
    };

    if (onUpdateAsset) {
      onUpdateAsset(updated);
    }
    setIsEditingBasicInfo(false);
    setDownloadSuccessToast('基本信息与标签已成功更新，已记录审计日志');
    setTimeout(() => setDownloadSuccessToast(null), 3000);
  };

  // Cancel basic information edit
  const handleCancelBasicInfo = () => {
    setEditTitle(asset.title);
    setEditDescription(asset.description || '');
    setEditCategory((asset.category || asset.type || '2D') as AssetCategory);
    setEditStage(asset.stage);
    setEditFileSize(asset.fileSize || '');
    setEditFormat(asset.metadata?.format || fileFormat);
    setEditResolution(asset.metadata?.resolution || '3840 x 2160 px');
    setEditPolyCount(asset.metadata?.polyCount || '');
    setEditTags(asset.tags || []);
    setIsEditingBasicInfo(false);
  };

  // Filter candidate parent assets for linking
  const candidateParentAssets = useMemo(() => {
    const q = parentSearch.trim().toLowerCase();
    return allAssets.filter(a => {
      if (a.id === asset.id) return false;
      if ((asset.upstreamAssetIds || []).includes(a.id)) return false;
      
      const matchesSearch = !q || (
        a.id.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        (a.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (a.category || a.type).toLowerCase().includes(q) ||
        (a.ipId || '').toLowerCase().includes(q)
      );

      if (!matchesSearch) return false;

      // If user directly inputs or matches the Asset ID, don't restrict by category filter so they find it immediately
      const directIdMatch = Boolean(q && a.id.toLowerCase().includes(q));
      if (!directIdMatch && parentCategoryFilter !== 'ALL' && (a.category || a.type) !== parentCategoryFilter) {
        return false;
      }

      return true;
    });
  }, [allAssets, asset, parentSearch, parentCategoryFilter]);

  const renderContent = () => (
    <div className="w-full space-y-4">
      {/* Toast Notification */}
      {downloadSuccessToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-xl shadow-2xl border border-indigo-500/40 flex items-center space-x-2.5 text-xs font-bold animate-bounce">
          <i className="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
          <span>{downloadSuccessToast}</span>
        </div>
      )}

      {/* Full Image Lightbox Modal */}
      {showFullImageViewer && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-6"
          onClick={() => setShowFullImageViewer(false)}
        >
          <button 
            onClick={() => setShowFullImageViewer(false)}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-lg transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          <div 
            className="w-full max-w-6xl h-[88vh] z-40"
            onClick={e => e.stopPropagation()}
          >
            <UniversalAssetViewer
              asset={asset}
              onDownload={canDownload ? handleDownloadLatest : undefined}
            />
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold shrink-0">
            <i className={`fa-solid ${categoryMeta?.icon || 'fa-file'}`}></i>
          </div>
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {asset.title}
              </h2>
              <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-md border border-indigo-100 shrink-0">
                {categoryMeta?.title || asset.category || asset.type}
              </span>
              <span className="bg-slate-100 text-slate-700 text-xs font-mono font-bold px-2 py-0.5 rounded shrink-0">
                {asset.version || 'v1.0'}
              </span>
              <span className="bg-amber-50 text-amber-700 text-xs font-mono font-bold px-2 py-0.5 rounded border border-amber-200 shrink-0">
                .{fileFormat}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md border border-slate-200/80 flex items-center gap-1.5 transition-colors">
                <i className="fa-solid fa-fingerprint text-indigo-500 text-[10px]"></i>
                <span>{asset.id}</span>
                <button
                  type="button"
                  onClick={handleCopyAssetId}
                  className="text-slate-400 hover:text-indigo-600 ml-1 transition-colors"
                  title="复制资产ID"
                >
                  <i className={`fa-solid ${copiedAssetId ? 'fa-check text-emerald-600' : 'fa-copy'} text-[10px]`}></i>
                </button>
              </span>
              <span className="text-xs text-slate-400">· 所属 IP: <strong className="text-slate-700 font-bold">{ip?.name || '未知 IP'}</strong></span>
              <span className="text-xs text-slate-400">· 阶段: <strong className="text-slate-700 font-bold">{STAGE_LABELS[asset.stage] || asset.stage}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => onToggleFavorite(asset.id, e)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center space-x-1.5 cursor-pointer ${
                isFavorited
                  ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-rose-500 hover:bg-slate-50'
              }`}
              title={isFavorited ? '已在收藏夹中，点击取消收藏' : '加入我的收藏'}
            >
              <i className={`fa-${isFavorited ? 'solid text-rose-500' : 'regular text-slate-400 hover:text-rose-500'} fa-heart text-xs`}></i>
              <span>{isFavorited ? '已收藏' : '收藏'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => openVersionModal('CREATE_NEW')}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/90 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer"
            title="上传同名/新版物料，支持版本保留或覆盖"
          >
            <i className="fa-solid fa-code-branch text-indigo-600"></i>
            <span>版本管理</span>
          </button>

          {canDownload ? (
            <button
              onClick={handleDownloadLatest}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-2 cursor-pointer"
              title={`下载 ${fileFormat} 格式源文件 (${asset.fileSize})`}
            >
              <i className="fa-solid fa-cloud-arrow-down text-xs"></i>
              <span>下载物料 ({fileFormat} · {asset.fileSize})</span>
            </button>
          ) : (
            <button
              onClick={() => alert('已发起下载权限申请，请联系部门管理员')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center space-x-2 cursor-pointer"
            >
              <i className="fa-solid fa-lock text-xs text-slate-400"></i>
              <span>申请权限</span>
            </button>
          )}

          {!isPageMode ? (
            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              title="关闭详情"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          ) : onBack ? (
            <button
              onClick={onBack}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer"
            >
              <i className="fa-solid fa-arrow-left text-[11px]"></i>
              <span>返回上级</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Main Tab Switcher: 【物料详情与评审】 vs 【操作历史与审计】 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveDetailTab('DETAIL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeDetailTab === 'DETAIL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <i className="fa-solid fa-layer-group text-xs"></i>
            <span>物料详情与评审</span>
          </button>

          <button
            onClick={() => setActiveDetailTab('OPERATION_HISTORY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeDetailTab === 'OPERATION_HISTORY'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <i className="fa-solid fa-clock-rotate-left text-xs"></i>
            <span>操作历史</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeDetailTab === 'OPERATION_HISTORY' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {fullOperationHistory.length}
            </span>
          </button>
        </div>

        {activeDetailTab === 'OPERATION_HISTORY' && (
          <div className="flex items-center space-x-2 px-1">
            <button
              onClick={handleExportAssetHistoryCSV}
              className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
              title="导出当前资产全量操作历史 CSV"
            >
              <i className="fa-solid fa-file-arrow-down text-indigo-600 text-xs"></i>
              <span>导出操作历史 (CSV)</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ASSET DETAILS & REVIEW (DEFAULT)                                   */}
      {/* ========================================================================= */}
      {activeDetailTab === 'DETAIL' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start animate-fadeIn">
        
        {/* ========================================================================= */}
        {/* LEFT / CENTER MAIN COLUMN: TOP PREVIEW + BOTTOM SIMPLIFIED COMMENTS        */}
        {/* ========================================================================= */}
        <div className="xl:col-span-7 2xl:col-span-8 space-y-5">
          
          {/* TOP: HIGH-DEF MEDIA PREVIEW CANVAS (浅色专业画布，全面支持 PDF / 各类图片 / PSD / AI / 视频 / 3D模型预览) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-3 sm:p-5 relative overflow-hidden group">
            {viewingVersion && viewingVersion !== (asset.version || 'v1.0') && (
              <div className="mb-3 p-3.5 bg-amber-50 border border-amber-200/90 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-amber-900 animate-fadeIn shadow-2xs">
                <div className="flex items-center space-x-2 min-w-0">
                  <i className="fa-solid fa-clock-rotate-left text-amber-600 text-sm shrink-0"></i>
                  <span>
                    您当前正在查阅历史归档版本 <strong>{viewingVersion}</strong>（当前生效版本为 <strong>{asset.version || 'v1.0'}</strong>）。
                  </span>
                </div>
                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleRollbackToVersion(viewingVersion)}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
                  >
                    设为生效定稿 (回滚)
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingVersion(null)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-amber-300 rounded-lg font-medium text-[11px] transition-all cursor-pointer shadow-2xs"
                  >
                    返回当前最新版
                  </button>
                </div>
              </div>
            )}

            <UniversalAssetViewer
              asset={displayedAsset}
              onFullscreen={() => setShowFullImageViewer(true)}
              onDownload={canDownload ? handleDownloadLatest : undefined}
            />
          </div>

          {/* BOTTOM: SIMPLIFIED COMMENTS & REVIEWS SECTION (文字、图片≤9、@成员、Emoji) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6">
            <AssetCommentsSection
              asset={asset}
              currentUser={currentUser}
              onUpdateAsset={onUpdateAsset}
            />
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT SIDEBAR: BASIC DETAILS (WITH QUICK EDIT) + LINEAGE + VERSIONS        */}
        {/* ========================================================================= */}
        <div className="xl:col-span-5 2xl:col-span-4 space-y-5">
          
          {/* 1. BASIC DETAILS CARD (支持快捷编辑) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <i className="fa-solid fa-circle-info text-indigo-600"></i>
                <span>基本详情</span>
              </h3>
              
              <div className="flex items-center space-x-2">
                {!isEditingBasicInfo ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingBasicInfo(true)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center space-x-1 cursor-pointer"
                    title="快捷编辑基本信息与标签"
                  >
                    <i className="fa-regular fa-pen-to-square text-[11px]"></i>
                    <span>快捷编辑</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={handleCancelBasicInfo}
                      className="px-2 py-0.5 rounded text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBasicInfo}
                      className="px-2.5 py-0.5 rounded text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                    >
                      保存
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* EDIT MODE FORM */}
            {isEditingBasicInfo ? (
              <div className="space-y-3 animate-fadeIn text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">标题</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                    placeholder="输入物料标题"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">简介描述</label>
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 resize-none"
                    placeholder="物料描述信息"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">资产类别</label>
                    <select
                      value={editCategory}
                      onChange={e => setEditCategory(e.target.value as AssetCategory)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                    >
                      {PIPELINE_STAGES.map(s => (
                        <option key={s.key} value={s.key}>{s.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">所处阶段</label>
                    <select
                      value={editStage}
                      onChange={e => setEditStage(e.target.value as ProjectStage)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                    >
                      {Object.entries(STAGE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">源工程格式 (如 PSD/OBJ)</label>
                    <input
                      type="text"
                      value={editFormat}
                      onChange={e => setEditFormat(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 uppercase font-mono"
                      placeholder="PSD"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">文件大小</label>
                    <input
                      type="text"
                      value={editFileSize}
                      onChange={e => setEditFileSize(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                      placeholder="128 MB"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">分辨率 / 尺寸</label>
                    <input
                      type="text"
                      value={editResolution}
                      onChange={e => setEditResolution(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                      placeholder="4096 x 4096 px"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">3D 三角面数</label>
                    <input
                      type="number"
                      value={editPolyCount}
                      onChange={e => setEditPolyCount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                      placeholder="850000"
                    />
                  </div>
                </div>

                {/* Tags Editing */}
                <div className="pt-1">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">语义标签编辑</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {editTags.map(tag => (
                      <span 
                        key={tag}
                        className="inline-flex items-center space-x-1 bg-indigo-50 text-indigo-700 text-[11px] font-medium px-2 py-0.5 rounded-md border border-indigo-200"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-rose-600 ml-0.5 cursor-pointer"
                        >
                          <i className="fa-solid fa-xmark text-[9px]"></i>
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={e => setNewTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="输入标签名称..."
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      + 添加
                    </button>
                  </div>
                </div>

                {/* Save & Cancel Bar */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleCancelBasicInfo}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBasicInfo}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs cursor-pointer"
                  >
                    保存基本信息
                  </button>
                </div>
              </div>
            ) : (
              /* VIEW MODE */
              <div className="space-y-3.5">
                {/* Global Unique Asset ID Pill */}
                <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black text-indigo-900/60 uppercase tracking-wider block">
                      全局唯一资产 ID
                    </span>
                    <span className="font-mono text-xs font-black text-indigo-950 truncate block mt-0.5 select-all">
                      {asset.id}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAssetId}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg text-[11px] font-bold border border-indigo-200 hover:border-transparent transition-all shrink-0 flex items-center space-x-1 shadow-xs"
                    title="复制资产ID"
                  >
                    <i className={`fa-solid ${copiedAssetId ? 'fa-check text-emerald-500' : 'fa-copy'}`}></i>
                    <span>{copiedAssetId ? '已复制' : '复制'}</span>
                  </button>
                </div>

                {asset.description && (
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {asset.description}
                  </p>
                )}

                {/* Specifications Matrix */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">资产类别</span>
                    <span className="font-bold text-indigo-600">{categoryMeta?.title || asset.type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">源工程格式</span>
                    <span className="font-bold font-mono text-amber-700">.{fileFormat}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">文件大小</span>
                    <span className="font-bold text-slate-800">{asset.fileSize}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">所处阶段</span>
                    <span className="font-bold text-slate-800">{STAGE_LABELS[asset.stage] || asset.stage}</span>
                  </div>
                  {asset.metadata?.resolution && (
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">分辨率 / 尺寸</span>
                      <span className="font-bold text-slate-800">{asset.metadata.resolution}</span>
                    </div>
                  )}
                  {asset.metadata?.polyCount && (
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">3D 雕刻面数</span>
                      <span className="font-bold text-purple-600">{asset.metadata.polyCount.toLocaleString()} 面</span>
                    </div>
                  )}
                </div>

                {/* Creator / Uploader Profile */}
                <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                      {asset.uploaderAvatar ? (
                        <img src={asset.uploaderAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        asset.uploader.slice(0, 1)
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">{asset.uploader}</p>
                      <p className="text-[10px] text-slate-400">{asset.department}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400">版本 {asset.version || 'v1.0'}</span>
                </div>

                {/* Tags Cloud */}
                {asset.tags && asset.tags.length > 0 && (
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        语义标签
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingBasicInfo(true)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                      >
                        编辑标签
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {asset.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 text-[10px] font-medium px-2.5 py-0.5 rounded-md border border-indigo-100/80 transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. ASSET LINEAGE PIPELINE CARD (资产链路) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <i className="fa-solid fa-timeline text-indigo-600"></i>
                  <span>资产链路</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  2D ➔ 3D ➔ 平面 ➔ 包装 ➔ 陈列 ➔ 实拍 ➔ 视频
                </p>
              </div>

              <button
                onClick={() => setIsLinkingParent(!isLinkingParent)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                  isLinkingParent
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200'
                }`}
              >
                <i className={`fa-solid ${isLinkingParent ? 'fa-xmark' : 'fa-link'} text-[10px]`}></i>
                <span>{isLinkingParent ? '取消' : '关联物料'}</span>
              </button>
            </div>

            {/* Parent Asset Selector Drawer */}
            {isLinkingParent && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-indigo-200 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">选择要关联的上游设计源:</span>
                  <span className="text-[10px] text-slate-400">如 2D 原画/底稿</span>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1">
                  {['ALL', '2D', '3D', 'GRAPHIC', 'PACKAGING'].map(catKey => (
                    <button
                      key={catKey}
                      onClick={() => setParentCategoryFilter(catKey)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                        parentCategoryFilter === catKey
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      {catKey === 'ALL' ? '全部' : catKey}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type="text"
                    value={parentSearch}
                    onChange={e => setParentSearch(e.target.value)}
                    placeholder="输入资产ID（如 HP_...）、标题或标签搜索..."
                    className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  {parentSearch && (
                    <button
                      type="button"
                      onClick={() => setParentSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                </div>

                {/* Candidate List */}
                <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1.5">
                  {candidateParentAssets.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                      {parentSearch ? `未找到包含 "${parentSearch}" 的资产ID或物料` : '暂无可关联资产'}
                    </div>
                  ) : (
                    candidateParentAssets.slice(0, 15).map(cand => (
                      <div 
                        key={cand.id}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-indigo-400 transition-colors"
                      >
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                          <div className="w-9 h-9 rounded overflow-hidden shrink-0 bg-slate-100">
                            <LazyImage 
                              src={cand.thumbnail} 
                              alt="" 
                              category={cand.category || cand.type}
                              className="w-full h-full object-cover" 
                              aspectRatio="aspect-square"
                            />
                          </div>
                          <div className="overflow-hidden">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded shrink-0">
                                {cand.id}
                              </span>
                              <p className="text-xs font-bold text-slate-800 truncate">{cand.title}</p>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {cand.category || cand.type} · {cand.version || 'v1.0'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddParent(cand.id)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-bold shrink-0 ml-2 cursor-pointer flex items-center space-x-1"
                        >
                          <i className="fa-solid fa-link text-[10px]"></i>
                          <span>关联</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 7-Stage Chain List */}
            <div className="space-y-2">
              {pipelineData.map((stage, idx) => {
                const hasAssets = stage.assets.length > 0;
                const isCurrentStage = stage.hasCurrent;

                return (
                  <div key={stage.key} className="relative">
                    <div className={`p-2.5 rounded-xl border transition-all ${
                      isCurrentStage
                        ? 'bg-indigo-50/80 border-indigo-400 shadow-2xs'
                        : hasAssets
                          ? 'bg-white border-slate-200'
                          : 'bg-slate-50/50 border-dashed border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                            isCurrentStage ? 'bg-indigo-600 text-white' : hasAssets ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                            <i className={`fa-solid ${stage.icon} text-xs ${isCurrentStage ? 'text-indigo-600' : 'text-slate-500'}`}></i>
                            <span>{stage.title}</span>
                          </span>
                        </div>

                        {isCurrentStage && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white font-mono">
                            ● 当前物料
                          </span>
                        )}
                      </div>

                      {/* Assets in this stage */}
                      {hasAssets ? (
                        <div className="space-y-1.5 pl-6">
                          {stage.assets.map(item => {
                            const isSelf = item.id === asset.id;
                            const isDirectParent = (asset.upstreamAssetIds || []).includes(item.id);
                            return (
                              <div
                                key={item.id}
                                onClick={() => !isSelf && onSelectAsset(item)}
                                className={`p-2 rounded-lg border flex items-center justify-between transition-colors ${
                                  isSelf
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                    : 'bg-slate-50 hover:bg-indigo-50/60 border-slate-200 text-slate-800 cursor-pointer'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5 overflow-hidden">
                                  <div className="w-8 h-8 rounded overflow-hidden shrink-0 bg-slate-100">
                                    <LazyImage 
                                      src={item.thumbnail} 
                                      alt="" 
                                      category={item.category || item.type}
                                      className="w-full h-full object-cover" 
                                      aspectRatio="aspect-square"
                                    />
                                  </div>
                                  <div className="overflow-hidden">
                                    <p className="text-xs font-bold truncate leading-tight">{item.title}</p>
                                    <p className={`text-[10px] truncate ${isSelf ? 'text-indigo-100' : 'text-slate-400'}`}>
                                      {item.version || 'v1.0'} · {STAGE_LABELS[item.stage] || item.stage}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1 shrink-0 ml-1">
                                  {isSelf ? (
                                    <span className="text-[10px] font-bold text-white px-1">本物料</span>
                                  ) : isDirectParent ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveParent(item.id);
                                      }}
                                      className="text-xs text-rose-500 hover:text-rose-700 px-1.5 py-0.5 rounded hover:bg-rose-50 cursor-pointer"
                                      title="解除父级关联"
                                    >
                                      解除
                                    </button>
                                  ) : (
                                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-slate-400 hover:text-indigo-600"></i>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Empty placeholder */
                        <div className="pl-6 py-0.5 text-[10px] text-slate-400 flex items-center justify-between">
                          <span className="italic">暂无物料 (空置)</span>
                          <button
                            onClick={() => {
                              setParentCategoryFilter(stage.key);
                              setIsLinkingParent(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold hover:underline cursor-pointer"
                          >
                            + 关联
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Arrow down connector */}
                    {idx < pipelineData.length - 1 && (
                      <div className="flex items-center justify-center py-0.5">
                        <i className="fa-solid fa-arrow-down text-[9px] text-slate-300"></i>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. VERSION HISTORY & RECORDS CARD (支持版本切换预览、设为定稿回滚、新版本上传与覆盖) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                  <i className="fa-solid fa-code-branch"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">版本日志与管理</h3>
                  <span className="text-[10px] text-slate-400 font-mono">共 {versionRecords.length} 个版本归档</span>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => openVersionModal('CREATE_NEW')}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center space-x-1 cursor-pointer"
                  title="上传同名或新版本文件，保留历史版本"
                >
                  <i className="fa-solid fa-plus text-[10px]"></i>
                  <span>新版本</span>
                </button>
                <button
                  type="button"
                  onClick={() => openVersionModal('OVERWRITE', asset.version || 'v1.0')}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center space-x-1 cursor-pointer"
                  title="覆盖更新当前生效版本文件"
                >
                  <i className="fa-solid fa-rotate text-[10px] text-slate-500"></i>
                  <span>覆盖更新</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {versionRecords.map((ver) => {
                const isCurrent = ver.version === (asset.version || 'v1.0');
                const isViewing = viewingVersion === ver.version;
                return (
                  <div 
                    key={ver.version} 
                    className={`p-3.5 rounded-xl border transition-all ${
                      isViewing
                        ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400/30'
                        : isCurrent 
                          ? 'bg-emerald-50/70 border-emerald-200 shadow-2xs' 
                          : 'bg-slate-50 border-slate-200/80 hover:bg-slate-50/90'
                    }`}
                  >
                    {/* Version title and badges */}
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span className={`font-mono text-xs ${isCurrent ? 'text-emerald-950 font-black' : 'text-slate-800'}`}>
                          {ver.version}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-600 text-white font-medium">
                            当前生效
                          </span>
                        )}
                        {isViewing && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-600 text-white font-medium animate-pulse">
                            正在预览
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-normal font-mono ${isCurrent ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {ver.updatedAt}
                      </span>
                    </div>

                    {/* Change Note */}
                    <p className={`text-xs mt-1.5 leading-relaxed ${isCurrent ? 'text-emerald-900' : 'text-slate-600'}`}>
                      {ver.changeLog}
                    </p>

                    {/* Updater Profile & File size */}
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                          {ver.updaterAvatar ? (
                            <img src={ver.updaterAvatar} alt={ver.updater} className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-[9px] font-bold text-slate-600">
                              {ver.updater.slice(0, 1)}
                            </span>
                          )}
                        </div>
                        <span className={`text-[11px] font-bold truncate ${isCurrent ? 'text-emerald-900' : 'text-slate-700'}`}>
                          {ver.updater}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">
                        {ver.fileSize || asset.fileSize}
                      </span>
                    </div>

                    {/* Version Action Toolbar */}
                    <div className="flex items-center justify-end space-x-1.5 mt-2.5 pt-2 border-t border-dashed border-slate-200/80">
                      {isViewing ? (
                        <button
                          type="button"
                          onClick={() => setViewingVersion(null)}
                          className="px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] transition-colors cursor-pointer"
                        >
                          退出版本预览
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setViewingVersion(ver.version)}
                          className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px] transition-colors cursor-pointer"
                          title="在画布中预览该历史版本"
                        >
                          预览此版本
                        </button>
                      )}

                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleRollbackToVersion(ver.version)}
                          className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[10px] transition-colors cursor-pointer"
                          title="将资产的当前定稿版本切换为该版本"
                        >
                          恢复为此版本
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openVersionModal('OVERWRITE', ver.version)}
                        className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-medium text-[10px] transition-colors cursor-pointer"
                        title="就地覆盖此版本源文件与说明"
                      >
                        覆盖
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadVersion(ver)}
                        className="p-1 rounded-md bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[10px] transition-colors cursor-pointer"
                        title="下载此版本文件"
                      >
                        <i className="fa-solid fa-download"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ASSET OPERATION HISTORY & AUDIT TRAIL (操作历史)                    */}
      {/* ========================================================================= */}
      {activeDetailTab === 'OPERATION_HISTORY' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Creator & Ingestion Profile Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* Creator Info */}
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-2xs">
                  {asset.uploaderAvatar ? (
                    <img src={asset.uploaderAvatar} alt={asset.uploader} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-600 font-black text-lg">
                      {asset.uploader ? asset.uploader.slice(0, 1) : 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      原创建建档人
                    </span>
                    <h3 className="text-base font-black text-slate-900">{asset.uploader || '未指定上传人'}</h3>
                    <span className="text-xs text-slate-400 font-medium">({asset.department || '潮玩研发中心'})</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span><i className="fa-regular fa-clock mr-1 text-slate-400"></i> 建档入库时间: <strong>{asset.createdAt}</strong></span>
                    <span>·</span>
                    <span>所属 IP: <strong className="text-slate-700">{ip?.name || '未知 IP'}</strong></span>
                  </p>
                </div>
              </div>

              {/* Specifications Snapshot */}
              <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <div className="text-center px-3 border-r border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">全局资产ID</p>
                  <p className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <span>{asset.id}</span>
                  </p>
                </div>
                <div className="text-center px-3 border-r border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">源工程格式</p>
                  <p className="text-xs font-mono font-bold text-indigo-600 mt-0.5">.{fileFormat}</p>
                </div>
                <div className="text-center px-3 border-r border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">文件大小</p>
                  <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">{asset.fileSize}</p>
                </div>
                <div className="text-center px-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">当前阶段</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{STAGE_LABELS[asset.stage] || asset.stage}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar & Search Tool */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setHistoryCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  historyCategoryFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                全部记录 ({fullOperationHistory.length})
              </button>

              <button
                onClick={() => setHistoryCategoryFilter('CREATE_AND_EDIT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  historyCategoryFilter === 'CREATE_AND_EDIT'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <i className="fa-solid fa-pen-to-square text-[10px]"></i>
                <span>创建与编辑</span>
              </button>

              <button
                onClick={() => setHistoryCategoryFilter('VERSION')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  historyCategoryFilter === 'VERSION'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <i className="fa-solid fa-code-branch text-[10px]"></i>
                <span>版本升级</span>
              </button>

              <button
                onClick={() => setHistoryCategoryFilter('DOWNLOAD')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  historyCategoryFilter === 'DOWNLOAD'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <i className="fa-solid fa-cloud-arrow-down text-[10px]"></i>
                <span>下载与调取日志</span>
              </button>

              <button
                onClick={() => setHistoryCategoryFilter('PERMISSION')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  historyCategoryFilter === 'PERMISSION'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <i className="fa-solid fa-shield-halved text-[10px]"></i>
                <span>权限变更历史</span>
              </button>
            </div>

            {/* Keyword Search Input */}
            <div className="relative min-w-[240px]">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                placeholder="搜索操作人、动作或变动详情..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-400 transition-colors"
              />
              {historySearchQuery && (
                <button
                  onClick={() => setHistorySearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>
          </div>

          {/* Operation History Timeline List */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900">操作审计追溯日志清单</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  共检索到 <strong className="text-indigo-600">{filteredOperationHistory.length}</strong> 条历史轨迹记录
                </p>
              </div>
            </div>

            {filteredOperationHistory.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <i className="fa-solid fa-clipboard-list text-slate-300 text-3xl mb-2"></i>
                <p className="text-xs font-bold text-slate-500">未找到符合条件的操作记录</p>
                <p className="text-[11px] text-slate-400 mt-1">请尝试切换筛选标签或清除搜索关键字</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
                {filteredOperationHistory.map((item) => {
                  const isCreate = item.type === 'CREATE';
                  const isEdit = item.type === 'EDIT_INFO';
                  const isVersion = item.type === 'VERSION_UPGRADE';
                  const isLink = item.type === 'LINK_UPSTREAM';
                  const isUnlink = item.type === 'UNLINK_UPSTREAM';
                  const isDownload = item.type === 'DOWNLOAD';
                  const isPerm = item.type === 'PERMISSION_CHANGE';

                  const badgeColorClass = 
                    isCreate ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    isEdit ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    isVersion ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    isLink ? 'bg-violet-50 text-violet-700 border-violet-200' :
                    isUnlink ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    isDownload ? 'bg-sky-50 text-sky-700 border-sky-200' :
                    'bg-purple-50 text-purple-700 border-purple-200';

                  const nodeIcon =
                    isCreate ? 'fa-plus' :
                    isEdit ? 'fa-pen-to-square' :
                    isVersion ? 'fa-code-branch' :
                    isLink ? 'fa-link' :
                    isUnlink ? 'fa-link-slash' :
                    isDownload ? 'fa-cloud-arrow-down' :
                    'fa-shield-halved';

                  const nodeDotColor =
                    isCreate ? 'bg-emerald-500 ring-emerald-100' :
                    isEdit ? 'bg-indigo-500 ring-indigo-100' :
                    isVersion ? 'bg-amber-500 ring-amber-100' :
                    isLink ? 'bg-violet-500 ring-violet-100' :
                    isUnlink ? 'bg-orange-500 ring-orange-100' :
                    isDownload ? 'bg-sky-500 ring-sky-100' :
                    'bg-purple-500 ring-purple-100';

                  return (
                    <div key={item.id} className="relative group">
                      {/* Timeline Node Point */}
                      <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full ${nodeDotColor} ring-4 flex items-center justify-center text-[8px] text-white shadow-xs`}>
                        <i className={`fa-solid ${nodeIcon}`}></i>
                      </div>

                      {/* Log Card */}
                      <div className="bg-slate-50/70 hover:bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/90 transition-all hover:shadow-xs space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2.5">
                            {/* Operator Avatar */}
                            <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden border border-slate-300 shrink-0">
                              {item.operatorAvatar ? (
                                <img src={item.operatorAvatar} alt={item.operatorName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-600">
                                  {item.operatorName.slice(0, 1)}
                                </span>
                              )}
                            </div>

                            <span className="text-xs font-bold text-slate-900">{item.operatorName}</span>
                            {item.operatorRole && (
                              <span className="text-[10px] text-slate-400 font-medium">({item.operatorRole})</span>
                            )}
                            {item.operatorDepartment && (
                              <span className="text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                {item.operatorDepartment}
                              </span>
                            )}

                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${badgeColorClass}`}>
                              {item.badge || item.type}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="text-[11px] font-mono text-slate-400">
                              {item.timestamp}
                            </span>
                          </div>
                        </div>

                        {/* Summary & Details Box */}
                        <div className="pl-9.5">
                          <h5 className="text-xs font-bold text-slate-800 leading-snug">
                            {item.summary}
                          </h5>

                          {item.details && (
                            <div className="mt-2 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/70 leading-relaxed font-normal">
                              {item.details}
                            </div>
                          )}

                          {/* Extra Metadata Tags */}
                          {item.extraMeta && (
                            <div className="flex flex-wrap items-center gap-2 mt-2.5">
                              {item.extraMeta.version && (
                                <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                                  版本: {item.extraMeta.version}
                                </span>
                              )}
                              {item.extraMeta.downloadPurpose && (
                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                                  用途: {item.extraMeta.downloadPurpose}
                                </span>
                              )}
                              {item.extraMeta.downloadFormat && (
                                <span className="text-[10px] font-mono font-bold bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-200">
                                  调取格式: .{item.extraMeta.downloadFormat}
                                </span>
                              )}
                              {item.extraMeta.permissionScope && (
                                <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                                  鉴权策略: {item.extraMeta.permissionScope}
                                </span>
                              )}
                              {item.extraMeta.fieldsChanged && item.extraMeta.fieldsChanged.length > 0 && (
                                <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                  涉及字段: {item.extraMeta.fieldsChanged.length} 项变动
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VERSION MANAGEMENT & UPLOAD MODAL DIALOG                                  */}
      {/* ========================================================================= */}
      {isVersionModalOpen && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
          onClick={() => setIsVersionModalOpen(false)}
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" />
          
          <div 
            className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold shrink-0">
                  <i className="fa-solid fa-code-branch"></i>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">版本迭代与文件更新</h3>
                  <p className="text-xs text-slate-500 truncate max-w-sm">
                    目标资产: {asset.title} · 当前版本: {asset.version || 'v1.0'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVersionModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
              
              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  上传新版源文件 (支持拖入本地新版文件)
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleVersionFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition-all ${
                    versionUploadFile 
                      ? 'border-indigo-400 bg-indigo-50/30' 
                      : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60'
                  }`}
                >
                  <input
                    type="file"
                    id="version-file-input"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleVersionFileSelect(e.target.files[0]);
                      }
                    }}
                  />

                  {versionUploadFile ? (
                    <div className="flex items-center justify-between gap-3 text-left">
                      <div className="flex items-center space-x-3 min-w-0">
                        {versionUploadPreview ? (
                          <img 
                            src={versionUploadPreview} 
                            alt="preview" 
                            className="w-12 h-12 rounded-lg object-cover border border-indigo-200 shrink-0" 
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg shrink-0">
                            <i className="fa-solid fa-file-arrow-up"></i>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {versionUploadFileName}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {versionUploadFileSize}
                          </p>
                          {versionUploadFileName.toLowerCase().includes(asset.title.toLowerCase().slice(0, 4)) && (
                            <span className="inline-block mt-0.5 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-medium">
                              ✨ 识别为同名迭代文件
                            </span>
                          )}
                        </div>
                      </div>

                      <label
                        htmlFor="version-file-input"
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs"
                      >
                        更换文件
                      </label>
                    </div>
                  ) : (
                    <label
                      htmlFor="version-file-input"
                      className="cursor-pointer block space-y-1.5"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-base">
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        点击浏览或将新版源文件拖拽至此处
                      </p>
                      <p className="text-[11px] text-slate-400">
                        支持任意格式，如 .{fileFormat}、同名源文件、高精度版本等
                      </p>
                    </label>
                  )}
                </div>
              </div>

              {/* Version Strategy Selector: CREATE_NEW vs OVERWRITE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  版本生效策略
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setVersionMode('CREATE_NEW')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      versionMode === 'CREATE_NEW'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="versionMode"
                        checked={versionMode === 'CREATE_NEW'}
                        onChange={() => setVersionMode('CREATE_NEW')}
                        className="text-indigo-600"
                      />
                      <span className="text-xs font-bold text-slate-900">创建新版本 (推荐)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 pl-5 leading-snug">
                      保留全部历史，生成全新递增版本号，便于回溯溯源。
                    </p>
                  </div>

                  <div
                    onClick={() => setVersionMode('OVERWRITE')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      versionMode === 'OVERWRITE'
                        ? 'border-amber-500 bg-amber-50/50 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="versionMode"
                        checked={versionMode === 'OVERWRITE'}
                        onChange={() => setVersionMode('OVERWRITE')}
                        className="text-amber-600"
                      />
                      <span className="text-xs font-bold text-slate-900">覆盖已有版本</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 pl-5 leading-snug">
                      就地替换指定版本文件，修正错漏且不改变版本号序列。
                    </p>
                  </div>
                </div>
              </div>

              {/* Mode-specific configuration */}
              {versionMode === 'CREATE_NEW' ? (
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      新版本号标识
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setVersionTagInput(getSuggestedNextVersion(asset.version || 'v1.0', 'minor'))}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-indigo-600 border border-slate-200 transition-colors cursor-pointer"
                      >
                        +0.1 ({getSuggestedNextVersion(asset.version || 'v1.0', 'minor')})
                      </button>
                      <button
                        type="button"
                        onClick={() => setVersionTagInput(getSuggestedNextVersion(asset.version || 'v1.0', 'major'))}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-indigo-600 border border-slate-200 transition-colors cursor-pointer"
                      >
                        +1.0 ({getSuggestedNextVersion(asset.version || 'v1.0', 'major')})
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={versionTagInput}
                    onChange={(e) => setVersionTagInput(e.target.value)}
                    placeholder="例如 v1.1, v2.0"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    当前生效版本为 <strong>{asset.version || 'v1.0'}</strong>，提交后新版本将作为首要定稿，历史版本可在版本管理中随时切换回滚。
                  </p>
                </div>
              ) : (
                <div className="space-y-2 bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
                  <label className="text-xs font-bold text-amber-900 block">
                    选择要覆盖的目标版本
                  </label>
                  <select
                    value={targetOverwriteVersion}
                    onChange={(e) => setTargetOverwriteVersion(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-amber-500 cursor-pointer"
                  >
                    {versionRecords.map(v => (
                      <option key={v.version} value={v.version}>
                        {v.version} {v.version === (asset.version || 'v1.0') ? '(当前生效版本)' : '(历史归档)'} - {v.updatedAt}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-amber-800">
                    ⚠️ 目标版本 <strong>{targetOverwriteVersion}</strong> 的原文件将被就地替换更新，其它历史版本不受影响。
                  </p>
                </div>
              )}

              {/* Change log notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  版本更新说明与改动要点
                </label>
                <textarea
                  value={versionChangeLog}
                  onChange={(e) => setVersionChangeLog(e.target.value)}
                  placeholder={
                    versionMode === 'CREATE_NEW' 
                      ? '详细记录此版本的优化内容，如贴图精细化、修复源文件法线错位、更新品牌主色调等...' 
                      : '记录本次覆盖更新的原因，如紧急修复错别字、替换高清源文件等...'
                  }
                  rows={3}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-indigo-500 leading-relaxed"
                />
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 truncate">
                提交人: <strong>{currentUser.name}</strong>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsVersionModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveVersion}
                  className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1.5 ${
                    versionMode === 'CREATE_NEW'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  <i className={`fa-solid ${versionMode === 'CREATE_NEW' ? 'fa-circle-check' : 'fa-rotate'}`}></i>
                  <span>{versionMode === 'CREATE_NEW' ? '确认发布新版本' : '确认覆盖该版本'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );

  if (isPageMode) {
    return (
      <div className="space-y-4 animate-fadeIn">
        {breadcrumbsNode && (
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex-1 min-w-0">
              {breadcrumbsNode}
            </div>
          </div>
        )}
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 animate-fadeIn overflow-y-auto">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      ></div>
      <div className="relative z-10 w-full max-w-7xl my-auto max-h-[92vh] overflow-y-auto custom-scrollbar p-1">
        {renderContent()}
      </div>
    </div>
  );
};

export const AssetDetail = AssetDetailModal;
export default AssetDetailModal;
