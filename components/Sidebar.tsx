import React from 'react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isAdmin?: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  favoritesCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  isAdmin = true,
  isOpenMobile = false,
  onCloseMobile,
  favoritesCount = 0,
}) => {
  const menuItems = [
    { id: 'upload', label: '上传中心', icon: 'fa-cloud-arrow-up' },
    { id: 'all-assets', label: '所有资产', icon: 'fa-images' },
    { id: 'favorites', label: '我的收藏', icon: 'fa-heart', badge: favoritesCount > 0 ? favoritesCount : null, color: 'text-rose-400' },
    { id: 'ips', label: 'IP 库', icon: 'fa-folder-open' },
    { id: 'admin-view', label: '管理视图', icon: 'fa-chart-simple', adminOnly: true },
    { id: 'permissions', label: '权限管理', icon: 'fa-shield-halved' },
  ];

  const handleItemClick = (id: string) => {
    onViewChange(id);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full text-slate-300">
      {/* Brand Header */}
      <div className="p-5 sm:p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/30">
            <i className="fa-solid fa-bolt text-white text-xl"></i>
          </div>
          <div>
            <span className="text-xl font-black text-white tracking-tight">Super Picool</span>
            <span className="block text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest">
              Digital Assets Hub
            </span>
          </div>
        </div>

        {/* Mobile Close Drawer Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 mt-4 px-3 sm:px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium cursor-pointer ${
              currentView === item.id 
                ? item.id === 'favorites' 
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-bold'
                  : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold' 
                : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <div className="flex items-center space-x-3">
              <i className={`fa-solid ${item.icon} w-5 text-base ${item.color && currentView !== item.id ? item.color : ''}`}></i>
              <span className="text-sm">{item.label}</span>
            </div>
            {item.badge !== null && item.badge !== undefined && (
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                currentView === item.id 
                  ? 'bg-white/20 text-white' 
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 sm:p-6 border-t border-slate-800 mt-auto">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">系统引擎</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">在线 (99.9%)</span>
          </div>
          <p className="text-xs text-slate-400 flex justify-between">
            <span>存储使用率:</span>
            <span className="font-mono text-slate-200 font-bold">4.2 / 10 TB</span>
          </p>
          <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full w-[42%]"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 h-screen sticky top-0 flex-col z-40 shrink-0 border-r border-slate-800">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer with Backdrop */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={onCloseMobile}
          />
          {/* Drawer Body */}
          <div className="relative w-72 max-w-[85vw] bg-slate-900 h-full shadow-2xl z-10 animate-slideRight flex flex-col border-r border-slate-800">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
