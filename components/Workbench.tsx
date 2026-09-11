import React from 'react';
import { IP, Asset, User, UploadRecord } from '../types';
import LazyImage from './LazyImage';

interface WorkbenchProps {
  currentUser: User;
  ips: IP[];
  assets: Asset[];
  records: UploadRecord[];
  onNavigate: (view: string, extra?: { ipName?: string; ipId?: string; ip?: IP }) => void;
  onCreateIP: () => void;
  onUpload: () => void;
  onSelectAsset?: (asset: Asset) => void;
}

export const Workbench: React.FC<WorkbenchProps> = ({
  currentUser,
  ips,
  assets,
  records,
  onNavigate,
  onCreateIP,
  onUpload,
  onSelectAsset,
}) => {
  // Check if current user has permission to edit IP library or manage asset library
  const canEditIP = currentUser.role === 'SUPER_ADMIN' || currentUser.canEditIP === true;
  const canManageAssetLibrary = currentUser.role === 'SUPER_ADMIN' || currentUser.canManageAssetLibrary === true;

  // Recent assets (last 6)
  const recentAssets = [...assets].slice(0, 6);

  // My IP count / accessible IPs
  const accessibleIps = ips.filter(ip => {
    if (ip.visibility === 'PUBLIC') return true;
    if (currentUser.role === 'SUPER_ADMIN') return true;
    return (ip.viewerIds || []).includes(currentUser.id) || (ip.adminIds || []).includes(currentUser.id);
  });

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-24">
      {/* Welcome Banner / Tenant Workspace Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 md:p-10 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/3 -mb-12 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold text-indigo-300">
              <i className="fa-solid fa-building-user"></i>
              <span>租户专属空间 · 快捷工作台</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              欢迎回来，{currentUser.name}
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              这里是您的多租户资产中枢，您可快速发起资产上传、管理 IP 资料库、检索数字物料及追踪最近协作。
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onUpload}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-2"
            >
              <i className="fa-solid fa-cloud-arrow-up text-base"></i>
              <span>快速上传资产</span>
            </button>
            {canEditIP && (
              <button
                onClick={onCreateIP}
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/15 backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-2"
              >
                <i className="fa-solid fa-plus text-base"></i>
                <span>新建 IP 档案</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('all-assets')}
              className="px-5 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-2"
            >
              <i className="fa-solid fa-magnifying-glass text-base"></i>
              <span>检索全部资产</span>
            </button>
          </div>
        </div>

        {/* Status Highlights in Banner */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
            <p className="text-xs text-slate-400 font-medium">可用 IP 库</p>
            <p className="text-xl font-black text-white mt-0.5">{accessibleIps.length} <span className="text-xs font-normal text-slate-400">个</span></p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
            <p className="text-xs text-slate-400 font-medium">资产总规模</p>
            <p className="text-xl font-black text-white mt-0.5">{assets.length} <span className="text-xs font-normal text-slate-400">件</span></p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
            <p className="text-xs text-slate-400 font-medium">已入库批次</p>
            <p className="text-xl font-black text-white mt-0.5">{records.length} <span className="text-xs font-normal text-slate-400">批</span></p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
            <p className="text-xs text-slate-400 font-medium">我的角色权限</p>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                {currentUser.role === 'SUPER_ADMIN' ? '超级管理' : currentUser.role === 'PM' ? '项目主管' : '设计师'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launchpad & Recommended Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Upload Portal Shortcut */}
        <div 
          onClick={onUpload}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm mb-4">
            <i className="fa-solid fa-cloud-arrow-up"></i>
          </div>
          <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
            上传中心
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            批量拖拽多格式文件入库，自动标准化命名及打标。
          </p>
          <div className="mt-4 flex items-center text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
            <span>立即进入</span>
            <i className="fa-solid fa-arrow-right ml-1.5 text-[10px]"></i>
          </div>
        </div>

        {/* All Assets Shortcut */}
        <div 
          onClick={() => onNavigate('all-assets')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm mb-4">
            <i className="fa-solid fa-images"></i>
          </div>
          <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition-colors">
            所有资产
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            查看 2D 原画、3D 建模、印刷文件与包装设计。
          </p>
          <div className="mt-4 flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
            <span>浏览资产库</span>
            <i className="fa-solid fa-arrow-right ml-1.5 text-[10px]"></i>
          </div>
        </div>

        {/* IP Library Shortcut */}
        <div 
          onClick={() => onNavigate('ips')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center text-xl group-hover:scale-110 group-hover:bg-pink-600 group-hover:text-white transition-all shadow-sm mb-4">
            <i className="fa-solid fa-cubes"></i>
          </div>
          <h3 className="font-bold text-slate-900 text-base group-hover:text-pink-600 transition-colors">
            IP 库
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            管理中英文名录、自有与三方授权、标签与关联图库。
          </p>
          <div className="mt-4 flex items-center text-xs font-bold text-pink-600 group-hover:translate-x-1 transition-transform">
            <span>进入 IP 库</span>
            <i className="fa-solid fa-arrow-right ml-1.5 text-[10px]"></i>
          </div>
        </div>

        {/* Permissions / Admin Shortcut */}
        <div 
          onClick={() => onNavigate(currentUser.role === 'SUPER_ADMIN' ? 'admin-view' : 'permissions')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm mb-4">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition-colors">
            {currentUser.role === 'SUPER_ADMIN' ? '管理视图与权限' : '权限与审批'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            IP 库编辑权与图库管理权限配置及审批。
          </p>
          <div className="mt-4 flex items-center text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
            <span>查看权限</span>
            <i className="fa-solid fa-arrow-right ml-1.5 text-[10px]"></i>
          </div>
        </div>
      </div>

      {/* Main Content Sections: Active IPs & Recent Upload Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: My Active IP Quick Jump */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
              <i className="fa-solid fa-star text-amber-400"></i>
              <span>常驻 IP 项目专区</span>
            </h2>
            <button
              onClick={() => onNavigate('ips')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
            >
              <span>查看全部 IP ({ips.length})</span>
              <i className="fa-solid fa-chevron-right text-[10px]"></i>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ips.slice(0, 4).map(ip => {
              const ipAssetCount = assets.filter(a => a.ipId === ip.id).length;
              return (
                <div
                  key={ip.id}
                  onClick={() => onNavigate('ips')}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                          <LazyImage
                            src={ip.coverImage}
                            alt={ip.name}
                            aspectRatio="aspect-square"
                            placeholderIcon="fa-folder-closed"
                          />
                        </div>
                        <div className="truncate">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{ip.name}</h4>
                          <p className="text-[10px] text-slate-400 font-medium truncate">{ip.englishName}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                        ip.ownership === 'ORIGINAL' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {ip.ownership === 'ORIGINAL' ? '自有' : '授权'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                      {ip.description || '暂无详细描述'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">
                      <i className="fa-solid fa-folder-open text-indigo-500 mr-1.5"></i>
                      已归档 {ipAssetCount} 个资产
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('all-assets', { ipName: ip.name, ipId: ip.id });
                      }}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-colors"
                    >
                      直达图库
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Recent Upload Records */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
              <i className="fa-solid fa-clock-rotate-left text-indigo-500"></i>
              <span>最近入库批次</span>
            </h2>
            <button
              onClick={() => onNavigate('upload')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              上传中心
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            {records.slice(0, 4).map(rec => (
              <div
                key={rec.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold text-indigo-600">{rec.batchNo}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{rec.timestamp.split(' ')[1] || rec.timestamp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold text-slate-800 truncate">{rec.ipName}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{rec.directoryName}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    +{rec.fileCount} 文件
                  </span>
                </div>
              </div>
            ))}

            <button
              onClick={() => onNavigate('upload')}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors flex items-center justify-center space-x-1.5"
            >
              <i className="fa-solid fa-plus text-[10px]"></i>
              <span>发起新批次上传</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Assets Strip */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <i className="fa-solid fa-fire text-rose-500"></i>
            <span>最新入库数字物料</span>
          </h2>
          <button
            onClick={() => onNavigate('all-assets')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
          >
            <span>全部资产 ({assets.length})</span>
            <i className="fa-solid fa-arrow-right text-[10px]"></i>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {recentAssets.map(asset => {
            const ip = ips.find(i => i.id === asset.ipId);
            return (
              <div
                key={asset.id}
                onClick={() => {
                  if (onSelectAsset) {
                    onSelectAsset(asset);
                  } else {
                    onNavigate('all-assets');
                  }
                }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
              >
                <div className="h-28 bg-slate-100 overflow-hidden relative">
                  <LazyImage
                    src={asset.thumbnail}
                    alt={asset.title}
                    category={asset.category || asset.type}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  >
                    <span className="absolute top-2 left-2 z-10 text-[9px] font-black bg-slate-900/80 backdrop-blur-md text-white px-1.5 py-0.5 rounded">
                      {asset.type}
                    </span>
                  </LazyImage>
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {asset.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {ip ? ip.name : '通用资产'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Workbench;
