
import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import AdminView from './components/AdminView';
import AssetCard from './components/AssetCard';
import IPGallery from './components/IPGallery';
import IPOverview from './components/IPOverview';
import IPDetail from './components/IPDetail';
import UploadCenter from './components/UploadCenter';
import PermissionManager from './components/PermissionManager';
import AllAssetsExplorer from './components/AllAssetsExplorer';
import AssetDetailModal from './components/AssetDetailModal';
import FavoritesView from './components/FavoritesView';
import { Asset, IP, BusinessType, ProjectStage, UserRole, PermissionRequest, User, AssetLibrary } from './types';
import { MOCK_ASSETS, MOCK_IP_LIST, CURRENT_USER, MOCK_USERS, MOCK_PERMISSION_REQUESTS, MOCK_UPLOAD_RECORDS, MOCK_LIBRARIES } from './constants';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [ipList, setIpList] = useState<IP[]>(MOCK_IP_LIST);
  const [libraries, setLibraries] = useState<AssetLibrary[]>(MOCK_LIBRARIES);
  const [permissionRequests, setPermissionRequests] = useState<PermissionRequest[]>(MOCK_PERMISSION_REQUESTS);
  const [uploadRecords, setUploadRecords] = useState(MOCK_UPLOAD_RECORDS);
  
  const [currentView, setCurrentView] = useState('upload');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedIP, setSelectedIP] = useState<IP | null>(null);
  const [ipViewMode, setIpViewMode] = useState<'GALLERY' | 'TABLE'>('GALLERY');
  const [localAssets, setLocalAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [favoriteAssetIds, setFavoriteAssetIds] = useState<Set<string>>(() => new Set(['ast-001', 'ast-004']));
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Folder navigation presets for "all-assets" view
  const [targetAssetIpId, setTargetAssetIpId] = useState<string | null>(null);
  const [targetAssetLibraryId, setTargetAssetLibraryId] = useState<string | null>(null);
  const [targetAssetCategory, setTargetAssetCategory] = useState<string | null>(null);

  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;

  const handleUpdateUserPermissions = (userId: string, updates: { canEditIP?: boolean; canManageAssetLibrary?: boolean; role?: UserRole }) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, ...updates };
        if (currentUser.id === userId) {
          setCurrentUser(updated);
        }
        return updated;
      }
      return u;
    }));
  };

  const canDownload = (ip: IP | null) => {
    if (!ip) return false;
    return currentUser.role === UserRole.SUPER_ADMIN || (ip.downloaderIds || []).includes(currentUser.id);
  };

  const toggleAssetSelection = (assetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAssetIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const handleToggleFavorite = (assetId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteAssetIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const filteredAssets = useMemo(() => {
    return localAssets.filter(asset => 
      asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, localAssets]);

  const handleUpdateAsset = (updatedAsset: Asset) => {
    setLocalAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    setSelectedAsset(updatedAsset);
  };

  const handleBatchUpdateAssets = (updatedAssets: Asset[]) => {
    const updatedMap = new Map(updatedAssets.map(a => [a.id, a]));
    setLocalAssets(prev => prev.map(a => updatedMap.get(a.id) || a));
    if (selectedAsset && updatedMap.has(selectedAsset.id)) {
      setSelectedAsset(updatedMap.get(selectedAsset.id)!);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'upload':
        return (
          <UploadCenter 
            ips={ipList} 
            existingAssets={localAssets}
            onUpload={(newAssets, newRecord) => {
              setLocalAssets(prev => [...newAssets, ...prev]);
              setUploadRecords(prev => [newRecord, ...prev]);
            }}
            onGoToLibrary={(ipName) => {
              const matched = ipList.find(i => i.name === ipName);
              if (matched) {
                setTargetAssetIpId(matched.id);
                setTargetAssetLibraryId(null);
                setTargetAssetCategory(null);
              }
              setCurrentView('all-assets');
            }}
            onCancel={() => setCurrentView('all-assets')}
          />
        );
      case 'all-assets':
        return (
          <AllAssetsExplorer
            ips={ipList}
            libraries={libraries}
            assets={localAssets}
            currentUser={currentUser}
            selectedAssetIds={selectedAssetIds}
            favoriteAssetIds={favoriteAssetIds}
            onToggleSelectAsset={toggleAssetSelection}
            onToggleFavorite={handleToggleFavorite}
            onClearSelection={() => setSelectedAssetIds(new Set())}
            onSelectAll={(ids) => setSelectedAssetIds(new Set(ids))}
            onBatchUpdateAssets={handleBatchUpdateAssets}
            initialIpId={targetAssetIpId}
            initialLibraryId={targetAssetLibraryId}
            initialCategory={targetAssetCategory}
            onUploadToCategory={(ipId, libId, cat) => {
              setCurrentView('upload');
            }}
            onUpdateAsset={handleUpdateAsset}
            onUpdateIP={(updatedIP) => setIpList(prev => prev.map(i => i.id === updatedIP.id ? updatedIP : i))}
            onUpdateLibrary={(updatedLib) => setLibraries(prev => prev.map(l => l.id === updatedLib.id ? updatedLib : l))}
          />
        );
      case 'ips':
        return (
          <IPGallery 
            ips={ipList} 
            currentUser={currentUser} 
            allAssets={localAssets}
            onSelect={(ip) => { setSelectedIP(ip); setCurrentView('ip-overview'); }} 
            onCreate={() => { setSelectedIP(null); setCurrentView('ip-detail'); }}
            onGoToLibrary={(ip) => {
              setTargetAssetIpId(ip.id);
              setTargetAssetLibraryId(null);
              setTargetAssetCategory(null);
              setCurrentView('all-assets');
            }}
            onCreateLibrary={(ipId) => {
              setIpList(prev => prev.map(ip => ip.id === ipId ? { ...ip, hasAssetLibrary: true } : ip));
              alert('图库创建成功！已关联资产空间。');
            }}
          />
        );
      case 'ip-overview':
        if (!selectedIP) return null;
        return (
          <IPOverview 
            ip={selectedIP}
            currentUser={currentUser}
            assets={localAssets}
            onBack={() => setCurrentView('ips')}
            onEdit={() => setCurrentView('ip-detail')}
            onSelectAsset={(asset) => setSelectedAsset(asset)}
            onGoToLibrary={() => {
              setTargetAssetIpId(selectedIP.id);
              setTargetAssetLibraryId(null);
              setTargetAssetCategory(null);
              setCurrentView('all-assets');
            }}
            onCreateLibrary={() => {
              setIpList(prev => prev.map(ip => ip.id === selectedIP.id ? { ...ip, hasAssetLibrary: true } : ip));
              setSelectedIP(prev => prev ? { ...prev, hasAssetLibrary: true } : null);
              alert('图库创建成功！已关联资产空间。');
            }}
          />
        );
      case 'ip-detail':
        return (
          <IPDetail 
            ip={selectedIP}
            allIps={ipList}
            allAssets={localAssets}
            onSave={(updatedIp) => {
              if (selectedIP) {
                setIpList(prev => prev.map(ip => ip.id === updatedIp.id ? updatedIp : ip));
                setSelectedIP(updatedIp);
                setCurrentView('ip-overview');
              } else {
                setIpList(prev => [updatedIp, ...prev]);
                setSelectedIP(updatedIp);
                setCurrentView('ip-overview');
              }
            }}
            onCancel={() => {
              if (selectedIP) {
                setCurrentView('ip-overview');
              } else {
                setCurrentView('ips');
              }
            }}
          />
        );
      case 'admin-view':
        return (
          <AdminView 
            currentUser={currentUser}
            ips={ipList}
            assets={localAssets}
            records={uploadRecords}
            users={users}
            onNavigateToIPs={() => setCurrentView('ips')}
            onNavigateToAssets={() => setCurrentView('all-assets')}
          />
        );
      case 'permissions':
        return (
          <PermissionManager 
            users={users}
            currentUser={currentUser}
            onUpdateUserPermissions={handleUpdateUserPermissions}
            requests={permissionRequests}
            onApproveRequest={(reqId) => {
              setPermissionRequests(prev => prev.map(req => req.id === reqId ? { ...req, status: 'APPROVED' } : req));
              alert('已批准权限申请，并已为该成员开启对应权限。');
            }}
            onRejectRequest={(reqId) => {
              setPermissionRequests(prev => prev.map(req => req.id === reqId ? { ...req, status: 'REJECTED' } : req));
            }}
          />
        );
      case 'favorites':
        return (
          <FavoritesView
            assets={localAssets}
            ips={ipList}
            libraries={libraries}
            favoriteAssetIds={favoriteAssetIds}
            onToggleFavorite={handleToggleFavorite}
            onSelectAsset={(asset) => setSelectedAsset(asset)}
            onNavigateToAssets={() => setCurrentView('all-assets')}
          />
        );
      default:
        return <div className="text-center py-20 text-slate-400 font-black tracking-widest opacity-30 text-2xl">功能开发中</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        currentView={currentView} 
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onViewChange={(view) => { 
          if (view === 'all-assets') {
            setTargetAssetIpId(null);
            setTargetAssetLibraryId(null);
            setTargetAssetCategory(null);
          }
          setCurrentView(view); 
          setSearchQuery(''); 
        }} 
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 sm:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 lg:px-10 flex items-center justify-between sticky top-0 z-30">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden mr-2.5 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-sm sm:text-base cursor-pointer shrink-0 transition-colors"
            title="打开导航菜单"
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          {/* Global Search Bar with quick shortcut indicator and clear role differentiation */}
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors text-xs sm:text-sm"></i>
              <input 
                type="text"
                placeholder="全局快速搜索 (IP 名称、标题、ID、标签 #)..."
                className="w-full bg-slate-100/70 border border-slate-200/80 focus:border-indigo-500 focus:bg-white rounded-xl sm:rounded-2xl pl-9 sm:pl-11 pr-14 sm:pr-20 py-2 sm:py-2.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal transition-all outline-none shadow-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                {searchQuery ? (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] cursor-pointer"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded border border-slate-300/50 hidden sm:inline">
                    全局
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-8 ml-3 sm:ml-8">
            <div className="flex items-center space-x-2">
              <button className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-indigo-600 hover:text-white transition-all shadow-xs">
                <i className="fa-solid fa-bell text-sm sm:text-base"></i>
              </button>
            </div>
            <div className="h-6 sm:h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div className="relative">
              <div 
                className="flex items-center space-x-2 sm:space-x-4 cursor-pointer group"
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-900 leading-tight">{currentUser.name}</p>
                  <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-0.5">{currentUser.department.replace('_', ' ')}</p>
                </div>
                <img src={currentUser.avatar} alt="User" className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl object-cover ring-2 sm:ring-4 ring-transparent group-hover:ring-indigo-500/10 transition-all shadow-sm" />
              </div>
              
              {showRoleSwitcher && (
                <div className="absolute right-0 top-14 sm:top-16 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fadeIn">
                  <div className="p-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">切换测试角色</p>
                  </div>
                  {MOCK_USERS.map(user => (
                    <button 
                      key={user.id}
                      onClick={() => { setCurrentUser(user); setShowRoleSwitcher(false); }}
                      className={`w-full flex items-center space-x-3 p-3 transition-colors cursor-pointer ${currentUser.id === user.id ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                    >
                      <img src={user.avatar} className="w-8 h-8 rounded-full" alt="" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-800">{user.name}</p>
                        <p className="text-[10px] text-slate-500">{user.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-6 lg:p-10 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar relative">
          {renderContent()}

          {/* Floating Action Bar */}
          {selectedAssetIds.size > 0 && (
            <div className="fixed bottom-20 lg:bottom-10 left-1/2 -translate-x-1/2 lg:ml-32 z-40 animate-fadeIn w-[92vw] sm:w-auto max-w-lg">
              <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-full shadow-2xl flex flex-wrap sm:flex-nowrap items-center justify-between sm:space-x-6 border border-slate-700 gap-2">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center bg-indigo-500 w-6 h-6 rounded-full text-xs font-bold">
                    {selectedAssetIds.size}
                  </span>
                  <span className="text-xs sm:text-sm font-medium">已选择资产</span>
                </div>
                <div className="w-px h-6 bg-slate-700 hidden sm:block"></div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {Array.from(selectedAssetIds).every(id => {
                    const asset = localAssets.find(a => a.id === id);
                    return asset && canDownload(ipList.find(ip => ip.id === asset.ipId) || null);
                  }) ? (
                    <button 
                      onClick={() => {
                        alert(`开始打包下载 ${selectedAssetIds.size} 个资产...`);
                        setSelectedAssetIds(new Set());
                      }}
                      className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs sm:text-sm font-bold px-3.5 sm:px-5 py-2 rounded-full transition-colors flex items-center cursor-pointer"
                    >
                      <i className="fa-solid fa-download mr-1.5 sm:mr-2"></i>
                      批量下载
                    </button>
                  ) : (
                    <button 
                      onClick={() => alert('已提交批量下载权限申请')}
                      className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs sm:text-sm font-bold px-3.5 sm:px-5 py-2 rounded-full transition-colors flex items-center cursor-pointer"
                    >
                      <i className="fa-solid fa-lock mr-1.5 sm:mr-2"></i>
                      申请下载
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedAssetIds(new Set())}
                    className="text-slate-400 hover:text-white p-2 transition-colors rounded-full cursor-pointer"
                  >
                    <i className="fa-solid fa-xmark text-xs sm:text-sm"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 py-1 px-3 flex items-center justify-around shadow-lg">
          <button
            onClick={() => { setCurrentView('all-assets'); setSearchQuery(''); }}
            className={`flex flex-col items-center py-1.5 px-3 rounded-xl cursor-pointer transition-colors ${
              currentView === 'all-assets' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <i className="fa-solid fa-images text-base"></i>
            <span className="text-[10px] mt-0.5">所有资产</span>
          </button>

          <button
            onClick={() => { setCurrentView('ips'); setSearchQuery(''); }}
            className={`flex flex-col items-center py-1.5 px-3 rounded-xl cursor-pointer transition-colors ${
              currentView === 'ips' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <i className="fa-solid fa-folder-open text-base"></i>
            <span className="text-[10px] mt-0.5">IP 库</span>
          </button>

          <button
            onClick={() => { setCurrentView('favorites'); setSearchQuery(''); }}
            className={`flex flex-col items-center py-1.5 px-3 rounded-xl cursor-pointer transition-colors ${
              currentView === 'favorites' ? 'text-rose-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <i className="fa-solid fa-heart text-base"></i>
            <span className="text-[10px] mt-0.5">收藏</span>
          </button>

          <button
            onClick={() => { setCurrentView('upload'); setSearchQuery(''); }}
            className={`flex flex-col items-center py-1.5 px-3 rounded-xl cursor-pointer transition-colors ${
              currentView === 'upload' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center -mt-3 shadow-md shadow-indigo-600/30">
              <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
            </div>
            <span className="text-[10px] mt-0.5">上传中心</span>
          </button>

          <button
            onClick={() => { setCurrentView('admin-view'); setSearchQuery(''); }}
            className={`flex flex-col items-center py-1.5 px-3 rounded-xl cursor-pointer transition-colors ${
              currentView === 'admin-view' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <i className="fa-solid fa-chart-simple text-base"></i>
            <span className="text-[10px] mt-0.5">管理</span>
          </button>

          <button
            onClick={() => { setCurrentView('permissions'); setSearchQuery(''); }}
            className={`flex flex-col items-center py-1.5 px-3 rounded-xl cursor-pointer transition-colors ${
              currentView === 'permissions' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <i className="fa-solid fa-shield-halved text-base"></i>
            <span className="text-[10px] mt-0.5">权限</span>
          </button>
        </nav>
      </main>

      {/* Asset Preview / Detail Modal */}
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          allAssets={localAssets}
          allIPs={ipList}
          allLibraries={libraries}
          currentUser={currentUser}
          isFavorited={favoriteAssetIds.has(selectedAsset.id)}
          onToggleFavorite={handleToggleFavorite}
          onClose={() => setSelectedAsset(null)}
          onSelectAsset={(asset) => setSelectedAsset(asset)}
          onUpdateAsset={handleUpdateAsset}
        />
      )}
    </div>
  );
};

export default App;
