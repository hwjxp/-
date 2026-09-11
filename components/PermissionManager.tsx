import React, { useState } from 'react';
import { User, UserRole, PermissionRequest } from '../types';

interface PermissionManagerProps {
  users: User[];
  currentUser: User;
  onUpdateUserPermissions: (userId: string, updates: { canEditIP?: boolean; canManageAssetLibrary?: boolean; role?: UserRole }) => void;
  requests: PermissionRequest[];
  onApproveRequest?: (requestId: string) => void;
  onRejectRequest?: (requestId: string) => void;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  users,
  currentUser,
  onUpdateUserPermissions,
  requests,
  onApproveRequest,
  onRejectRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'PERMISSIONS' | 'REQUESTS'>('PERMISSIONS');
  const [searchMember, setSearchMember] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('ALL');

  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchMember.toLowerCase()) ||
                          user.department.toLowerCase().includes(searchMember.toLowerCase());
    const matchesDept = filterDepartment === 'ALL' || user.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  const pendingRequests = requests.filter(r => r.status === 'PENDING');

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-24">
      {/* Header info */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
              系统权限控制台
            </span>
            <h1 className="text-2xl font-black text-slate-900">权限与访问控制</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xl leading-relaxed">
            简化权限管理模式：直接配置人员的<span className="font-bold text-slate-800">「IP 库编辑权」</span>（允许创建、修改 IP 资料与档案）与<span className="font-bold text-slate-800">「图库管理权」</span>（允许管理资产分类、图库绑定与批量维护）。
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('PERMISSIONS')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'PERMISSIONS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            成员功能权限设置
          </button>
          <button
            onClick={() => setActiveTab('REQUESTS')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
              activeTab === 'REQUESTS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>待审批申请</span>
            {pendingRequests.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'PERMISSIONS' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden space-y-6 p-6 md:p-8">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                placeholder="搜索成员姓名、部门..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-400">部门筛选:</span>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="ALL">全部部门</option>
                <option value="MANAGEMENT">MANAGEMENT (管理层)</option>
                <option value="TOY_DEPT">TOY_DEPT (潮玩部)</option>
                <option value="CARD_DEPT">CARD_DEPT (卡牌部)</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold border-y border-slate-200">
                <tr>
                  <th className="px-6 py-4">成员信息</th>
                  <th className="px-6 py-4">所属部门与角色</th>
                  <th className="px-6 py-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-indigo-600 font-black">IP 库编辑权</span>
                      <span className="text-[9px] text-slate-400 font-normal">新建/修改/编辑 IP 档案</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-emerald-600 font-black">图库管理权</span>
                      <span className="text-[9px] text-slate-400 font-normal">管理图库/批量资产维护</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right">管理操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredUsers.map(user => {
                  const isUserSuperAdmin = user.role === UserRole.SUPER_ADMIN;
                  const hasIPEdit = isUserSuperAdmin || !!user.canEditIP;
                  const hasLibraryManage = isUserSuperAdmin || !!user.canManageAssetLibrary;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* User identity */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img src={user.avatar} className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-100" alt="" />
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-black text-slate-900">{user.name}</span>
                              {user.id === currentUser.id && (
                                <span className="text-[9px] bg-indigo-50 text-indigo-600 font-black px-1.5 py-0.2 rounded">
                                  我
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {user.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800">{user.department.replace('_', ' ')}</span>
                        <div className="mt-1">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            user.role === UserRole.SUPER_ADMIN
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : user.role === UserRole.PM
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </td>

                      {/* Permission 1: IP Edit Permission */}
                      <td className="px-6 py-4 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasIPEdit}
                            disabled={!isSuperAdmin || isUserSuperAdmin}
                            onChange={(e) => {
                              onUpdateUserPermissions(user.id, {
                                canEditIP: e.target.checked
                              });
                            }}
                            className="sr-only peer"
                          />
                          <div className={`relative w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                            hasIPEdit ? 'peer-checked:bg-indigo-600' : ''
                          } ${(!isSuperAdmin || isUserSuperAdmin) ? 'opacity-60 cursor-not-allowed' : ''}`}></div>
                        </label>
                        {isUserSuperAdmin && (
                          <span className="block text-[9px] text-slate-400 mt-1 font-bold">超级管理员默认具备</span>
                        )}
                      </td>

                      {/* Permission 2: Asset Library Manage Permission */}
                      <td className="px-6 py-4 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasLibraryManage}
                            disabled={!isSuperAdmin || isUserSuperAdmin}
                            onChange={(e) => {
                              onUpdateUserPermissions(user.id, {
                                canManageAssetLibrary: e.target.checked
                              });
                            }}
                            className="sr-only peer"
                          />
                          <div className={`relative w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                            hasLibraryManage ? 'peer-checked:bg-emerald-600' : ''
                          } ${(!isSuperAdmin || isUserSuperAdmin) ? 'opacity-60 cursor-not-allowed' : ''}`}></div>
                        </label>
                        {isUserSuperAdmin && (
                          <span className="block text-[9px] text-slate-400 mt-1 font-bold">超级管理员默认具备</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        {isSuperAdmin && !isUserSuperAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              const newEdit = !user.canEditIP;
                              const newLib = !user.canManageAssetLibrary;
                              onUpdateUserPermissions(user.id, {
                                canEditIP: newEdit,
                                canManageAssetLibrary: newLib,
                              });
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            快速切换双权
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">锁定管理</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'REQUESTS' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-base">权限申请与审批列表</h3>
              <p className="text-xs text-slate-400 mt-0.5">审核团队成员发起的权限变更诉求</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold border-y border-slate-200">
                <tr>
                  <th className="px-6 py-4">申请人</th>
                  <th className="px-6 py-4">申请诉求 / IP 目标</th>
                  <th className="px-6 py-4">申请权限类型</th>
                  <th className="px-6 py-4">提交时间</th>
                  <th className="px-6 py-4 text-right">审批操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img src={req.userAvatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                        <span className="font-bold text-slate-800">{req.userName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{req.ipName}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        req.requestedRole === 'DOWNLOADER' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {req.requestedRole === 'DOWNLOADER' ? '图库/物料下载权限' : 'IP 档案编辑权限'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">{req.timestamp}</td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onApproveRequest && onApproveRequest(req.id)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                          >
                            同意赋权
                          </button>
                          <button
                            onClick={() => onRejectRequest && onRejectRequest(req.id)}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors"
                          >
                            驳回
                          </button>
                        </div>
                      ) : (
                        <span className={`text-xs font-bold ${req.status === 'APPROVED' ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {req.status === 'APPROVED' ? '已同意' : '已驳回'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-400">
                      <i className="fa-solid fa-inbox text-3xl mb-2 text-slate-300 block"></i>
                      暂无待处理的权限申请
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionManager;
