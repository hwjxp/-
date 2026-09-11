import React, { useState } from 'react';
import { IP, AssetLibrary, User, UserRole } from '../types';

interface PermissionConfigModalProps {
  type: 'IP' | 'LIBRARY';
  targetItem: IP | AssetLibrary;
  parentIP?: IP | null;
  allUsers: User[];
  onSave: (permissions: {
    adminIds: string[];
    viewerIds: string[];
    uploaderIds: string[];
    downloaderIds: string[];
  }) => void;
  onClose: () => void;
}

type PermissionRole = 'MANAGE' | 'VIEW' | 'UPLOAD' | 'DOWNLOAD';

const PERMISSION_ROLES: {
  key: PermissionRole;
  label: string;
  desc: string;
  icon: string;
  color: string;
  badgeBg: string;
}[] = [
  {
    key: 'MANAGE',
    label: '管理权限 (Manage)',
    desc: '拥有图库编辑、增删子库、批量整理及成员权限配置权限',
    icon: 'fa-shield-halved',
    color: 'text-rose-600',
    badgeBg: 'bg-rose-50 border-rose-200 text-rose-700'
  },
  {
    key: 'VIEW',
    label: '查看权限 (Read)',
    desc: '可进入空间并浏览全部资产高清缩略图、元数据与版本历史',
    icon: 'fa-eye',
    color: 'text-indigo-600',
    badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-700'
  },
  {
    key: 'UPLOAD',
    label: '上传权限 (Upload)',
    desc: '可向该空间上传新的设计物料及更新已有资产版本',
    icon: 'fa-cloud-arrow-up',
    color: 'text-emerald-600',
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700'
  },
  {
    key: 'DOWNLOAD',
    label: '下载权限 (Download)',
    desc: '可下载原始高精工程文件包（PSD/OBJ/FBX/CAD/RAW等）',
    icon: 'fa-cloud-arrow-down',
    color: 'text-amber-600',
    badgeBg: 'bg-amber-50 border-amber-200 text-amber-700'
  }
];

export const PermissionConfigModal: React.FC<PermissionConfigModalProps> = ({
  type,
  targetItem,
  parentIP,
  allUsers,
  onSave,
  onClose
}) => {
  // Current active tab for permission role
  const [activeRole, setActiveRole] = useState<PermissionRole>('MANAGE');
  const [searchUser, setSearchUser] = useState('');

  // Initial state from targetItem
  const [adminIds, setAdminIds] = useState<string[]>(
    targetItem.adminIds || (type === 'IP' ? ['u1'] : [])
  );
  const [viewerIds, setViewerIds] = useState<string[]>(
    targetItem.viewerIds || (type === 'IP' ? ['u1', 'u2', 'u3', 'u4'] : [])
  );
  const [uploaderIds, setUploaderIds] = useState<string[]>(
    targetItem.uploaderIds || (type === 'IP' ? ['u1', 'u2', 'u4'] : [])
  );
  const [downloaderIds, setDownloaderIds] = useState<string[]>(
    targetItem.downloaderIds || (type === 'IP' ? ['u1', 'u2'] : [])
  );

  // Parent inherited IDs when target is a Library
  const getInheritedIds = (role: PermissionRole): string[] => {
    if (type !== 'LIBRARY' || !parentIP) return [];
    if (role === 'MANAGE') return parentIP.adminIds || [];
    if (role === 'VIEW') return parentIP.viewerIds || [];
    if (role === 'UPLOAD') return parentIP.uploaderIds || ['u1', 'u2'];
    if (role === 'DOWNLOAD') return parentIP.downloaderIds || [];
    return [];
  };

  const getCurrentIds = (role: PermissionRole): string[] => {
    if (role === 'MANAGE') return adminIds;
    if (role === 'VIEW') return viewerIds;
    if (role === 'UPLOAD') return uploaderIds;
    if (role === 'DOWNLOAD') return downloaderIds;
    return [];
  };

  const setCurrentIds = (role: PermissionRole, newIds: string[]) => {
    if (role === 'MANAGE') setAdminIds(newIds);
    if (role === 'VIEW') setViewerIds(newIds);
    if (role === 'UPLOAD') setUploaderIds(newIds);
    if (role === 'DOWNLOAD') setDownloaderIds(newIds);
  };

  const toggleUser = (userId: string, role: PermissionRole) => {
    const inherited = getInheritedIds(role);
    // Inherited from IP cannot be toggled off at library level
    if (type === 'LIBRARY' && inherited.includes(userId)) {
      return;
    }

    const current = getCurrentIds(role);
    if (current.includes(userId)) {
      setCurrentIds(role, current.filter(id => id !== userId));
    } else {
      setCurrentIds(role, [...current, userId]);
    }
  };

  const handleSave = () => {
    onSave({
      adminIds,
      viewerIds,
      uploaderIds,
      downloaderIds
    });
    onClose();
  };

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.department.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.role.toLowerCase().includes(searchUser.toLowerCase())
  );

  const inheritedFromParent = getInheritedIds(activeRole);
  const currentAssigned = getCurrentIds(activeRole);

  const itemName = targetItem.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-7 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-indigo-400 border border-white/10">
              <i className="fa-solid fa-sliders text-lg"></i>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-600 text-white">
                  {type === 'IP' ? 'IP 级权限配置' : '图库专属权限配置'}
                </span>
                <span className="text-xs text-slate-300 font-bold truncate max-w-[300px]">
                  {itemName}
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                {type === 'IP' ? `配置「${itemName}」空间与下属图库权限` : `配置「${itemName}」主题图库权限`}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Rule Banner Explanation */}
        <div className="px-7 py-3.5 bg-indigo-50/80 border-b border-indigo-100/80 text-xs text-indigo-900 flex items-start space-x-2.5 shrink-0">
          <i className="fa-solid fa-circle-info text-indigo-600 mt-0.5 shrink-0"></i>
          <div>
            {type === 'IP' ? (
              <p className="leading-relaxed">
                <strong>级联继承规则：</strong> 在此设置的成员权限将<strong>自动向下级联生效至该 IP 下属的所有主题图库本</strong>（管理、查看、上传与下载）。在单个子图库中也可以为其追加额外专有成员。
              </p>
            ) : (
              <p className="leading-relaxed">
                <strong>独立图库规则：</strong> 来自所属 IP「{parentIP?.name || '上级 IP'}」的成员权限已<strong>默认级联继承生效</strong>。在此配置的额外成员仅对本图库有效，不会反向赋予 IP 级权限。
              </p>
            )}
          </div>
        </div>

        {/* Modal Body: Two Columns (Left Role Tabs, Right User Selector) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: 4 Roles Selector */}
          <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 space-y-2 shrink-0 overflow-y-auto">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">
              配置权限类型
            </p>
            {PERMISSION_ROLES.map(role => {
              const isSelected = activeRole === role.key;
              const count = (getCurrentIds(role.key).length) + (type === 'LIBRARY' ? getInheritedIds(role.key).filter(id => !getCurrentIds(role.key).includes(id)).length : 0);

              return (
                <button
                  key={role.key}
                  onClick={() => setActiveRole(role.key)}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex flex-col space-y-1 cursor-pointer border ${
                    isSelected
                      ? 'bg-white border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                      : 'bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <i className={`fa-solid ${role.icon} text-xs ${role.color}`}></i>
                      <span className="text-xs font-bold text-slate-900">{role.label.split(' ')[0]}</span>
                    </div>
                    <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                    {role.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right: Members List */}
          <div className="flex-1 p-6 flex flex-col overflow-hidden bg-white">
            {/* Search and header info */}
            <div className="flex items-center justify-between mb-4 shrink-0 gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <i className={`fa-solid ${PERMISSION_ROLES.find(r => r.key === activeRole)?.icon} ${PERMISSION_ROLES.find(r => r.key === activeRole)?.color}`}></i>
                  <span>{PERMISSION_ROLES.find(r => r.key === activeRole)?.label}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {PERMISSION_ROLES.find(r => r.key === activeRole)?.desc}
                </p>
              </div>

              <div className="relative w-48 shrink-0">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  placeholder="搜索团队成员..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Members grid list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
              {filteredUsers.map(user => {
                const isInherited = type === 'LIBRARY' && inheritedFromParent.includes(user.id);
                const isDirectlyAssigned = currentAssigned.includes(user.id);
                const hasPermission = isInherited || isDirectlyAssigned;

                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUser(user.id, activeRole)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                      isInherited
                        ? 'bg-indigo-50/40 border-indigo-200 cursor-not-allowed opacity-90'
                        : hasPermission
                          ? 'bg-indigo-50/70 border-indigo-500 shadow-xs cursor-pointer'
                          : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-9 h-9 rounded-xl object-cover ring-2 ring-white shadow-xs"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900">{user.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                            {user.department}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          系统角色: {user.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isInherited ? (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-xl flex items-center space-x-1" title="由父级 IP 权限级联继承，无法在图库层级移除">
                          <i className="fa-solid fa-arrows-turn-to-dots text-[10px]"></i>
                          <span>IP 级联继承</span>
                        </span>
                      ) : hasPermission ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-xl flex items-center space-x-1">
                          <i className="fa-solid fa-check text-[10px]"></i>
                          <span>已授权</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                          <i className="fa-solid fa-plus text-[10px] mr-1"></i>
                          <span>添加授权</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-7 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            已为 <strong className="text-slate-800">{itemName}</strong> 分配权限规则
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer"
            >
              保存权限配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionConfigModal;
