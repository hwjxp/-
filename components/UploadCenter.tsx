import React, { useState, useRef, useCallback, useMemo } from 'react';
import { IP, ProjectStage, Asset, UploadRecord } from '../types';
import { CURRENT_USER, MOCK_UPLOAD_RECORDS } from '../constants';
import { getTagStats, TagInfo } from '../utils/tagUtils';
import { generateAssetId, getIpCode, sanitizeCustomCode, copyAssetId, isValidAssetId, formatCompactTimestamp } from '../utils/assetIdUtils';
import TagAutocompleteInput from './TagAutocompleteInput';

interface UploadCenterProps {
  ips: IP[];
  existingAssets: Asset[];
  onUpload: (assets: Asset[], newRecord: UploadRecord) => void;
  onGoToLibrary?: (ipName: string) => void;
  onCancel: () => void;
}

export interface StagedFile {
  id: string;
  file?: File;
  previewUrl: string;
  name: string;
  extension: string;
  sizeFormatted: string;
  sizeBytes: number;
  title: string;
  customCode: string;
  generatedAssetId?: string;
  stagedAt?: Date;
  ipId: string;
  stage: ProjectStage | '';
  tags: string[];
  upstreamAssetIds?: string[];
  uploadProgress?: number; // 0 - 100
  folderPath?: string;
  relativePath?: string;
}

export interface ExtractedFileItem {
  file: File;
  folderPath?: string;
  relativePath?: string;
}

export const DIRECTORY_OPTIONS: { stage: ProjectStage; label: string; icon: string; desc: string; color: string }[] = [
  { stage: ProjectStage.CARD_IP_SOURCE, label: 'IP 图库/原画源文件', icon: 'fa-palette', desc: '角色立绘、原画素材、分层源文件', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { stage: ProjectStage.TOY_2D_COLORED, label: '2D 上色与拆件图', icon: 'fa-brush', desc: '三视图、拆件线稿、色卡标准', color: 'text-sky-600 bg-sky-50 border-sky-100' },
  { stage: ProjectStage.TOY_3D_MODEL, label: '3D 建模与工程文件', icon: 'fa-cube', desc: '3D 打印切片、OBJ/FBX 资产包、工程模具', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { stage: ProjectStage.CARD_FRONT_BACK, label: '卡牌正背面设计', icon: 'fa-id-card', desc: '卡面插画、牌框、稀有度卡面工艺', color: 'text-amber-600 bg-amber-50 border-amber-100' },
  { stage: ProjectStage.CARD_PRODUCTION, label: '卡牌印刷生产文件', icon: 'fa-print', desc: '烫金版、UV 局部工艺层、印刷刀模', color: 'text-rose-600 bg-rose-50 border-rose-100' },
  { stage: ProjectStage.PACKAGING, label: '包装与结构设计', icon: 'fa-box', desc: '盲盒外包装、展示盒、卡包结构', color: 'text-purple-600 bg-purple-50 border-purple-100' },
  { stage: ProjectStage.MARKETING, label: '宣发与营销物料', icon: 'fa-bullhorn', desc: '海报、电商详情页、社媒宣传图', color: 'text-teal-600 bg-teal-50 border-teal-100' },
  { stage: ProjectStage.SKETCH, label: '初期概念与草图', icon: 'fa-pencil', desc: '早期脑暴草图、风格提案', color: 'text-slate-600 bg-slate-100 border-slate-200' }
];

export const DIRECTORY_TRANSLATIONS: Record<ProjectStage, string> = {
  [ProjectStage.CARD_IP_SOURCE]: 'IP 图库/原画',
  [ProjectStage.TOY_2D_COLORED]: '2D 上色',
  [ProjectStage.TOY_3D_MODEL]: '3D 建模/工程',
  [ProjectStage.CARD_FRONT_BACK]: '卡牌正背面',
  [ProjectStage.CARD_PRODUCTION]: '卡牌印刷工艺',
  [ProjectStage.PACKAGING]: '包装设计',
  [ProjectStage.MARKETING]: '营销物料',
  [ProjectStage.SKETCH]: '概念草图'
};

const SAMPLE_PRESETS: Partial<StagedFile>[] = [
  {
    name: 'Cyber_Neon_Hero_Visual_v1.png',
    extension: 'png',
    title: '赛博主角主视觉立绘',
    customCode: 'CYBER_HERO',
    previewUrl: 'https://picsum.photos/seed/cyber1/600/600',
    sizeFormatted: '18.4 MB',
    sizeBytes: 19293798,
    ipId: 'ip-1',
    stage: ProjectStage.CARD_IP_SOURCE,
    tags: ['主视觉', '高精度', '立绘']
  },
  {
    name: 'Cyber_Mecha_3D_Rig.fbx',
    extension: 'fbx',
    title: '机甲骨骼绑定工程',
    customCode: 'MECHA_RIG',
    previewUrl: 'https://picsum.photos/seed/cyber2/600/600',
    sizeFormatted: '142.6 MB',
    sizeBytes: 149526784,
    ipId: 'ip-1',
    stage: ProjectStage.TOY_3D_MODEL,
    tags: ['工程文件', '可打印', '骨骼绑定']
  },
  {
    name: 'Card_Holo_Foil_Layer.psd',
    extension: 'psd',
    title: '神话卡全息烫金工艺层',
    customCode: 'HOLO_FOIL',
    previewUrl: 'https://picsum.photos/seed/cyber3/600/600',
    sizeFormatted: '64.2 MB',
    sizeBytes: 67318579,
    ipId: 'ip-2',
    stage: ProjectStage.CARD_PRODUCTION,
    tags: ['烫金', '印刷工艺', '分层源文件']
  },
  {
    name: 'Astro_Package_Box_Diecut.ai',
    extension: 'ai',
    title: '星空系列外包装刀线图',
    customCode: 'PKG_BOX',
    previewUrl: 'https://picsum.photos/seed/cyber4/600/600',
    sizeFormatted: '32.1 MB',
    sizeBytes: 33659289,
    ipId: 'ip-3',
    stage: ProjectStage.PACKAGING,
    tags: ['刀模', '外包装', '矢量']
  }
];

// Helper to auto-suggest directory based on file name, extension & folder hierarchy
function autoDetectStage(fileName: string, folderPath?: string): ProjectStage {
  const combined = `${folderPath || ''}/${fileName}`.toLowerCase();

  // 3D models & engineering
  if (combined.match(/\.(fbx|obj|gltf|glb|blend|stl|step|ztl|max|c4d|dae|3ds|ply)$/) || combined.includes('3d') || combined.includes('建模') || combined.includes('工程') || combined.includes('骨骼')) {
    return ProjectStage.TOY_3D_MODEL;
  }
  // Videos & promotional marketing
  if (combined.match(/\.(mp4|mov|avi|mkv|webm|flv|wmv)$/) || combined.includes('海报') || combined.includes('宣发') || combined.includes('营销') || combined.includes('banner') || combined.includes('预告') || combined.includes('短片')) {
    return ProjectStage.MARKETING;
  }
  // Packaging & structure
  if (combined.includes('包装') || combined.includes('刀模') || combined.includes('盒') || combined.includes('package') || combined.includes('box') || combined.includes('封套')) {
    return ProjectStage.PACKAGING;
  }
  // Card production & special prints
  if (combined.includes('烫金') || combined.includes('uv') || combined.includes('印刷') || combined.includes('刀线') || combined.includes('工艺') || combined.includes('production')) {
    return ProjectStage.CARD_PRODUCTION;
  }
  // Card front & back
  if (combined.includes('卡牌') || combined.includes('card') || combined.includes('正面') || combined.includes('背面') || combined.includes('牌框') || combined.includes('卡面')) {
    return ProjectStage.CARD_FRONT_BACK;
  }
  // 2D turnaround & color拆件
  if (combined.includes('上色') || combined.includes('三视图') || combined.includes('拆件') || combined.includes('色卡') || combined.includes('color') || combined.includes('turnaround')) {
    return ProjectStage.TOY_2D_COLORED;
  }
  // Concept & sketches
  if (combined.includes('草图') || combined.includes('sketch') || combined.includes('概念') || combined.includes('脑暴') || combined.includes('线稿')) {
    return ProjectStage.SKETCH;
  }
  // Default IP art source
  return ProjectStage.CARD_IP_SOURCE;
}

// Recursive helper to traverse FileSystemEntry and extract all nested files with folder paths
async function extractFilesFromDataTransfer(dataTransfer: DataTransfer): Promise<ExtractedFileItem[]> {
  const items = dataTransfer.items;
  if (!items || items.length === 0) {
    return Array.from(dataTransfer.files || []).map(file => ({ file }));
  }

  const results: ExtractedFileItem[] = [];

  const traverseEntry = (entry: any, currentPath: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!entry) {
        resolve();
        return;
      }
      if (entry.isFile) {
        entry.file(
          (file: File) => {
            results.push({
              file,
              folderPath: currentPath || undefined,
              relativePath: currentPath ? `${currentPath}/${file.name}` : file.name
            });
            resolve();
          },
          () => resolve()
        );
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const dirPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

        const readAllEntries = () => {
          dirReader.readEntries(
            async (entries: any[]) => {
              if (!entries || entries.length === 0) {
                resolve();
              } else {
                for (const childEntry of entries) {
                  await traverseEntry(childEntry, dirPath);
                }
                readAllEntries();
              }
            },
            () => resolve()
          );
        };
        readAllEntries();
      } else {
        resolve();
      }
    });
  };

  const promises: Promise<void>[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.webkitGetAsEntry) {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        promises.push(traverseEntry(entry, ''));
        continue;
      }
    }
    const file = item.getAsFile();
    if (file) {
      results.push({ file });
    }
  }

  if (promises.length > 0) {
    await Promise.all(promises);
  } else if (results.length === 0 && dataTransfer.files && dataTransfer.files.length > 0) {
    return Array.from(dataTransfer.files).map(file => ({ file }));
  }

  return results;
}

const UploadCenter: React.FC<UploadCenterProps> = ({ 
  ips, 
  existingAssets, 
  onUpload, 
  onGoToLibrary, 
  onCancel 
}) => {
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'HISTORY'>('UPLOAD');
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [isScanningFolders, setIsScanningFolders] = useState(false);
  const [folderScanNotice, setFolderScanNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAllIds, setCopiedAllIds] = useState(false);
  const [filterQueueMode, setFilterQueueMode] = useState<'ALL' | 'INCOMPLETE' | 'READY'>('ALL');
  const [searchQueueText, setSearchQueueText] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestProgressText, setIngestProgressText] = useState('');
  const [previewLightboxUrl, setPreviewLightboxUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Batch edit form values
  const [batchIpId, setBatchIpId] = useState<string>('');
  const [batchStage, setBatchStage] = useState<ProjectStage | ''>('');
  const [batchTagInput, setBatchTagInput] = useState<string>('');
  const [batchCustomCode, setBatchCustomCode] = useState<string>('');

  // Comprehensive tag statistics
  const tagStats = useMemo(() => {
    return getTagStats(ips, existingAssets);
  }, [ips, existingAssets]);

  // Upload history records state
  const [records, setRecords] = useState<UploadRecord[]>(MOCK_UPLOAD_RECORDS);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyIpFilter, setHistoryIpFilter] = useState<string>('ALL');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [justUploadedBatch, setJustUploadedBatch] = useState<UploadRecord | null>(null);

  // Upstream linking modal state
  const [linkingFileId, setLinkingFileId] = useState<string | null>(null);
  const [upstreamSearchQuery, setUpstreamSearchQuery] = useState('');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleCopyId = async (idToCopy: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const ok = await copyAssetId(idToCopy);
    if (ok) {
      setCopiedId(idToCopy);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCopyAllGeneratedIds = async (record: UploadRecord) => {
    const ids = (record.filesSummary || []).map(f => f.assetId).filter(Boolean).join('\n');
    if (!ids) return;
    const ok = await copyAssetId(ids);
    if (ok) {
      setCopiedAllIds(true);
      setTimeout(() => setCopiedAllIds(false), 2500);
    }
  };

  const handleFiles = (incomingItems: (File | ExtractedFileItem)[]) => {
    const defaultIp = batchIpId || (ips[0]?.id || '');
    const baseTime = Date.now();

    const newItems: StagedFile[] = incomingItems.map((item, idx) => {
      const file = item instanceof File ? item : item.file;
      const folderPath = item instanceof File ? undefined : item.folderPath;
      const relativePath = item instanceof File ? undefined : item.relativePath;

      // Smart IP detection: if folderPath contains an IP name or batchIpId is specified
      let detectedIpId = defaultIp;
      if (folderPath) {
        const matchedIp = ips.find(ip => folderPath.toLowerCase().includes(ip.name.toLowerCase()));
        if (matchedIp) {
          detectedIpId = matchedIp.id;
        }
      }
      const selectedIp = ips.find(i => i.id === detectedIpId);

      const parts = file.name.split('.');
      const ext = parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
      const nameWithoutExt = parts.join('.');
      const customCode = sanitizeCustomCode(nameWithoutExt, 15);
      const suggestedStage = batchStage || autoDetectStage(file.name, folderPath);
      const stagedAt = new Date(baseTime + idx * 1000);
      const generatedAssetId = generateAssetId(selectedIp || detectedIpId, customCode, stagedAt);

      // Auto-extract folder tags from directory segments
      const folderTags: string[] = [];
      if (folderPath) {
        folderPath.split('/').forEach(seg => {
          const s = seg.trim();
          if (s && !ips.some(ip => ip.name === s) && !folderTags.includes(s)) {
            folderTags.push(s);
          }
        });
      }

      return {
        id: `stage_${baseTime}_${idx}_${Math.random().toString(36).substring(4)}`,
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
        name: file.name,
        extension: ext || 'bin',
        sizeFormatted: formatFileSize(file.size),
        sizeBytes: file.size,
        title: nameWithoutExt || file.name,
        customCode: customCode || 'ITEM',
        generatedAssetId,
        stagedAt,
        ipId: detectedIpId,
        stage: suggestedStage,
        tags: Array.from(new Set([...(ext ? [ext.toUpperCase()] : []), ...folderTags])),
        uploadProgress: 100,
        folderPath,
        relativePath
      };
    });

    setStagedFiles(prev => [...prev, ...newItems]);
    // Auto-select newly added files for fast batch adjustment
    setSelectedIds(prev => {
      const next = new Set(prev);
      newItems.forEach(item => next.add(item.id));
      return next;
    });
  };

  const loadPresetSamples = () => {
    const defaultIp = batchIpId || (ips[0]?.id || '');
    const baseTime = Date.now();

    const newItems: StagedFile[] = SAMPLE_PRESETS.map((p, idx) => {
      const targetIpId = p.ipId || defaultIp;
      const targetIp = ips.find(i => i.id === targetIpId);
      const customCode = p.customCode || 'SAMPLE';
      const stagedAt = new Date(baseTime + idx * 1000);
      const generatedAssetId = generateAssetId(targetIp || targetIpId, customCode, stagedAt);

      return {
        id: `sample_${baseTime}_${idx}`,
        previewUrl: p.previewUrl || '',
        name: p.name || 'Sample_File.png',
        extension: p.extension || 'png',
        sizeFormatted: p.sizeFormatted || '24 MB',
        sizeBytes: p.sizeBytes || 25165824,
        title: p.title || '示例物料',
        customCode,
        generatedAssetId,
        stagedAt,
        ipId: targetIpId,
        stage: p.stage || ProjectStage.CARD_IP_SOURCE,
        tags: p.tags || ['示例物料'],
        uploadProgress: 100
      };
    });

    setStagedFiles(prev => [...prev, ...newItems]);
    setSelectedIds(prev => {
      const next = new Set(prev);
      newItems.forEach(item => next.add(item.id));
      return next;
    });
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setIsScanningFolders(true);

    try {
      const extracted = await extractFilesFromDataTransfer(e.dataTransfer);
      if (extracted.length > 0) {
        handleFiles(extracted);
        const folderCount = new Set(extracted.map(f => f.folderPath).filter(Boolean)).size;
        if (folderCount > 0) {
          setFolderScanNotice(`🚀 成功穿透解析 ${folderCount} 个文件夹，提取 ${extracted.length} 个物料文件，已自动完成格式与生命周期阶段归类！`);
          setTimeout(() => setFolderScanNotice(null), 5000);
        }
      }
    } catch (err) {
      console.error('Error parsing dropped items:', err);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    } finally {
      setIsScanningFolders(false);
    }
  }, [ips, batchIpId, batchStage]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      const items: ExtractedFileItem[] = fileList.map(file => {
        // webkitRelativePath contains "FolderName/Subfolder/file.ext"
        const rel = file.webkitRelativePath || '';
        const parts = rel.split('/');
        parts.pop(); // remove file name
        const folderPath = parts.join('/');
        return {
          file,
          folderPath: folderPath || undefined,
          relativePath: rel || undefined
        };
      });

      handleFiles(items);
      const folderCount = new Set(items.map(f => f.folderPath).filter(Boolean)).size;
      if (folderCount > 0) {
        setFolderScanNotice(`📁 成功解析文件夹，提取 ${items.length} 个物料并自动建立目录结构层级！`);
        setTimeout(() => setFolderScanNotice(null), 5000);
      }
      e.target.value = '';
    }
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStagedFiles.length && filteredStagedFiles.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStagedFiles.map(f => f.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectIncompleteOnly = () => {
    const incomplete = stagedFiles.filter(f => !f.ipId || !f.stage || !f.title.trim()).map(f => f.id);
    setSelectedIds(new Set(incomplete));
  };

  // Batch apply
  const handleBatchApply = () => {
    if (selectedIds.size === 0) {
      alert('请先勾选需要批量修改的物料');
      return;
    }

    if (!batchIpId && !batchStage && !batchTagInput.trim() && !batchCustomCode.trim()) {
      alert('请至少选择或输入一项要批量应用的属性（IP、文件目录、标签或英文短代码）');
      return;
    }

    setStagedFiles(prev => prev.map(item => {
      if (!selectedIds.has(item.id)) return item;
      const updated = { ...item };
      if (batchIpId) updated.ipId = batchIpId;
      if (batchStage) updated.stage = batchStage;
      if (batchCustomCode.trim()) {
        updated.customCode = sanitizeCustomCode(batchCustomCode.trim(), 15);
      }
      if (batchTagInput.trim()) {
        const newTags = batchTagInput.split(/[,，\s]+/).filter(t => t.trim().length > 0);
        const merged = Array.from(new Set([...updated.tags, ...newTags]));
        updated.tags = merged;
      }

      // Real-time dynamic recalculation of unique asset ID
      const targetIp = ips.find(i => i.id === updated.ipId) || updated.ipId;
      const date = updated.stagedAt || new Date();
      updated.generatedAssetId = generateAssetId(targetIp, updated.customCode || updated.title, date);

      return updated;
    }));

    setBatchTagInput('');
  };

  // Auto-detect classification for all staged files
  const handleAutoClassifyAll = () => {
    setStagedFiles(prev => prev.map(f => ({
      ...f,
      stage: autoDetectStage(f.name)
    })));
  };

  // Single file update with real-time automatic unique asset ID recalculation
  const updateStagedFile = (id: string, updates: Partial<StagedFile>) => {
    setStagedFiles(prev => prev.map(f => {
      if (f.id !== id) return f;
      const merged = { ...f, ...updates };
      if (updates.customCode !== undefined) {
        merged.customCode = sanitizeCustomCode(updates.customCode, 15);
      } else if (updates.title !== undefined && (!merged.customCode || merged.customCode === 'ITEM' || merged.customCode === 'ASSET')) {
        merged.customCode = sanitizeCustomCode(updates.title, 15);
      }

      // Real-time automatic recalculation of unique Asset ID based on IP, title/code, and timestamp
      const targetIp = ips.find(i => i.id === merged.ipId) || merged.ipId;
      const date = merged.stagedAt || new Date();
      merged.generatedAssetId = generateAssetId(targetIp, merged.customCode || merged.title, date);

      return merged;
    }));
  };

  // Synchronize IP and stage from one item to all others
  const syncSettingsToAll = (sourceFile: StagedFile, e: React.MouseEvent) => {
    e.stopPropagation();
    setStagedFiles(prev => prev.map(f => {
      const newIpId = sourceFile.ipId || f.ipId;
      const newStage = sourceFile.stage || f.stage;
      const targetIp = ips.find(i => i.id === newIpId) || newIpId;
      const date = f.stagedAt || new Date();
      const newGeneratedId = generateAssetId(targetIp, f.customCode || f.title, date);

      return {
        ...f,
        ipId: newIpId,
        stage: newStage,
        generatedAssetId: newGeneratedId
      };
    }));
  };

  // Remove files
  const removeStagedFile = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStagedFiles(prev => prev.filter(f => f.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const removeSelectedFiles = () => {
    if (selectedIds.size === 0) return;
    setStagedFiles(prev => prev.filter(f => !selectedIds.has(f.id)));
    setSelectedIds(new Set());
  };

  const calculateVersion = (ipId: string, stage: string) => {
    if (!ipId || !stage) return 1;
    const count = existingAssets.filter(a => a.ipId === ipId && a.stage === stage).length;
    return count + 1;
  };

  // Filtered queue files
  const filteredStagedFiles = useMemo(() => {
    return stagedFiles.filter(f => {
      const isComplete = Boolean(f.ipId && f.stage && f.title.trim());
      if (filterQueueMode === 'INCOMPLETE' && isComplete) return false;
      if (filterQueueMode === 'READY' && !isComplete) return false;
      if (searchQueueText.trim()) {
        const q = searchQueueText.toLowerCase();
        const matchesName = f.name.toLowerCase().includes(q) || f.title.toLowerCase().includes(q);
        const matchesCode = (f.customCode || '').toLowerCase().includes(q);
        const matchesTag = f.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesName && !matchesCode && !matchesTag) return false;
      }
      return true;
    });
  }, [stagedFiles, filterQueueMode, searchQueueText]);

  const readyCount = useMemo(() => {
    return stagedFiles.filter(f => f.ipId && f.stage && f.title.trim()).length;
  }, [stagedFiles]);

  const isReadyToIngest = useMemo(() => {
    return stagedFiles.length > 0 && readyCount === stagedFiles.length;
  }, [stagedFiles, readyCount]);

  const totalQueueBytes = useMemo(() => {
    return stagedFiles.reduce((acc, curr) => acc + curr.sizeBytes, 0);
  }, [stagedFiles]);

  // Submit ingestion with tactile simulated progression
  const handleConfirmIngest = async () => {
    if (stagedFiles.length === 0) return;

    const unassigned = stagedFiles.filter(f => !f.ipId || !f.stage || !f.title.trim());
    if (unassigned.length > 0) {
      alert(`还有 ${unassigned.length} 个文件未分配归属 IP 或目录分类，请先完善信息。`);
      return;
    }

    setIsIngesting(true);
    setIngestProgressText('正在校验入库物料完整性与格式规范...');
    await new Promise(r => setTimeout(r, 400));

    setIngestProgressText('正在生成全局唯一资产 ID (Global Asset ID) 索引...');
    await new Promise(r => setTimeout(r, 400));

    setIngestProgressText('正在归档资产并建立全链路关系树...');
    await new Promise(r => setTimeout(r, 400));

    const firstIp = ips.find(i => i.id === stagedFiles[0].ipId);
    const targetDirectoryName = DIRECTORY_TRANSLATIONS[stagedFiles[0].stage as ProjectStage] || '图库目录';
    const now = new Date();

    const newAssets: Asset[] = stagedFiles.map((f, index) => {
      const version = calculateVersion(f.ipId, f.stage);
      const ip = ips.find(i => i.id === f.ipId);
      const stageLabel = DIRECTORY_TRANSLATIONS[f.stage as ProjectStage] || '资产';
      const formalTitle = ip ? `${ip.name}_${stageLabel}_${f.title}_v${version}` : f.title;

      const is3D = f.name.match(/\.(obj|fbx|gltf|glb|blend|stl|step|ztl)$/i) || f.stage === ProjectStage.TOY_3D_MODEL;
      const isVideo = f.name.match(/\.(mp4|mov|avi|mkv|prores)$/i);
      const isPackaging = f.stage === ProjectStage.PACKAGING || f.name.toLowerCase().includes('包装') || f.name.toLowerCase().includes('刀模');
      const isDisplay = f.name.toLowerCase().includes('陈列') || f.name.toLowerCase().includes('堆头') || f.name.toLowerCase().includes('展台');
      const isPhoto = f.name.match(/\.(cr3|raw|dng)$/i) || f.name.toLowerCase().includes('实拍') || f.name.toLowerCase().includes('棚拍');
      const isGraphic = f.stage === ProjectStage.CARD_PRODUCTION || f.name.toLowerCase().includes('vi') || f.name.toLowerCase().includes('规范');

      let computedCategory: any = '2D';
      if (is3D) computedCategory = '3D';
      else if (isVideo) computedCategory = 'VIDEO';
      else if (isPackaging) computedCategory = 'PACKAGING';
      else if (isDisplay) computedCategory = 'DISPLAY';
      else if (isPhoto) computedCategory = 'PHOTO';
      else if (isGraphic) computedCategory = 'GRAPHIC';

      // Standard Global Unique Asset ID: [IP Code (≤6)] + _ + [Custom Title/Code (≤15)] + _ + [Timestamp]
      const assetTimestamp = f.stagedAt || new Date(now.getTime() + index * 1000);
      const uniqueAssetId = f.generatedAssetId || generateAssetId(ip || f.ipId, f.customCode || f.title, assetTimestamp);

      return {
        id: uniqueAssetId,
        ipId: f.ipId,
        category: computedCategory,
        title: formalTitle,
        description: `上传批次归档版本 v${version}，原始文件: ${f.name} [全局资产ID: ${uniqueAssetId}]`,
        type: computedCategory,
        stage: f.stage as ProjectStage,
        version: `v${version}.0`,
        upstreamAssetIds: f.upstreamAssetIds || [],
        tags: ['新入库', ...f.tags],
        thumbnail: f.previewUrl || 'https://picsum.photos/seed/assetthumb/400/400',
        fileSize: f.sizeFormatted,
        uploader: CURRENT_USER.name,
        department: CURRENT_USER.department,
        createdAt: new Date().toISOString().split('T')[0],
        isPublic: true,
        activityLog: [
          {
            id: `log_${Date.now()}_${index}`,
            type: 'STATUS_CHANGE',
            user: { id: CURRENT_USER.id, name: CURRENT_USER.name, avatar: CURRENT_USER.avatar },
            newStatus: f.stage,
            timestamp: '刚刚'
          }
        ]
      };
    });

    const totalBytes = stagedFiles.reduce((acc, curr) => acc + curr.sizeBytes, 0);
    const newRecord: UploadRecord = {
      id: `rec_${Date.now()}`,
      batchNo: `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      uploaderName: CURRENT_USER.name,
      uploaderAvatar: CURRENT_USER.avatar,
      ipId: stagedFiles[0].ipId,
      ipName: firstIp?.name || '未知 IP',
      directoryName: stagedFiles.length === 1 ? targetDirectoryName : `${targetDirectoryName} 等 ${new Set(stagedFiles.map(s => s.stage)).size} 个目录`,
      fileCount: stagedFiles.length,
      totalSize: formatFileSize(totalBytes),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'SUCCESS',
      filesSummary: stagedFiles.map((f, idx) => ({
        name: f.name,
        size: f.sizeFormatted,
        stage: DIRECTORY_TRANSLATIONS[f.stage as ProjectStage] || '未分类',
        assetId: newAssets[idx]?.id
      }))
    };

    setRecords(prev => [newRecord, ...prev]);
    setJustUploadedBatch(newRecord);
    onUpload(newAssets, newRecord);
    setStagedFiles([]);
    setSelectedIds(new Set());
    setIsIngesting(false);
    setIngestProgressText('');
  };

  // Filtered history records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (historyIpFilter !== 'ALL' && r.ipId !== historyIpFilter) return false;
      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase();
        const matchesBatch = r.batchNo.toLowerCase().includes(q);
        const matchesIp = r.ipName.toLowerCase().includes(q);
        const matchesUploader = r.uploaderName.toLowerCase().includes(q);
        const matchesFiles = (r.filesSummary || []).some(f => 
          f.name.toLowerCase().includes(q) || (f.assetId && f.assetId.toLowerCase().includes(q))
        );
        if (!matchesBatch && !matchesIp && !matchesUploader && !matchesFiles) return false;
      }
      return true;
    });
  }, [records, historyIpFilter, historySearchQuery]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-28 animate-fadeIn">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
            <i className="fa-solid fa-cloud-arrow-up text-xl"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">资产上传与入库中心</h2>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                全局资产唯一 ID 体系
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              支持多文件/文件夹批量拖拽、自动格式解析、批量分配 IP 与生产阶段
            </p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
          <button
            onClick={() => { setActiveTab('UPLOAD'); setJustUploadedBatch(null); }}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'UPLOAD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <i className="fa-solid fa-upload"></i>
            <span>文件入库与批量配置</span>
            {stagedFiles.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-indigo-600 text-white font-black animate-scaleUp">
                {stagedFiles.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'HISTORY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <i className="fa-solid fa-clock-rotate-left"></i>
            <span>上传历史记录</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
              {records.length}
            </span>
          </button>
        </div>
      </div>

      {/* Modern 3-Step Flow Wizard Indicator */}
      {activeTab === 'UPLOAD' && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1 */}
            <div className={`p-3.5 rounded-xl border transition-all flex items-center space-x-3 ${
              stagedFiles.length === 0 
                ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 shadow-xs ring-2 ring-indigo-500/10' 
                : 'bg-slate-50/70 border-slate-200 text-slate-600'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                stagedFiles.length > 0 ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
              }`}>
                {stagedFiles.length > 0 ? <i className="fa-solid fa-check"></i> : '1'}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black block truncate">1. 拖拽/选择物料</span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {stagedFiles.length > 0 ? `已载入 ${stagedFiles.length} 个文件 (${formatFileSize(totalQueueBytes)})` : '支持图片、PSD、3D、视频等'}
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`p-3.5 rounded-xl border transition-all flex items-center space-x-3 ${
              stagedFiles.length > 0 && !isReadyToIngest
                ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 shadow-xs ring-2 ring-indigo-500/10' 
                : stagedFiles.length > 0 && isReadyToIngest
                  ? 'bg-slate-50/70 border-slate-200 text-slate-600'
                  : 'bg-slate-50/40 border-slate-100 text-slate-400 opacity-70'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                isReadyToIngest ? 'bg-emerald-500 text-white' : stagedFiles.length > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {isReadyToIngest ? <i className="fa-solid fa-check"></i> : '2'}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black block truncate">2. 智能分类与唯一ID配置</span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {stagedFiles.length > 0 ? `就绪: ${readyCount}/${stagedFiles.length}` : '批量分配 IP、阶段与语义标签'}
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`p-3.5 rounded-xl border transition-all flex items-center space-x-3 ${
              isReadyToIngest
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 shadow-xs ring-2 ring-emerald-500/10' 
                : 'bg-slate-50/40 border-slate-100 text-slate-400 opacity-70'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                isReadyToIngest ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {isReadyToIngest ? <i className="fa-solid fa-rocket"></i> : '3'}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black block truncate">3. 确认入库与归档</span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {isReadyToIngest ? '全部就绪，随时可提交入库' : '完成元数据配置后即可入库'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Just Uploaded Batch Notification Banner */}
      {justUploadedBatch && activeTab === 'UPLOAD' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 animate-scaleUp shadow-xs">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-md shrink-0">
              <i className="fa-solid fa-check"></i>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-emerald-900">
                  批次 {justUploadedBatch.batchNo} 已成功归档入库！
                </h3>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  {justUploadedBatch.fileCount} 个资产
                </span>
              </div>
              <p className="text-xs text-emerald-700 font-medium mt-1">
                已归档至【<strong>{justUploadedBatch.ipName}</strong>】• {justUploadedBatch.directoryName} ({justUploadedBatch.totalSize})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => handleCopyAllGeneratedIds(justUploadedBatch)}
              className="px-4 py-2.5 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-all border border-emerald-200 flex items-center space-x-1.5 shadow-2xs"
            >
              <i className={`fa-solid ${copiedAllIds ? 'fa-check text-emerald-600' : 'fa-copy'}`}></i>
              <span>{copiedAllIds ? '已复制所有资产ID' : '复制本批资产ID'}</span>
            </button>

            {onGoToLibrary && (
              <button
                onClick={() => onGoToLibrary(justUploadedBatch.ipName)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center space-x-2"
              >
                <i className="fa-solid fa-folder-open"></i>
                <span>前往该 IP 图库查看</span>
              </button>
            )}
            
            <button
              onClick={() => setJustUploadedBatch(null)}
              className="px-3.5 py-2.5 bg-transparent hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Main Upload Tab */}
      {activeTab === 'UPLOAD' && (
        <div className="space-y-8">
          {/* Folder Scanning Notice Banner */}
          {folderScanNotice && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between gap-4 text-xs font-bold text-indigo-900 shadow-2xs animate-fadeIn">
              <div className="flex items-center space-x-2.5">
                <i className="fa-solid fa-folder-tree text-indigo-600 text-base"></i>
                <span>{folderScanNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setFolderScanNotice(null)}
                className="text-indigo-400 hover:text-indigo-700 text-sm px-2 py-1 rounded-lg"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          )}

          {/* Prominent Upload Dropzone Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-200 shadow-xs relative overflow-hidden">
            <div
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 lg:p-14 text-center transition-all duration-200 cursor-pointer ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-50/80 scale-[0.99] shadow-inner' 
                  : 'border-slate-300/80 bg-slate-50/60 hover:bg-slate-50 hover:border-indigo-400'
              }`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-slate-100 text-indigo-600 group-hover:scale-105 transition-transform">
                <i className={`fa-solid ${isScanningFolders ? 'fa-spinner fa-spin text-indigo-600' : isDragging ? 'fa-cloud-arrow-up animate-bounce text-indigo-600' : 'fa-folder-arrow-up text-slate-400'} text-2xl sm:text-3xl`}></i>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-3 shadow-2xs">
                <i className="fa-solid fa-wand-magic-sparkles text-indigo-500"></i>
                <span>支持将本地【文件夹】或【多文件】直接拖拽至此处</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-2 tracking-tight">
                {isScanningFolders ? '正在深度解析本地文件夹与文件类型...' : '点击或拖拽物料文件/文件夹至此处'}
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm font-medium max-w-xl mx-auto mb-6 leading-relaxed">
                拖入文件夹将自动穿透解析全部嵌套文件，根据扩展名与目录名智能匹配阶段、生成全局唯一 ID 与标准版本。
              </p>

              {/* Supported Format Pills */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-2xl mx-auto mb-7">
                {[
                  { ext: 'PNG / JPG / WEBP', type: '原画/立绘/贴图' },
                  { ext: 'PSD / AI', type: '分层工程/刀模设计' },
                  { ext: 'FBX / OBJ / GLB / BLEND', type: '3D数模工程' },
                  { ext: 'MP4 / MOV / AVI', type: '宣发短片/动效' },
                  { ext: 'PDF / ZIP', type: '规范文档/素材包' }
                ].map((item) => (
                  <span key={item.ext} className="text-[10px] font-bold bg-white text-slate-600 border border-slate-200/80 px-2.5 py-1 rounded-lg shadow-2xs">
                    <strong className="text-indigo-600 font-black">{item.ext}</strong>
                    <span className="text-slate-400 ml-1">({item.type})</span>
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-7 rounded-xl transition-all shadow-md hover:shadow-indigo-500/20 active:scale-95 text-xs sm:text-sm flex items-center space-x-2 cursor-pointer"
                >
                  <i className="fa-solid fa-file-arrow-up"></i>
                  <span>选择本地文件</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}
                  className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-xl transition-all border border-slate-200 shadow-2xs text-xs sm:text-sm flex items-center space-x-2 cursor-pointer"
                >
                  <i className="fa-solid fa-folder-tree text-indigo-500"></i>
                  <span>选择整个文件夹 (含子目录)</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); loadPresetSamples(); }}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3 px-6 rounded-xl transition-all border border-indigo-200/80 text-xs sm:text-sm flex items-center space-x-2 cursor-pointer"
                >
                  <i className="fa-solid fa-wand-magic-sparkles text-indigo-600"></i>
                  <span>加载示例物料包体验</span>
                </button>
              </div>

              <input
                type="file"
                multiple
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
              />
              <input
                type="file"
                // @ts-ignore
                webkitdirectory=""
                directory=""
                multiple
                ref={folderInputRef}
                className="hidden"
                onChange={handleFolderSelect}
              />
            </div>

            {/* Quick Upload Policy Bar */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 pt-5 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[11px] font-medium">
                <span className="flex items-center"><i className="fa-solid fa-circle-check text-emerald-500 mr-1.5"></i>自动解析文件类型与面数/尺寸</span>
                <span className="flex items-center"><i className="fa-solid fa-circle-check text-emerald-500 mr-1.5"></i>实时生成全局唯一资产 ID</span>
                <span className="flex items-center"><i className="fa-solid fa-circle-check text-emerald-500 mr-1.5"></i>支持多选一键批量分配目录</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">单文件最大支持 4GB</span>
            </div>
          </div>

          {/* Staged Files Section & Batch Edit Bar */}
          {stagedFiles.length > 0 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Batch Configuration Bar (Sticky Dark Bar) */}
              <div className="bg-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-slate-800 space-y-5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredStagedFiles.length && filteredStagedFiles.length > 0}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-500"
                      />
                      <span className="font-black text-sm text-slate-100">
                        全选待入库物料
                      </span>
                    </label>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 font-bold px-3 py-1 rounded-full border border-indigo-500/30">
                      已选中 {selectedIds.size} / {stagedFiles.length} 项
                    </span>

                    {readyCount < stagedFiles.length && (
                      <button
                        onClick={selectIncompleteOnly}
                        className="text-xs text-amber-400 hover:text-amber-300 font-bold underline transition-colors"
                      >
                        仅选中待完善项 ({stagedFiles.length - readyCount})
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleAutoClassifyAll}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition-all flex items-center space-x-1.5"
                      title="根据文件格式与文件名关键词自动预选生产阶段"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles text-indigo-400"></i>
                      <span>智能推导阶段目录</span>
                    </button>

                    {selectedIds.size > 0 && (
                      <button
                        onClick={removeSelectedFiles}
                        className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center space-x-1.5 transition-colors px-2 py-1"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                        <span>移除选中 ({selectedIds.size})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Batch Modification Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      批量指定归属 IP
                    </label>
                    <select
                      value={batchIpId}
                      onChange={(e) => setBatchIpId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-400 transition-colors"
                    >
                      <option value="">-- 选择归属 IP --</option>
                      {ips.map(ip => (
                        <option key={ip.id} value={ip.id}>
                          {ip.name} [{getIpCode(ip)}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      批量指定生产阶段/目录
                    </label>
                    <select
                      value={batchStage}
                      onChange={(e) => setBatchStage(e.target.value as ProjectStage)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-400 transition-colors"
                    >
                      <option value="">-- 选择目标阶段目录 --</option>
                      {DIRECTORY_OPTIONS.map(opt => (
                        <option key={opt.stage} value={opt.stage}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      资产短英文标识 (ID构成 ≤15字)
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={batchCustomCode}
                      onChange={(e) => setBatchCustomCode(e.target.value)}
                      placeholder="如: CHAR_V1 (仅英文/数字)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-indigo-400 transition-colors placeholder:text-slate-500 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      批量添加标签
                    </label>
                    <TagAutocompleteInput
                      value={batchTagInput}
                      onChange={setBatchTagInput}
                      tagStats={tagStats}
                      mode="multi-comma"
                      darkTheme={true}
                      placeholder="如：主视觉, 定稿"
                    />
                  </div>

                  <div>
                    <button
                      onClick={handleBatchApply}
                      disabled={selectedIds.size === 0}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-2.5 px-4 rounded-xl text-xs transition-all shadow-md disabled:shadow-none flex items-center justify-center space-x-2"
                    >
                      <i className="fa-solid fa-check-double"></i>
                      <span>应用到已勾选 ({selectedIds.size})</span>
                    </button>
                  </div>
                </div>

                {/* Global Asset ID Standard Banner */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2 text-slate-300 font-mono text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-slate-400 font-sans">全局资产ID生成规则:</span>
                    <strong className="text-indigo-300 font-black">
                      [IP缩写 ≤6位] _ [短英文 ≤15位] _ [时间戳]
                    </strong>
                    <span className="text-slate-400 text-[10px] hidden sm:inline">(入库时自动分配并全系统引用)</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-700/60 px-2 py-0.5 rounded">
                    仅限英文、数字、下划线及连接符
                  </span>
                </div>

                {/* Quick Tag Recommendations with IP Count Badges */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center mr-1">
                    <i className="fa-solid fa-wand-magic-sparkles text-indigo-400 mr-1.5"></i>
                    常用标签快捷追加:
                  </span>
                  {tagStats.slice(0, 8).map(tag => (
                    <button
                      key={tag.name}
                      type="button"
                      onClick={() => {
                        const parts = batchTagInput.split(/[,，]/).map(p => p.trim()).filter(Boolean);
                        if (!parts.includes(tag.name)) {
                          const updated = parts.length > 0 ? `${parts.join(', ')}, ${tag.name}` : tag.name;
                          setBatchTagInput(updated);
                        }
                      }}
                      className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700/80 transition-all flex items-center space-x-1.5"
                    >
                      <span>#{tag.name}</span>
                      <span className="text-[9px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.2 rounded font-black">
                        {tag.ipCount} IP
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Queue Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    待入库物料列表 ({stagedFiles.length})
                  </span>
                  <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setFilterQueueMode('ALL')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        filterQueueMode === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      全部 ({stagedFiles.length})
                    </button>
                    <button
                      onClick={() => setFilterQueueMode('INCOMPLETE')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        filterQueueMode === 'INCOMPLETE' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      待完善 ({stagedFiles.length - readyCount})
                    </button>
                    <button
                      onClick={() => setFilterQueueMode('READY')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        filterQueueMode === 'READY' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      已就绪 ({readyCount})
                    </button>
                  </div>
                </div>

                <div className="relative w-full sm:w-64">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type="text"
                    value={searchQueueText}
                    onChange={(e) => setSearchQueueText(e.target.value)}
                    placeholder="按物料名或短标识过滤..."
                    className="w-full pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Staged File Cards */}
              <div className="space-y-3.5">
                {filteredStagedFiles.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
                    <i className="fa-solid fa-filter-circle-xmark text-3xl mb-2 opacity-40"></i>
                    <p className="text-xs font-bold">没有符合筛选条件的物料</p>
                  </div>
                ) : (
                  filteredStagedFiles.map((file) => {
                    const isSelected = selectedIds.has(file.id);
                    const selectedIp = ips.find(i => i.id === file.ipId);
                    const version = calculateVersion(file.ipId, file.stage);
                    const stageLabel = DIRECTORY_TRANSLATIONS[file.stage as ProjectStage] || '';
                    const previewFormalName = selectedIp && file.stage && file.title
                      ? `${selectedIp.name}_${stageLabel}_${file.title}_v${version}`
                      : '请选择 IP 和目录生成规范名';

                    const isCardComplete = Boolean(file.ipId && file.stage && file.title.trim());
                    const liveDate = file.stagedAt || new Date();
                    const previewId = file.generatedAssetId || generateAssetId(selectedIp || file.ipId, file.customCode || file.title, liveDate);
                    const ipCode = getIpCode(selectedIp || file.ipId);
                    const titleCode = sanitizeCustomCode(file.customCode || file.title, 15);
                    const timestampCode = formatCompactTimestamp(liveDate);
                    const isIdValid = isValidAssetId(previewId);
                    const isCopied = copiedId === previewId;

                    return (
                      <div
                        key={file.id}
                        onClick={() => toggleSelectOne(file.id)}
                        className={`bg-white rounded-3xl p-5 border transition-all flex flex-col lg:flex-row items-start lg:items-center gap-5 cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/10'
                            : 'border-slate-200 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        {/* Checkbox & Thumbnail Preview */}
                        <div className="flex items-center space-x-3.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(file.id)}
                            className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600"
                          />

                          <div 
                            className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200/80 flex items-center justify-center relative shrink-0 group"
                            onClick={() => file.previewUrl && setPreviewLightboxUrl(file.previewUrl)}
                          >
                            {file.previewUrl ? (
                              <>
                                <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity">
                                  <i className="fa-solid fa-magnifying-glass-plus"></i>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-slate-400">
                                <i className="fa-solid fa-file-lines text-xl"></i>
                                <span className="text-[9px] font-mono font-bold uppercase mt-0.5">{file.extension}</span>
                              </div>
                            )}

                            <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[8px] font-mono font-bold text-white text-center py-0.2">
                              .{file.extension}
                            </span>
                          </div>
                        </div>

                        {/* Middle: Titles, Live Unique ID & Tags */}
                        <div className="flex-1 min-w-0 space-y-2 w-full" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center space-x-2 min-w-0 flex-wrap gap-y-1">
                              <span className="text-xs font-black text-slate-800 truncate block max-w-xs sm:max-w-md">
                                {file.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                ({file.sizeFormatted})
                              </span>
                              {file.folderPath && (
                                <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1">
                                  <i className="fa-solid fa-folder-tree text-[9px]"></i>
                                  <span>{file.folderPath}</span>
                                </span>
                              )}
                            </div>

                            {/* Status Indicator */}
                            {isCardComplete ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                <i className="fa-solid fa-circle-check text-emerald-600 text-[10px]"></i>
                                <span>就绪</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                <i className="fa-solid fa-triangle-exclamation text-amber-600 text-[10px]"></i>
                                <span>缺少 IP 或生产阶段</span>
                              </span>
                            )}
                          </div>

                          {/* Editable Title and Short ID */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 mb-0.5">物料中文名称</label>
                              <input
                                type="text"
                                value={file.title}
                                onChange={(e) => updateStagedFile(file.id, { title: e.target.value })}
                                placeholder="物料描述标题 (如: 赛博主角主视觉)"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between">
                                <label className="block text-[9px] font-bold text-slate-400 mb-0.5">
                                  英文短标识 (ID构成, ≤15字符)
                                </label>
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {(file.customCode || '').length}/15
                                </span>
                              </div>
                              <input
                                type="text"
                                maxLength={15}
                                value={file.customCode || ''}
                                onChange={(e) => updateStagedFile(file.id, { customCode: e.target.value })}
                                placeholder="如: HERO_VISUAL"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-indigo-700 uppercase focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400"
                              />
                            </div>
                          </div>

                          {/* Live Unique Asset ID Badge & Breakdown */}
                          <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider flex items-center shrink-0">
                                <i className="fa-solid fa-fingerprint text-indigo-600 mr-1 text-[11px]"></i>
                                实时生成唯一资产ID:
                              </span>
                              <span className="font-mono text-xs font-black text-indigo-950 bg-white px-2.5 py-1 rounded-xl border border-indigo-200/80 shadow-2xs truncate">
                                {previewId}
                              </span>

                              <div className="hidden md:flex items-center space-x-1 text-[9px] font-mono text-slate-500">
                                <span className="bg-white/80 px-1.5 py-0.5 rounded border border-slate-200" title="IP缩写">IP:{ipCode}</span>
                                <span>+</span>
                                <span className="bg-white/80 px-1.5 py-0.5 rounded border border-slate-200" title="文件标识">{titleCode}</span>
                                <span>+</span>
                                <span className="bg-white/80 px-1.5 py-0.5 rounded border border-slate-200" title="时间戳">{timestampCode}</span>
                              </div>

                              {isIdValid ? (
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md shrink-0 flex items-center">
                                  <i className="fa-solid fa-check mr-0.5 text-[8px]"></i> 规范合规
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md shrink-0">
                                  待完善
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleCopyId(previewId, e)}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all shrink-0 flex items-center space-x-1 ${
                                isCopied 
                                  ? 'bg-emerald-500 text-white shadow-2xs' 
                                  : 'bg-white hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              <i className={`fa-solid ${isCopied ? 'fa-check' : 'fa-copy'} text-[10px]`}></i>
                              <span>{isCopied ? '已复制' : '复制ID'}</span>
                            </button>
                          </div>

                          {/* Standard Formal Name & Tags */}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <p className="text-[11px] font-mono text-slate-500 truncate font-semibold mr-2">
                              <i className="fa-solid fa-folder-tree text-[10px] mr-1 text-slate-400"></i>
                              {previewFormalName}
                            </p>

                            {/* Tags Chips */}
                            {file.tags.map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md"
                              >
                                <span>#{tag}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateStagedFile(file.id, {
                                      tags: file.tags.filter(t => t !== tag)
                                    });
                                  }}
                                  className="hover:text-red-500 ml-0.5"
                                >
                                  <i className="fa-solid fa-xmark text-[9px]"></i>
                                </button>
                              </span>
                            ))}

                            {/* Upstream Lineage Linker Badge */}
                            <div className="flex items-center gap-1 ml-auto">
                              {file.upstreamAssetIds && file.upstreamAssetIds.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLinkingFileId(file.id);
                                    setUpstreamSearchQuery('');
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md"
                                >
                                  <i className="fa-solid fa-link text-[9px]"></i>
                                  <span>已关联 {file.upstreamAssetIds.length} 个上游</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLinkingFileId(file.id);
                                    setUpstreamSearchQuery('');
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 px-2 py-0.5 rounded-md transition-colors"
                                >
                                  <i className="fa-solid fa-plus text-[8px]"></i>
                                  <span>关联上游原型</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: IP and Stage Selectors & Item Actions */}
                        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2.5 w-full lg:w-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="w-full sm:w-40 lg:w-36 xl:w-40">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">归属 IP</label>
                            <select
                              value={file.ipId}
                              onChange={(e) => updateStagedFile(file.id, { ipId: e.target.value })}
                              className={`w-full bg-slate-50 border rounded-xl px-2.5 py-1.5 text-xs font-bold transition-colors ${
                                !file.ipId ? 'border-amber-300 text-amber-600 bg-amber-50/50' : 'border-slate-200 text-slate-700'
                              }`}
                            >
                              <option value="">-- 选择 IP --</option>
                              {ips.map(ip => (
                                <option key={ip.id} value={ip.id}>{ip.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="w-full sm:w-44 lg:w-40 xl:w-44">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">文件目录 / 阶段</label>
                            <select
                              value={file.stage}
                              onChange={(e) => updateStagedFile(file.id, { stage: e.target.value as ProjectStage })}
                              className={`w-full bg-slate-50 border rounded-xl px-2.5 py-1.5 text-xs font-bold transition-colors ${
                                !file.stage ? 'border-amber-300 text-amber-600 bg-amber-50/50' : 'border-slate-200 text-slate-700'
                              }`}
                            >
                              <option value="">-- 选择目录 --</option>
                              {DIRECTORY_OPTIONS.map(opt => (
                                <option key={opt.stage} value={opt.stage}>{opt.label}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center space-x-1.5 self-end sm:self-center pt-2 sm:pt-4 lg:pt-0">
                            <button
                              type="button"
                              onClick={(e) => syncSettingsToAll(file, e)}
                              title="将此文件的 IP 和生产阶段同步应用到全部物料"
                              className="w-8 h-8 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors border border-slate-200/80"
                            >
                              <i className="fa-solid fa-arrows-split-up-and-left text-xs"></i>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => removeStagedFile(file.id, e)}
                              title="移除此文件"
                              className="w-8 h-8 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors border border-slate-200/80"
                            >
                              <i className="fa-solid fa-trash-can text-xs"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Floating Bottom Ingest Submission Bar */}
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-6 z-30">
                <div className="flex items-center space-x-3 text-xs text-slate-600">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] text-white font-bold ${
                    isReadyToIngest ? 'bg-emerald-500 shadow-xs' : 'bg-amber-400 animate-pulse'
                  }`}>
                    {isReadyToIngest ? <i className="fa-solid fa-check text-[8px]"></i> : '!'}
                  </div>
                  <div>
                    <span className="font-black text-slate-800 block text-xs sm:text-sm">
                      {isReadyToIngest
                        ? `就绪：全部 ${stagedFiles.length} 个物料均已完成 IP 归属与全局资产 ID 编码`
                        : `待完善：已就绪 ${readyCount} / ${stagedFiles.length} 项 (尚有 ${stagedFiles.length - readyCount} 个文件未配置)`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      总文件体积: {formatFileSize(totalQueueBytes)} · 支持一键全流程归档
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={() => { setStagedFiles([]); setSelectedIds(new Set()); }}
                    className="px-4 py-3 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    清空待办
                  </button>

                  <button
                    onClick={handleConfirmIngest}
                    disabled={!isReadyToIngest || isIngesting}
                    className="flex-1 sm:flex-none px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-sm rounded-2xl transition-all shadow-md hover:shadow-indigo-500/30 disabled:shadow-none flex items-center justify-center space-x-2"
                  >
                    {isIngesting ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin"></i>
                        <span>{ingestProgressText || '正在入库归档...'}</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-box-archive"></i>
                        <span>确认入库并归档 ({stagedFiles.length} 个资产)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Upload Records Preview at bottom of Upload view */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">近期上传归档批次</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">历史上传批次与资产 ID 追溯</p>
              </div>
              <button
                onClick={() => setActiveTab('HISTORY')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
              >
                <span>查看全部历史记录 ({records.length})</span>
                <i className="fa-solid fa-arrow-right text-[10px]"></i>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {records.slice(0, 3).map((rec) => (
                <div key={rec.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">
                      <i className="fa-solid fa-boxes-packing"></i>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-black text-slate-900">{rec.batchNo}</span>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">
                          入库成功
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <strong className="text-slate-700">{rec.ipName}</strong> • {rec.directoryName} • {rec.fileCount} 个物料 ({rec.totalSize})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-slate-400">
                    <span>{rec.timestamp}</span>
                    {onGoToLibrary && (
                      <button
                        onClick={() => onGoToLibrary(rec.ipName)}
                        className="text-indigo-600 hover:text-indigo-700 font-bold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-xs flex items-center space-x-1"
                      >
                        <i className="fa-solid fa-folder-open text-[11px]"></i>
                        <span>浏览图库</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">上传历史批次记录</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  共计 {records.length} 个上传批次，支持追溯批次操作人、文件明细及全局资产 ID
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveTab('UPLOAD')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-5 py-2.5 rounded-xl text-xs shadow-md transition-colors flex items-center space-x-2"
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>上传新批次</span>
                </button>
              </div>
            </div>

            {/* Filter and Search for History */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="搜索批次号、物料名称、资产唯一 ID 或上传人..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="w-full sm:w-56">
                <select
                  value={historyIpFilter}
                  onChange={(e) => setHistoryIpFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="ALL">全部 IP 批次</option>
                  {ips.map(ip => (
                    <option key={ip.id} value={ip.id}>{ip.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredRecords.length === 0 ? (
                <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl">
                  <i className="fa-solid fa-box-open text-3xl mb-2 opacity-40"></i>
                  <p className="text-xs font-bold">未找到匹配的上传批次记录</p>
                </div>
              ) : (
                filteredRecords.map((rec) => {
                  const isExpanded = expandedRecordId === rec.id;

                  return (
                    <div
                      key={rec.id}
                      className="border border-slate-200/80 rounded-3xl overflow-hidden hover:border-slate-300 transition-all bg-slate-50/50 shadow-2xs"
                    >
                      <div
                        onClick={() => setExpandedRecordId(isExpanded ? null : rec.id)}
                        className="p-6 bg-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 cursor-pointer"
                      >
                        <div className="flex items-start sm:items-center space-x-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
                            <i className="fa-solid fa-folder-closed text-lg"></i>
                          </div>
                          <div>
                            <div className="flex items-center space-x-3">
                              <span className="font-mono text-sm font-black text-slate-900">{rec.batchNo}</span>
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                <i className="fa-solid fa-circle-check mr-1"></i> 已入库
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                              <span>目标 IP: <strong className="text-slate-800">{rec.ipName}</strong></span>
                              <span>•</span>
                              <span>目录: <strong className="text-slate-800">{rec.directoryName}</strong></span>
                              <span>•</span>
                              <span>物料数: <strong className="text-slate-800">{rec.fileCount}</strong> 项 ({rec.totalSize})</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 self-end lg:self-center">
                          <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-slate-700">{rec.uploaderName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{rec.timestamp}</p>
                          </div>

                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyAllGeneratedIds(rec); }}
                            className="px-3.5 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center space-x-1"
                            title="复制本批次全部资产 ID"
                          >
                            <i className="fa-solid fa-fingerprint text-indigo-500"></i>
                            <span>复制批次ID</span>
                          </button>

                          {onGoToLibrary && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onGoToLibrary(rec.ipName); }}
                              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5"
                            >
                              <i className="fa-solid fa-folder-open"></i>
                              <span>直达图库</span>
                            </button>
                          )}

                          <button className="text-slate-400 hover:text-slate-600 p-2">
                            <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-xs`}></i>
                          </button>
                        </div>
                      </div>

                      {isExpanded && rec.filesSummary && (
                        <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-3 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              批次包含物料明细 ({rec.filesSummary.length})
                            </h5>
                            <span className="text-[10px] text-slate-400">点击复制各物料专属唯一 ID</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {rec.filesSummary.map((file, idx) => (
                              <div key={idx} className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                                <div className="flex items-center space-x-3 truncate">
                                  <i className="fa-solid fa-file-code text-indigo-500 shrink-0"></i>
                                  <div className="truncate">
                                    <span className="text-xs font-bold text-slate-800 truncate block">{file.name}</span>
                                    {file.assetId && (
                                      <div className="flex items-center space-x-1.5 mt-0.5">
                                        <span className="text-[9px] text-slate-400 font-mono">ID:</span>
                                        <span className="text-[10px] font-mono font-bold text-indigo-600 truncate">{file.assetId}</span>
                                        <button
                                          type="button"
                                          onClick={(e) => handleCopyId(file.assetId!, e)}
                                          className="text-slate-400 hover:text-indigo-600 text-[9px] px-1 py-0.2 rounded hover:bg-indigo-50"
                                          title="复制资产ID"
                                        >
                                          <i className={`fa-solid ${copiedId === file.assetId ? 'fa-check text-emerald-600' : 'fa-copy'}`}></i>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                    {file.stage}
                                  </span>
                                  <span className="text-[10px] text-slate-400">{file.size}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upstream Prototype Linker Modal */}
      {linkingFileId && (() => {
        const targetFile = stagedFiles.find(f => f.id === linkingFileId);
        if (!targetFile) return null;

        const targetIp = ips.find(i => i.id === targetFile.ipId);
        const availableAssets = existingAssets.filter(a => {
          const matchesIp = !targetFile.ipId || a.ipId === targetFile.ipId;
          const q = upstreamSearchQuery.trim().toLowerCase();
          const matchesQuery = !q ||
            a.id.toLowerCase().includes(q) ||
            a.title.toLowerCase().includes(q) ||
            (a.tags || []).some(t => t.toLowerCase().includes(q)) ||
            (a.category || '').toLowerCase().includes(q);
          return matchesIp && matchesQuery;
        });

        const currentSelectedIds = new Set(targetFile.upstreamAssetIds || []);

        const toggleAssetLink = (assetId: string) => {
          const next = new Set(currentSelectedIds);
          if (next.has(assetId)) {
            next.delete(assetId);
          } else {
            next.add(assetId);
          }
          updateStagedFile(targetFile.id, {
            upstreamAssetIds: Array.from(next)
          });
        };

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh] animate-scaleUp">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-base font-bold shadow-2xs">
                    <i className="fa-solid fa-link"></i>
                  </span>
                  <div>
                    <h3 className="text-base font-black text-slate-800">关联上游原型 / 概念原画</h3>
                    <p className="text-xs text-slate-500">
                      正在为 <span className="font-bold text-slate-700">{targetFile.name}</span> 指定引用的上游物料
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setLinkingFileId(null)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>

              {/* Filter & Search Bar */}
              <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type="text"
                    value={upstreamSearchQuery}
                    onChange={(e) => setUpstreamSearchQuery(e.target.value)}
                    placeholder="输入资产ID（如 HP_...）、物料标题、标签或类型搜索..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                {targetIp && (
                  <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold border border-purple-200">
                    <i className="fa-solid fa-layer-group text-[10px]"></i>
                    <span>限定 IP: {targetIp.name}</span>
                  </div>
                )}
              </div>

              {/* Asset List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-100">
                {availableAssets.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <i className="fa-solid fa-boxes-stacked text-3xl mb-2 opacity-40"></i>
                    <p className="text-xs font-bold">暂无匹配的备选物料</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">请先在相应 IP 下上传 2D 原画或 3D 原型资产</p>
                  </div>
                ) : (
                  availableAssets.map(asset => {
                    const isSelected = currentSelectedIds.has(asset.id);
                    return (
                      <div
                        key={asset.id}
                        onClick={() => toggleAssetLink(asset.id)}
                        className={`pt-2 first:pt-0 p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-50/80 border border-purple-200'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={asset.thumbnail}
                            alt={asset.title}
                            className="w-12 h-12 rounded-xl object-cover shrink-0 bg-slate-100 border border-slate-200"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-mono text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-1.5 py-0.2 rounded shrink-0">
                                {asset.id}
                              </span>
                              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 shrink-0">
                                {asset.category || '2D'}
                              </span>
                              {asset.version && (
                                <span className="text-[10px] font-bold font-mono text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded shrink-0">
                                  {asset.version}
                                </span>
                              )}
                              <h4 className="text-xs font-bold text-slate-800 truncate">{asset.title}</h4>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {asset.uploader} · {asset.createdAt} · {asset.fileSize}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 ml-3">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                              isSelected
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-slate-100 text-transparent border border-slate-300'
                            }`}
                          >
                            <i className="fa-solid fa-check"></i>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-bold">
                  已关联 <span className="text-purple-600 font-black">{currentSelectedIds.size}</span> 个上游原型
                </div>
                <button
                  onClick={() => setLinkingFileId(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  确定完成
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Image Preview Lightbox Modal */}
      {previewLightboxUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setPreviewLightboxUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={previewLightboxUrl} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20" 
            />
            <button
              onClick={() => setPreviewLightboxUrl(null)}
              className="mt-4 px-5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-colors"
            >
              关闭预览
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadCenter;
