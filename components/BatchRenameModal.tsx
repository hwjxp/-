import React, { useState, useMemo } from 'react';
import { Asset, IP, AssetLibrary, User, AssetOperationRecord } from '../types';

interface BatchRenameModalProps {
  selectedAssets: Asset[];
  allIPs: IP[];
  allLibraries: AssetLibrary[];
  currentUser: User;
  onClose: () => void;
  onApplyRename: (updatedAssets: Asset[]) => void;
}

type RenameMode = 'FORMULA' | 'REPLACE' | 'TEMPLATE';

export const BatchRenameModal: React.FC<BatchRenameModalProps> = ({
  selectedAssets,
  allIPs,
  currentUser,
  onClose,
  onApplyRename
}) => {
  const [mode, setMode] = useState<RenameMode>('FORMULA');

  // FORMULA mode states
  const [prefix, setPrefix] = useState('');
  const [nameMode, setNameMode] = useState<'KEEP_ORIGINAL' | 'CUSTOM' | 'TRIM_EXT'>('KEEP_ORIGINAL');
  const [customBaseName, setCustomBaseName] = useState('物料');
  const [enableSeq, setEnableSeq] = useState(true);
  const [seqStart, setSeqStart] = useState(1);
  const [seqDigits, setSeqDigits] = useState<number>(2); // 2 -> 01, 3 -> 001
  const [seqPosition, setSeqPosition] = useState<'AFTER_NAME' | 'BEFORE_NAME'>('AFTER_NAME');
  
  const [enableDate, setEnableDate] = useState(true);
  const [dateFormat, setDateFormat] = useState<'YYYYMMDD' | 'YYYY-MM-DD' | 'YYMMDD' | 'NONE'>('YYYYMMDD');
  const [suffix, setSuffix] = useState('');
  const [separator, setSeparator] = useState<string>('_');

  // REPLACE mode states
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);

  // TEMPLATE mode states
  const [templateStr, setTemplateStr] = useState('{IP}_{CATEGORY}_{ORIGINAL}_{SEQ:02}_{DATE}');

  // Custom manual override overrides per asset ID if user directly edits in the preview table
  const [manualOverrides, setManualOverrides] = useState<Record<string, string>>({});

  // Helper date formatter
  const getFormattedDate = (format: string) => {
    const d = new Date();
    const yyyy = d.getFullYear().toString();
    const yy = yyyy.slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    if (format === 'YYYYMMDD') return `${yyyy}${mm}${dd}`;
    if (format === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`;
    if (format === 'YYMMDD') return `${yy}${mm}${dd}`;
    return '';
  };

  // Helper to format sequence number
  const formatSeqNumber = (num: number, digits: number) => {
    if (digits <= 1) return String(num);
    return String(num).padStart(digits, '0');
  };

  // Calculate new titles for each asset
  const renamedAssetList = useMemo(() => {
    const dateStr = enableDate ? getFormattedDate(dateFormat) : '';

    return selectedAssets.map((asset, index) => {
      // If manually overridden in table
      if (manualOverrides[asset.id] !== undefined) {
        return {
          asset,
          newTitle: manualOverrides[asset.id],
          isOverridden: true
        };
      }

      const ipObj = allIPs.find(i => i.id === asset.ipId);
      const ipCode = (ipObj?.englishName || ipObj?.name || 'ASSET')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 10);
      const catCode = asset.category || asset.type || '2D';
      const stageCode = asset.stage || 'STAGE';
      const seqStr = formatSeqNumber(seqStart + index, seqDigits);

      // Clean original title (remove trailing format extensions if present)
      let cleanOriginal = asset.title.replace(/\.(png|jpg|jpeg|psd|ai|fbx|obj|zip|rar|mp4|mov|pdf|svg)$/i, '');

      let computedName = '';

      if (mode === 'FORMULA') {
        const parts: string[] = [];

        // 1. Prefix
        if (prefix.trim()) {
          parts.push(prefix.trim());
        }

        // 2. Name + Seq
        let main = '';
        if (nameMode === 'KEEP_ORIGINAL') {
          main = cleanOriginal;
        } else if (nameMode === 'CUSTOM') {
          main = customBaseName.trim() || '物料';
        } else {
          main = cleanOriginal.trim();
        }

        if (enableSeq) {
          if (seqPosition === 'BEFORE_NAME') {
            parts.push(seqStr);
            if (main) parts.push(main);
          } else {
            if (main) parts.push(main);
            parts.push(seqStr);
          }
        } else {
          if (main) parts.push(main);
        }

        // 3. Date
        if (dateStr) {
          parts.push(dateStr);
        }

        // 4. Suffix
        if (suffix.trim()) {
          parts.push(suffix.trim().replace(/^_/, ''));
        }

        computedName = parts.filter(Boolean).join(separator);
      } else if (mode === 'REPLACE') {
        if (!findText) {
          computedName = asset.title;
        } else {
          try {
            const regex = new RegExp(
              findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              matchCase ? 'g' : 'gi'
            );
            computedName = asset.title.replace(regex, replaceText);
          } catch {
            computedName = asset.title;
          }
        }
      } else if (mode === 'TEMPLATE') {
        computedName = templateStr
          .replace(/\{IP\}/g, ipCode)
          .replace(/\{IP_NAME\}/g, ipObj?.name || 'IP')
          .replace(/\{CATEGORY\}/g, catCode)
          .replace(/\{STAGE\}/g, stageCode)
          .replace(/\{ORIGINAL\}/g, cleanOriginal)
          .replace(/\{SEQ:01\}/g, formatSeqNumber(seqStart + index, 1))
          .replace(/\{SEQ:02\}/g, formatSeqNumber(seqStart + index, 2))
          .replace(/\{SEQ:03\}/g, formatSeqNumber(seqStart + index, 3))
          .replace(/\{SEQ:04\}/g, formatSeqNumber(seqStart + index, 4))
          .replace(/\{SEQ\}/g, seqStr)
          .replace(/\{DATE\}/g, getFormattedDate('YYYYMMDD'))
          .replace(/\{DATE_DASH\}/g, getFormattedDate('YYYY-MM-DD'))
          .replace(/\{VERSION\}/g, asset.version || 'v1.0');
      }

      return {
        asset,
        newTitle: computedName || asset.title,
        isOverridden: false
      };
    });
  }, [
    selectedAssets,
    allIPs,
    mode,
    prefix,
    nameMode,
    customBaseName,
    enableSeq,
    seqStart,
    seqDigits,
    seqPosition,
    enableDate,
    dateFormat,
    suffix,
    separator,
    findText,
    replaceText,
    matchCase,
    templateStr,
    manualOverrides
  ]);

  // Check for duplicated titles among renamed list
  const duplicateTitles = useMemo(() => {
    const counts = new Map<string, number>();
    renamedAssetList.forEach(item => {
      counts.set(item.newTitle, (counts.get(item.newTitle) || 0) + 1);
    });
    const dupes = new Set<string>();
    counts.forEach((count, title) => {
      if (count > 1) dupes.add(title);
    });
    return dupes;
  }, [renamedAssetList]);

  // Handle Apply
  const handleConfirm = () => {
    const updatedAssets: Asset[] = renamedAssetList.map(({ asset, newTitle }) => {
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const renameOpRecord: AssetOperationRecord = {
        id: `op-rename-${asset.id}-${Date.now()}`,
        type: 'EDIT_INFO',
        operatorName: currentUser.name,
        operatorAvatar: currentUser.avatar,
        operatorRole: currentUser.role === 'SUPER_ADMIN' ? '超级管理员' : '设计专员',
        operatorDepartment: currentUser.department || '设计研发部',
        timestamp: nowStr,
        summary: `批量重命名: 由 【${asset.title}】 修改为 【${newTitle}】`,
        details: `执行批量重命名规则应用 (模式: ${mode === 'FORMULA' ? '规则组合' : mode === 'REPLACE' ? '文本替换' : '自定义模板'})。`,
        badge: '批量更名',
        badgeColor: 'indigo',
        extraMeta: {
          fieldsChanged: ['title']
        }
      };

      const existingHistory = asset.operationHistory || [];

      return {
        ...asset,
        title: newTitle.trim(),
        updatedAt: nowStr,
        operationHistory: [renameOpRecord, ...existingHistory]
      };
    });

    onApplyRename(updatedAssets);
    onClose();
  };

  // Quick preset shortcuts
  const handleApplyPreset = (type: 'IP_SEQ' | 'STAGE_DATE' | 'CLEAN_UP') => {
    setMode('FORMULA');
    if (type === 'IP_SEQ') {
      const firstIp = allIPs.find(i => i.id === selectedAssets[0]?.ipId);
      const ipName = (firstIp?.englishName || 'IP').toUpperCase().replace(/[^A-Z0-9]/g, '_');
      setPrefix(ipName);
      setNameMode('KEEP_ORIGINAL');
      setEnableSeq(true);
      setSeqDigits(2);
      setSeqPosition('AFTER_NAME');
      setEnableDate(true);
      setDateFormat('YYYYMMDD');
      setSeparator('_');
    } else if (type === 'STAGE_DATE') {
      setPrefix('PROD');
      setNameMode('CUSTOM');
      setCustomBaseName('Asset_Pack');
      setEnableSeq(true);
      setSeqDigits(3);
      setSeqPosition('AFTER_NAME');
      setEnableDate(true);
      setDateFormat('YYYYMMDD');
      setSeparator('_');
    } else if (type === 'CLEAN_UP') {
      setPrefix('');
      setNameMode('KEEP_ORIGINAL');
      setEnableSeq(false);
      setEnableDate(false);
      setSuffix('');
      setSeparator('_');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
      ></div>

      <div className="relative z-10 w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <i className="fa-solid fa-pen-to-square text-base"></i>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-white">批量重命名物料</h3>
                <span className="bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full">
                  已选 {selectedAssets.length} 项
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                支持规则组合、正则查找替换与灵活模板，实时预览重命名效果并一键同步全系统
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* 1. Mode Selector & Quick Presets */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            {/* Mode Switcher */}
            <div className="flex items-center space-x-1 bg-slate-200/80 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setMode('FORMULA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  mode === 'FORMULA'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-wand-magic-sparkles text-[11px]"></i>
                <span>规则组合模式</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('REPLACE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  mode === 'REPLACE'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-magnifying-glass text-[11px]"></i>
                <span>文本查找替换</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('TEMPLATE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  mode === 'TEMPLATE'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-code text-[11px]"></i>
                <span>灵活表达式</span>
              </button>
            </div>

            {/* Quick Presets */}
            {mode === 'FORMULA' && (
              <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                <span className="font-bold text-[11px] text-slate-400 mr-1">推荐规范:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('IP_SEQ')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 text-[11px] font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
                >
                  IP+原名+序号+日期
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('STAGE_DATE')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 text-[11px] font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
                >
                  阶段+统一名+3位编号
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('CLEAN_UP')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-400 text-[11px] font-bold text-slate-600 shadow-xs transition-colors cursor-pointer"
                >
                  重置
                </button>
              </div>
            )}
          </div>

          {/* 2. Configuration Options by Mode */}
          {mode === 'FORMULA' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 2.1 Prefix */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>1. 自定义前缀 (Prefix)</span>
                    <span className="text-[10px] text-slate-400 font-normal">选填</span>
                  </label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={e => setPrefix(e.target.value)}
                    placeholder="如: CYBER / FINAL"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  />
                  {/* Quick Fill Chips */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {allIPs.slice(0, 3).map(ip => {
                      const code = (ip.englishName || ip.name).toUpperCase().slice(0, 8);
                      return (
                        <button
                          key={ip.id}
                          type="button"
                          onClick={() => setPrefix(code)}
                          className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-1.5 py-0.5 rounded font-mono transition-colors cursor-pointer"
                        >
                          +{code}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setPrefix('VI')}
                      className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-1.5 py-0.5 rounded font-mono transition-colors cursor-pointer"
                    >
                      +VI
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrefix('PROD')}
                      className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-1.5 py-0.5 rounded font-mono transition-colors cursor-pointer"
                    >
                      +PROD
                    </button>
                  </div>
                </div>

                {/* 2.2 Main Name Core */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    <span>2. 主体文件名 (Core Name)</span>
                  </label>
                  <div className="space-y-2">
                    <select
                      value={nameMode}
                      onChange={e => setNameMode(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="KEEP_ORIGINAL">保留原资产名称</option>
                      <option value="CUSTOM">统一自定义主体名</option>
                    </select>

                    {nameMode === 'CUSTOM' && (
                      <input
                        type="text"
                        value={customBaseName}
                        onChange={e => setCustomBaseName(e.target.value)}
                        placeholder="输入统一主体名，如 Character_Art"
                        className="w-full bg-indigo-50/50 border border-indigo-200 rounded-xl px-3 py-1.5 text-xs font-bold text-indigo-900 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                      />
                    )}
                  </div>
                </div>

                {/* 2.3 Sequence Number */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      <span>3. 递增序号 (Sequence)</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableSeq}
                        onChange={e => setEnableSeq(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-[11px] text-slate-500 font-medium">启用</span>
                    </label>
                  </div>

                  {enableSeq ? (
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">起始序号</span>
                        <input
                          type="number"
                          min={1}
                          max={9999}
                          value={seqStart}
                          onChange={e => setSeqStart(parseInt(e.target.value, 10) || 1)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">位数补零</span>
                        <select
                          value={seqDigits}
                          onChange={e => setSeqDigits(parseInt(e.target.value, 10))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none"
                        >
                          <option value={1}>1 (无补零)</option>
                          <option value={2}>01 (两位)</option>
                          <option value={3}>001 (三位)</option>
                          <option value={4}>0001 (四位)</option>
                        </select>
                      </div>

                      <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">序号位置:</span>
                        <div className="flex items-center space-x-2">
                          <label className="flex items-center space-x-1 cursor-pointer">
                            <input
                              type="radio"
                              name="seqPos"
                              checked={seqPosition === 'AFTER_NAME'}
                              onChange={() => setSeqPosition('AFTER_NAME')}
                            />
                            <span>主体后</span>
                          </label>
                          <label className="flex items-center space-x-1 cursor-pointer">
                            <input
                              type="radio"
                              name="seqPos"
                              checked={seqPosition === 'BEFORE_NAME'}
                              onChange={() => setSeqPosition('BEFORE_NAME')}
                            />
                            <span>主体前</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                      未开启序号规则
                    </div>
                  )}
                </div>

                {/* 2.4 Date Stamp & Separator */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      <span>4. 日期戳与连接符</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableDate}
                        onChange={e => setEnableDate(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-[11px] text-slate-500 font-medium">附加日期</span>
                    </label>
                  </div>

                  <div className="space-y-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">日期格式</span>
                      <select
                        disabled={!enableDate}
                        value={dateFormat}
                        onChange={e => setDateFormat(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 disabled:opacity-50 focus:border-indigo-500 outline-none"
                      >
                        <option value="YYYYMMDD">{getFormattedDate('YYYYMMDD')} (无连字符)</option>
                        <option value="YYYY-MM-DD">{getFormattedDate('YYYY-MM-DD')} (标准中划线)</option>
                        <option value="YYMMDD">{getFormattedDate('YYMMDD')} (简短6位)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-[10px] text-slate-500 font-bold">连接符</span>
                      <div className="flex items-center space-x-1">
                        {[
                          { label: '_', val: '_' },
                          { label: '-', val: '-' },
                          { label: '空格', val: ' ' }
                        ].map(sep => (
                          <button
                            key={sep.val}
                            type="button"
                            onClick={() => setSeparator(sep.val)}
                            className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                              separator === sep.val
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {sep.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suffix optional field */}
              <div className="flex items-center space-x-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-600 shrink-0">自定义后缀 (Suffix):</span>
                <input
                  type="text"
                  value={suffix}
                  onChange={e => setSuffix(e.target.value)}
                  placeholder="选填，如: FINAL / APPROVED / V2"
                  className="flex-1 max-w-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                />
                <div className="flex items-center space-x-1">
                  {['_FINAL', '_V1.0', '_RAW', '_RENDER'].map(sfx => (
                    <button
                      key={sfx}
                      type="button"
                      onClick={() => setSuffix(sfx)}
                      className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2 py-1 rounded font-mono transition-colors cursor-pointer"
                    >
                      {sfx}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mode === 'REPLACE' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">查找内容 (Find Text)</label>
                  <input
                    type="text"
                    value={findText}
                    onChange={e => setFindText(e.target.value)}
                    placeholder="输入需要被替换的原文本字符..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">替换为 (Replace With)</label>
                  <input
                    type="text"
                    value={replaceText}
                    onChange={e => setReplaceText(e.target.value)}
                    placeholder="输入替换后的新文本内容..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-1">
                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={matchCase}
                    onChange={e => setMatchCase(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>区分大小写 (Case Sensitive)</span>
                </label>
              </div>
            </div>
          )}

          {mode === 'TEMPLATE' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>自定义格式表达式 (Template Expression)</span>
                  <span className="text-[11px] text-indigo-600 font-mono">支持自由组合变量</span>
                </label>
                <input
                  type="text"
                  value={templateStr}
                  onChange={e => setTemplateStr(e.target.value)}
                  placeholder="{IP}_{CATEGORY}_{ORIGINAL}_{SEQ:02}_{DATE}"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Tag Insertion Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500">点击插入占位变量:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { tag: '{IP}', label: 'IP代码 (如 CYBER)' },
                    { tag: '{IP_NAME}', label: 'IP中文名' },
                    { tag: '{CATEGORY}', label: '分类 (如 2D)' },
                    { tag: '{STAGE}', label: '制作阶段' },
                    { tag: '{ORIGINAL}', label: '原文件名' },
                    { tag: '{SEQ:01}', label: '序号 1' },
                    { tag: '{SEQ:02}', label: '序号 01' },
                    { tag: '{SEQ:03}', label: '序号 001' },
                    { tag: '{DATE}', label: '日期 20260816' },
                    { tag: '{DATE_DASH}', label: '日期 2026-08-16' },
                    { tag: '{VERSION}', label: '版本 v1.0' }
                  ].map(item => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => setTemplateStr(prev => prev + item.tag)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-[11px] font-mono font-bold transition-all border border-slate-200 cursor-pointer"
                    >
                      {item.tag} <span className="text-[10px] text-slate-400 font-sans font-normal">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. Live Comparison Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-black text-slate-800">
                  重命名实时效果对比 ({renamedAssetList.length} 项)
                </h4>
                {duplicateTitles.size > 0 && (
                  <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                    <i className="fa-solid fa-triangle-exclamation text-[10px]"></i>
                    <span>检测到 {duplicateTitles.size} 处同名冲突，建议开启序号规则</span>
                  </span>
                )}
              </div>

              {Object.keys(manualOverrides).length > 0 && (
                <button
                  type="button"
                  onClick={() => setManualOverrides({})}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer"
                >
                  重置所有手动微调
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 text-slate-600 font-bold sticky top-0 z-10 backdrop-blur-md border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">#</th>
                      <th className="py-2.5 px-3 w-16">预览</th>
                      <th className="py-2.5 px-4 w-1/3">原资产标题</th>
                      <th className="py-2.5 px-2 w-8 text-center"></th>
                      <th className="py-2.5 px-4">重命名后新标题 (支持直接编辑微调)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {renamedAssetList.map(({ asset, newTitle, isOverridden }, idx) => {
                      const isDupe = duplicateTitles.has(newTitle);
                      const isUnchanged = asset.title === newTitle;

                      return (
                        <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            <div className="w-10 h-8 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shadow-2xs shrink-0">
                              <img src={asset.thumbnail} alt="" className="w-full h-full object-cover" />
                            </div>
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-600 truncate max-w-[220px]" title={asset.title}>
                            <span className={isUnchanged ? 'text-slate-500' : 'line-through opacity-70 text-slate-400 mr-2'}>
                              {asset.title}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 ml-1">
                              {asset.category || asset.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-300">
                            <i className="fa-solid fa-arrow-right text-[11px] text-indigo-400"></i>
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={newTitle}
                                onChange={e => {
                                  setManualOverrides(prev => ({
                                    ...prev,
                                    [asset.id]: e.target.value
                                  }));
                                }}
                                className={`w-full px-3 py-1.5 text-xs font-bold rounded-xl border outline-none transition-all ${
                                  isDupe 
                                    ? 'border-amber-400 bg-amber-50/60 text-amber-900 focus:bg-white' 
                                    : isOverridden
                                      ? 'border-purple-400 bg-purple-50/60 text-purple-900 focus:bg-white'
                                      : 'border-slate-200 bg-slate-50/50 text-slate-900 focus:border-indigo-500 focus:bg-white'
                                }`}
                              />
                              {isOverridden && (
                                <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded shrink-0">
                                  手动
                                </span>
                              )}
                              {isDupe && (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded shrink-0" title="该标题存在同名冲突">
                                  重复
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            共将对 <span className="font-bold text-indigo-600">{selectedAssets.length}</span> 个资产应用命名变更，并自动录入版本操作历史
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
            >
              <i className="fa-solid fa-check text-xs"></i>
              <span>应用批量重命名</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchRenameModal;
