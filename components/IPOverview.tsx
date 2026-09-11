import React, { useState } from 'react';
import { IP, Asset, User, UserRole } from '../types';
import LazyImage from './LazyImage';

interface IPOverviewProps {
  ip: IP;
  currentUser: User;
  assets?: Asset[];
  onBack: () => void;
  onEdit: () => void;
  onGoToLibrary: () => void;
  onCreateLibrary?: () => void;
  onSelectAsset?: (asset: Asset) => void;
}

export const IPOverview: React.FC<IPOverviewProps> = ({
  ip,
  currentUser,
  assets = [],
  onBack,
  onEdit,
  onGoToLibrary,
  onCreateLibrary,
  onSelectAsset,
}) => {
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'LOGS' | 'ASSETS_PREVIEW'>('SUMMARY');
  
  const canEditIP = currentUser.role === UserRole.SUPER_ADMIN || !!currentUser.canEditIP;
  const canManageAssetLibrary = currentUser.role === UserRole.SUPER_ADMIN || !!currentUser.canManageAssetLibrary;

  const ipAssets = assets.filter(a => a.ipId === ip.id);
  const changeLogs = ip.changeLogs || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 animate-fadeIn">
      {/* Top Action Bar with Clean Unboxed Breadcrumb */}
      <div className="flex items-center justify-between gap-4 py-1">
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 font-medium">
          <button
            onClick={onBack}
            className="text-slate-500 hover:text-indigo-600 font-medium transition-colors cursor-pointer flex items-center space-x-1"
          >
            <i className="fa-solid fa-arrow-left text-[10px] mr-1"></i>
            <span>IP 库</span>
          </button>
          <span className="text-slate-300 font-normal select-none">/</span>
          <span className="text-slate-900 font-bold truncate max-w-[280px]">
            {ip.name}
          </span>
        </nav>

        <div className="flex items-center space-x-3">
          {ip.hasAssetLibrary ? (
            <button
              onClick={onGoToLibrary}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all"
            >
              <i className="fa-solid fa-folder-open text-indigo-400"></i>
              <span>浏览关联图库 ({ipAssets.length})</span>
            </button>
          ) : canManageAssetLibrary && onCreateLibrary ? (
            <button
              onClick={onCreateLibrary}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all"
            >
              <i className="fa-solid fa-folder-plus"></i>
              <span>开通图库</span>
            </button>
          ) : null}

          {canEditIP && (
            <button
              onClick={onEdit}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <i className="fa-solid fa-pen-to-square"></i>
              <span>编辑 IP 资料</span>
            </button>
          )}
        </div>
      </div>

      {/* Main IP Overview Hero Banner (Compact & High Contrast) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* IP Avatar / Cover Container (1:1 Aspect Ratio with Lazy Loading) */}
          <div className="w-full sm:w-48 aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative group">
            <LazyImage
              src={ip.coverImage}
              alt={ip.name}
              aspectRatio="aspect-square"
              placeholderIcon="fa-image"
            >
              <span className={`absolute top-2.5 left-2.5 z-10 text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm ${
                ip.ownership === 'ORIGINAL' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {ip.ownership === 'ORIGINAL' ? '自有原创 IP' : '三方授权 IP'}
              </span>
            </LazyImage>
          </div>

          {/* Core Info Details */}
          <div className="flex-1 min-w-0 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 truncate">
                  {ip.name}
                </h1>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  {ip.englishName}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  ip.visibility === 'PUBLIC' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <i className={`fa-solid ${ip.visibility === 'PUBLIC' ? 'fa-globe' : 'fa-lock'} text-[9px] mr-1`}></i>
                  {ip.visibility === 'PUBLIC' ? '公开可见' : '机密受控'}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mt-2">
                {ip.description || '暂无详细背景描述。可点击右上角「编辑 IP 资料」进行补充。'}
              </p>
            </div>

            {/* Tag Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">类型/领域:</span>
              {ip.categories && ip.categories.map(cat => (
                <span key={cat} className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                  #{cat}
                </span>
              ))}

              <span className="text-slate-300 mx-1">|</span>

              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">发行区域:</span>
              {ip.regions && ip.regions.map(reg => (
                <span key={reg} className="text-[11px] font-bold bg-pink-50 text-pink-700 px-2.5 py-0.5 rounded-lg border border-pink-100">
                  {reg}
                </span>
              ))}
            </div>

            {/* Meta stats counters bar */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block">归档物料数</span>
                <span className="text-sm font-black text-slate-800">{ipAssets.length} 件</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block">图库状态</span>
                <span className={`text-xs font-black ${ip.hasAssetLibrary ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {ip.hasAssetLibrary ? '已开启关联' : '未开通'}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block">创建时间</span>
                <span className="text-xs font-mono font-bold text-slate-700">{ip.createdAt || '2024-03-10'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block">最近更新</span>
                <span className="text-xs font-mono font-bold text-slate-700">{ip.updatedAt || ip.createdAt || '近期'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-black">
        <button
          onClick={() => setActiveTab('SUMMARY')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'SUMMARY' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <span>概览与物料清单</span>
          {activeTab === 'SUMMARY' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('LOGS')}
          className={`pb-3 relative transition-colors flex items-center space-x-1.5 ${
            activeTab === 'LOGS' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <span>IP 编辑与变更日志</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px]">
            {changeLogs.length}
          </span>
          {activeTab === 'LOGS' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></div>
          )}
        </button>
      </div>

      {/* Tab 1: Summary & Assets mini view */}
      {activeTab === 'SUMMARY' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <i className="fa-solid fa-layer-group text-indigo-500"></i>
                <span>该 IP 关联物料 ({ipAssets.length})</span>
              </h3>
              {ipAssets.length > 0 && (
                <button
                  onClick={onGoToLibrary}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
                >
                  <span>直达全部图库</span>
                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </button>
              )}
            </div>

            {ipAssets.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {ipAssets.slice(0, 8).map(asset => (
                  <div
                    key={asset.id}
                    onClick={() => {
                      if (onSelectAsset) {
                        onSelectAsset(asset);
                      } else {
                        onGoToLibrary();
                      }
                    }}
                    className="group bg-slate-50 hover:bg-white rounded-2xl border border-slate-100 hover:border-indigo-400 p-3 transition-all cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="h-28 rounded-xl overflow-hidden bg-slate-200 mb-2 relative">
                      <LazyImage
                        src={asset.thumbnail}
                        alt={asset.title}
                        category={asset.category || asset.type}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      >
                        <span className="absolute top-1.5 left-1.5 z-10 text-[8px] font-black bg-slate-900/80 text-white px-1.5 py-0.5 rounded">
                          {asset.type}
                        </span>
                      </LazyImage>
                    </div>
                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600">{asset.title}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{asset.stage}</span>
                      <span>{asset.fileSize}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <i className="fa-solid fa-folder-open text-3xl text-slate-300 mb-2"></i>
                <p className="text-xs font-bold text-slate-500">该 IP 暂无关联物料或图库尚未开通</p>
                <p className="text-[10px] text-slate-400 mt-1">可前往「上传中心」批量入库并将物料绑定至该 IP</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Change Logs Timeline */}
      {activeTab === 'LOGS' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-900">IP 档案全生命周期变更日志</h3>
            <p className="text-xs text-slate-400 mt-0.5">记录该 IP 自立项创建以来的信息修订、封面更换、标签调整与图库开通历史</p>
          </div>

          <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
            {changeLogs.map((log) => {
              const getActionBadge = (action: string) => {
                switch (action) {
                  case 'CREATE':
                    return { label: '初始创建', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'fa-plus' };
                  case 'UPDATE_INFO':
                    return { label: '信息修改', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'fa-pen' };
                  case 'UPDATE_COVER':
                    return { label: '封面更新', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: 'fa-image' };
                  case 'UPDATE_TAGS':
                    return { label: '标签变更', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'fa-tags' };
                  case 'ENABLE_LIBRARY':
                    return { label: '开通图库', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: 'fa-folder-plus' };
                  default:
                    return { label: '档案操作', bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: 'fa-clock' };
                }
              };

              const badge = getActionBadge(log.action);

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600 ring-4 ring-indigo-50"></div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={log.operatorAvatar || 'https://i.pravatar.cc/150?u=user'}
                          alt={log.operatorName}
                          className="w-6 h-6 rounded-full object-cover border border-slate-200"
                        />
                        <span className="text-xs font-bold text-slate-900">{log.operatorName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg}`}>
                          <i className={`fa-solid ${badge.icon} text-[8px] mr-1`}></i>
                          {badge.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium pl-8">
                      {log.description}
                    </p>
                  </div>
                </div>
              );
            })}

            {changeLogs.length === 0 && (
              <div className="text-xs text-slate-400 py-4">暂无历史编辑记录</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IPOverview;
