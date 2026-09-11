import React, { useState, useRef, useMemo } from 'react';
import { IP, Asset } from '../types';
import { getTagStats, TagInfo } from '../utils/tagUtils';
import TagAutocompleteInput from './TagAutocompleteInput';

interface IPDetailProps {
  ip?: IP | null;
  allIps?: IP[];
  allAssets?: Asset[];
  onSave: (ip: IP) => void;
  onCancel: () => void;
}

const AVAILABLE_CATEGORIES = ['潮玩', '影视', '动漫', '体育', '游戏', '艺术', '文学', '卡牌'];
const AVAILABLE_REGIONS = ['国内', '日韩', '亚太', '欧美', '全球'];

const IPDetail: React.FC<IPDetailProps> = ({ 
  ip, 
  allIps = [], 
  allAssets = [], 
  onSave, 
  onCancel 
}) => {
  const isEditing = !!ip;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<IP>>(
    ip || {
      id: `ip-${Date.now()}`,
      name: '',
      englishName: '',
      description: '',
      coverImage: '',
      ownership: 'ORIGINAL',
      categories: [],
      regions: [],
      hasAssetLibrary: false,
      visibility: 'PUBLIC',
      adminIds: [],
      viewerIds: [],
      downloaderIds: [],
      changeLogs: []
    }
  );

  const [customTagInput, setCustomTagInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Calculate comprehensive tag statistics
  const tagStats = useMemo(() => {
    return getTagStats(allIps, allAssets);
  }, [allIps, allAssets]);

  // Lookup map for fast tag count retrieval
  const tagCountMap = useMemo(() => {
    const map = new Map<string, number>();
    tagStats.forEach(t => map.set(t.name, t.ipCount));
    return map;
  }, [tagStats]);

  const toggleCategory = (cat: string) => {
    const current = formData.categories || [];
    if (current.includes(cat)) {
      setFormData({ ...formData, categories: current.filter(c => c !== cat) });
    } else {
      setFormData({ ...formData, categories: [...current, cat] });
    }
  };

  const toggleRegion = (region: string) => {
    const current = formData.regions || [];
    if (current.includes(region)) {
      setFormData({ ...formData, regions: current.filter(r => r !== region) });
    } else {
      setFormData({ ...formData, regions: [...current, region] });
    }
  };

  const handleAddCustomTag = (tagToAdd?: TagInfo | string) => {
    const rawName = typeof tagToAdd === 'string' ? tagToAdd : (tagToAdd ? tagToAdd.name : customTagInput);
    const cleanName = rawName.trim();
    if (!cleanName) return;

    const currentCategories = formData.categories || [];
    if (!currentCategories.includes(cleanName)) {
      setFormData({ ...formData, categories: [...currentCategories, cleanName] });
    }
    setCustomTagInput('');
  };

  const removeCategory = (cat: string) => {
    const current = formData.categories || [];
    setFormData({ ...formData, categories: current.filter(c => c !== cat) });
  };

  // Local image upload handler
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片格式文件（JPG, PNG, WebP, SVG）');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFormData(prev => ({ ...prev, coverImage: e.target?.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSave = () => {
    if (!formData.name?.trim() || !formData.englishName?.trim()) {
      alert('请填写完整必填信息（中文名称、英文标识）');
      return;
    }

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Generate change log entry
    const newLog = isEditing ? {
      id: `log-${Date.now()}`,
      operatorName: '当前操作人',
      action: (formData.coverImage !== ip?.coverImage ? 'UPDATE_COVER' : 'UPDATE_INFO') as any,
      description: `修改了 IP 资料信息与标签设定`,
      timestamp: timeStr
    } : {
      id: `log-${Date.now()}`,
      operatorName: '当前操作人',
      action: 'CREATE' as any,
      description: `新建 IP 档案《${formData.name}》`,
      timestamp: timeStr
    };

    const finalIP: IP = {
      ...(formData as IP),
      createdAt: ip?.createdAt || timeStr,
      updatedAt: timeStr,
      changeLogs: [newLog, ...(formData.changeLogs || [])]
    };

    onSave(finalIP);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20 animate-fadeIn">
      {/* Top Action Bar (Compact) */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onCancel}
          className="flex items-center text-slate-600 font-bold text-xs hover:text-slate-900 transition-colors bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-sm"
        >
          <i className="fa-solid fa-arrow-left mr-1.5"></i>
          返回
        </button>

        <div className="flex items-center space-x-2.5">
          <button 
            onClick={onCancel}
            className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 py-1.5 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center space-x-1.5"
          >
            <i className="fa-solid fa-floppy-disk"></i>
            <span>保存并提交</span>
          </button>
        </div>
      </div>

      {/* Main Form Container (Compact 2-Column Grid Layout) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900">{isEditing ? '编辑 IP 档案' : '创建新 IP 档案'}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">配置 IP 基础命名、中英文标识、权属性质、封面及全库分类标签</p>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            * 标记为必填字段
          </span>
        </div>

        {/* Section 1: Top 2-Column with Cover Upload & Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left: Local Cover Upload Box (4 cols) */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[11px] font-black text-slate-600 flex items-center justify-between">
              <span>封面主图 (本地上传)</span>
              {formData.coverImage && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, coverImage: '' })}
                  className="text-[10px] text-red-500 hover:underline font-bold"
                >
                  清除重选
                </button>
              )}
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`aspect-[5/4] w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all relative overflow-hidden group ${
                isDragOver 
                  ? 'border-indigo-500 bg-indigo-50/50' 
                  : formData.coverImage 
                    ? 'border-slate-200 bg-slate-50' 
                    : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              {formData.coverImage ? (
                <>
                  <img
                    src={formData.coverImage}
                    alt="Cover preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2">
                    <i className="fa-solid fa-camera text-base mb-1"></i>
                    <span className="text-[10px] font-bold">点击更换本地图片</span>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-sm group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">点击或拖拽上传封面</span>
                    <span className="text-[10px] text-slate-400">支持 JPG, PNG, WebP</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Basic Info & Ownership (8 cols) */}
          <div className="md:col-span-8 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600">
                  中文名称 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  placeholder="例如：赛博霓虹纪元"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600">
                  英文名称 / 编码标识 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.englishName}
                  onChange={e => setFormData({ ...formData, englishName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  placeholder="例如：Cyber Neon Genesis"
                />
              </div>
            </div>

            {/* Ownership & Visibility row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600">权属性质</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ownership: 'ORIGINAL' })}
                    className={`flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      formData.ownership === 'ORIGINAL'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <i className="fa-solid fa-crown text-[10px]"></i>
                    <span>自有原创 IP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ownership: 'LICENSED' })}
                    className={`flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      formData.ownership === 'LICENSED'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <i className="fa-solid fa-handshake text-[10px]"></i>
                    <span>三方授权 IP</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600">可见性范围</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, visibility: 'PUBLIC' })}
                    className={`flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      formData.visibility === 'PUBLIC'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <i className="fa-solid fa-globe text-[10px]"></i>
                    <span>全员公开</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, visibility: 'PRIVATE' })}
                    className={`flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      formData.visibility === 'PRIVATE'
                        ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <i className="fa-solid fa-lock text-[10px]"></i>
                    <span>机密受控</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Description (Compact) */}
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-600">简介与世界观描述</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                placeholder="简要阐述该 IP 的核心企划背景、视觉特征或授权周期..."
              ></textarea>
            </div>
          </div>
        </div>

        {/* Section 2: Tags & Category Management (Structured & Intuitive) */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3.5">
          {/* Top Tag Header & Autocomplete Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-black text-slate-800 flex items-center space-x-1.5">
                <i className="fa-solid fa-tags text-indigo-500"></i>
                <span>分类与领域标签管理</span>
              </span>
              <span className="text-[10px] text-slate-400">支持智能联想全库已建标签或直接回车快速打标</span>
            </div>

            {/* Autocomplete Input Bar */}
            <div className="flex gap-1.5 sm:w-80">
              <div className="flex-1">
                <TagAutocompleteInput
                  value={customTagInput}
                  onChange={setCustomTagInput}
                  tagStats={tagStats}
                  placeholder="搜索/新增标签 (回车即添加)..."
                  mode="single"
                  onSelectTag={(tag) => handleAddCustomTag(tag)}
                  onEnterPress={() => handleAddCustomTag()}
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddCustomTag()}
                disabled={!customTagInput.trim()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center space-x-1"
              >
                <i className="fa-solid fa-plus text-[10px]"></i>
                <span>添加</span>
              </button>
            </div>
          </div>

          {/* Selected Tags Display Chips */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white rounded-lg border border-slate-200 min-h-[36px]">
            <span className="text-[10px] font-bold text-slate-400 shrink-0 mr-1">已选标签:</span>
            {(formData.categories || []).map(cat => {
              const ipCount = tagCountMap.get(cat) ?? (isEditing ? 1 : 0);
              return (
                <span
                  key={cat}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs group"
                >
                  <span>#{cat}</span>
                  {ipCount > 0 && (
                    <span className="text-[9px] bg-indigo-200/60 text-indigo-800 px-1 py-0.2 rounded font-black">
                      {ipCount}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeCategory(cat)}
                    className="hover:text-red-600 transition-colors ml-0.5 opacity-60 group-hover:opacity-100"
                  >
                    <i className="fa-solid fa-xmark text-[9px]"></i>
                  </button>
                </span>
              );
            })}
            {(formData.categories || []).length === 0 && (
              <span className="text-[11px] text-slate-400 italic">暂无标签，可点击下方常用分类或上方输入框新增</span>
            )}
          </div>

          {/* Preset Category Recommendations */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400 mr-1">常用推荐:</span>
            {AVAILABLE_CATEGORIES.map(cat => {
              const isSelected = formData.categories?.includes(cat);
              const count = tagCountMap.get(cat) || 0;
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    isSelected 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-black ${
                    isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Region Badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 mr-1">发行区域:</span>
            {AVAILABLE_REGIONS.map(region => {
              const isSelected = formData.regions?.includes(region);
              const count = tagCountMap.get(region) || 0;
              return (
                <button
                  type="button"
                  key={region}
                  onClick={() => toggleRegion(region)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    isSelected 
                      ? 'bg-pink-600 text-white border-pink-600 shadow-2xs' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-pink-300 hover:text-pink-600'
                  }`}
                >
                  <span>{region}</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-black ${
                    isSelected ? 'bg-pink-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPDetail;
