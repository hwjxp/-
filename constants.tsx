import { Asset, ProjectStage, IP, User, BusinessType, ValidationStatus, UserRole, PermissionRequest, UploadRecord, AssetLibrary } from './types';

export const MOCK_IP_LIST: IP[] = [
  {
    id: 'ip-hp',
    name: '哈利波特',
    englishName: 'Harry Potter',
    description: '华纳兄弟官方正版授权经典魔法世界 IP，涵盖霍格沃茨四大学院、经典角色阵容、魔法道具与学院徽章全套正版图库视觉资产。',
    coverImage: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=800&h=500&fit=crop',
    ownership: 'LICENSED',
    categories: ['影视', '游戏', '潮玩', '文学'],
    regions: ['全球', '国内', '欧美'],
    hasAssetLibrary: true,
    visibility: 'PUBLIC',
    adminIds: ['u1', 'u2'],
    viewerIds: ['u3', 'u4'],
    downloaderIds: ['u1', 'u2'],
    createdAt: '2024-01-15 10:00',
    updatedAt: '2024-05-20 16:30',
    changeLogs: [
      { id: 'log-hp-2', operatorName: 'Sarah (PM)', operatorAvatar: 'https://i.pravatar.cc/150?u=sarah', action: 'UPDATE_TAGS', description: '更新 2024 夏季全球授权规范与图库指南', timestamp: '2024-05-20 16:30' },
      { id: 'log-hp-1', operatorName: 'Alex (Super Admin)', operatorAvatar: 'https://i.pravatar.cc/150?u=alex', action: 'CREATE', description: '录入正版授权 IP《哈利波特》并同步开通四大官方图库本', timestamp: '2024-01-15 10:00' }
    ]
  },
  {
    id: 'ip-poke',
    name: '宝可梦',
    englishName: 'Pokémon',
    description: 'The Pokémon Company 官方正版授权，涵盖皮卡丘、伊布、初代御三家及神兽系列 2D 原画图库、3D 模型与集换式卡牌标准资产。',
    coverImage: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=800&h=500&fit=crop',
    ownership: 'LICENSED',
    categories: ['游戏', '动漫', '潮玩', '卡牌'],
    regions: ['全球', '亚太', '日韩', '欧美'],
    hasAssetLibrary: true,
    visibility: 'PUBLIC',
    adminIds: ['u1'],
    viewerIds: ['u2', 'u3', 'u4'],
    downloaderIds: ['u1', 'u2', 'u3'],
    createdAt: '2024-01-20 14:00',
    updatedAt: '2024-05-22 11:15',
    changeLogs: [
      { id: 'log-poke-2', operatorName: 'Alex (Super Admin)', operatorAvatar: 'https://i.pravatar.cc/150?u=alex', action: 'ENABLE_LIBRARY', description: '发布《世代经典角色图库 Vol.1》与《卡牌标准视觉库》', timestamp: '2024-05-22 11:15' },
      { id: 'log-poke-1', operatorName: 'Alex (Super Admin)', operatorAvatar: 'https://i.pravatar.cc/150?u=alex', action: 'CREATE', description: '创建《宝可梦》授权总档案库', timestamp: '2024-01-20 14:00' }
    ]
  },
  {
    id: 'ip-sanrio',
    name: '三丽鸥',
    englishName: 'Sanrio Characters',
    description: '三丽鸥家族全员视觉资产，包含 Hello Kitty、美乐蒂、酷洛米、大耳狗等超人气角色的春季主题图库、3D盲盒模具及实拍打样档案。',
    coverImage: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&h=500&fit=crop',
    ownership: 'LICENSED',
    categories: ['动漫', '潮玩', '艺术'],
    regions: ['全球', '国内', '日韩', '亚太'],
    hasAssetLibrary: true,
    visibility: 'PUBLIC',
    adminIds: ['u2'],
    viewerIds: ['u1', 'u3', 'u4'],
    downloaderIds: ['u2', 'u4'],
    createdAt: '2024-02-10 11:30',
    updatedAt: '2024-05-15 09:20',
    changeLogs: [
      { id: 'log-sanrio-1', operatorName: 'Sarah (PM)', operatorAvatar: 'https://i.pravatar.cc/150?u=sarah', action: 'CREATE', description: '初始化三丽鸥授权图库，录入 50 周年限定视觉素材', timestamp: '2024-02-10 11:30' }
    ]
  },
  {
    id: 'ip-1',
    name: '赛博霓虹纪元',
    englishName: 'Cyber Neon Genesis',
    description: '以赛博朋克美学为特色的高端自有原创潮玩系列。融合未来机械重工与高饱和荧光色彩，涵盖主宇宙核心角色体系与机甲外骨骼装配图谱。',
    coverImage: 'https://picsum.photos/seed/cyber/800/400',
    ownership: 'ORIGINAL',
    categories: ['潮玩', '游戏', '艺术'],
    regions: ['国内', '全球'],
    hasAssetLibrary: true,
    visibility: 'PUBLIC',
    adminIds: ['u1'],
    viewerIds: [],
    downloaderIds: ['u1', 'u2'],
    createdAt: '2024-03-10 14:20',
    updatedAt: '2024-05-18 10:30',
    changeLogs: [
      { id: 'log-1-3', operatorName: 'Alex (Super Admin)', operatorAvatar: 'https://i.pravatar.cc/150?u=alex', action: 'UPDATE_TAGS', description: '追加类型标签「艺术」并更新全球区域发行范围', timestamp: '2024-05-18 10:30' },
      { id: 'log-1-2', operatorName: 'Sarah (PM)', operatorAvatar: 'https://i.pravatar.cc/150?u=sarah', action: 'ENABLE_LIBRARY', description: '开启关联数字资产图库并完成首批 2D/3D 原画入库', timestamp: '2024-04-02 16:45' },
      { id: 'log-1-1', operatorName: 'Alex (Super Admin)', operatorAvatar: 'https://i.pravatar.cc/150?u=alex', action: 'CREATE', description: '创建 IP 档案《赛博霓虹纪元》，确立自有原创产权', timestamp: '2024-03-10 14:20' }
    ]
  },
  {
    id: 'ip-2',
    name: '神话国度卡牌',
    englishName: 'Mythic Kingdom Cards',
    description: '具有复杂全息工艺的奇幻集换式卡牌游戏。收录古代神话英雄、上古灵兽与法宝阵图，配套高精度烫金印前工程规范。',
    coverImage: 'https://picsum.photos/seed/ancient/800/400',
    ownership: 'LICENSED',
    categories: ['卡牌', '动漫', '体育'],
    regions: ['国内', '亚太'],
    hasAssetLibrary: true,
    visibility: 'PRIVATE',
    adminIds: ['u2'],
    viewerIds: ['u1', 'u3'],
    downloaderIds: ['u2'],
    createdAt: '2024-02-18 09:15',
    updatedAt: '2024-05-12 11:20',
    changeLogs: [
      { id: 'log-2-2', operatorName: 'Sarah (PM)', operatorAvatar: 'https://i.pravatar.cc/150?u=sarah', action: 'UPDATE_INFO', description: '更新授权期限备忘及亚太发行区域打标', timestamp: '2024-05-12 11:20' },
      { id: 'log-2-1', operatorName: 'Sarah (PM)', operatorAvatar: 'https://i.pravatar.cc/150?u=sarah', action: 'CREATE', description: '录入外部授权项目《神话国度卡牌》基本信息与封面', timestamp: '2024-02-18 09:15' }
    ]
  },
  {
    id: 'ip-3',
    name: '漫游星空',
    englishName: 'Astro Bound',
    description: '基于太空探索的盲盒系列。以萌趣宇航服与星际科考仪器为题材，适合轻量化潮流周边及跨界衍生。',
    coverImage: 'https://picsum.photos/seed/space/800/400',
    ownership: 'ORIGINAL',
    categories: ['潮玩', '影视'],
    regions: ['全球'],
    hasAssetLibrary: true,
    visibility: 'PUBLIC',
    adminIds: ['u3'],
    viewerIds: [],
    downloaderIds: [],
    createdAt: '2024-04-05 16:00',
    updatedAt: '2024-04-20 18:30',
    changeLogs: [
      { id: 'log-3-1', operatorName: 'Kenji (Designer)', operatorAvatar: 'https://i.pravatar.cc/150?u=kenji', action: 'CREATE', description: '初始化盲盒企划档案并同步建立公共图库', timestamp: '2024-04-05 16:00' }
    ]
  },
  {
    id: 'ip-4',
    name: '幻兽之境',
    englishName: 'Phantom Beasts',
    description: '异世界奇幻猛兽集合馆。包含巨龙、灵兽、深渊魔物等多元生态插画与概念设定。',
    coverImage: 'https://picsum.photos/seed/beast/800/400',
    ownership: 'LICENSED',
    categories: ['游戏', '动漫'],
    regions: ['欧美', '亚太'],
    hasAssetLibrary: false,
    visibility: 'PUBLIC',
    adminIds: ['u1'],
    viewerIds: [],
    downloaderIds: [],
    createdAt: '2024-05-01 11:00',
    updatedAt: '2024-05-01 11:00',
    changeLogs: [
      { id: 'log-4-1', operatorName: 'Alex (Super Admin)', operatorAvatar: 'https://i.pravatar.cc/150?u=alex', action: 'CREATE', description: '建立授权库待定 IP 档案', timestamp: '2024-05-01 11:00' }
    ]
  }
];

export const MOCK_LIBRARIES: AssetLibrary[] = [
  // 哈利波特图库
  {
    id: 'lib-hp-1',
    ipId: 'ip-hp',
    name: '2024 主题图库视觉指南',
    version: 'v2.4',
    description: '华纳官方 2024 年度主图库，包含四大学院主视觉、金色飞贼徽章与魔法世界典藏图鉴。',
    coverImage: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=600&h=400&fit=crop',
    createdAt: '2024-01-20',
    updatedAt: '2024-05-10',
    status: 'ACTIVE'
  },
  {
    id: 'lib-hp-2',
    ipId: 'ip-hp',
    name: '魔法学院角色与道具特辑',
    version: 'v1.8',
    description: '涵盖哈利、赫敏、罗恩、邓布利多等核心角色立绘原画、魔杖 3D 渲染与实物周边摄影。',
    coverImage: 'https://images.unsplash.com/photo-1547756536-cde3673fa2e5?w=600&h=400&fit=crop',
    createdAt: '2024-02-15',
    updatedAt: '2024-05-18',
    status: 'ACTIVE'
  },
  {
    id: 'lib-hp-3',
    ipId: 'ip-hp',
    name: '霍格沃茨城堡场景空间库',
    version: 'v1.0',
    description: '大礼堂、九又四分之三站台、禁林与对角巷高精度背景插画与实拍陈列物料。',
    coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&h=400&fit=crop',
    createdAt: '2024-03-01',
    updatedAt: '2024-04-20',
    status: 'ACTIVE'
  },

  // 宝可梦图库
  {
    id: 'lib-poke-1',
    ipId: 'ip-poke',
    name: '世代经典角色图库 Vol.1',
    version: 'v3.2',
    description: '皮卡丘、喷火龙、超梦、耿鬼等百只经典宝可梦官方 2D 标准姿势、3D 建模源文件与打样实拍。',
    coverImage: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=600&h=400&fit=crop',
    createdAt: '2024-01-25',
    updatedAt: '2024-05-22',
    status: 'ACTIVE'
  },
  {
    id: 'lib-poke-2',
    ipId: 'ip-poke',
    name: '对战集换卡牌标准视觉库',
    version: 'v2.0',
    description: 'PTCG 风格卡牌框架、闪卡工艺图层、卡背标准刀版及卡砖实拍打样图。',
    coverImage: 'https://images.unsplash.com/photo-1621360841013-c7683c659ec6?w=600&h=400&fit=crop',
    createdAt: '2024-02-28',
    updatedAt: '2024-05-15',
    status: 'ACTIVE'
  },

  // 三丽鸥图库
  {
    id: 'lib-sanrio-1',
    ipId: 'ip-sanrio',
    name: '2024 春季梦幻派对图库',
    version: 'v2.1',
    description: 'Hello Kitty、美乐蒂、库洛米甜美马卡龙色系 2D 原画、3D 模具文件与实体盲盒实拍。',
    coverImage: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&h=400&fit=crop',
    createdAt: '2024-02-12',
    updatedAt: '2024-05-12',
    status: 'ACTIVE'
  },
  {
    id: 'lib-sanrio-2',
    ipId: 'ip-sanrio',
    name: 'Hello Kitty 50周年限定特辑',
    version: 'v1.0',
    description: '金典复古红蓝配色与 50 周年纪念款金属徽章、礼盒包装与实物摆件棚拍摄影。',
    coverImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&h=400&fit=crop',
    createdAt: '2024-03-15',
    updatedAt: '2024-04-30',
    status: 'ACTIVE'
  },

  // 赛博霓虹纪元图库
  {
    id: 'lib-cyber-1',
    ipId: 'ip-1',
    name: '2024 核心主视觉与角色图库',
    version: 'v2.2',
    description: '赛博主角团「霓虹猎手」、「零号机甲」高饱和 2D 概念图、3D 打印模型与涂装实拍。',
    coverImage: 'https://picsum.photos/seed/cyber/600/400',
    createdAt: '2024-03-12',
    updatedAt: '2024-05-18',
    status: 'ACTIVE'
  },
  {
    id: 'lib-cyber-2',
    ipId: 'ip-1',
    name: '重工装备与外骨骼机械图库',
    version: 'v1.4',
    description: '武器配装、外骨骼结构分解图、工业 CAD 模型与装配实景拍摄。',
    coverImage: 'https://picsum.photos/seed/mech/600/400',
    createdAt: '2024-04-01',
    updatedAt: '2024-05-02',
    status: 'ACTIVE'
  },

  // 神话国度卡牌图库
  {
    id: 'lib-mythic-1',
    ipId: 'ip-2',
    name: '上古神兽与文物全息图库',
    version: 'v2.0',
    description: '青铜鼎、玄武神兽、古代战车等古风奇幻 2D 精绘与 3D 浮雕模具、实体卡牌实拍。',
    coverImage: 'https://picsum.photos/seed/ancient/600/400',
    createdAt: '2024-02-20',
    updatedAt: '2024-05-12',
    status: 'ACTIVE'
  },

  // 漫游星空图库
  {
    id: 'lib-astro-1',
    ipId: 'ip-3',
    name: '潮玩盲盒第一弹标准图库',
    version: 'v1.0',
    description: '星际探索者萌趣盲盒 6 款基础款 + 1 款隐藏款全套 2D/3D/实拍打样图库。',
    coverImage: 'https://picsum.photos/seed/space/600/400',
    createdAt: '2024-04-08',
    updatedAt: '2024-04-20',
    status: 'ACTIVE'
  }
];

export const MOCK_ASSETS: Asset[] = [
  // ===== 1. 哈利波特物料 (lib-hp-1 & lib-hp-2) =====
  // 2D 资产
  {
    id: 'HP_EMBLEM_20240510',
    ipId: 'ip-hp',
    libraryId: 'lib-hp-1',
    category: '2D',
    title: '霍格沃茨四大学院院徽矢量集',
    description: '格兰芬多狮子、斯莱特林银蛇、拉文克劳雄鹰与赫奇帕奇獾高精矢量徽章。',
    type: '2D',
    stage: ProjectStage.MARKETING,
    version: 'v2.0',
    tags: ['Hogwarts', 'Vector', 'Emblem', 'Official'],
    thumbnail: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=400&h=300&fit=crop',
    fileSize: '48 MB',
    uploader: 'Warner Creative',
    department: 'DESIGN_DEPT',
    createdAt: '2024-05-10',
    isPublic: true,
    metadata: { format: 'AI / SVG / PSD', resolution: 'Vector / 8000x8000' },
    comments: [
      {
        id: 'cmt-hp1-1',
        author: { id: 'u2', name: 'Sarah (PM)', avatar: 'https://i.pravatar.cc/150?u=sarah', role: 'PM', department: 'TOY_DEPT' },
        content: '院徽四个学院的官方 Pantone 专色已通过华纳总审核对。@Chen (3D Artist) 制作 3D 浮雕徽章时请务必严格按矢量图层分色。',
        timestamp: '2024-05-11 14:20',
        feedbackType: 'APPROVED',
        mentions: ['Chen (3D Artist)'],
        reactions: [{ emoji: '👍', count: 3, userIds: ['u1', 'u3', 'u4'] }, { emoji: '🎯', count: 2, userIds: ['u4', 'u2'] }]
      },
      {
        id: 'cmt-hp1-2',
        author: { id: 'u4', name: 'Chen (3D Artist)', avatar: 'https://i.pravatar.cc/150?u=chen', role: '3D Artist', department: 'TOY_DEPT' },
        content: '收到！斯莱特林蛇身纹理部分在 ZBrush 中会保留 0.3mm 倒角防止开模缩水，预计明天同步第一版白模切片。',
        timestamp: '2024-05-11 16:45',
        feedbackType: 'GENERAL',
        reactions: [{ emoji: '🚀', count: 2, userIds: ['u2', 'u1'] }]
      }
    ]
  },
  {
    id: 'HP_SNITCH_20240512',
    ipId: 'ip-hp',
    libraryId: 'lib-hp-1',
    category: '2D',
    title: '金色飞贼魔法主视觉海报原画',
    description: '魁地奇赛场背景与金色飞贼流光特写概念原画。',
    type: '2D',
    stage: ProjectStage.MARKETING,
    version: 'v1.5',
    tags: ['Quidditch', 'Snitch', 'Poster', 'KeyArt'],
    thumbnail: 'https://images.unsplash.com/photo-1547756536-cde3673fa2e5?w=400&h=300&fit=crop',
    fileSize: '124 MB',
    uploader: 'Warner Creative',
    department: 'DESIGN_DEPT',
    createdAt: '2024-05-12',
    isPublic: true,
    metadata: { format: 'PSD (Layered)', resolution: '6000x4000 300DPI' }
  },
  {
    id: 'HP_HARRY_20240514',
    ipId: 'ip-hp',
    libraryId: 'lib-hp-2',
    category: '2D',
    title: '哈利·波特决斗姿态立绘概念图',
    description: '挥舞十一英寸冬青木魔杖的战斗姿态官方立绘。',
    type: '2D',
    stage: ProjectStage.TOY_2D_COLORED,
    version: 'v2.1',
    tags: ['HarryPotter', 'Character', '2DConcept'],
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=300&fit=crop',
    fileSize: '85 MB',
    uploader: 'Sarah (PM)',
    department: 'DESIGN_DEPT',
    createdAt: '2024-05-14',
    isPublic: true
  },
  // 3D 资产
  {
    id: 'HP_WAND3D_20240515',
    ipId: 'ip-hp',
    libraryId: 'lib-hp-2',
    category: '3D',
    title: '老魔杖 1:1 收藏级 3D 建模源文件',
    description: '接骨木魔杖高多边形雕刻文件，含木质纹理与接骨木节细节。',
    type: '3D',
    stage: ProjectStage.TOY_3D_MODEL,
    version: 'v3.0',
    upstreamAssetIds: ['HP_HARRY_20240514'],
    tags: ['ElderWand', '3DModel', 'PrintReady', 'FBX'],
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop',
    fileSize: '260 MB',
    uploader: 'Chen (3D Artist)',
    department: 'TOY_DEPT',
    createdAt: '2024-05-15',
    isPublic: true,
    metadata: { polyCount: 850000, format: 'ZTL / FBX / OBJ' }
  },
  {
    id: 'HP_CASTLE_20240516',
    ipId: 'ip-hp',
    libraryId: 'lib-hp-1',
    category: '3D',
    title: '霍格沃茨城堡微缩景观 3D 打印切片',
    description: '可直接用于工业级 SLA/DLP 光固化 3D 打印的微缩城堡模型。',
    type: '3D',
    stage: ProjectStage.TOY_3D_MODEL,
    version: 'v1.2',
    upstreamAssetIds: ['HP_EMBLEM_20240510'],
    tags: ['HogwartsCastle', '3DPrint', 'STL'],
    thumbnail: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=400&h=300&fit=crop',
    fileSize: '410 MB',
    uploader: 'Chen (3D Artist)',
    department: 'TOY_DEPT',
    createdAt: '2024-05-16',
    isPublic: true
  },
  // 实拍资产
  {
    id: 'HP_PHOTO1_20240518',
    ipId: 'ip-hp',
    libraryId: 'lib-hp-2',
    category: 'PHOTO',
    title: '官方授权学院魔杖套装棚拍定妆照',
    description: '黑丝绒背景下四款魔杖实物陈列与细节微距摄影原片。',
    type: 'PHOTO',
    stage: ProjectStage.MARKETING,
    version: 'v1.0',
    upstreamAssetIds: ['HP_WAND3D_20240515'],
    tags: ['StudioPhoto', 'WandSet', 'RawPhoto', 'Packaging'],
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=300&fit=crop',
    fileSize: '320 MB',
    uploader: 'Marketing Dept',
    department: 'MARKETING_DEPT',
    createdAt: '2024-05-18',
    isPublic: true,
    metadata: { format: 'CR3 / High-Res TIFF', resolution: '4500万像素 8192x5464' }
  },
  {
    id: 'HP_PHOTO2_20240519',
    ipId: 'ip-hp',
    libraryId: 'lib-hp-1',
    category: 'PHOTO',
    title: '四大学院金属徽章盲盒实物打样摄影',
    description: '镀金/镀银压铸金属实物打样表面光泽与包装实景。',
    type: 'PHOTO',
    stage: ProjectStage.PACKAGING,
    version: 'v1.0',
    upstreamAssetIds: ['HP_EMBLEM_20240510', 'HP_CASTLE_20240516'],
    tags: ['EmblemSample', 'ProductPhoto', 'Showcase'],
    thumbnail: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&h=300&fit=crop',
    fileSize: '180 MB',
    uploader: 'Marketing Dept',
    department: 'MARKETING_DEPT',
    createdAt: '2024-05-19',
    isPublic: true
  },

  // ===== 2. 宝可梦物料 (lib-poke-1 & lib-poke-2) =====
  // 2D 资产
  {
    id: 'POKE_PIKA2D_20240502',
    ipId: 'ip-poke',
    libraryId: 'lib-poke-1',
    category: '2D',
    title: '皮卡丘十万伏特官方动态立绘 PSD',
    description: '官方标准 2D 动作立绘，含多图层闪电特效与光影分层。',
    type: '2D',
    stage: ProjectStage.TOY_2D_COLORED,
    version: 'v2.0',
    tags: ['Pikachu', 'Electric', 'Official2D', 'MasterArt'],
    thumbnail: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=400&h=300&fit=crop',
    fileSize: '95 MB',
    uploader: 'TPC Direct',
    department: 'DESIGN_DEPT',
    createdAt: '2024-05-02',
    isPublic: true
  },
  {
    id: 'POKE_CHAR2D_20240511',
    ipId: 'ip-poke',
    libraryId: 'lib-poke-2',
    category: '2D',
    title: '喷火龙 SAR 特典全息闪卡印刷刀版',
    description: '集换式卡牌正面、烫金工艺图层与镭射光栅遮罩文件。',
    type: '2D',
    stage: ProjectStage.CARD_PRODUCTION,
    version: 'v1.4',
    tags: ['Charizard', 'TradingCard', 'HoloPrint', 'SAR'],
    thumbnail: 'https://images.unsplash.com/photo-1621360841013-c7683c659ec6?w=400&h=300&fit=crop',
    fileSize: '110 MB',
    uploader: 'Kenji (Designer)',
    department: 'CARD_DEPT',
    createdAt: '2024-05-11',
    isPublic: true
  },
  // 3D 资产
  {
    id: 'POKE_MEWTWO_20240513',
    ipId: 'ip-poke',
    libraryId: 'lib-poke-1',
    category: '3D',
    title: '超梦 Mega 觉醒手办级 3D 雕刻工程件',
    description: '超精细肌肉结构、念力特效件分件模型，配备标准注塑拔模角度。',
    type: '3D',
    stage: ProjectStage.TOY_3D_MODEL,
    version: 'v2.5',
    upstreamAssetIds: ['POKE_PIKA2D_20240502'],
    tags: ['Mewtwo', 'MegaForm', '3DModel', 'Splits'],
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
    fileSize: '380 MB',
    uploader: 'Chen (3D Artist)',
    department: 'TOY_DEPT',
    createdAt: '2024-05-13',
    isPublic: true,
    metadata: { polyCount: 1200000, format: 'ZTL / OBJ / STEP' }
  },
  // 实拍资产
  {
    id: 'POKE_PHOTO_20240517',
    ipId: 'ip-poke',
    libraryId: 'lib-poke-1',
    category: 'PHOTO',
    title: '经典御三家景品手办实物涂装棚拍',
    description: '小火龙、杰尼龟、妙蛙种子首发样板涂装打样实拍照。',
    type: 'PHOTO',
    stage: ProjectStage.MARKETING,
    version: 'v1.0',
    upstreamAssetIds: ['POKE_MEWTWO_20240513', 'POKE_PIKA2D_20240502'],
    tags: ['SamplePhoto', 'Starters', 'Showcase', 'Studio'],
    thumbnail: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=300&fit=crop',
    fileSize: '210 MB',
    uploader: 'Marketing Dept',
    department: 'MARKETING_DEPT',
    createdAt: '2024-05-17',
    isPublic: true
  },

  // ===== 3. 三丽鸥物料 (lib-sanrio-1) =====
  // 2D 资产
  {
    id: 'SANRIO_KUROMI_20240508',
    ipId: 'ip-sanrio',
    libraryId: 'lib-sanrio-1',
    category: '2D',
    title: '库洛米甜酷马卡龙主视觉插画',
    description: '2024 春季限定甜酷系列，适用于盲盒外盒与衍生周边。',
    type: '2D',
    stage: ProjectStage.MARKETING,
    version: 'v1.1',
    tags: ['Kuromi', 'PastelPunk', 'Illust', 'Vector'],
    thumbnail: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=300&fit=crop',
    fileSize: '64 MB',
    uploader: 'Sarah (PM)',
    department: 'DESIGN_DEPT',
    createdAt: '2024-05-08',
    isPublic: true
  },
  // 3D 资产
  {
    id: 'SANRIO_KITTY_20240509',
    ipId: 'ip-sanrio',
    libraryId: 'lib-sanrio-1',
    category: '3D',
    title: 'Hello Kitty 50 周年纪念款金冠 3D 模具',
    description: '树脂倒模与金属皇冠精密配合的注塑模具源文件。',
    type: '3D',
    stage: ProjectStage.TOY_3D_MODEL,
    version: 'v2.0',
    upstreamAssetIds: ['SANRIO_KUROMI_20240508'],
    tags: ['HelloKitty', '50thAnniversary', 'MoldDesign'],
    thumbnail: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&h=300&fit=crop',
    fileSize: '175 MB',
    uploader: 'Chen (3D Artist)',
    department: 'TOY_DEPT',
    createdAt: '2024-05-09',
    isPublic: true
  },
  // 实拍资产
  {
    id: 'SANRIO_PHOTO_20240516',
    ipId: 'ip-sanrio',
    libraryId: 'lib-sanrio-1',
    category: 'PHOTO',
    title: '春季甜品派对盲盒全家福实拍定妆照',
    description: '自然柔光室内场景，6 款实物盲盒摆放定妆原片。',
    type: 'PHOTO',
    stage: ProjectStage.MARKETING,
    version: 'v1.0',
    upstreamAssetIds: ['SANRIO_KITTY_20240509', 'SANRIO_KUROMI_20240508'],
    tags: ['ProductPhoto', 'BlindBox', 'FamilySet'],
    thumbnail: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&h=300&fit=crop',
    fileSize: '290 MB',
    uploader: 'Marketing Dept',
    department: 'MARKETING_DEPT',
    createdAt: '2024-05-16',
    isPublic: true
  },

  // ===== 4. 赛博霓虹纪元物料 (lib-cyber-1) =====
  // 3D 资产
  {
    id: 'CYBER_MECH3D_20240515',
    ipId: 'ip-1',
    libraryId: 'lib-cyber-1',
    category: '3D',
    title: '霓虹原型 v1 核心装甲 3D 打印模型',
    description: '核心角色的初始 3D 打印模型，包含外骨骼可动关节。',
    type: '3D',
    stage: ProjectStage.TOY_3D_MODEL,
    version: 'v2.4',
    upstreamAssetIds: ['CYBER_HERO2D_20240514'],
    tags: ['Cyberpunk', 'Toy', '3D', 'Rigged'],
    thumbnail: 'https://picsum.photos/seed/toy3d/400/300',
    fileSize: '145 MB',
    uploader: 'Chen Design',
    department: 'TOY_DEPT',
    createdAt: '2024-05-15',
    isPublic: true,
    activityLog: [
      { id: 'log1', type: 'COMMENT', user: { id: 'u2', name: 'Sarah Lee', avatar: 'https://i.pravatar.cc/150?u=sarah' }, content: '看起来很棒！关节是全可动的吗？', timestamp: '2小时前' },
      { id: 'log2', type: 'STATUS_CHANGE', user: { id: 'u1', name: 'Alex Rivera', avatar: 'https://i.pravatar.cc/150?u=alex' }, oldStatus: 'TOY_2D_COLORED', newStatus: 'TOY_3D_MODEL', timestamp: '5小时前' },
      { id: 'log3', type: 'DOWNLOAD', user: { id: 'u3', name: 'Kenji Maker', avatar: 'https://i.pravatar.cc/150?u=kenji' }, timestamp: '1天前' }
    ]
  },
  // 2D 资产
  {
    id: 'CYBER_HERO2D_20240514',
    ipId: 'ip-1',
    libraryId: 'lib-cyber-1',
    category: '2D',
    title: '赛博霓虹主视觉概念插画 (高精)',
    description: '霓虹都市夜景与核心主角机甲 2D 概念图。',
    type: '2D',
    stage: ProjectStage.TOY_2D_COLORED,
    version: 'v1.0',
    tags: ['Cyberpunk', '2DConcept', 'KeyArt'],
    thumbnail: 'https://picsum.photos/seed/cyber/400/300',
    fileSize: '88 MB',
    uploader: 'Alex Rivera',
    department: 'DESIGN_DEPT',
    createdAt: '2024-05-14',
    isPublic: true
  },
  // 实拍资产
  {
    id: 'CYBER_PHOTO_20240518',
    ipId: 'ip-1',
    libraryId: 'lib-cyber-1',
    category: 'PHOTO',
    title: '零号机甲透明荧光涂装实物打样照',
    description: '紫外线荧光灯下的实物机甲发光漆面特写实拍照。',
    type: 'PHOTO',
    stage: ProjectStage.MARKETING,
    version: 'v1.0',
    upstreamAssetIds: ['CYBER_MECH3D_20240515', 'CYBER_HERO2D_20240514'],
    tags: ['SamplePhoto', 'UVLight', 'GlowEffect'],
    thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&h=300&fit=crop',
    fileSize: '156 MB',
    uploader: 'Chen Design',
    department: 'TOY_DEPT',
    createdAt: '2024-05-18',
    isPublic: true
  },

  // ===== 5. 神话国度卡牌物料 (lib-mythic-1) =====
  // 2D 资产
  {
    id: 'MYTHIC_DING_20240518',
    ipId: 'ip-2',
    libraryId: 'lib-mythic-1',
    category: '2D',
    title: '青铜鼎 A 正面全息设计',
    description: '古代青铜鼎卡牌正面高精图层。',
    type: '2D',
    stage: ProjectStage.CARD_FRONT_BACK,
    version: 'v1.2',
    tags: ['Antique', 'Bronze', 'SSR'],
    thumbnail: 'https://images.unsplash.com/photo-1621360841013-c7683c659ec6?w=400&h=600&fit=crop',
    fileSize: '42 MB',
    uploader: 'Li Creative',
    department: 'CARD_DEPT',
    createdAt: '2024-05-18',
    isPublic: true,
    cardData: {
      code: 'GHB-B-01',
      nameEn: 'Bronze Ding A',
      cardTypeL1: '文物卡',
      cardTypeL2: '基础普通卡',
      validationResult: { status: ValidationStatus.PENDING }
    }
  },
  {
    id: 'MYTHIC_XUAN_20240520',
    ipId: 'ip-2',
    libraryId: 'lib-mythic-1',
    category: '2D',
    title: '玄武神兽守护卡正背面',
    description: '玄武守护神兽卡正面设计与背面通用烫金底纹。',
    type: '2D',
    stage: ProjectStage.CARD_FRONT_BACK,
    version: 'v1.0',
    tags: ['Mythical', 'Guardian'],
    thumbnail: 'https://images.unsplash.com/photo-1614726365922-03487042a5ee?w=400&h=600&fit=crop',
    fileSize: '12 MB',
    uploader: 'Wang Design',
    department: 'CARD_DEPT',
    createdAt: '2024-05-20',
    isPublic: true,
    cardData: {
      code: 'GHB-B-02',
      nameEn: 'Black Tortoise',
      cardTypeL1: '神兽卡',
      cardTypeL2: '稀有卡',
      validationResult: { status: ValidationStatus.PENDING }
    }
  },
  {
    id: 'MYTHIC_CART_20240521',
    ipId: 'ip-2',
    libraryId: 'lib-mythic-1',
    category: '2D',
    title: '古代战车载具卡全套工艺',
    description: '汉代古代战车正面线稿与上色图。',
    type: '2D',
    stage: ProjectStage.CARD_FRONT_BACK,
    version: 'v1.0',
    tags: ['War', 'Vehicle'],
    thumbnail: 'https://images.unsplash.com/photo-1444491741275-3747c53c99b4?w=400&h=600&fit=crop',
    fileSize: '8 MB',
    uploader: 'Zhang Design',
    department: 'CARD_DEPT',
    createdAt: '2024-05-21',
    isPublic: true,
    cardData: {
      code: 'GHB-B-03',
      nameEn: 'Ancient Chariot',
      cardTypeL1: '载具卡',
      cardTypeL2: '基础普通卡',
      validationResult: { status: ValidationStatus.PENDING }
    }
  },
  // 实拍资产
  {
    id: 'MYTHIC_PHOTO_20240522',
    ipId: 'ip-2',
    libraryId: 'lib-mythic-1',
    category: 'PHOTO',
    title: '青铜鼎卡牌镭射折光实物卡品实拍',
    description: '实体制卡出样后在暖光灯下呈现的满版镭射折光实物照片。',
    type: 'PHOTO',
    stage: ProjectStage.CARD_PRODUCTION,
    version: 'v1.0',
    upstreamAssetIds: ['MYTHIC_DING_20240518'],
    tags: ['PhysicalCard', 'LaserHolo', 'QualityCheck'],
    thumbnail: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&h=300&fit=crop',
    fileSize: '95 MB',
    uploader: 'Li Creative',
    department: 'CARD_DEPT',
    createdAt: '2024-05-22',
    isPublic: true
  },

  // ===== 6. 漫游星空物料 (lib-astro-1) =====
  // 2D 资产
  {
    id: 'ASTRO_SUIT2D_20240504',
    ipId: 'ip-3',
    libraryId: 'lib-astro-1',
    category: '2D',
    title: '星际探索者萌趣宇航服 2D 三视图',
    description: '正侧背三视图与面罩反光色板规范。',
    type: '2D',
    stage: ProjectStage.TOY_2D_COLORED,
    version: 'v1.0',
    tags: ['Astro', 'ThreeViews', 'Concept'],
    thumbnail: 'https://picsum.photos/seed/space/400/300',
    fileSize: '36 MB',
    uploader: 'Kenji (Designer)',
    department: 'TOY_DEPT',
    createdAt: '2024-05-04',
    isPublic: true
  },
  // 3D 资产
  {
    id: 'ASTRO_MECH3D_20240506',
    ipId: 'ip-3',
    libraryId: 'lib-astro-1',
    category: '3D',
    title: '星际探索者 3D 打印分件源工程',
    description: '盲盒头雕、背包、磁吸面罩 3D 拆件打印工程包。',
    type: '3D',
    stage: ProjectStage.TOY_3D_MODEL,
    version: 'v2.0',
    upstreamAssetIds: ['ASTRO_SUIT2D_20240504'],
    tags: ['Astro', '3DPrint', 'STL', 'Obj'],
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop',
    fileSize: '190 MB',
    uploader: 'Chen (3D Artist)',
    department: 'TOY_DEPT',
    createdAt: '2024-05-06',
    isPublic: true
  },
  // 实拍资产
  {
    id: 'ASTRO_PHOTO_20240511',
    ipId: 'ip-3',
    libraryId: 'lib-astro-1',
    category: 'PHOTO',
    title: '漫游星空盲盒实体首版灰模打样实拍',
    description: '手板厂制作的树脂白模装配与可动性实物打样拍摄。',
    type: 'PHOTO',
    stage: ProjectStage.TOY_3D_MODEL,
    version: 'v1.0',
    upstreamAssetIds: ['ASTRO_MECH3D_20240506', 'ASTRO_SUIT2D_20240504'],
    tags: ['PrototypeSample', 'ResinModel', 'PhysicalCheck'],
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop',
    fileSize: '115 MB',
    uploader: 'Kenji (Designer)',
    department: 'TOY_DEPT',
    createdAt: '2024-05-11',
    isPublic: true
  },

  // ===== 7. 规范与包装、平面、陈列、实拍照片、视频资产 =====
  {
    id: 'HP_PACK_20240520',
    ipId: 'ip-hp',
    libraryId: 'lib-hp-1',
    category: 'PACKAGING',
    title: '霍格沃茨四大学院典藏礼盒外包装刀版',
    description: '四色压纹烫金礼盒标准工业刀模线与展开图。',
    type: 'PACKAGING',
    stage: ProjectStage.PACKAGING,
    version: 'v1.3',
    upstreamAssetIds: ['HP_EMBLEM_20240510'],
    tags: ['Hogwarts', 'Packaging', 'DieCut', 'AI'],
    thumbnail: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&h=300&fit=crop',
    fileSize: '78 MB',
    uploader: 'Warner Creative',
    department: 'DESIGN_DEPT',
    createdAt: '2024-05-20',
    isPublic: true
  },
  {
    id: 'HP_DISP_20240521',
    ipId: 'ip-hp',
    libraryId: 'lib-hp-1',
    category: 'DISPLAY',
    title: '九又四分之三站台主题快闪店空间陈列方案',
    description: '商场中庭陈列堆头、3D 地贴与展柜物料陈列效果图及尺寸规范。',
    type: 'DISPLAY',
    stage: ProjectStage.MARKETING,
    version: 'v1.0',
    upstreamAssetIds: ['HP_EMBLEM_20240510', 'HP_PACK_20240520'],
    tags: ['Display', 'Retail', 'PopupStore'],
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=300&fit=crop',
    fileSize: '165 MB',
    uploader: 'Marketing Dept',
    department: 'MARKETING_DEPT',
    createdAt: '2024-05-21',
    isPublic: true
  },
  {
    id: 'HP_VID_20240522',
    ipId: 'ip-hp',
    libraryId: 'lib-hp-1',
    category: 'VIDEO',
    title: '金色飞贼 3D 裸眼大屏特效宣传短片',
    description: '4K 60FPS 裸眼 3D 大屏宣传视频工程源文件及 ProRes 格式母带。',
    type: 'VIDEO',
    stage: ProjectStage.MARKETING,
    version: 'v2.0',
    upstreamAssetIds: ['HP_SNITCH_20240512'],
    tags: ['Video', '3DAnimation', 'Commercial', '4K'],
    thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&h=300&fit=crop',
    fileSize: '820 MB',
    uploader: 'Warner Creative',
    department: 'MARKETING_DEPT',
    createdAt: '2024-05-22',
    isPublic: true
  },
  {
    id: 'POKE_GRAPH_20240518',
    ipId: 'ip-poke',
    libraryId: 'lib-poke-1',
    category: 'GRAPHIC',
    title: '宝可梦 2024 官方品牌 VI 平面规范手册',
    description: '标准色值 PANTONE 对照表、Logo 最小安全距离及授权使用范例。',
    type: 'GRAPHIC',
    stage: ProjectStage.MARKETING,
    version: 'v2024.1',
    tags: ['BrandGuideline', 'Graphic', 'VI', 'PDF'],
    thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=300&fit=crop',
    fileSize: '52 MB',
    uploader: 'TPC Direct',
    department: 'DESIGN_DEPT',
    createdAt: '2024-05-18',
    isPublic: true
  },
  {
    id: 'POKE_PACK_20240519',
    ipId: 'ip-poke',
    libraryId: 'lib-poke-2',
    category: 'PACKAGING',
    title: 'PTCG 补充包铝箔袋展开刀模与印刷分色图',
    description: '卡牌铝箔防伪包装印刷分色层、光油与撕口位工程图。',
    type: 'PACKAGING',
    stage: ProjectStage.CARD_PRODUCTION,
    version: 'v2.0',
    upstreamAssetIds: ['POKE_CHAR2D_20240511', 'POKE_GRAPH_20240518'],
    tags: ['BoosterPack', 'Packaging', 'DieLine', 'Foil'],
    thumbnail: 'https://images.unsplash.com/photo-1621360841013-c7683c659ec6?w=400&h=300&fit=crop',
    fileSize: '95 MB',
    uploader: 'Kenji (Designer)',
    department: 'CARD_DEPT',
    createdAt: '2024-05-19',
    isPublic: true
  },
  {
    id: 'POKE_VID_20240520',
    ipId: 'ip-poke',
    libraryId: 'lib-poke-2',
    category: 'VIDEO',
    title: '喷火龙 SAR 闪卡全息折光宣发预告短视频',
    description: '15 秒社交媒体竖屏宣发短视频，展示镭射动态折光质感。',
    type: 'VIDEO',
    stage: ProjectStage.MARKETING,
    version: 'v1.0',
    upstreamAssetIds: ['POKE_CHAR2D_20240511'],
    tags: ['Video', 'Shorts', 'HoloPromo'],
    thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=300&fit=crop',
    fileSize: '240 MB',
    uploader: 'Marketing Dept',
    department: 'MARKETING_DEPT',
    createdAt: '2024-05-20',
    isPublic: true
  },
  {
    id: 'SANRIO_DISP_20240521',
    ipId: 'ip-sanrio',
    libraryId: 'lib-sanrio-1',
    category: 'DISPLAY',
    title: '库洛米甜酷派对盲盒门店端架陈列道具图纸',
    description: '亚克力端架展示盒、背板发光字与阶梯展台施工图纸。',
    type: 'DISPLAY',
    stage: ProjectStage.MARKETING,
    version: 'v1.0',
    upstreamAssetIds: ['SANRIO_KUROMI_20240508'],
    tags: ['Display', 'AcrylicStand', 'StoreDesign'],
    thumbnail: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&h=300&fit=crop',
    fileSize: '86 MB',
    uploader: 'Sarah (PM)',
    department: 'DESIGN_DEPT',
    createdAt: '2024-05-21',
    isPublic: true
  },
  {
    id: 'SANRIO_PACK_20240522',
    ipId: 'ip-sanrio',
    libraryId: 'lib-sanrio-1',
    category: 'PACKAGING',
    title: 'Hello Kitty 50周年马口铁礼盒结构与浮雕刀版',
    description: '双层马口铁盒冲压模具、立体浮雕凸版及烫金菲林源文件。',
    type: 'PACKAGING',
    stage: ProjectStage.PACKAGING,
    version: 'v2.2',
    upstreamAssetIds: ['SANRIO_KITTY_20240509', 'SANRIO_KUROMI_20240508'],
    tags: ['Packaging', 'TinBox', 'Embossing'],
    thumbnail: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&h=300&fit=crop',
    fileSize: '112 MB',
    uploader: 'Sarah (PM)',
    department: 'DESIGN_DEPT',
    createdAt: '2024-05-22',
    isPublic: true
  }
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alex (Super Admin)', role: UserRole.SUPER_ADMIN, department: 'MANAGEMENT', avatar: 'https://i.pravatar.cc/150?u=alex', canEditIP: true, canManageAssetLibrary: true },
  { id: 'u2', name: 'Sarah (PM)', role: UserRole.PM, department: 'TOY_DEPT', avatar: 'https://i.pravatar.cc/150?u=sarah', canEditIP: true, canManageAssetLibrary: true },
  { id: 'u3', name: 'Kenji (Designer)', role: UserRole.DESIGNER, department: 'CARD_DEPT', avatar: 'https://i.pravatar.cc/150?u=kenji', canEditIP: false, canManageAssetLibrary: false },
  { id: 'u4', name: 'Chen (3D Artist)', role: UserRole.DESIGNER, department: 'TOY_DEPT', avatar: 'https://i.pravatar.cc/150?u=chen', canEditIP: false, canManageAssetLibrary: true }
];

export const CURRENT_USER: User = MOCK_USERS[0];

export const MOCK_PERMISSION_REQUESTS: PermissionRequest[] = [
  {
    id: 'req-1',
    userId: 'u3',
    userName: 'Kenji (Designer)',
    userAvatar: 'https://i.pravatar.cc/150?u=kenji',
    ipId: 'ip-1',
    ipName: '赛博霓虹纪元',
    requestedRole: 'DOWNLOADER',
    status: 'PENDING',
    timestamp: '2小时前'
  }
];

export const MOCK_UPLOAD_RECORDS: UploadRecord[] = [
  {
    id: 'rec-1',
    batchNo: 'BATCH-20260814-001',
    uploaderName: 'Chen Design',
    uploaderAvatar: 'https://i.pravatar.cc/150?u=chen',
    ipId: 'ip-1',
    ipName: '赛博霓虹纪元',
    directoryName: '3D 建模/工程文件',
    fileCount: 4,
    totalSize: '342 MB',
    timestamp: '2026-08-14 09:30',
    status: 'SUCCESS',
    filesSummary: [
      { name: 'CyberHero_Body_3D_Print.obj', size: '145 MB', stage: '3D 建模' },
      { name: 'CyberHero_Weapon_Rig.fbx', size: '98 MB', stage: '3D 建模' },
      { name: 'Texture_Maps_4K.zip', size: '82 MB', stage: '3D 建模' },
      { name: 'Render_Preview_01.png', size: '17 MB', stage: '3D 建模' }
    ]
  },
  {
    id: 'rec-2',
    batchNo: 'BATCH-20260813-003',
    uploaderName: 'Li Creative',
    uploaderAvatar: 'https://i.pravatar.cc/150?u=li',
    ipId: 'ip-2',
    ipName: '神话国度卡牌',
    directoryName: '卡牌正背面设计',
    fileCount: 3,
    totalSize: '62 MB',
    timestamp: '2026-08-13 16:45',
    status: 'SUCCESS',
    filesSummary: [
      { name: 'Card_Ancient_Ding_Front.psd', size: '42 MB', stage: '卡牌正背面' },
      { name: 'Card_Xuanwu_Front.psd', size: '12 MB', stage: '卡牌正背面' },
      { name: 'Card_Common_Back_v2.png', size: '8 MB', stage: '卡牌正背面' }
    ]
  },
  {
    id: 'rec-3',
    batchNo: 'BATCH-20260812-002',
    uploaderName: 'Kenji (Designer)',
    uploaderAvatar: 'https://i.pravatar.cc/150?u=kenji',
    ipId: 'ip-3',
    ipName: '漫游星空',
    directoryName: '2D 原画/IP图库',
    fileCount: 6,
    totalSize: '128 MB',
    timestamp: '2026-08-12 14:10',
    status: 'SUCCESS',
    filesSummary: [
      { name: 'Astro_Suit_Concept_A.png', size: '24 MB', stage: '2D 上色' },
      { name: 'Astro_Helmet_Details.png', size: '18 MB', stage: '2D 上色' },
      { name: 'Astro_Planet_BG.psd', size: '56 MB', stage: '2D 上色' },
      { name: 'Astro_Color_Palettes.pdf', size: '30 MB', stage: '2D 上色' }
    ]
  }
];
