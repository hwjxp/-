
import React, { useState } from 'react';
import { Asset, ValidationStatus } from '../types';
import { validateCardAsset } from '../services/geminiService';

interface CardValidationTableProps {
  assets: Asset[];
  onUpdateAsset: (updatedAsset: Asset) => void;
}

const CardValidationTable: React.FC<CardValidationTableProps> = ({ assets, onUpdateAsset }) => {
  const [validatingIds, setValidatingIds] = useState<Set<string>>(new Set());

  const handleValidate = async (asset: Asset) => {
    setValidatingIds(prev => new Set(prev).add(asset.id));
    
    // Simulate updating status to "Validating"
    const result = await validateCardAsset(asset);
    
    const updatedAsset = {
      ...asset,
      cardData: {
        ...asset.cardData!,
        validationResult: {
          status: result?.status === 'SUCCESS' ? ValidationStatus.SUCCESS : ValidationStatus.FAILED,
          errors: result?.errors || [],
          details: result?.summary
        }
      }
    };

    onUpdateAsset(updatedAsset);
    setValidatingIds(prev => {
      const next = new Set(prev);
      next.delete(asset.id);
      return next;
    });
  };

  const stats = {
    total: assets.length,
    success: assets.filter(a => a.cardData?.validationResult?.status === ValidationStatus.SUCCESS).length,
    failed: assets.filter(a => a.cardData?.validationResult?.status === ValidationStatus.FAILED).length,
    validating: validatingIds.size,
    unverified: assets.filter(a => !a.cardData?.validationResult || a.cardData?.validationResult?.status === ValidationStatus.PENDING).length
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Status Cards */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: '总数', value: stats.total, color: 'text-slate-800' },
          { label: '成功', value: stats.success, color: 'text-green-600' },
          { label: '失败', value: stats.failed, color: 'text-red-500' },
          { label: '校验中', value: stats.validating, color: 'text-blue-500' },
          { label: '未校验', value: stats.unverified, color: 'text-slate-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <p className={`text-sm font-bold mb-4 ${s.color}`}>{s.label}</p>
            <p className="text-3xl font-black text-slate-800">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-500">名称:</span>
          <input type="text" className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-pink-500/20" placeholder="请输入" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-500">编码:</span>
          <input type="text" className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-pink-500/20" placeholder="请输入" />
        </div>
        <div className="flex items-center space-x-2 flex-1">
          <span className="text-sm font-medium text-slate-500">校验结果:</span>
          <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none bg-white flex-1">
            <option>请选择</option>
            <option>成功</option>
            <option>失败</option>
          </select>
        </div>
        <div className="flex space-x-3">
          <button className="px-6 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">重置</button>
          <button className="px-6 py-1.5 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600">查询</button>
          <button className="text-pink-500 text-sm font-medium">展开 <i className="fa-solid fa-chevron-down text-[10px]"></i></button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end items-center space-x-3">
        <button className="px-4 py-2 bg-pink-500 text-white rounded-lg text-xs font-bold hover:bg-pink-600">批量校验</button>
        <button className="px-4 py-2 bg-pink-500 text-white rounded-lg text-xs font-bold hover:bg-pink-600">导入卡牌名称</button>
        <button className="px-4 py-2 bg-pink-500 text-white rounded-lg text-xs font-bold hover:bg-pink-600">新建卡牌</button>
        <button className="px-4 py-2 bg-pink-500 text-white rounded-lg text-xs font-bold hover:bg-pink-600">编辑配置</button>
        <button className="px-4 py-2 bg-pink-500 text-white rounded-lg text-xs font-bold hover:bg-pink-600">导出</button>
        <div className="flex space-x-4 ml-4 text-slate-400">
          <i className="fa-solid fa-rotate-right cursor-pointer hover:text-slate-600"></i>
          <i className="fa-solid fa-arrows-up-down cursor-pointer hover:text-slate-600"></i>
          <i className="fa-solid fa-gear cursor-pointer hover:text-slate-600"></i>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-100">
            <tr>
              <th className="px-4 py-4">名称</th>
              <th className="px-4 py-4">名称(EN)</th>
              <th className="px-4 py-4">编码</th>
              <th className="px-4 py-4">素材</th>
              <th className="px-4 py-4">印刷正面</th>
              <th className="px-4 py-4">印刷背面</th>
              <th className="px-4 py-4">效果图</th>
              <th className="px-4 py-4">工艺文件</th>
              <th className="px-4 py-4">AI校验结果</th>
              <th className="px-4 py-4">卡种名称(二级)</th>
              <th className="px-4 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {assets.map(asset => (
              <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4 font-medium">{asset.title || '-'}</td>
                <td className="px-4 py-4 text-slate-500">{asset.cardData?.nameEn || '-'}</td>
                <td className="px-4 py-4 text-slate-500">{asset.cardData?.code || '-'}</td>
                <td className="px-4 py-4">
                  <div className="w-12 h-16 bg-slate-100 rounded overflow-hidden shadow-sm border border-slate-200">
                    <img src={asset.thumbnail} className="w-full h-full object-cover" alt="thumb" />
                  </div>
                </td>
                <td className="px-4 py-4 text-center text-slate-300">-</td>
                <td className="px-4 py-4 text-center text-slate-300">-</td>
                <td className="px-4 py-4 text-center text-slate-300">-</td>
                <td className="px-4 py-4 text-center text-slate-300">-</td>
                <td className="px-4 py-4">
                  {validatingIds.has(asset.id) ? (
                    <span className="flex items-center text-blue-500 font-bold">
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i>校验中...
                    </span>
                  ) : asset.cardData?.validationResult ? (
                    <div className="flex flex-col">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold w-fit ${
                        asset.cardData.validationResult.status === ValidationStatus.SUCCESS 
                        ? 'bg-green-50 text-green-600 border border-green-100' 
                        : 'bg-red-50 text-red-500 border border-red-100'
                      }`}>
                        {asset.cardData.validationResult.status === ValidationStatus.SUCCESS ? '校验成功' : '校验失败'}
                      </span>
                      {asset.cardData.validationResult.errors && asset.cardData.validationResult.errors.length > 0 && (
                        <p className="text-[10px] text-red-400 mt-1 italic line-clamp-1" title={asset.cardData.validationResult.errors.join(', ')}>
                          {asset.cardData.validationResult.errors[0]}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold">未校验</span>
                  )}
                </td>
                <td className="px-4 py-4 font-medium text-slate-600">{asset.cardData?.cardTypeL2 || '基础普通卡'}</td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end space-x-3 text-indigo-600 font-bold">
                    <button 
                      onClick={() => handleValidate(asset)}
                      disabled={validatingIds.has(asset.id)}
                      className="hover:text-indigo-800 disabled:opacity-50"
                    >
                      提交验证
                    </button>
                    <span className="text-slate-200 text-[10px]">|</span>
                    <button className="hover:text-indigo-800">编辑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CardValidationTable;
