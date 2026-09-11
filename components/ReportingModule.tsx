
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { MOCK_ASSETS, MOCK_IP_LIST } from '../constants.tsx';
import { BusinessType } from '../types';

const ReportingModule: React.FC = () => {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Aggregate stats
  const statsByDept = [
    { name: 'Toy Dept', value: MOCK_ASSETS.filter(a => a.department === 'TOY_DEPT').length, color: '#6366f1' },
    { name: 'Card Dept', value: MOCK_ASSETS.filter(a => a.department === 'CARD_DEPT').length, color: '#ec4899' },
    { name: 'Marketing', value: 15, color: '#f59e0b' },
    { name: 'Production', value: 8, color: '#10b981' },
  ];

  const statsByProject = MOCK_IP_LIST.map(ip => ({
    name: ip.name,
    count: MOCK_ASSETS.filter(a => a.ipId === ip.id).length,
    type: ip.businessType === BusinessType.TOYS ? 'Toys' : 'Cards'
  }));

  const reportTypeLabels = {
    daily: '每日',
    weekly: '每周',
    monthly: '每月'
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">自动化生产力报表</h2>
          <p className="text-slate-500 text-sm">各部门创意产出摘要</p>
        </div>
        <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
          {(['daily', 'weekly', 'monthly'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setReportType(t)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                reportType === t ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {reportTypeLabels[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center">
            <i className="fa-solid fa-chart-simple text-indigo-500 mr-3"></i>
            项目产出
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsByProject} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }} width={120} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center">
            <i className="fa-solid fa-users-viewfinder text-pink-500 mr-3"></i>
            部门工作量
          </h3>
          <div className="h-64 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statsByDept}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statsByDept.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500 leading-relaxed italic">
              "卡牌部门本周生产文件增加了 24%。潮玩部门保持稳定，专注于 3D 建模阶段。"
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">贡献者详细日志</h3>
          <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">导出 PDF</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            <tr>
              <th className="px-6 py-4">设计师</th>
              <th className="px-6 py-4">项目</th>
              <th className="px-6 py-4">资产名称</th>
              <th className="px-6 py-4">阶段</th>
              <th className="px-6 py-4">日期</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_ASSETS.map(asset => (
              <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                      {asset.uploader.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{asset.uploader}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {MOCK_IP_LIST.find(ip => ip.id === asset.ipId)?.name}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-800">{asset.title}</td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 uppercase">
                    {asset.stage.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{asset.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportingModule;
