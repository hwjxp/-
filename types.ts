
export enum BusinessType {
  TOYS = 'DESIGNER_TOYS',
  CARDS = 'TRADING_CARDS'
}

export enum ProjectStage {
  SKETCH = 'SKETCH',
  MARKETING = 'MARKETING_ASSETS',
  PACKAGING = 'PACKAGING',
  TOY_2D_COLORED = '2D_COLORED',
  TOY_3D_MODEL = '3D_MODEL',
  CARD_IP_SOURCE = 'IP_SOURCE',
  CARD_FRONT_BACK = 'FACE_DESIGN',
  CARD_PRODUCTION = 'PRODUCTION_FILES'
}

export enum ValidationStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  VALIDATING = 'VALIDATING'
}

export interface CardMetadata {
  nameEn?: string;
  code: string;
  frontFile?: string;
  backFile?: string;
  previewUrl?: string;
  processFile?: string;
  cardTypeL2: string;
  cardTypeL1: string;
  validationResult?: {
    status: ValidationStatus;
    details?: string;
    errors?: string[];
  };
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PM = 'PM',
  DESIGNER = 'DESIGNER'
}

export type AssetCategory = 
  | '2D' 
  | '3D' 
  | 'GRAPHIC'     // 平面
  | 'PACKAGING'   // 包装
  | 'DISPLAY'     // 陈列
  | 'PHOTO'       // 实拍照片
  | 'VIDEO';      // 视频

export interface AssetLibrary {
  id: string;
  ipId: string;
  name: string;
  version?: string;
  description?: string;
  coverImage?: string;
  createdAt: string;
  updatedAt?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
  adminIds?: string[];     // 图库管理员 (可管理该图库)
  viewerIds?: string[];    // 图库可读用户
  uploaderIds?: string[];  // 图库上传用户
  downloaderIds?: string[]; // 图库下载用户
}

export interface IPChangeLog {
  id: string;
  operatorName: string;
  operatorAvatar?: string;
  action: 'CREATE' | 'UPDATE_INFO' | 'UPDATE_COVER' | 'UPDATE_TAGS' | 'ENABLE_LIBRARY';
  description: string;
  timestamp: string;
}

export interface IP {
  id: string;
  name: string;
  englishName: string;
  description: string;
  coverImage?: string;
  ownership: 'ORIGINAL' | 'LICENSED'; // 自有 IP | 三方 IP
  categories: string[]; // 潮玩, 影视, 动漫, 游戏, etc.
  regions: string[]; // 国内, 亚太, 欧美, 全球
  hasAssetLibrary: boolean;
  visibility: 'PUBLIC' | 'PRIVATE';
  adminIds: string[];      // IP 管理员（级联至下属所有图库）
  viewerIds: string[];     // IP 查看者（级联至下属所有图库）
  uploaderIds?: string[];  // IP 上传者（级联至下属所有图库）
  downloaderIds: string[]; // IP 下载者（级联至下属所有图库）
  createdAt?: string;
  updatedAt?: string;
  changeLogs?: IPChangeLog[];
}

export interface PermissionRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  ipId: string;
  ipName: string;
  requestedRole: 'VIEWER' | 'DOWNLOADER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: string;
}

export interface AssetComment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role?: string;
    department?: string;
  };
  content: string;
  images?: string[]; // Up to 9 attached image URLs
  timestamp: string;
  feedbackType?: 'GENERAL' | 'APPROVED' | 'CHANGE_REQUEST' | 'SUGGESTION';
  mentions?: string[]; // user IDs or names mentioned
  reactions?: { emoji: string; count: number; userIds: string[] }[];
}

export interface ActivityEvent {
  id: string;
  type: 'COMMENT' | 'STATUS_CHANGE' | 'DOWNLOAD';
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  content?: string;
  timestamp: string;
  oldStatus?: string;
  newStatus?: string;
}

export interface AssetOperationRecord {
  id: string;
  type: 'CREATE' | 'EDIT_INFO' | 'VERSION_UPGRADE' | 'LINK_UPSTREAM' | 'UNLINK_UPSTREAM' | 'DOWNLOAD' | 'PERMISSION_CHANGE';
  operatorName: string;
  operatorAvatar?: string;
  operatorRole?: string;
  operatorDepartment?: string;
  timestamp: string;
  summary: string;
  details?: string;
  badge?: string;
  badgeColor?: string;
  extraMeta?: {
    version?: string;
    fileSize?: string;
    downloadPurpose?: string;
    downloadFormat?: string;
    permissionScope?: string;
    fieldsChanged?: string[];
  };
}

export interface AssetVersionRecord {
  version: string;
  updatedAt: string;
  updater: string;
  updaterAvatar?: string;
  fileSize: string;
  changeLog: string;
  downloadUrl?: string;
}

export interface Asset {
  id: string;
  ipId: string;
  libraryId?: string;
  category?: AssetCategory;
  title: string;
  description: string;
  type: string; 
  stage: ProjectStage;
  tags: string[];
  thumbnail: string;
  fileSize: string;
  uploader: string;
  uploaderAvatar?: string;
  department: string;
  createdAt: string;
  updatedAt?: string;
  isPublic: boolean;
  version?: string;
  versionHistory?: AssetVersionRecord[];
  upstreamAssetIds?: string[]; // IDs of referenced upstream assets (e.g. 2D concept)
  activityLog?: ActivityEvent[];
  comments?: AssetComment[];
  operationHistory?: AssetOperationRecord[];
  cardData?: CardMetadata; // Specific data for card-type assets
  metadata?: {
    productionSpecs?: string[];
    polyCount?: number;
    dimensions?: string;
    resolution?: string;
    format?: string;
    colorSpace?: string;
    software?: string;
  };
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  avatar: string;
  canEditIP?: boolean; // 是否拥有编辑 IP 库的权限
  canManageAssetLibrary?: boolean; // 是否拥有图库管理的权限
}

export interface UploadRecord {
  id: string;
  batchNo: string;
  uploaderName: string;
  uploaderAvatar?: string;
  ipId: string;
  ipName: string;
  directoryName: string;
  fileCount: number;
  totalSize: string;
  timestamp: string;
  status: 'SUCCESS' | 'PROCESSING' | 'FAILED';
  filesSummary: { name: string; size: string; stage: string; assetId?: string }[];
}
