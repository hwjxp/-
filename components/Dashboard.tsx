
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MOCK_IP_LIST } from '../constants.tsx';
import { User, UserRole } from '../types';

const data = MOCK_IP_LIST.map(ip => ({
  name: ip.name.split(' ')[0],
  assets: ip.assetCount,
  color: ip.id === 'ip-1' ? '#6366f1' : ip.id === 'ip-2' ? '#8b5cf6' : '#ec4899'
}));

interface DashboardProps {
  currentUser: User;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser }) => {
  const isAdmin = currentUser.role === UserRole.SUPER_ADMIN;

  const adminStats = [
    { label: '总资产 (全公司)', value: '1,248', delta: '+12%', icon: 'fa-box-archive', color: 'bg-blue-500' },
    { label: '待审核 (全局)', value: '42', delta: '-5%', icon: 'fa-clock', color: 'bg-amber-500' },
    { label: '已发布资产', value: '892', delta: '+18%', icon: 'fa-circle-check', color: 'bg-green-500' },
    { label: '活跃项目', value: '12', delta: '0%', icon: 'fa-folder-tree', color: 'bg-indigo-500' },
  ];

  const userStats = [
    { label: '我参与的项目', value: '3', delta: '0%', icon: 'fa-folder-open', color: 'bg-indigo-500' },
    { label: '我的待办任务', value: '7', delta: '-2', icon: 'fa-clipboard-list', color: 'bg-amber-500' },
    { label: '风险与延期警告', value: '1', delta: '+1', icon: 'fa-triangle-exclamation', color: 'bg-red-500' },
    { label: '本周上传资产', value: '18', delta: '+5%', icon: 'fa-cloud-arrow-up', color: 'bg-green-500' },
  ];

  const stats = isAdmin ? adminStats : userStats;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white text-xl shadow-lg`}>
                <i className={`fa-solid ${stat.icon}`}></i>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.delta.startsWith('+') ? 'bg-green-50 text-green-600' : stat.delta.startsWith('-') ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                {stat.delta}
              </span>
            </div>
            <h4 className="text-slate-500 text-sm font-medium">{stat.label}</h4>
            <div className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800">{isAdmin ? '全公司资产分布' : '我的项目更新进度'}</h3>
            <select className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1 text-slate-600 outline-none">
              <option>最近 30 天</option>
              <option>最近 6 个月</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="assets" radius={[6, 6, 0, 0]} barSize={40}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-sm text-white">
          <h3 className="text-lg font-bold mb-6">{isAdmin ? '全公司近期活动' : '项目风险与动态'}</h3>
          <div className="space-y-6">
            {isAdmin ? (
              [
                { user: 'Li Creative', action: '上传了', item: '角色设计 v2', time: '12 分钟前', color: 'bg-indigo-500' },
                { user: 'Wang VFX', action: '发布了', item: 'Logo 动画定稿', time: '2 小时前', color: 'bg-green-500' },
                { user: 'Admin', action: '创建了', item: '新项目：回声', time: '5 小时前', color: 'bg-pink-500' },
                { user: 'Chen D.', action: '标记了', item: '环境草图', time: '昨天', color: 'bg-amber-500' },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 ${activity.color} flex items-center justify-center text-sm font-bold`}>
                    {activity.user.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-bold">{activity.user}</span> {activity.action} <span className="text-indigo-400 font-medium">{activity.item}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              [
                { user: '系统提醒', action: '距离', item: '赛博霓虹纪元_3D建模 交付还有2天', time: '刚刚', color: 'bg-red-500' },
                { user: 'Kenji', action: '评论了', item: '您的 3D 原型 v1', time: '1 小时前', color: 'bg-indigo-500' },
                { user: 'Sarah (PM)', action: '将状态更新为', item: '审核中', time: '3 小时前', color: 'bg-amber-500' },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 ${activity.color} flex items-center justify-center text-sm font-bold`}>
                    <i className="fa-solid fa-bell"></i>
                  </div>
                  <div>
                    <p className="text-sm text-slate-300">
                      <span className="font-bold text-white">{activity.user}</span> {activity.action} <span className="text-indigo-400 font-medium">{activity.item}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-8 py-3 bg-slate-800 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
            查看所有动态
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
