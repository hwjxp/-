import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  LineChart,
  Line,
  ComposedChart
} from 'recharts';
import { IP, Asset, User, UploadRecord, ProjectStage } from '../types';

interface AdminViewProps {
  currentUser: User;
  ips: IP[];
  assets: Asset[];
  records: UploadRecord[];
  users: User[];
  onNavigateToIPs: () => void;
  onNavigateToAssets: () => void;
}

// Tenant / Department Definitions
export interface TenantInfo {
  id: string;
  name: string;
  code: string;
  category: 'INTERNAL' | 'EXTERNAL' | 'PARTNER';
  leader: string;
  memberCount: number;
  color: string;
  bgLight: string;
  borderLight: string;
  storageQuotaGB: number;
  description: string;
}

export const SYSTEM_TENANTS: TenantInfo[] = [
  {
    id: 'dept-toy',
    name: '玩具与潮玩研发事业部',
    code: 'TOY_DEPT',
    category: 'INTERNAL',
    leader: 'Sarah (PM)',
    memberCount: 14,
    color: '#6366f1',
    bgLight: 'bg-indigo-50',
    borderLight: 'border-indigo-200',
    storageQuotaGB: 500,
    description: '负责 2D 三视图上色、3D 打印模型切片、模具结构及实拍样板归档'
  },
  {
    id: 'dept-card',
    name: '卡牌与衍生品事业部',
    code: 'CARD_DEPT',
    category: 'INTERNAL',
    leader: 'Kenji (Designer)',
    memberCount: 9,
    color: '#ec4899',
    bgLight: 'bg-pink-50',
    borderLight: 'border-pink-200',
    storageQuotaGB: 350,
    description: '负责卡面设计、全息烫金/UV 工艺分层、印前刀模与牌套标准'
  },
  {
    id: 'dept-mkt',
    name: '品牌与营销视觉中心',
    code: 'MARKETING_DEPT',
    category: 'INTERNAL',
    leader: 'Alex (Super Admin)',
    memberCount: 8,
    color: '#06b6d4',
    bgLight: 'bg-cyan-50',
    borderLight: 'border-cyan-200',
    storageQuotaGB: 400,
    description: '负责全球宣发主视觉、电商物料、发布会视频与包装展示结构'
  },
  {
    id: 'dept-licensing',
    name: '全球正版授权业务部',
    code: 'GLOBAL_LICENSING',
    category: 'PARTNER',
    leader: 'Warner & Pokemon Liaison',
    memberCount: 6,
    color: '#10b981',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    storageQuotaGB: 600,
    description: '负责华纳哈利波特、宝可梦、三丽鸥等官方正版图库鉴权与合规'
  },
  {
    id: 'dept-ext-studio',
    name: '星火签约合作工作室',
    code: 'EXT_STUDIO',
    category: 'EXTERNAL',
    leader: 'Li Creative Partner',
    memberCount: 12,
    color: '#f59e0b',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    storageQuotaGB: 200,
    description: '外部签约原画师与 3D 绑定团队，承接角色立绘与高模外包'
  },
  {
    id: 'dept-mgmt',
    name: '数字资产治理中台',
    code: 'MANAGEMENT',
    category: 'INTERNAL',
    leader: 'Alex (Super Admin)',
    memberCount: 5,
    color: '#8b5cf6',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    storageQuotaGB: 1000,
    description: '企业全库权限安全审计、资产唯一 ID 体系与生命周期治理'
  }
];

export type AdminTab = 'OVERVIEW' | 'ASSET_STATS' | 'IP_RANKING' | 'TENANT_CONTRIBUTION' | 'ACTIVITY_AUDIT';

export interface ExtendedActivityLog {
  id: string;
  type: 'UPLOAD_BATCH' | 'VERSION_UPDATE' | 'STAGE_CHANGE' | 'COMMENT' | 'PERMISSION' | 'LIBRARY_PUBLISH';
  typeName: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    department?: string;
  };
  tenantCode: string;
  tenantName: string;
  ipId?: string;
  ipName: string;
  assetId?: string;
  assetTitle?: string;
  description: string;
  timestamp: string;
  metaBadge?: string;
  fileCount?: number;
  size?: string;
  details?: string[];
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  ips,
  assets,
  records,
  users,
  onNavigateToIPs,
  onNavigateToAssets
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | 'YEAR'>('30D');

  // Filters for Asset Statistics tab (New Panel)
  const [assetStatsOwnershipFilter, setAssetStatsOwnershipFilter] = useState<'ALL' | 'ORIGINAL' | 'LICENSED'>('ALL');
  const [assetStatsIpSortBy, setAssetStatsIpSortBy] = useState<'ASSET_COUNT' | 'STORAGE' | 'NAME'>('ASSET_COUNT');
  const [assetStatsChartType, setAssetStatsChartType] = useState<'BAR_COUNT' | 'STORAGE_GB' | 'STAGE_STACK'>('BAR_COUNT');
  const [assetStatsSelectedIpId, setAssetStatsSelectedIpId] = useState<string | null>(null);
  const [assetStatsTrendMetric, setAssetStatsTrendMetric] = useState<'ALL' | 'UPLOADS' | 'VERSIONS' | 'DOWNLOADS'>('ALL');

  // Filters for IP Ranking tab
  const [ipSearchQuery, setIpSearchQuery] = useState('');
  const [ipOwnershipFilter, setIpOwnershipFilter] = useState<'ALL' | 'ORIGINAL' | 'LICENSED'>('ALL');
  const [ipSortBy, setIpSortBy] = useState<'ASSET_COUNT' | 'STORAGE' | 'ACTIVITY' | 'PIPELINE_SCORE'>('ASSET_COUNT');
  const [ipChartMode, setIpChartMode] = useState<'BAR' | 'TREND_LINE' | 'STAGE_STACK'>('BAR');
  const [selectedIpDetailId, setSelectedIpDetailId] = useState<string | null>(null);

  // Filters for Tenant tab
  const [tenantCategoryFilter, setTenantCategoryFilter] = useState<'ALL' | 'INTERNAL' | 'EXTERNAL' | 'PARTNER'>('ALL');
  const [tenantChartMode, setTenantChartMode] = useState<'ACTIVITY_STACKED' | 'CONTRIBUTION_RANK' | 'STORAGE_QUOTA' | 'MONTHLY_TREND'>('ACTIVITY_STACKED');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Filters for Activity Audit tab
  const [auditTypeFilter, setAuditTypeFilter] = useState<string>('ALL');
  const [auditIpFilter, setAuditIpFilter] = useState<string>('ALL');
  const [auditTenantFilter, setAuditTenantFilter] = useState<string>('ALL');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Helper to parse file size string into MB
  const parseSizeToMB = (sizeStr: string): number => {
    if (!sizeStr) return 0;
    const lower = sizeStr.toLowerCase().trim();
    const num = parseFloat(lower) || 0;
    if (lower.includes('gb')) return num * 1024;
    if (lower.includes('kb')) return num / 1024;
    return num; // assume MB
  };

  // 1. Comprehensive Synthesized Activity Stream
  const fullActivityLogs = useMemo<ExtendedActivityLog[]>(() => {
    const logs: ExtendedActivityLog[] = [];

    // From Upload Batches
    records.forEach((rec, idx) => {
      const matchedUser = users.find(u => u.name === rec.uploaderName || u.name.includes(rec.uploaderName.split(' ')[0]));
      const deptCode = matchedUser?.department || (idx % 2 === 0 ? 'TOY_DEPT' : 'CARD_DEPT');
      const tenant = SYSTEM_TENANTS.find(t => t.code === deptCode) || SYSTEM_TENANTS[0];

      logs.push({
        id: `act_upload_${rec.id}`,
        type: 'UPLOAD_BATCH',
        typeName: '资产批次入库',
        user: {
          id: matchedUser?.id || `user_temp_${idx}`,
          name: rec.uploaderName,
          avatar: rec.uploaderAvatar || 'https://i.pravatar.cc/150?u=chen',
          department: tenant.name
        },
        tenantCode: tenant.code,
        tenantName: tenant.name,
        ipId: rec.ipId,
        ipName: rec.ipName,
        description: `批量归档 ${rec.fileCount} 个物料至【${rec.directoryName}】，总容量 ${rec.totalSize}`,
        timestamp: rec.timestamp,
        metaBadge: rec.batchNo,
        fileCount: rec.fileCount,
        size: rec.totalSize,
        details: (rec.filesSummary || []).map(f => `${f.name} (${f.size}) - ${f.stage}${f.assetId ? ` [ID: ${f.assetId}]` : ''}`)
      });
    });

    // From IP Change Logs
    ips.forEach(ip => {
      (ip.changeLogs || []).forEach(cl => {
        const tenant = SYSTEM_TENANTS.find(t => t.code === 'MANAGEMENT') || SYSTEM_TENANTS[0];
        logs.push({
          id: `act_ip_${cl.id}`,
          type: cl.action === 'ENABLE_LIBRARY' ? 'LIBRARY_PUBLISH' : 'STAGE_CHANGE',
          typeName: cl.action === 'ENABLE_LIBRARY' ? '图库空间发布' : 'IP 档案与规范维护',
          user: {
            id: 'u_admin',
            name: cl.operatorName,
            avatar: cl.operatorAvatar || 'https://i.pravatar.cc/150?u=alex',
            department: tenant.name
          },
          tenantCode: tenant.code,
          tenantName: tenant.name,
          ipId: ip.id,
          ipName: ip.name,
          description: cl.description,
          timestamp: cl.timestamp,
          metaBadge: ip.ownership === 'ORIGINAL' ? '自有 IP' : '授权 IP'
        });
      });
    });

    // From Asset comments & activities
    assets.forEach((asset, aIdx) => {
      const ip = ips.find(i => i.id === asset.ipId);
      const tenant = SYSTEM_TENANTS.find(t => t.code === asset.department) || SYSTEM_TENANTS[aIdx % SYSTEM_TENANTS.length];

      if (asset.version && asset.version !== 'v1.0') {
        logs.push({
          id: `act_ver_${asset.id}`,
          type: 'VERSION_UPDATE',
          typeName: '物料版本迭代',
          user: {
            id: 'u_updater',
            name: asset.uploader,
            avatar: asset.uploaderAvatar || 'https://i.pravatar.cc/150?u=sarah',
            department: tenant.name
          },
          tenantCode: tenant.code,
          tenantName: tenant.name,
          ipId: asset.ipId,
          ipName: ip?.name || '未知 IP',
          assetId: asset.id,
          assetTitle: asset.title,
          description: `升级版本至 ${asset.version}，${asset.description.slice(0, 40)}...`,
          timestamp: asset.updatedAt || asset.createdAt,
          metaBadge: asset.version,
          size: asset.fileSize
        });
      }

      (asset.comments || []).forEach(comm => {
        const commTenant = SYSTEM_TENANTS.find(t => t.code === comm.author.department) || tenant;
        logs.push({
          id: `act_comm_${comm.id}`,
          type: 'COMMENT',
          typeName: '设计评审与讨论',
          user: {
            id: comm.author.id,
            name: comm.author.name,
            avatar: comm.author.avatar,
            department: commTenant.name
          },
          tenantCode: commTenant.code,
          tenantName: commTenant.name,
          ipId: asset.ipId,
          ipName: ip?.name || '未知 IP',
          assetId: asset.id,
          assetTitle: asset.title,
          description: `在物料【${asset.title}】下发表评审反馈: "${comm.content.slice(0, 30)}${comm.content.length > 30 ? '...' : ''}"`,
          timestamp: comm.timestamp,
          metaBadge: comm.feedbackType === 'APPROVED' ? '定稿通过' : comm.feedbackType === 'CHANGE_REQUEST' ? '修改意见' : '常规讨论'
        });
      });
    });

    // Sort descending by timestamp
    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [records, ips, assets, users]);

  // 2. Aggregate IP Deep Analytics & Ranking
  const ipRankingData = useMemo(() => {
    const stageKeys: (keyof typeof ProjectStage)[] = [
      'CARD_IP_SOURCE',
      'TOY_2D_COLORED',
      'TOY_3D_MODEL',
      'CARD_FRONT_BACK',
      'CARD_PRODUCTION',
      'PACKAGING',
      'MARKETING'
    ];

    return ips.map(ip => {
      const ipAssets = assets.filter(a => a.ipId === ip.id);
      const ipRecords = records.filter(r => r.ipId === ip.id);
      const ipActivities = fullActivityLogs.filter(l => l.ipId === ip.id);

      const totalSizeMB = ipAssets.reduce((acc, a) => acc + parseSizeToMB(a.fileSize), 0);
      const totalVersions = ipAssets.reduce((acc, a) => acc + (a.versionHistory?.length || 1), 0);
      const totalComments = ipAssets.reduce((acc, a) => acc + (a.comments?.length || 0), 0);

      // Pipeline Coverage Score (0 - 100%)
      const coveredStages = new Set(ipAssets.map(a => a.stage));
      const stageCoverageCount = stageKeys.filter(k => coveredStages.has(ProjectStage[k])).length;
      const pipelineScore = Math.round((stageCoverageCount / stageKeys.length) * 100);

      // Activity Score Calculation
      const activityScore = ipAssets.length * 10 + ipRecords.length * 25 + totalComments * 5 + ipActivities.length * 8;

      return {
        ip,
        id: ip.id,
        name: ip.name,
        englishName: ip.englishName,
        ownership: ip.ownership,
        coverImage: ip.coverImage,
        categories: ip.categories,
        assetCount: ipAssets.length,
        totalSizeMB: Math.round(totalSizeMB * 10) / 10,
        totalSizeFormatted: totalSizeMB > 1024 ? `${(totalSizeMB / 1024).toFixed(2)} GB` : `${totalSizeMB.toFixed(1)} MB`,
        batchCount: ipRecords.length,
        versionCount: totalVersions,
        commentCount: totalComments,
        activityScore,
        pipelineScore,
        stageCoverageCount,
        hasLibrary: ip.hasAssetLibrary,
        stageBreakdown: {
          is2D: ipAssets.some(a => a.category === '2D' || a.stage === ProjectStage.CARD_IP_SOURCE || a.stage === ProjectStage.TOY_2D_COLORED),
          is3D: ipAssets.some(a => a.category === '3D' || a.stage === ProjectStage.TOY_3D_MODEL),
          isGraphic: ipAssets.some(a => a.category === 'GRAPHIC' || a.stage === ProjectStage.CARD_FRONT_BACK),
          isPackaging: ipAssets.some(a => a.category === 'PACKAGING' || a.stage === ProjectStage.PACKAGING),
          isDisplay: ipAssets.some(a => a.category === 'DISPLAY'),
          isPhoto: ipAssets.some(a => a.category === 'PHOTO'),
          isVideo: ipAssets.some(a => a.category === 'VIDEO' || a.stage === ProjectStage.MARKETING)
        }
      };
    });
  }, [ips, assets, records, fullActivityLogs]);

  // Filtered & Sorted IP Ranking
  const filteredIpRanking = useMemo(() => {
    return ipRankingData
      .filter(item => {
        if (ipOwnershipFilter !== 'ALL' && item.ownership !== ipOwnershipFilter) return false;
        if (ipSearchQuery.trim()) {
          const q = ipSearchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q) || item.englishName.toLowerCase().includes(q);
          const matchCat = item.categories.some(c => c.toLowerCase().includes(q));
          if (!matchName && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (ipSortBy === 'ASSET_COUNT') return b.assetCount - a.assetCount;
        if (ipSortBy === 'STORAGE') return b.totalSizeMB - a.totalSizeMB;
        if (ipSortBy === 'ACTIVITY') return b.activityScore - a.activityScore;
        if (ipSortBy === 'PIPELINE_SCORE') return b.pipelineScore - a.pipelineScore;
        return 0;
      });
  }, [ipRankingData, ipOwnershipFilter, ipSearchQuery, ipSortBy]);

  // 3. Aggregate Tenant / Department Statistics & Contribution
  const tenantStats = useMemo(() => {
    return SYSTEM_TENANTS.map(tenant => {
      const tenantAssets = assets.filter(a => a.department === tenant.code);
      const tenantRecords = records.filter(r => {
        const uploaderUser = users.find(u => u.name === r.uploaderName);
        return uploaderUser?.department === tenant.code;
      });
      const tenantLogs = fullActivityLogs.filter(l => l.tenantCode === tenant.code);
      const tenantUsers = users.filter(u => u.department === tenant.code);

      const totalSizeMB = tenantAssets.reduce((acc, a) => acc + parseSizeToMB(a.fileSize), 0);
      const storageUsedGB = Math.round((totalSizeMB / 1024) * 100) / 100;
      const quotaUsagePercent = Math.min(100, Math.round((storageUsedGB / tenant.storageQuotaGB) * 100));

      const commentInteractions = tenantLogs.filter(l => l.type === 'COMMENT').length;
      const versionUpdates = tenantLogs.filter(l => l.type === 'VERSION_UPDATE').length;
      const uploadBatchesCount = tenantLogs.filter(l => l.type === 'UPLOAD_BATCH').length;

      // Calculate Integrated Contribution Index (0 - 100)
      const contributionIndex = Math.min(
        100,
        Math.round(
          tenantAssets.length * 1.5 +
          uploadBatchesCount * 4 +
          versionUpdates * 3 +
          commentInteractions * 2 +
          tenantUsers.length * 3
        )
      );

      // Associated IPs
      const distinctIps = Array.from(new Set(tenantAssets.map(a => a.ipId)));

      return {
        tenant,
        id: tenant.id,
        name: tenant.name,
        code: tenant.code,
        category: tenant.category,
        color: tenant.color,
        assetCount: tenantAssets.length,
        totalSizeMB,
        storageUsedGB,
        quotaUsagePercent,
        uploadBatchesCount,
        versionUpdates,
        commentInteractions,
        activeMembersCount: Math.max(tenantUsers.length, 1),
        ipCoverageCount: distinctIps.length,
        contributionIndex,
        activityCount: tenantLogs.length
      };
    });
  }, [assets, records, fullActivityLogs, users]);

  // Filtered Tenant Stats
  const filteredTenants = useMemo(() => {
    return tenantStats
      .filter(t => {
        if (tenantCategoryFilter !== 'ALL' && t.category !== tenantCategoryFilter) return false;
        return true;
      })
      .sort((a, b) => b.contributionIndex - a.contributionIndex);
  }, [tenantStats, tenantCategoryFilter]);

  // Radar Data for Tenant Comparison
  const tenantRadarData = useMemo(() => {
    const maxAssets = Math.max(...tenantStats.map(t => t.assetCount), 1);
    const maxUploads = Math.max(...tenantStats.map(t => t.uploadBatchesCount), 1);
    const maxUpdates = Math.max(...tenantStats.map(t => t.versionUpdates), 1);
    const maxInteractions = Math.max(...tenantStats.map(t => t.commentInteractions), 1);
    const maxStorage = Math.max(...tenantStats.map(t => t.storageUsedGB), 1);

    return [
      {
        dimension: '资产产出量',
        TOY: Math.round(((tenantStats.find(t => t.code === 'TOY_DEPT')?.assetCount || 0) / maxAssets) * 100),
        CARD: Math.round(((tenantStats.find(t => t.code === 'CARD_DEPT')?.assetCount || 0) / maxAssets) * 100),
        MKT: Math.round(((tenantStats.find(t => t.code === 'MARKETING_DEPT')?.assetCount || 0) / maxAssets) * 100),
        LICENSING: Math.round(((tenantStats.find(t => t.code === 'GLOBAL_LICENSING')?.assetCount || 0) / maxAssets) * 100)
      },
      {
        dimension: '入库批次频度',
        TOY: Math.round(((tenantStats.find(t => t.code === 'TOY_DEPT')?.uploadBatchesCount || 0) / maxUploads) * 100),
        CARD: Math.round(((tenantStats.find(t => t.code === 'CARD_DEPT')?.uploadBatchesCount || 0) / maxUploads) * 100),
        MKT: Math.round(((tenantStats.find(t => t.code === 'MARKETING_DEPT')?.uploadBatchesCount || 0) / maxUploads) * 100),
        LICENSING: Math.round(((tenantStats.find(t => t.code === 'GLOBAL_LICENSING')?.uploadBatchesCount || 0) / maxUploads) * 100)
      },
      {
        dimension: '版本迭代活跃',
        TOY: Math.round(((tenantStats.find(t => t.code === 'TOY_DEPT')?.versionUpdates || 0) / maxUpdates) * 100),
        CARD: Math.round(((tenantStats.find(t => t.code === 'CARD_DEPT')?.versionUpdates || 0) / maxUpdates) * 100),
        MKT: Math.round(((tenantStats.find(t => t.code === 'MARKETING_DEPT')?.versionUpdates || 0) / maxUpdates) * 100),
        LICENSING: Math.round(((tenantStats.find(t => t.code === 'GLOBAL_LICENSING')?.versionUpdates || 0) / maxUpdates) * 100)
      },
      {
        dimension: '评审互动热度',
        TOY: Math.round(((tenantStats.find(t => t.code === 'TOY_DEPT')?.commentInteractions || 0) / maxInteractions) * 100),
        CARD: Math.round(((tenantStats.find(t => t.code === 'CARD_DEPT')?.commentInteractions || 0) / maxInteractions) * 100),
        MKT: Math.round(((tenantStats.find(t => t.code === 'MARKETING_DEPT')?.commentInteractions || 0) / maxInteractions) * 100),
        LICENSING: Math.round(((tenantStats.find(t => t.code === 'GLOBAL_LICENSING')?.commentInteractions || 0) / maxInteractions) * 100)
      },
      {
        dimension: '存储资产吞吐',
        TOY: Math.round(((tenantStats.find(t => t.code === 'TOY_DEPT')?.storageUsedGB || 0) / maxStorage) * 100),
        CARD: Math.round(((tenantStats.find(t => t.code === 'CARD_DEPT')?.storageUsedGB || 0) / maxStorage) * 100),
        MKT: Math.round(((tenantStats.find(t => t.code === 'MARKETING_DEPT')?.storageUsedGB || 0) / maxStorage) * 100),
        LICENSING: Math.round(((tenantStats.find(t => t.code === 'GLOBAL_LICENSING')?.storageUsedGB || 0) / maxStorage) * 100)
      }
    ];
  }, [tenantStats]);

  // Top User Contributors
  const topContributors = useMemo(() => {
    const userMap: Record<string, { user: User; uploads: number; updates: number; comments: number; totalScore: number }> = {};

    users.forEach(u => {
      userMap[u.id] = { user: u, uploads: 0, updates: 0, comments: 0, totalScore: 0 };
    });

    fullActivityLogs.forEach(log => {
      const u = users.find(usr => usr.name === log.user.name || usr.id === log.user.id);
      if (u && userMap[u.id]) {
        if (log.type === 'UPLOAD_BATCH') userMap[u.id].uploads += log.fileCount || 1;
        if (log.type === 'VERSION_UPDATE') userMap[u.id].updates += 1;
        if (log.type === 'COMMENT') userMap[u.id].comments += 1;
      }
    });

    return Object.values(userMap)
      .map(item => ({
        ...item,
        totalScore: item.uploads * 10 + item.updates * 15 + item.comments * 5
      }))
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [users, fullActivityLogs]);

  // 4. Overall Macro KPIs
  const totalAssetsCount = assets.length;
  const originalIpsCount = ips.filter(i => i.ownership === 'ORIGINAL').length;
  const licensedIpsCount = ips.filter(i => i.ownership === 'LICENSED').length;
  const totalUploadBatches = records.length;
  const totalUsersCount = users.length;
  const totalStorageMB = assets.reduce((acc, a) => acc + parseSizeToMB(a.fileSize), 0);
  const totalStorageGB = (totalStorageMB / 1024).toFixed(1);

  // Time-series Activity Trend Mock Data
  const activityTrendData = useMemo(() => {
    return [
      { date: '08-08', uploads: 3, updates: 5, comments: 12, total: 20 },
      { date: '08-09', uploads: 6, updates: 8, comments: 16, total: 30 },
      { date: '08-10', uploads: 4, updates: 11, comments: 14, total: 29 },
      { date: '08-11', uploads: 8, updates: 14, comments: 22, total: 44 },
      { date: '08-12', uploads: 12, updates: 18, comments: 28, total: 58 },
      { date: '08-13', uploads: 9, updates: 15, comments: 25, total: 49 },
      { date: '08-14', uploads: 15, updates: 22, comments: 34, total: 71 },
      { date: '08-15', uploads: 11, updates: 19, comments: 30, total: 60 }
    ];
  }, []);

  // Asset Category Breakdown Data for Charts
  const categoryBreakdownData = useMemo(() => {
    const map: Record<string, { count: number; color: string; label: string }> = {
      '2D': { count: 0, color: '#6366f1', label: '2D 原画/立绘' },
      '3D': { count: 0, color: '#10b981', label: '3D 建模/工程' },
      'GRAPHIC': { count: 0, color: '#06b6d4', label: '平面/卡面' },
      'PACKAGING': { count: 0, color: '#ec4899', label: '包装/结构' },
      'DISPLAY': { count: 0, color: '#f59e0b', label: '陈列/堆头' },
      'PHOTO': { count: 0, color: '#8b5cf6', label: '实拍照片' },
      'VIDEO': { count: 0, color: '#f43f5e', label: '宣传视频' }
    };

    assets.forEach(a => {
      const cat = a.category || '2D';
      if (map[cat]) {
        map[cat].count += 1;
      }
    });

    return Object.entries(map).map(([key, val]) => ({
      key,
      name: val.label,
      count: val.count,
      color: val.color
    }));
  }, [assets]);

  // Ownership Breakdown for Pie
  const ownershipPieData = useMemo(() => {
    return [
      { name: '自有原创 IP', value: originalIpsCount, color: '#6366f1' },
      { name: '官方正版授权 IP', value: licensedIpsCount, color: '#10b981' }
    ];
  }, [originalIpsCount, licensedIpsCount]);

  // IP Output & Growth Trend line data for IP ranking view
  const ipTrendData = useMemo(() => {
    const topIps = ips.slice(0, 6);
    return [
      {
        month: '3月',
        ...topIps.reduce((acc, ip, idx) => ({ ...acc, [ip.name]: Math.max(2, Math.round((assets.filter(a => a.ipId === ip.id).length || 5) * 0.2 + idx * 2)) }), {})
      },
      {
        month: '4月',
        ...topIps.reduce((acc, ip, idx) => ({ ...acc, [ip.name]: Math.max(4, Math.round((assets.filter(a => a.ipId === ip.id).length || 8) * 0.4 + idx * 3)) }), {})
      },
      {
        month: '5月',
        ...topIps.reduce((acc, ip, idx) => ({ ...acc, [ip.name]: Math.max(8, Math.round((assets.filter(a => a.ipId === ip.id).length || 12) * 0.6 + idx * 4)) }), {})
      },
      {
        month: '6月',
        ...topIps.reduce((acc, ip, idx) => ({ ...acc, [ip.name]: Math.max(12, Math.round((assets.filter(a => a.ipId === ip.id).length || 16) * 0.75 + idx * 5)) }), {})
      },
      {
        month: '7月',
        ...topIps.reduce((acc, ip, idx) => ({ ...acc, [ip.name]: Math.max(16, Math.round((assets.filter(a => a.ipId === ip.id).length || 20) * 0.9 + idx * 6)) }), {})
      },
      {
        month: '8月 (当前)',
        ...topIps.reduce((acc, ip) => ({ ...acc, [ip.name]: assets.filter(a => a.ipId === ip.id).length || 15 }), {})
      }
    ];
  }, [ips, assets]);

  // IP 7-Stage Breakdown Stack Data
  const ipStageStackData = useMemo(() => {
    return filteredIpRanking.map(ip => {
      const ipAssets = assets.filter(a => a.ipId === ip.id);
      return {
        name: ip.name,
        '2D原画': ipAssets.filter(a => a.category === '2D').length,
        '3D工程': ipAssets.filter(a => a.category === '3D').length,
        '平面设计': ipAssets.filter(a => a.category === 'GRAPHIC').length,
        '包装结构': ipAssets.filter(a => a.category === 'PACKAGING').length,
        '陈列道具': ipAssets.filter(a => a.category === 'DISPLAY').length,
        '实拍照片': ipAssets.filter(a => a.category === 'PHOTO').length,
        '宣传视频': ipAssets.filter(a => a.category === 'VIDEO').length,
        total: ipAssets.length
      };
    });
  }, [filteredIpRanking, assets]);

  // Tenant Activity Multi-metric Bar Chart Data
  const tenantActivityBarData = useMemo(() => {
    return filteredTenants.map(t => ({
      name: t.name.length > 6 ? t.name.slice(0, 6) + '..' : t.name,
      fullName: t.name,
      code: t.code,
      '入库物料(件)': t.assetCount,
      '批次吞吐(批)': t.uploadBatchesCount,
      '版本升级(次)': t.versionUpdates,
      '评审互动(条)': t.commentInteractions,
      '存储已用(GB)': parseFloat(t.storageUsedGB),
      '贡献指数': t.contributionIndex,
      color: t.color
    }));
  }, [filteredTenants]);

  // Tenant Monthly Activity Trend Data
  const tenantMonthlyTrendData = useMemo(() => {
    return [
      { month: '3月', 玩具研发部: 18, 卡牌工程部: 12, 营销视觉中心: 25, 衍生周边部: 8, 正版授权方: 5 },
      { month: '4月', 玩具研发部: 28, 卡牌工程部: 22, 营销视觉中心: 35, 衍生周边部: 15, 正版授权方: 12 },
      { month: '5月', 玩具研发部: 42, 卡牌工程部: 38, 营销视觉中心: 52, 衍生周边部: 24, 正版授权方: 20 },
      { month: '6月', 玩具研发部: 65, 卡牌工程部: 55, 营销视觉中心: 70, 衍生周边部: 36, 正版授权方: 32 },
      { month: '7月', 玩具研发部: 88, 卡牌工程部: 78, 营销视觉中心: 92, 衍生周边部: 48, 正版授权方: 45 },
      { month: '8月', 玩具研发部: 112, 卡牌工程部: 96, 营销视觉中心: 125, 衍生周边部: 62, 正版授权方: 58 }
    ];
  }, []);

  // =========================================================================
  // NEW: Dedicated Asset Statistics Panel Computation Hooks (recharts)
  // =========================================================================
  
  // 1. IP Asset Upload Distribution & Storage
  const assetStatsIpDistribution = useMemo(() => {
    let result = ips.map((ip, idx) => {
      const ipAssets = assets.filter(a => a.ipId === ip.id);
      const totalMB = ipAssets.reduce((sum, a) => sum + parseSizeToMB(a.fileSize), 0);
      const storageGB = parseFloat((totalMB / 1024).toFixed(2));
      
      const counts2D = ipAssets.filter(a => a.category === '2D').length;
      const counts3D = ipAssets.filter(a => a.category === '3D').length;
      const countsGraphic = ipAssets.filter(a => a.category === 'GRAPHIC').length;
      const countsPackaging = ipAssets.filter(a => a.category === 'PACKAGING').length;
      const countsDisplay = ipAssets.filter(a => a.category === 'DISPLAY').length;
      const countsPhoto = ipAssets.filter(a => a.category === 'PHOTO').length;
      const countsVideo = ipAssets.filter(a => a.category === 'VIDEO').length;

      // File formats
      const psdCount = ipAssets.filter(a => {
        const fmt = (a.metadata?.format || a.fileFormat || '').toUpperCase();
        return fmt.includes('PSD') || fmt.includes('PSB');
      }).length;
      const aiCount = ipAssets.filter(a => {
        const fmt = (a.metadata?.format || a.fileFormat || '').toUpperCase();
        return fmt.includes('AI') || fmt.includes('EPS');
      }).length;
      const modelCount = ipAssets.filter(a => {
        const fmt = (a.metadata?.format || a.fileFormat || '').toUpperCase();
        return fmt.includes('OBJ') || fmt.includes('BLEND') || fmt.includes('FBX') || fmt.includes('STL');
      }).length;
      const imgCount = ipAssets.filter(a => {
        const fmt = (a.metadata?.format || a.fileFormat || '').toUpperCase();
        return fmt.includes('PNG') || fmt.includes('JPG') || fmt.includes('JPEG') || fmt.includes('WEBP');
      }).length;
      const vidCount = ipAssets.filter(a => {
        const fmt = (a.metadata?.format || a.fileFormat || '').toUpperCase();
        return fmt.includes('MP4') || fmt.includes('MOV') || fmt.includes('AVI');
      }).length;
      const docCount = ipAssets.filter(a => {
        const fmt = (a.metadata?.format || a.fileFormat || '').toUpperCase();
        return fmt.includes('PDF') || fmt.includes('DWG') || fmt.includes('DXF');
      }).length;

      const colors = ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6', '#14b8a6'];

      return {
        id: ip.id,
        name: ip.name,
        shortName: ip.name.length > 8 ? ip.name.slice(0, 8) + '..' : ip.name,
        ownership: ip.ownership,
        ownershipLabel: ip.ownership === 'ORIGINAL' ? '自研原创' : '正版授权',
        assetCount: ipAssets.length,
        storageGB,
        storageMB: Math.round(totalMB),
        '2D原画': counts2D,
        '3D建模': counts3D,
        '平面卡面': countsGraphic,
        '包装刀模': countsPackaging,
        '美陈陈列': countsDisplay,
        '实拍打样': countsPhoto,
        '宣传视频': countsVideo,
        formatBreakdown: {
          PSD: psdCount,
          AI: aiCount,
          '3D': modelCount,
          Image: imgCount,
          Video: vidCount,
          Doc: docCount
        },
        color: colors[idx % colors.length]
      };
    });

    if (assetStatsOwnershipFilter !== 'ALL') {
      result = result.filter(r => r.ownership === assetStatsOwnershipFilter);
    }

    if (assetStatsIpSortBy === 'ASSET_COUNT') {
      result.sort((a, b) => b.assetCount - a.assetCount);
    } else if (assetStatsIpSortBy === 'STORAGE') {
      result.sort((a, b) => b.storageGB - a.storageGB);
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    }

    return result;
  }, [ips, assets, assetStatsOwnershipFilter, assetStatsIpSortBy]);

  // 2. File Type / Extension Distribution Data
  const assetStatsFileTypeData = useMemo(() => {
    let psdCount = 0, psdMB = 0;
    let aiCount = 0, aiMB = 0;
    let modelCount = 0, modelMB = 0;
    let imgCount = 0, imgMB = 0;
    let vidCount = 0, vidMB = 0;
    let cadCount = 0, cadMB = 0;
    let otherCount = 0, otherMB = 0;

    assets.forEach(a => {
      const fmt = (a.metadata?.format || a.fileFormat || '').toUpperCase();
      const mb = parseSizeToMB(a.fileSize);

      if (fmt.includes('PSD') || fmt.includes('PSB') || fmt.includes('PHOTOSHOP')) {
        psdCount++; psdMB += mb;
      } else if (fmt.includes('AI') || fmt.includes('EPS') || fmt.includes('ILLUSTRATOR')) {
        aiCount++; aiMB += mb;
      } else if (fmt.includes('OBJ') || fmt.includes('BLEND') || fmt.includes('FBX') || fmt.includes('STL') || fmt.includes('MAX') || fmt.includes('MA') || a.category === '3D') {
        modelCount++; modelMB += mb;
      } else if (fmt.includes('PNG') || fmt.includes('JPG') || fmt.includes('JPEG') || fmt.includes('WEBP')) {
        imgCount++; imgMB += mb;
      } else if (fmt.includes('MP4') || fmt.includes('MOV') || fmt.includes('AVI') || a.category === 'VIDEO') {
        vidCount++; vidMB += mb;
      } else if (fmt.includes('PDF') || fmt.includes('DWG') || fmt.includes('DXF')) {
        cadCount++; cadMB += mb;
      } else {
        otherCount++; otherMB += mb;
      }
    });

    const totalCount = assets.length || 1;
    const totalMB = psdMB + aiMB + modelMB + imgMB + vidMB + cadMB + otherMB || 1;

    return [
      {
        name: 'PSD / PSB 分层源工程',
        shortName: 'PSD/PSB',
        count: psdCount,
        percent: Math.round((psdCount / totalCount) * 100),
        storageMB: Math.round(psdMB),
        storageGB: (psdMB / 1024).toFixed(1),
        storagePercent: Math.round((psdMB / totalMB) * 100),
        color: '#3b82f6',
        icon: 'fa-layer-group',
        desc: 'Photoshop 2D原画分层工程'
      },
      {
        name: 'AI / EPS 矢量排版稿',
        shortName: 'AI/EPS',
        count: aiCount,
        percent: Math.round((aiCount / totalCount) * 100),
        storageMB: Math.round(aiMB),
        storageGB: (aiMB / 1024).toFixed(1),
        storagePercent: Math.round((aiMB / totalMB) * 100),
        color: '#f97316',
        icon: 'fa-bezier-curve',
        desc: 'Illustrator 矢量刀模与卡面'
      },
      {
        name: 'OBJ / BLEND / FBX 3D数模',
        shortName: '3D数模',
        count: modelCount,
        percent: Math.round((modelCount / totalCount) * 100),
        storageMB: Math.round(modelMB),
        storageGB: (modelMB / 1024).toFixed(1),
        storagePercent: Math.round((modelMB / totalMB) * 100),
        color: '#10b981',
        icon: 'fa-cubes',
        desc: 'Blender/Maya 3D高低模与骨骼'
      },
      {
        name: 'PNG / JPG / WEBP 超清图像',
        shortName: '超清图像',
        count: imgCount,
        percent: Math.round((imgCount / totalCount) * 100),
        storageMB: Math.round(imgMB),
        storageGB: (imgMB / 1024).toFixed(1),
        storagePercent: Math.round((imgMB / totalMB) * 100),
        color: '#6366f1',
        icon: 'fa-image',
        desc: '立绘、无底色渲染图与打样照'
      },
      {
        name: 'MP4 / MOV 宣发动效视频',
        shortName: '宣发视频',
        count: vidCount,
        percent: Math.round((vidCount / totalCount) * 100),
        storageMB: Math.round(vidMB),
        storageGB: (vidMB / 1024).toFixed(1),
        storagePercent: Math.round((vidMB / totalMB) * 100),
        color: '#f43f5e',
        icon: 'fa-film',
        desc: '拆盒PV、3D旋转动效及TVC'
      },
      {
        name: 'PDF / DWG 刀模与工程制图',
        shortName: '刀模制图',
        count: cadCount,
        percent: Math.round((cadCount / totalCount) * 100),
        storageMB: Math.round(cadMB),
        storageGB: (cadMB / 1024).toFixed(1),
        storagePercent: Math.round((cadMB / totalMB) * 100),
        color: '#ec4899',
        icon: 'fa-file-invoice',
        desc: '印刷包装盒刀线与美陈施工图'
      },
      {
        name: 'ZIP / 其他整合归档',
        shortName: '其他归档',
        count: otherCount,
        percent: Math.round((otherCount / totalCount) * 100),
        storageMB: Math.round(otherMB),
        storageGB: (otherMB / 1024).toFixed(1),
        storagePercent: Math.round((otherMB / totalMB) * 100),
        color: '#64748b',
        icon: 'fa-file-zipper',
        desc: '字体包、贴图纹理与全套打样包'
      }
    ].filter(item => item.count > 0 || item.storageMB > 0);
  }, [assets]);

  // 3. 7-Stage Category Distribution
  const assetStatsCategoryDistribution = useMemo(() => {
    const categories: { key: ProjectStage; label: string; color: string; icon: string }[] = [
      { key: '2D', label: '2D 原画概念', color: '#6366f1', icon: 'fa-palette' },
      { key: '3D', label: '3D 建模工程', color: '#10b981', icon: 'fa-cube' },
      { key: 'GRAPHIC', label: '平面 VI 与卡面', color: '#06b6d4', icon: 'fa-pen-nib' },
      { key: 'PACKAGING', label: '包装与刀模', color: '#ec4899', icon: 'fa-box-open' },
      { key: 'DISPLAY', label: '美陈与陈列', color: '#f59e0b', icon: 'fa-store' },
      { key: 'PHOTO', label: '实拍摄影打样', color: '#8b5cf6', icon: 'fa-camera' },
      { key: 'VIDEO', label: '宣传视频动效', color: '#f43f5e', icon: 'fa-video' }
    ];

    const total = assets.length || 1;

    return categories.map(cat => {
      const count = assets.filter(a => a.category === cat.key || a.type === cat.key).length;
      return {
        name: cat.label,
        key: cat.key,
        count,
        percent: Math.round((count / total) * 100),
        color: cat.color,
        icon: cat.icon
      };
    });
  }, [assets]);

  // 4. Recent Activity & Upload Trend Waveform (Dynamic by timeRange)
  const assetStatsRecentTrendData = useMemo(() => {
    if (timeRange === '7D') {
      return [
        { period: '8-09', uploads: 6, versions: 3, downloads: 14, activeUsers: 8 },
        { period: '8-10', uploads: 9, versions: 5, downloads: 22, activeUsers: 11 },
        { period: '8-11', uploads: 12, versions: 7, downloads: 35, activeUsers: 14 },
        { period: '8-12', uploads: 18, versions: 9, downloads: 48, activeUsers: 16 },
        { period: '8-13', uploads: 22, versions: 12, downloads: 65, activeUsers: 19 },
        { period: '8-14', uploads: 28, versions: 16, downloads: 78, activeUsers: 23 },
        { period: '8-15 (今日)', uploads: 34, versions: 20, downloads: 92, activeUsers: 27 }
      ];
    } else if (timeRange === '30D') {
      return [
        { period: '7月下旬', uploads: 32, versions: 14, downloads: 98, activeUsers: 15 },
        { period: '7月末', uploads: 45, versions: 22, downloads: 140, activeUsers: 19 },
        { period: '8月第1周', uploads: 62, versions: 31, downloads: 185, activeUsers: 24 },
        { period: '8月第2周', uploads: 85, versions: 42, downloads: 260, activeUsers: 28 },
        { period: '8月中旬', uploads: 115, versions: 58, downloads: 345, activeUsers: 34 },
        { period: '当前活跃', uploads: 142, versions: 74, downloads: 420, activeUsers: 38 }
      ];
    } else if (timeRange === '90D') {
      return [
        { period: '6月上旬', uploads: 60, versions: 25, downloads: 160, activeUsers: 18 },
        { period: '6月下旬', uploads: 85, versions: 38, downloads: 230, activeUsers: 22 },
        { period: '7月上旬', uploads: 120, versions: 55, downloads: 340, activeUsers: 26 },
        { period: '7月下旬', uploads: 165, versions: 78, downloads: 480, activeUsers: 32 },
        { period: '8月上旬', uploads: 210, versions: 98, downloads: 620, activeUsers: 36 },
        { period: '8月中旬', uploads: 275, versions: 132, downloads: 810, activeUsers: 42 }
      ];
    } else {
      return [
        { period: 'Q1 (1-3月)', uploads: 140, versions: 62, downloads: 380, activeUsers: 20 },
        { period: '4月', uploads: 95, versions: 44, downloads: 290, activeUsers: 24 },
        { period: '5月', uploads: 135, versions: 68, downloads: 410, activeUsers: 28 },
        { period: '6月 (年中大促)', uploads: 245, versions: 115, downloads: 780, activeUsers: 36 },
        { period: '7月 (暑期旺季)', uploads: 290, versions: 140, downloads: 920, activeUsers: 40 },
        { period: '8月 (秋季企划)', uploads: 360, versions: 185, downloads: 1150, activeUsers: 46 }
      ];
    }
  }, [timeRange]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return fullActivityLogs.filter(log => {
      if (auditTypeFilter !== 'ALL' && log.type !== auditTypeFilter) return false;
      if (auditIpFilter !== 'ALL' && log.ipId !== auditIpFilter) return false;
      if (auditTenantFilter !== 'ALL' && log.tenantCode !== auditTenantFilter) return false;
      if (auditSearchQuery.trim()) {
        const q = auditSearchQuery.toLowerCase();
        const matchUser = log.user.name.toLowerCase().includes(q);
        const matchDesc = log.description.toLowerCase().includes(q);
        const matchIp = log.ipName.toLowerCase().includes(q);
        const matchBadge = (log.metaBadge || '').toLowerCase().includes(q);
        const matchDetails = (log.details || []).some(d => d.toLowerCase().includes(q));
        if (!matchUser && !matchDesc && !matchIp && !matchBadge && !matchDetails) return false;
      }
      return true;
    });
  }, [fullActivityLogs, auditTypeFilter, auditIpFilter, auditTenantFilter, auditSearchQuery]);

  // Export audit report simulation
  const handleExportAuditReport = () => {
    const csvContent = [
      ['日志ID', '活动类型', '操作人', '所属租户/部门', '关联IP', '描述', '时间戳', '附注'],
      ...filteredAuditLogs.map(l => [
        l.id,
        l.typeName,
        l.user.name,
        l.tenantName,
        l.ipName,
        `"${l.description.replace(/"/g, '""')}"`,
        l.timestamp,
        l.metaBadge || ''
      ])
    ]
      .map(e => e.join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `IP_ASSET_AUDIT_LOGS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('审计日志报表 CSV 导出成功！');
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-28">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-2.5 animate-fadeIn">
          <i className="fa-solid fa-circle-check text-emerald-400"></i>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Main Navigation Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white p-6 sm:p-7 rounded-[2.5rem] border border-slate-200/80 shadow-xs">
        <div className="flex items-start sm:items-center space-x-4">
          <div className="w-13 h-13 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl shadow-md shadow-indigo-600/20 shrink-0">
            <i className="fa-solid fa-chart-pie"></i>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                企业管理与多租户统计中心
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-200">
                ADMIN CONSOLE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              全库 IP 资产规模盘点、租户与团队贡献度分析、以及细粒度全生命周期活动审计
            </p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Selector */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
            {(['7D', '30D', '90D', 'YEAR'] as const).map(range => (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range);
                  showToast(`统计时间已切换为：${range === '7D' ? '近7天' : range === '30D' ? '近30天' : range === '90D' ? '近季度' : '全年'}`);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timeRange === range
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {range === '7D' ? '近7天' : range === '30D' ? '近30天' : range === '90D' ? '近季度' : '全年'}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportAuditReport}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-1.5 transition-all"
            title="导出当前分析数据与审计记录"
          >
            <i className="fa-solid fa-file-arrow-down text-indigo-600"></i>
            <span>导出报表</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 flex flex-wrap gap-1.5 shadow-2xs">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'OVERVIEW'
              ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <i className="fa-solid fa-gauge-high"></i>
          <span>宏观态势与大盘</span>
        </button>

        <button
          onClick={() => setActiveTab('ASSET_STATS')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'ASSET_STATS'
              ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <i className="fa-solid fa-chart-column"></i>
          <span>资产统计看板</span>
          <span className="px-2 py-0.2 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
            {assets.length} 件
          </span>
        </button>

        <button
          onClick={() => setActiveTab('IP_RANKING')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'IP_RANKING'
              ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <i className="fa-solid fa-trophy"></i>
          <span>IP 统计与产出排行</span>
          <span className="px-2 py-0.2 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
            {ips.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('TENANT_CONTRIBUTION')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'TENANT_CONTRIBUTION'
              ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <i className="fa-solid fa-building-user"></i>
          <span>租户/部门 贡献度分析</span>
          <span className="px-2 py-0.2 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
            {SYSTEM_TENANTS.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ACTIVITY_AUDIT')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'ACTIVITY_AUDIT'
              ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <i className="fa-solid fa-list-check"></i>
          <span>全库活动日志与审计</span>
          <span className="px-2 py-0.2 rounded-full text-[10px] bg-purple-50 text-purple-700 font-bold border border-purple-200">
            {fullActivityLogs.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW (宏观态势与大盘) */}
      {/* ========================================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* KPI 1: Assets & Storage */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">全库资产总量</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-box-archive"></i>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl font-black text-slate-900">{totalAssetsCount}</span>
                  <span className="text-xs text-slate-400 font-medium">件物料</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500">累计占用存储: <strong className="text-slate-800 font-bold">{totalStorageGB} GB</strong></span>
                  <span className="text-emerald-600 font-bold flex items-center"><i className="fa-solid fa-arrow-trend-up mr-1"></i>+18.4%</span>
                </div>
              </div>
            </div>

            {/* KPI 2: IP Scale */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">IP 档案总数</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-folder-tree"></i>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl font-black text-slate-900">{ips.length}</span>
                  <span className="text-xs text-slate-400 font-medium">个主力 IP</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-indigo-600 font-bold">自有原创 {originalIpsCount}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-emerald-600 font-bold">三方授权 {licensedIpsCount}</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Ingestion Batches */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">资产入库批次</span>
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-layer-group"></i>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl font-black text-slate-900">{totalUploadBatches}</span>
                  <span className="text-xs text-slate-400 font-medium">批次完成</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500">唯一 ID 生成率: <strong className="text-emerald-600 font-bold">100%</strong></span>
                  <span className="text-slate-400">零重码</span>
                </div>
              </div>
            </div>

            {/* KPI 4: Tenants & Contributors */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">活跃租户与团队</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-users-gear"></i>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl font-black text-slate-900">{SYSTEM_TENANTS.length}</span>
                  <span className="text-xs text-slate-400 font-medium">个业务租户</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500">受控人员: <strong className="text-indigo-600 font-bold">{totalUsersCount} 账号</strong></span>
                  <span className="text-slate-400">全权审计</span>
                </div>
              </div>
            </div>
          </div>

          {/* Time Series Activity Trends & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Activity Trend Area Chart */}
            <div className="lg:col-span-2 bg-white p-7 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">全库活动活跃度趋势 (Activity Dynamics)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">监控入库批次、版本升级与评审互动的每日活跃波形</p>
                </div>
                <div className="flex items-center space-x-3 text-xs font-bold text-slate-500">
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-1.5"></span>入库吞吐</span>
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5"></span>版本升级</span>
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-pink-500 mr-1.5"></span>协作讨论</span>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl text-xs space-y-1.5">
                              <p className="font-black text-indigo-300">{label} 活动统计</p>
                              <div className="space-y-1 text-[11px]">
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">入库物料:</span>
                                  <strong className="text-white">{d.uploads} 件</strong>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">版本升级:</span>
                                  <strong className="text-emerald-400">{d.updates} 次</strong>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">评审讨论:</span>
                                  <strong className="text-pink-400">{d.comments} 条</strong>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" />
                    <Area type="monotone" dataKey="comments" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorComments)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right 1 Col: Ownership Ratio & Category Matrix */}
            <div className="bg-white p-7 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900">IP 权属性质与品类分布</h3>
                <p className="text-xs text-slate-400 mt-0.5">自有原创 IP 与全球三方授权资产构成</p>
              </div>

              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ownershipPieData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={6}
                      dataKey="value"
                    >
                      {ownershipPieData.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                {ownershipPieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="font-bold text-slate-700">{item.name}</span>
                    </div>
                    <span className="font-mono font-black text-slate-900">{item.value} 个 IP</span>
                  </div>
                ))}
              </div>

              {/* Quick Category Pill Bars */}
              <div className="pt-2 space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  资产大类数量构成
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {categoryBreakdownData.slice(0, 4).map(c => (
                    <div key={c.key} className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 font-medium">{c.name}</span>
                      <strong className="font-bold" style={{ color: c.color }}>{c.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Highlight Links to Sub-sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div 
              onClick={() => setActiveTab('ASSET_STATS')}
              className="bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-100 p-6 rounded-3xl cursor-pointer transition-all hover:shadow-xs group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-indigo-900">资产全景统计看板</span>
                <i className="fa-solid fa-arrow-right text-indigo-600 group-hover:translate-x-1 transition-transform"></i>
              </div>
              <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                透视全库 {assets.length} 件物料的 IP 上传量分布、文件类型占比及近期活跃吞吐趋势。
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('IP_RANKING')}
              className="bg-cyan-50/70 hover:bg-cyan-50 border border-cyan-100 p-6 rounded-3xl cursor-pointer transition-all hover:shadow-xs group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-cyan-900">IP 资产深度排行</span>
                <i className="fa-solid fa-arrow-right text-cyan-600 group-hover:translate-x-1 transition-transform"></i>
              </div>
              <p className="text-xs text-cyan-700 font-medium leading-relaxed">
                查看全库 {ips.length} 个 IP 的物料产出规模、阶段覆盖评分与活跃度积分。
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('TENANT_CONTRIBUTION')}
              className="bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-100 p-6 rounded-3xl cursor-pointer transition-all hover:shadow-xs group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-emerald-900">租户与部门贡献度</span>
                <i className="fa-solid fa-arrow-right text-emerald-600 group-hover:translate-x-1 transition-transform"></i>
              </div>
              <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                评估玩具、卡牌、营销等 6 大租户的吞吐量、迭代率与团队贡献榜。
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('ACTIVITY_AUDIT')}
              className="bg-purple-50/70 hover:bg-purple-50 border border-purple-100 p-6 rounded-3xl cursor-pointer transition-all hover:shadow-xs group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-purple-900">全生命周期审计日志</span>
                <i className="fa-solid fa-arrow-right text-purple-600 group-hover:translate-x-1 transition-transform"></i>
              </div>
              <p className="text-xs text-purple-700 font-medium leading-relaxed">
                实时追溯全库 {fullActivityLogs.length} 条入库、版本升级、状态变更与评审轨迹。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW TAB: ASSET STATISTICS PANEL (基于 recharts 的资产统计看板)             */}
      {/* ========================================================================= */}
      {activeTab === 'ASSET_STATS' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top KPI Snapshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs hover:border-indigo-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">已入库资产总量</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-box-archive"></i>
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-900">{assets.length}</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  <i className="fa-solid fa-arrow-trend-up mr-1"></i> +24.8% 增幅
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400">跨 {ips.length} 个 IP 系列，含 7 大研发阶段</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs hover:border-cyan-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">总存储占用体量</span>
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-hard-drive"></i>
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-900">
                  {(assets.reduce((sum, a) => sum + parseSizeToMB(a.fileSize), 0) / 1024).toFixed(2)} <span className="text-sm font-bold text-slate-400">GB</span>
                </span>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  配额充足
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400">含 PSD、3D工程模型及超清原画</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs hover:border-emerald-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">主流格式覆盖</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-file-shield"></i>
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-900">{assetStatsFileTypeData.length} <span className="text-sm font-bold text-slate-400">类</span></span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  100% 格式合规
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400">PSD / AI / 3D数模 / 视频 / 刀模</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs hover:border-purple-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">唯一资产ID合规率</span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-fingerprint"></i>
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-900">100%</span>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                  规范校验通过
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400">标准结构: IP-TYPE-STAGE-YYMM-SEQ</div>
            </div>
          </div>

          {/* SECTION 1: 不同 IP 的资产上传量分布 (Bar & Stacked Recharts) */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold">
                    <i className="fa-solid fa-chart-column"></i>
                  </div>
                  <h3 className="text-base font-black text-slate-900">不同 IP 的资产上传量分布与存储占用</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  直观比对各 IP 系列的物料建档规模、7阶段品类构成及物理存储体量
                </p>
              </div>

              {/* IP Filters & Mode Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Ownership Filter */}
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
                  <button
                    onClick={() => setAssetStatsOwnershipFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      assetStatsOwnershipFilter === 'ALL' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    全部 IP
                  </button>
                  <button
                    onClick={() => setAssetStatsOwnershipFilter('ORIGINAL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      assetStatsOwnershipFilter === 'ORIGINAL' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    自研原创
                  </button>
                  <button
                    onClick={() => setAssetStatsOwnershipFilter('LICENSED')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      assetStatsOwnershipFilter === 'LICENSED' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    正版授权
                  </button>
                </div>

                {/* Sort Filter */}
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
                  <button
                    onClick={() => setAssetStatsIpSortBy('ASSET_COUNT')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      assetStatsIpSortBy === 'ASSET_COUNT' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    按件数
                  </button>
                  <button
                    onClick={() => setAssetStatsIpSortBy('STORAGE')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      assetStatsIpSortBy === 'STORAGE' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    按存储
                  </button>
                </div>

                {/* Chart Presentation Mode */}
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
                  <button
                    onClick={() => setAssetStatsChartType('BAR_COUNT')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                      assetStatsChartType === 'BAR_COUNT' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                    title="上传量直方图"
                  >
                    <i className="fa-solid fa-chart-simple text-[10px]"></i>
                    <span>上传量</span>
                  </button>
                  <button
                    onClick={() => setAssetStatsChartType('STORAGE_GB')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                      assetStatsChartType === 'STORAGE_GB' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                    title="存储空间分布 (GB)"
                  >
                    <i className="fa-solid fa-database text-[10px]"></i>
                    <span>存储空间</span>
                  </button>
                  <button
                    onClick={() => setAssetStatsChartType('STAGE_STACK')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                      assetStatsChartType === 'STAGE_STACK' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                    title="7阶段品类构成堆叠"
                  >
                    <i className="fa-solid fa-layer-group text-[10px]"></i>
                    <span>7阶段构成</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Recharts Container & IP Leaderboard Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {assetStatsChartType === 'STAGE_STACK' ? (
                      <BarChart data={assetStatsIpDistribution} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="shortName" 
                          tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: '#64748b' }} 
                          axisLine={false} 
                          tickLine={false}
                          label={{ value: '物料件数 (件)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[200px]">
                                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                                    <span className="font-black text-sm text-indigo-300">{d.name}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{d.ownershipLabel}</span>
                                  </div>
                                  <div className="space-y-1 text-[11px]">
                                    <div className="flex justify-between"><span className="text-indigo-300">2D 原画概念:</span><strong className="font-mono">{d['2D原画']} 件</strong></div>
                                    <div className="flex justify-between"><span className="text-emerald-300">3D 建模工程:</span><strong className="font-mono">{d['3D建模']} 件</strong></div>
                                    <div className="flex justify-between"><span className="text-cyan-300">平面 VI 卡面:</span><strong className="font-mono">{d['平面卡面']} 件</strong></div>
                                    <div className="flex justify-between"><span className="text-pink-300">包装与刀模:</span><strong className="font-mono">{d['包装刀模']} 件</strong></div>
                                    <div className="flex justify-between"><span className="text-amber-300">美陈与陈列:</span><strong className="font-mono">{d['美陈陈列']} 件</strong></div>
                                    <div className="flex justify-between"><span className="text-purple-300">实拍与视频:</span><strong className="font-mono">{d['实拍打样'] + d['宣传视频']} 件</strong></div>
                                  </div>
                                  <div className="border-t border-slate-700/80 pt-1.5 flex justify-between font-bold text-white">
                                    <span>合计总量 / 存储:</span>
                                    <span className="text-indigo-400 font-mono">{d.assetCount} 件 · {d.storageGB} GB</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                        <Bar dataKey="2D原画" stackId="a" fill="#6366f1" />
                        <Bar dataKey="3D建模" stackId="a" fill="#10b981" />
                        <Bar dataKey="平面卡面" stackId="a" fill="#06b6d4" />
                        <Bar dataKey="包装刀模" stackId="a" fill="#ec4899" />
                        <Bar dataKey="美陈陈列" stackId="a" fill="#f59e0b" />
                        <Bar dataKey="实拍打样" stackId="a" fill="#8b5cf6" />
                        <Bar dataKey="宣传视频" stackId="a" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    ) : assetStatsChartType === 'STORAGE_GB' ? (
                      <BarChart data={assetStatsIpDistribution} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="shortName" 
                          tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: '#64748b' }} 
                          axisLine={false} 
                          tickLine={false}
                          label={{ value: '存储占用 (GB)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5">
                                  <p className="font-bold text-cyan-300 text-sm">{d.name}</p>
                                  <p className="text-[11px] text-slate-300">存储占用: <strong className="text-white font-mono">{d.storageGB} GB</strong> ({d.storageMB} MB)</p>
                                  <p className="text-[11px] text-slate-300">物料总量: <strong className="text-white font-mono">{d.assetCount} 件</strong></p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="storageGB" name="存储空间 (GB)" fill="#06b6d4" radius={[8, 8, 0, 0]}>
                          {assetStatsIpDistribution.map((entry, idx) => (
                            <Cell key={`cell-storage-${idx}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <BarChart data={assetStatsIpDistribution} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="shortName" 
                          tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: '#64748b' }} 
                          axisLine={false} 
                          tickLine={false}
                          label={{ value: '资产上传量 (件)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5">
                                  <p className="font-bold text-indigo-300 text-sm">{d.name}</p>
                                  <p className="text-[11px] text-slate-300">入库物料: <strong className="text-white font-mono">{d.assetCount} 件</strong></p>
                                  <p className="text-[11px] text-slate-300">存储占用: <strong className="text-white font-mono">{d.storageGB} GB</strong></p>
                                  <p className="text-[10px] text-slate-400">所属类别: {d.ownershipLabel}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="assetCount" name="资产上传量 (件)" fill="#6366f1" radius={[8, 8, 0, 0]}>
                          {assetStatsIpDistribution.map((entry, idx) => (
                            <Cell key={`cell-count-${idx}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right: IP Inventory Highlights */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <h4 className="text-xs font-black text-slate-900">IP 资产体量排名前列</h4>
                  <span className="text-[10px] font-bold text-slate-400">共 {assetStatsIpDistribution.length} 个 IP</span>
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                  {assetStatsIpDistribution.slice(0, 5).map((item, idx) => (
                    <div 
                      key={item.id}
                      onClick={() => setAssetStatsSelectedIpId(assetStatsSelectedIpId === item.id ? null : item.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        assetStatsSelectedIpId === item.id
                          ? 'bg-indigo-50/80 border-indigo-300 shadow-xs'
                          : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            idx === 0 ? 'bg-amber-400 text-amber-950 font-black' :
                            idx === 1 ? 'bg-slate-300 text-slate-800 font-black' :
                            idx === 2 ? 'bg-amber-700 text-white font-black' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className="text-xs font-black font-mono text-indigo-600">{item.assetCount} 件</span>
                          <span className="text-[10px] font-mono text-slate-400">({item.storageGB}G)</span>
                        </div>
                      </div>

                      {/* Format Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {item.formatBreakdown.PSD > 0 && (
                          <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-100">
                            PSD:{item.formatBreakdown.PSD}
                          </span>
                        )}
                        {item.formatBreakdown['3D'] > 0 && (
                          <span className="text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-100">
                            3D:{item.formatBreakdown['3D']}
                          </span>
                        )}
                        {item.formatBreakdown.AI > 0 && (
                          <span className="text-[9px] font-mono font-bold bg-orange-50 text-orange-700 px-1.5 py-0.2 rounded border border-orange-100">
                            AI:{item.formatBreakdown.AI}
                          </span>
                        )}
                        {item.formatBreakdown.Image > 0 && (
                          <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-100">
                            图:{item.formatBreakdown.Image}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: 文件类型占比与 7 阶段研发品类构成 (Dual Donut Charts + Format Table) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: File Format Distribution Donut */}
            <div className="lg:col-span-6 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
                      <i className="fa-solid fa-file-code"></i>
                    </div>
                    <h3 className="text-base font-black text-slate-900">工程文件格式与扩展名占比</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-bold">按格式分类</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  分层源文件 (PSD/AI) 与 3D 数模是全库核心资产与存储主要构成
                </p>
              </div>

              <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetStatsFileTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {assetStatsFileTypeData.map((entry, index) => (
                        <Cell key={`cell-fmt-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1">
                              <p className="font-bold text-indigo-300 text-sm">{d.name}</p>
                              <p className="text-[11px] text-slate-300">物料总量: <strong className="text-white font-mono">{d.count} 件 ({d.percent}%)</strong></p>
                              <p className="text-[11px] text-slate-300">存储占用: <strong className="text-white font-mono">{d.storageGB} GB ({d.storagePercent}%)</strong></p>
                              <p className="text-[10px] text-slate-400">{d.desc}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900">{assets.length}</span>
                  <span className="text-[10px] font-bold text-slate-400">总物料数</span>
                </div>
              </div>

              {/* Legend Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                {assetStatsFileTypeData.slice(0, 6).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50/80 p-2 rounded-xl border border-slate-200/60 text-xs">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                      <span className="font-bold text-slate-700 truncate text-[11px]">{item.shortName}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 shrink-0 text-[11px]">{item.count}件 ({item.percent}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: 7-Stage Category Distribution Donut */}
            <div className="lg:col-span-6 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold">
                      <i className="fa-solid fa-shapes"></i>
                    </div>
                    <h3 className="text-base font-black text-slate-900">7 阶段研发品类覆盖结构</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-bold">全流程链路</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  从 2D 原画概念、3D 建模到包装打样与宣发视频的全链路物料结构
                </p>
              </div>

              <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetStatsCategoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {assetStatsCategoryDistribution.map((entry, index) => (
                        <Cell key={`cell-cat-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1">
                              <p className="font-bold text-indigo-300 text-sm">{d.name}</p>
                              <p className="text-[11px] text-slate-300">物料总量: <strong className="text-white font-mono">{d.count} 件</strong></p>
                              <p className="text-[11px] text-slate-300">全库占比: <strong className="text-white font-mono">{d.percent}%</strong></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-purple-600">7</span>
                  <span className="text-[10px] font-bold text-slate-400">阶段链路</span>
                </div>
              </div>

              {/* Legend Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                {assetStatsCategoryDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50/80 p-2 rounded-xl border border-slate-200/60 text-xs">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                      <span className="font-bold text-slate-700 truncate text-[11px]">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 shrink-0 text-[11px]">{item.count}件 ({item.percent}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 3: 近期活跃趋势与吞吐波形 (Recharts ComposedChart: Upload, Version, Download) */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
                    <i className="fa-solid fa-chart-line"></i>
                  </div>
                  <h3 className="text-base font-black text-slate-900">近期资产活跃趋势与吞吐走势分析</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  综合追踪新物料入库波形、版本迭代频次、下游调取下载与跨部门协同规模
                </p>
              </div>

              {/* Metric Indicator Switcher */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
                <button
                  onClick={() => setAssetStatsTrendMetric('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    assetStatsTrendMetric === 'ALL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  全量综合
                </button>
                <button
                  onClick={() => setAssetStatsTrendMetric('UPLOADS')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    assetStatsTrendMetric === 'UPLOADS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  新入库量
                </button>
                <button
                  onClick={() => setAssetStatsTrendMetric('VERSIONS')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    assetStatsTrendMetric === 'VERSIONS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  版本迭代
                </button>
                <button
                  onClick={() => setAssetStatsTrendMetric('DOWNLOADS')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    assetStatsTrendMetric === 'DOWNLOADS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  调取下载
                </button>
              </div>
            </div>

            {/* Composed Chart Visual */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={assetStatsRecentTrendData} margin={{ top: 15, right: 20, left: -10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="statsUploadGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="period" 
                      tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false}
                      label={{ value: '吞吐频次 (次/件)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[190px]">
                              <p className="font-bold text-indigo-300 text-sm border-b border-slate-700/80 pb-1">{label} 资产活动</p>
                              <div className="space-y-1 text-[11px]">
                                <div className="flex justify-between"><span className="text-indigo-300">新资产入库:</span><strong className="font-mono">{payload.find(p => p.dataKey === 'uploads')?.value || 0} 件</strong></div>
                                <div className="flex justify-between"><span className="text-amber-300">版本升级迭代:</span><strong className="font-mono">{payload.find(p => p.dataKey === 'versions')?.value || 0} 次</strong></div>
                                <div className="flex justify-between"><span className="text-emerald-300">物料调取下载:</span><strong className="font-mono">{payload.find(p => p.dataKey === 'downloads')?.value || 0} 次</strong></div>
                                <div className="flex justify-between"><span className="text-rose-300">活跃协同人数:</span><strong className="font-mono">{payload.find(p => p.dataKey === 'activeUsers')?.value || 0} 人</strong></div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />

                    {(assetStatsTrendMetric === 'ALL' || assetStatsTrendMetric === 'UPLOADS') && (
                      <Area 
                        type="monotone" 
                        dataKey="uploads" 
                        name="新物料入库量" 
                        stroke="#6366f1" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#statsUploadGrad)" 
                      />
                    )}

                    {(assetStatsTrendMetric === 'ALL' || assetStatsTrendMetric === 'VERSIONS') && (
                      <Bar 
                        dataKey="versions" 
                        name="版本升级迭代" 
                        fill="#f59e0b" 
                        radius={[6, 6, 0, 0]} 
                        barSize={18} 
                      />
                    )}

                    {(assetStatsTrendMetric === 'ALL' || assetStatsTrendMetric === 'DOWNLOADS') && (
                      <Line 
                        type="monotone" 
                        dataKey="downloads" 
                        name="资产调取下载" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#10b981' }} 
                      />
                    )}

                    {assetStatsTrendMetric === 'ALL' && (
                      <Line 
                        type="monotone" 
                        dataKey="activeUsers" 
                        name="活跃协同人员" 
                        stroke="#f43f5e" 
                        strokeWidth={2} 
                        strokeDasharray="4 4" 
                        dot={{ r: 3, fill: '#f43f5e' }} 
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom 4 Trend Takeaway Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">周期入库峰值</span>
                <p className="text-lg font-black text-indigo-600 mt-1">
                  {Math.max(...assetStatsRecentTrendData.map(d => d.uploads))} <span className="text-xs font-normal text-slate-500">件/周期</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">主峰值由潮玩研发与卡牌部贡献</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">版本迭代升级比</span>
                <p className="text-lg font-black text-amber-600 mt-1">
                  {(assetStatsRecentTrendData.reduce((s, d) => s + d.versions, 0) / (assetStatsRecentTrendData.reduce((s, d) => s + d.uploads, 0) || 1) * 100).toFixed(1)}%
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">平均每件资产经历 1.4 次迭代</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">资产调取流通比</span>
                <p className="text-lg font-black text-emerald-600 mt-1">
                  {(assetStatsRecentTrendData.reduce((s, d) => s + d.downloads, 0) / (assetStatsRecentTrendData.reduce((s, d) => s + d.uploads, 0) || 1)).toFixed(1)}x
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">下游生产/打样调取频次高</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">全库协同创作者</span>
                <p className="text-lg font-black text-rose-600 mt-1">
                  {Math.max(...assetStatsRecentTrendData.map(d => d.activeUsers))} <span className="text-xs font-normal text-slate-500">位设计师/PM</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">跨 6 大事业部与外部工坊</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: IP RANKING (IP 维度深度统计与排行) */}
      {/* ========================================================================= */}
      {activeTab === 'IP_RANKING' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Filter Bar & Sort Controls */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="搜索 IP 名称或品类..."
                  value={ipSearchQuery}
                  onChange={(e) => setIpSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-400 transition-colors"
                />
              </div>

              {/* Ownership Filter */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                <button
                  onClick={() => setIpOwnershipFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    ipOwnershipFilter === 'ALL' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  全部 ({ips.length})
                </button>
                <button
                  onClick={() => setIpOwnershipFilter('ORIGINAL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    ipOwnershipFilter === 'ORIGINAL' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  自有原创 ({originalIpsCount})
                </button>
                <button
                  onClick={() => setIpOwnershipFilter('LICENSED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    ipOwnershipFilter === 'LICENSED' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  三方授权 ({licensedIpsCount})
                </button>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
              <span className="text-xs text-slate-400 font-bold">排序维度:</span>
              <select
                value={ipSortBy}
                onChange={(e) => setIpSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-400 transition-colors"
              >
                <option value="ASSET_COUNT">按资产总量 (从多到少)</option>
                <option value="STORAGE">按存储容量 (MB)</option>
                <option value="ACTIVITY">按活跃度综合积分</option>
                <option value="PIPELINE_SCORE">按全链路覆盖率 (%)</option>
              </select>
            </div>
          </div>

          {/* IP Comparison & Trend Chart Section */}
          <div className="bg-white p-7 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {ipChartMode === 'BAR' && 'IP 资产体量与权属规模对比'}
                  {ipChartMode === 'TREND_LINE' && '主力 IP 资产产出增长趋势折线图 (Output Growth)'}
                  {ipChartMode === 'STAGE_STACK' && 'IP 7大阶段物料构成堆叠分析 (Stage Breakdown)'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {ipChartMode === 'BAR' && '柱状高度代表归档资产总件数，颜色区分自有原创与授权'}
                  {ipChartMode === 'TREND_LINE' && '追踪主力 IP 近 6 个月历史资产沉淀与物料产出累积曲线'}
                  {ipChartMode === 'STAGE_STACK' && '对比各 IP 在 2D/3D/平面/包装/陈列/实拍/视频 7 阶段物料储备'}
                </p>
              </div>

              {/* Chart Mode Toggle */}
              <div className="flex items-center space-x-2 shrink-0">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                  <button
                    onClick={() => setIpChartMode('BAR')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      ipChartMode === 'BAR' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <i className="fa-solid fa-chart-simple text-[11px]"></i>
                    <span>资产总量柱状图</span>
                  </button>
                  <button
                    onClick={() => setIpChartMode('TREND_LINE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      ipChartMode === 'TREND_LINE' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <i className="fa-solid fa-chart-line text-[11px]"></i>
                    <span>产出趋势折线图</span>
                  </button>
                  <button
                    onClick={() => setIpChartMode('STAGE_STACK')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      ipChartMode === 'STAGE_STACK' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <i className="fa-solid fa-layer-group text-[11px]"></i>
                    <span>7阶段构成堆叠</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Chart Render Area */}
            <div className="h-72 w-full">
              {ipChartMode === 'BAR' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredIpRanking} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl text-xs space-y-1.5">
                              <p className="font-black text-white text-sm">{d.name} ({d.englishName})</p>
                              <p className="text-indigo-300 font-bold">归档资产: {d.assetCount} 件 ({d.totalSizeFormatted})</p>
                              <p className="text-emerald-300">活跃积分: {d.activityScore} 分</p>
                              <p className="text-amber-300">链路完整度: {d.pipelineScore}% ({d.stageCoverageCount}/7 阶段)</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="assetCount" radius={[8, 8, 0, 0]} barSize={38}>
                      {filteredIpRanking.map((entry, idx) => (
                        <Cell key={`ip-bar-${idx}`} fill={entry.ownership === 'ORIGINAL' ? '#6366f1' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {ipChartMode === 'TREND_LINE' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ipTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '11px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    {ips.slice(0, 5).map((ip, idx) => {
                      const colors = ['#6366f1', '#10b981', '#ec4899', '#f59e0b', '#06b6d4'];
                      return (
                        <Line
                          key={ip.id}
                          type="monotone"
                          dataKey={ip.name}
                          stroke={colors[idx % colors.length]}
                          strokeWidth={2.5}
                          dot={{ r: 3.5, fill: colors[idx % colors.length] }}
                          activeDot={{ r: 6 }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              )}

              {ipChartMode === 'STAGE_STACK' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ipStageStackData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '11px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="2D原画" stackId="a" fill="#6366f1" />
                    <Bar dataKey="3D工程" stackId="a" fill="#10b981" />
                    <Bar dataKey="平面设计" stackId="a" fill="#06b6d4" />
                    <Bar dataKey="包装结构" stackId="a" fill="#ec4899" />
                    <Bar dataKey="陈列道具" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="实拍照片" stackId="a" fill="#8b5cf6" />
                    <Bar dataKey="宣传视频" stackId="a" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* IP Ranking Detailed Table / Leaderboard */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-base">全库 IP 产出榜单与阶段成熟度矩阵</h3>
                <p className="text-xs text-slate-400 mt-0.5">监控每个 IP 的 7 阶段配套完整率、版本迭代活跃度与批次沉淀</p>
              </div>
              <span className="text-xs text-slate-400 font-bold">共 {filteredIpRanking.length} 个 IP 档案</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">排名</th>
                    <th className="px-6 py-4">IP 档案</th>
                    <th className="px-6 py-4">权属性质</th>
                    <th className="px-6 py-4">资产数量 / 存储</th>
                    <th className="px-6 py-4">7 阶段全链路覆盖矩阵</th>
                    <th className="px-6 py-4">版本迭代 / 互动</th>
                    <th className="px-6 py-4 text-right">活跃积分</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredIpRanking.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Rank Badge */}
                      <td className="px-6 py-4">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                          index === 0 ? 'bg-amber-100 text-amber-800' :
                          index === 1 ? 'bg-slate-200 text-slate-800' :
                          index === 2 ? 'bg-amber-700/10 text-amber-900' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {index + 1}
                        </span>
                      </td>

                      {/* IP Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.coverImage || 'https://picsum.photos/seed/ip/100/100'}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                            alt=""
                          />
                          <div>
                            <span className="font-black text-slate-900 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">{item.englishName}</span>
                          </div>
                        </div>
                      </td>

                      {/* Ownership */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          item.ownership === 'ORIGINAL'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {item.ownership === 'ORIGINAL' ? '自有原创' : '官方授权'}
                        </span>
                      </td>

                      {/* Asset Count & Size */}
                      <td className="px-6 py-4">
                        <span className="font-black text-slate-900 text-sm">{item.assetCount}</span>
                        <span className="text-slate-400 text-xs ml-1">件</span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {item.totalSizeFormatted} · {item.batchCount} 批次
                        </span>
                      </td>

                      {/* 7 Stages Pipeline Coverage Matrix */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            {[
                              { key: 'is2D', label: '2D' },
                              { key: 'is3D', label: '3D' },
                              { key: 'isGraphic', label: '平面' },
                              { key: 'isPackaging', label: '包装' },
                              { key: 'isDisplay', label: '陈列' },
                              { key: 'isPhoto', label: '实拍' },
                              { key: 'isVideo', label: '视频' }
                            ].map(stage => {
                              const hasStage = (item.stageBreakdown as any)[stage.key];
                              return (
                                <span
                                  key={stage.key}
                                  title={`${stage.label}: ${hasStage ? '已具备资产' : '暂无物料'}`}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                    hasStage
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-slate-100 text-slate-300'
                                  }`}
                                >
                                  {stage.label}
                                </span>
                              );
                            })}
                          </div>
                          <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full rounded-full transition-all"
                              style={{ width: `${item.pipelineScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Version & Interactions */}
                      <td className="px-6 py-4">
                        <span className="text-slate-700 font-bold block">{item.versionCount} 次迭代</span>
                        <span className="text-slate-400 text-[10px] block">{item.commentCount} 条评审讨论</span>
                      </td>

                      {/* Activity Score */}
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono font-black text-indigo-600 text-sm">
                          {item.activityScore}
                        </span>
                        <span className="text-[10px] text-slate-400 block">综合热度</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TENANT CONTRIBUTION (租户/部门 贡献度分析与排行) */}
      {/* ========================================================================= */}
      {activeTab === 'TENANT_CONTRIBUTION' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Category Filter */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">业务租户与协同部门矩阵</h3>
              <p className="text-xs text-slate-400 mt-0.5">监控各事业部、正版授权方及外包工作室的物料产出与存储资源占用</p>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setTenantCategoryFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tenantCategoryFilter === 'ALL' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
                }`}
              >
                全部租户 ({SYSTEM_TENANTS.length})
              </button>
              <button
                onClick={() => setTenantCategoryFilter('INTERNAL')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tenantCategoryFilter === 'INTERNAL' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
                }`}
              >
                内部研发中心 (4)
              </button>
              <button
                onClick={() => setTenantCategoryFilter('PARTNER')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tenantCategoryFilter === 'PARTNER' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-500'
                }`}
              >
                官方正版授权方 (1)
              </button>
              <button
                onClick={() => setTenantCategoryFilter('EXTERNAL')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tenantCategoryFilter === 'EXTERNAL' ? 'bg-white text-amber-600 shadow-2xs' : 'text-slate-500'
                }`}
              >
                签约合作工作室 (1)
              </button>
            </div>
          </div>

          {/* Interactive Tenant Contribution & Activity Visualization Panel */}
          <div className="bg-white p-7 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {tenantChartMode === 'ACTIVITY_STACKED' && '各租户业务活跃度柱状图 (Activity Breakdown)'}
                  {tenantChartMode === 'CONTRIBUTION_RANK' && '租户与部门综合贡献度指数排行 (Contribution Score)'}
                  {tenantChartMode === 'STORAGE_QUOTA' && '租户存储空间占用与配额吞吐对比 (Storage & Quota)'}
                  {tenantChartMode === 'MONTHLY_TREND' && '核心部门月度物料产出与协作趋势折线图 (Monthly Trend)'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {tenantChartMode === 'ACTIVITY_STACKED' && '多维对比各租户在入库批次、版本升级和评审互动上的活跃度分布'}
                  {tenantChartMode === 'CONTRIBUTION_RANK' && '依据物料吞吐、迭代频度与评审深度加权得出的综合贡献力'}
                  {tenantChartMode === 'STORAGE_QUOTA' && '监控各事业部已用 GB 存储量与分配配额上限'}
                  {tenantChartMode === 'MONTHLY_TREND' && '追踪玩具、卡牌、营销等核心租户近半年资产沉淀走势'}
                </p>
              </div>

              {/* Chart Switcher Buttons */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 shrink-0">
                <button
                  onClick={() => setTenantChartMode('ACTIVITY_STACKED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    tenantChartMode === 'ACTIVITY_STACKED' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <i className="fa-solid fa-chart-column text-[11px]"></i>
                  <span>活跃度多维柱状图</span>
                </button>
                <button
                  onClick={() => setTenantChartMode('CONTRIBUTION_RANK')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    tenantChartMode === 'CONTRIBUTION_RANK' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <i className="fa-solid fa-ranking-star text-[11px]"></i>
                  <span>贡献指数排行</span>
                </button>
                <button
                  onClick={() => setTenantChartMode('MONTHLY_TREND')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    tenantChartMode === 'MONTHLY_TREND' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <i className="fa-solid fa-chart-line text-[11px]"></i>
                  <span>月度产出趋势折线图</span>
                </button>
                <button
                  onClick={() => setTenantChartMode('STORAGE_QUOTA')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    tenantChartMode === 'STORAGE_QUOTA' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <i className="fa-solid fa-hard-drive text-[11px]"></i>
                  <span>存储吞吐分析</span>
                </button>
              </div>
            </div>

            {/* Chart Area */}
            <div className="h-72 w-full">
              {tenantChartMode === 'ACTIVITY_STACKED' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tenantActivityBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '11px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="入库物料(件)" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="版本升级(次)" stackId="a" fill="#10b981" />
                    <Bar dataKey="评审互动(条)" stackId="a" fill="#ec4899" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {tenantChartMode === 'CONTRIBUTION_RANK' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tenantActivityBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl text-xs space-y-1.5">
                              <p className="font-black text-white text-sm">{d.fullName} ({d.code})</p>
                              <p className="text-indigo-300 font-bold">综合贡献指数: {d['贡献指数']} 分</p>
                              <p className="text-emerald-300">归档资产: {d['入库物料(件)']} 件</p>
                              <p className="text-pink-300">升级/评审: {d['版本升级(次)']} 次 / {d['评审互动(条)']} 条</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="贡献指数" radius={[8, 8, 0, 0]} barSize={42}>
                      {tenantActivityBarData.map((entry, idx) => (
                        <Cell key={`tenant-rank-bar-${idx}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {tenantChartMode === 'MONTHLY_TREND' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tenantMonthlyTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '11px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line type="monotone" dataKey="玩具研发部" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3.5 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="卡牌工程部" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3.5 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="营销视觉中心" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3.5 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="衍生周边部" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3.5 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="正版授权方" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3.5 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {tenantChartMode === 'STORAGE_QUOTA' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tenantActivityBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '11px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="存储已用(GB)" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Tenant Contribution Leaderboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTenants.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-indigo-300 transition-all space-y-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-xs shrink-0"
                        style={{ backgroundColor: item.color }}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">{item.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono font-bold block">{item.code}</span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      item.category === 'INTERNAL' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      item.category === 'PARTNER' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {item.category === 'INTERNAL' ? '内部研发' : item.category === 'PARTNER' ? '官方授权方' : '签约外包'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                    {item.tenant.description}
                  </p>

                  {/* 4 Core Contribution Metrics */}
                  <div className="grid grid-cols-2 gap-2.5 mt-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">归档物料</span>
                      <strong className="text-slate-900 font-black text-sm">{item.assetCount} 件</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">入库批次</span>
                      <strong className="text-indigo-600 font-black text-sm">{item.uploadBatchesCount} 批</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">版本升级</span>
                      <strong className="text-emerald-600 font-black text-sm">{item.versionUpdates} 次</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">评审互动</span>
                      <strong className="text-pink-600 font-black text-sm">{item.commentInteractions} 条</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  {/* Storage Quota Progress */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">存储空间占用</span>
                      <span className="font-mono font-bold text-slate-700">
                        {item.storageUsedGB} GB / {item.tenant.storageQuotaGB} GB ({item.quotaUsagePercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(5, item.quotaUsagePercent)}%`,
                          backgroundColor: item.quotaUsagePercent > 80 ? '#ef4444' : item.color
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Bottom Index */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400 font-medium">负责负责人: <strong className="text-slate-700">{item.tenant.leader}</strong></span>
                    <span className="text-xs font-black" style={{ color: item.color }}>
                      贡献指数 {item.contributionIndex}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Radar Chart & Top Contributor Staff */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Radar Multi-dimensional Comparison */}
            <div className="lg:col-span-2 bg-white p-7 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">核心租户 5 维贡献能力雷达图</h3>
                  <p className="text-xs text-slate-400 mt-0.5">对比各事业部在产出量、批次频次、迭代活跃、评审互动与存储吞吐上的分布</p>
                </div>
                <div className="flex items-center space-x-3 text-xs font-bold">
                  <span className="text-indigo-600 font-black">■ 玩具研发部</span>
                  <span className="text-pink-600 font-black">■ 卡牌工程部</span>
                  <span className="text-cyan-600 font-black">■ 营销视觉中心</span>
                </div>
              </div>

              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={90} data={tenantRadarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="玩具研发部" dataKey="TOY" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                    <Radar name="卡牌工程部" dataKey="CARD" stroke="#ec4899" fill="#ec4899" fillOpacity={0.25} />
                    <Radar name="营销视觉中心" dataKey="MKT" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Individual Contributors Leaderboard */}
            <div className="bg-white p-7 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900">骨干成员活跃贡献榜</h3>
                <p className="text-xs text-slate-400 mt-0.5">统计个人入库、升级与评审总积分</p>
              </div>

              <div className="space-y-3.5">
                {topContributors.map((c, idx) => (
                  <div key={c.user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/60 transition-colors">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="relative">
                        <img src={c.user.avatar} className="w-9 h-9 rounded-full object-cover border border-slate-200" alt="" />
                        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full font-black text-[9px] flex items-center justify-center ${
                          idx === 0 ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-white'
                        }`}>
                          {idx + 1}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-black text-xs text-slate-900 block truncate">{c.user.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium block truncate">
                          {c.uploads} 入库 · {c.updates} 升级 · {c.comments} 评审
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-black text-indigo-600 block">{c.totalScore}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">贡献值</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={onNavigateToAssets}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors text-center"
              >
                查看资产协作详情
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ACTIVITY AUDIT (全库活动日志与审计追溯) */}
      {/* ========================================================================= */}
      {activeTab === 'ACTIVITY_AUDIT' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Advanced Multi-Filters Bar */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="relative flex-1 w-full">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="搜索操作人、关联 IP、物料 ID、批次号或修改描述..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-400 transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {/* Event Type Filter */}
                <select
                  value={auditTypeFilter}
                  onChange={(e) => setAuditTypeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-400 transition-colors"
                >
                  <option value="ALL">全部活动类型</option>
                  <option value="UPLOAD_BATCH">资产批次入库</option>
                  <option value="VERSION_UPDATE">物料版本升级</option>
                  <option value="COMMENT">设计评审与讨论</option>
                  <option value="LIBRARY_PUBLISH">图库空间发布</option>
                  <option value="STAGE_CHANGE">规范与状态流转</option>
                </select>

                {/* IP Filter */}
                <select
                  value={auditIpFilter}
                  onChange={(e) => setAuditIpFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-400 transition-colors"
                >
                  <option value="ALL">全部关联 IP</option>
                  {ips.map(ip => (
                    <option key={ip.id} value={ip.id}>{ip.name}</option>
                  ))}
                </select>

                {/* Tenant Filter */}
                <select
                  value={auditTenantFilter}
                  onChange={(e) => setAuditTenantFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-400 transition-colors"
                >
                  <option value="ALL">全部所属租户</option>
                  {SYSTEM_TENANTS.map(t => (
                    <option key={t.code} value={t.code}>{t.name}</option>
                  ))}
                </select>

                <button
                  onClick={handleExportAuditReport}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <i className="fa-solid fa-download"></i>
                  <span>导出日志</span>
                </button>
              </div>
            </div>

            {/* Quick Stat Pill Filter Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
                分类快捷筛选:
              </span>
              {[
                { type: 'ALL', label: '全部', count: fullActivityLogs.length, color: 'text-slate-700 bg-slate-100' },
                { type: 'UPLOAD_BATCH', label: '入库记录', count: fullActivityLogs.filter(l => l.type === 'UPLOAD_BATCH').length, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
                { type: 'VERSION_UPDATE', label: '版本迭代', count: fullActivityLogs.filter(l => l.type === 'VERSION_UPDATE').length, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                { type: 'COMMENT', label: '设计评审', count: fullActivityLogs.filter(l => l.type === 'COMMENT').length, color: 'text-pink-700 bg-pink-50 border-pink-200' },
                { type: 'LIBRARY_PUBLISH', label: '图库发布', count: fullActivityLogs.filter(l => l.type === 'LIBRARY_PUBLISH').length, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' }
              ].map(badge => (
                <button
                  key={badge.type}
                  onClick={() => setAuditTypeFilter(badge.type)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                    auditTypeFilter === badge.type
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : `${badge.color} border-transparent hover:border-slate-300`
                  }`}
                >
                  <span>{badge.label}</span>
                  <span className="ml-1 opacity-70">({badge.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Audit Logs Interactive Timeline & List */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-base">企业活动审计流水 (Audit Trail)</h3>
                <p className="text-xs text-slate-400 mt-0.5">详细记录资产入库、唯一 ID 索引绑定、版本流转与跨团队协同轨迹</p>
              </div>
              <span className="text-xs text-slate-500 font-bold">
                当前匹配: <strong className="text-indigo-600">{filteredAuditLogs.length}</strong> / {fullActivityLogs.length} 条记录
              </span>
            </div>

            {filteredAuditLogs.length === 0 ? (
              <div className="p-16 text-center text-slate-400">
                <i className="fa-solid fa-inbox text-4xl mb-3 opacity-40"></i>
                <p className="text-sm font-bold text-slate-600">未找到符合当前筛选条件的活动审计记录</p>
                <p className="text-xs text-slate-400 mt-1">请尝试清除或调整搜索关键字与分类条件</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredAuditLogs.map(log => {
                  const isExpanded = expandedLogId === log.id;
                  const typeStyles = {
                    UPLOAD_BATCH: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: 'fa-cloud-arrow-up' },
                    VERSION_UPDATE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'fa-code-branch' },
                    COMMENT: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', icon: 'fa-comments' },
                    LIBRARY_PUBLISH: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: 'fa-book-bookmark' },
                    STAGE_CHANGE: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: 'fa-arrow-progress' },
                    PERMISSION: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'fa-user-shield' }
                  }[log.type] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: 'fa-bolt' };

                  return (
                    <div
                      key={log.id}
                      className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors cursor-pointer space-y-3"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start sm:items-center space-x-3.5">
                          {/* Type Icon */}
                          <div className={`w-9 h-9 rounded-xl ${typeStyles.bg} ${typeStyles.text} flex items-center justify-center text-sm border ${typeStyles.border} shrink-0`}>
                            <i className={`fa-solid ${typeStyles.icon}`}></i>
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${typeStyles.bg} ${typeStyles.text} ${typeStyles.border}`}>
                                {log.typeName}
                              </span>
                              <span className="text-xs font-black text-slate-900">
                                {log.user.name}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                ({log.tenantName})
                              </span>
                              {log.metaBadge && (
                                <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                  {log.metaBadge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 font-medium mt-1">
                              {log.description}
                            </p>
                          </div>
                        </div>

                        {/* Right Timestamp & IP Info */}
                        <div className="flex items-center sm:flex-col sm:items-end justify-between text-right shrink-0">
                          <span className="text-[11px] text-slate-400 font-mono font-medium">{log.timestamp}</span>
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50/80 px-2.5 py-0.5 rounded-md mt-1 border border-indigo-100">
                            {log.ipName}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Details Drawer */}
                      {isExpanded && log.details && log.details.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/90 p-4 rounded-2xl space-y-2 animate-fadeIn">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                            本次批次入库物料明细清单:
                          </span>
                          <ul className="space-y-1 text-xs">
                            {log.details.map((item, idx) => (
                              <li key={idx} className="flex items-center space-x-2 text-slate-700 font-mono text-[11px]">
                                <i className="fa-solid fa-angle-right text-indigo-500 text-[10px]"></i>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
