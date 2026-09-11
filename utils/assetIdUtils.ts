import { IP } from '../types';

// Standard IP code mapping dictionary
const IP_CODE_MAP: Record<string, string> = {
  'ip-hp': 'HP',
  'harry potter': 'HP',
  '哈利波特': 'HP',
  'ip-poke': 'POKE',
  'pokémon': 'POKE',
  'pokemon': 'POKE',
  '宝可梦': 'POKE',
  'ip-sanrio': 'SANRIO',
  'sanrio': 'SANRIO',
  '三丽鸥': 'SANRIO',
  'ip-1': 'CYBER',
  'cyber': 'CYBER',
  '赛博霓虹纪元': 'CYBER',
  '赛博霓虹': 'CYBER',
  'ip-2': 'MYTHIC',
  'mythic': 'MYTHIC',
  '神话国度卡牌': 'MYTHIC',
  '神话国度': 'MYTHIC',
  'ip-3': 'ASTRO',
  'astro': 'ASTRO',
  '漫游星空': 'ASTRO',
  'ip-mecha': 'MECHA',
  '机甲纪元': 'MECHA',
  'ip-pets': 'PETS',
  '潮玩萌宠': 'PETS'
};

// Common Chinese title semantic keywords to English standard abbreviations
const TITLE_SEMANTIC_MAP: [RegExp, string][] = [
  [/主视觉|立绘|角色|人物|主角/i, 'HERO'],
  [/三视图|拆件|工程|图纸|结构/i, 'SPEC'],
  [/3d|建模|数模|雕刻|打印|切片/i, '3D_RIG'],
  [/包装|彩盒|盲盒|展示盒|外盒/i, 'PKG'],
  [/刀模|刀线|模具/i, 'DIECUT'],
  [/烫金|全息|镭射|工艺|印金/i, 'HOLO'],
  [/卡牌|卡面|牌框|正面|背面/i, 'CARD'],
  [/海报|宣发|电商|banner|展板/i, 'POSTER'],
  [/陈列|美陈|道具|展架|堆头/i, 'DISPLAY'],
  [/实拍|静物|棚拍|摄影|样板/i, 'PHOTO'],
  [/视频|短片|动画|动效|宣传片/i, 'VIDEO'],
  [/草图|概念|脑暴|设定/i, 'SKETCH'],
  [/图标|logo|标志|徽章/i, 'ICON'],
  [/背景|场景|底纹/i, 'BG'],
  [/色卡|标准色|配色/i, 'COLOR']
];

/**
 * Extracts or generates a standard 2-6 character uppercase English IP code.
 */
export function getIpCode(ipOrIdOrName?: IP | string | null): string {
  if (!ipOrIdOrName) return 'ASSET';

  if (typeof ipOrIdOrName === 'object' && ipOrIdOrName !== null) {
    if (ipOrIdOrName.id && IP_CODE_MAP[ipOrIdOrName.id.toLowerCase()]) {
      return IP_CODE_MAP[ipOrIdOrName.id.toLowerCase()];
    }
    if (ipOrIdOrName.englishName) {
      const cleaned = ipOrIdOrName.englishName.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleaned) return cleaned.slice(0, 6);
    }
    if (ipOrIdOrName.name && IP_CODE_MAP[ipOrIdOrName.name.toLowerCase()]) {
      return IP_CODE_MAP[ipOrIdOrName.name.toLowerCase()];
    }
    // Try regex match from IP name
    if (ipOrIdOrName.name) {
      for (const [key, val] of Object.entries(IP_CODE_MAP)) {
        if (ipOrIdOrName.name.toLowerCase().includes(key)) {
          return val;
        }
      }
    }
    return 'IP';
  }

  const str = String(ipOrIdOrName).trim().toLowerCase();
  if (IP_CODE_MAP[str]) {
    return IP_CODE_MAP[str];
  }

  for (const [key, val] of Object.entries(IP_CODE_MAP)) {
    if (str.includes(key)) {
      return val;
    }
  }

  // Fallback: extract english letters/digits up to 6 chars
  const cleaned = str.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length >= 2) {
    return cleaned.slice(0, 6);
  }

  return 'IP';
}

/**
 * Sanitizes and validates the user custom title code.
 * Converts Chinese keywords to smart semantic English short-code if no English exists.
 * Restricts to English letters, numbers, hyphens, and underscores, max 15 chars.
 */
export function sanitizeCustomCode(rawTitle: string, maxLen = 15): string {
  if (!rawTitle) return 'ITEM';

  // 1. Remove file extension if present (e.g. "hero.png" -> "hero")
  let cleanName = rawTitle.replace(/\.[a-zA-Z0-9]{2,6}$/, '').trim();

  // 2. Check if the string has alphanumeric characters
  let extracted = cleanName
    .replace(/[\s\.\-]+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toUpperCase();

  // Remove leading/trailing/multiple underscores
  extracted = extracted.replace(/^_+|_+$/g, '').replace(/_+/g, '_');

  if (extracted.length >= 2) {
    return extracted.slice(0, maxLen);
  }

  // 3. If mostly Chinese/non-English, perform smart semantic mapping
  for (const [pattern, semanticCode] of TITLE_SEMANTIC_MAP) {
    if (pattern.test(cleanName)) {
      return semanticCode.slice(0, maxLen);
    }
  }

  return 'ITEM';
}

/**
 * Formats a compact timestamp string: YYYYMMDDHHmmss
 */
export function formatCompactTimestamp(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}${hh}${mm}${ss}`;
}

/**
 * Generates the global standard unique Asset ID.
 * Rule: [IP Code (≤6 letters)] + _ + [Custom Title (≤15 English chars)] + _ + [Timestamp YYYYMMDDHHmmss]
 */
export function generateAssetId(
  ipOrCode: IP | string | null | undefined,
  customTitle: string = 'ITEM',
  date: Date = new Date()
): string {
  const ipCode = getIpCode(ipOrCode);
  const cleanTitle = sanitizeCustomCode(customTitle, 15);
  const timestamp = formatCompactTimestamp(date);
  return `${ipCode}_${cleanTitle}_${timestamp}`;
}

/**
 * Validates if an Asset ID satisfies the global system rules.
 * Must contain only letters, numbers, underscores, and hyphens (4 to 60 characters).
 */
export function isValidAssetId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_-]{4,60}$/.test(id);
}

/**
 * Copies an Asset ID to the clipboard with robust fallback for iframe sandboxes.
 */
export async function copyAssetId(assetId: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(assetId);
      return true;
    }
  } catch {
    // Fall through to textarea fallback
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = assetId;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

