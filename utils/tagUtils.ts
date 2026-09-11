import { IP, Asset } from '../types';

export interface TagInfo {
  name: string;
  ipCount: number;
  ipNames: string[];
  assetCount: number;
  type: 'CATEGORY' | 'REGION' | 'ASSET_TAG' | 'COMMON';
}

const COMMON_DEFAULT_TAGS = [
  '潮玩', '游戏', '动漫', '影视', '艺术', '体育', '文学', '卡牌',
  '国内', '亚太', '欧美', '全球',
  'Cyberpunk', 'Toy', '3D', 'Antique', 'Bronze', 'SSR', 'Mythical',
  '主视觉', '高精度', '工程文件', '可打印', '烫金', '印刷', '刀模', '包装', '盲盒'
];

/**
 * Compute tag statistics across all IPs and Assets in the platform
 */
export function getTagStats(ips: IP[], assets: Asset[]): TagInfo[] {
  const tagMap = new Map<string, {
    ipSet: Set<string>;
    ipNameSet: Set<string>;
    assetCount: number;
    type: 'CATEGORY' | 'REGION' | 'ASSET_TAG' | 'COMMON';
  }>();

  // Initialize common default tags
  COMMON_DEFAULT_TAGS.forEach(tag => {
    tagMap.set(tag, {
      ipSet: new Set(),
      ipNameSet: new Set(),
      assetCount: 0,
      type: 'COMMON'
    });
  });

  // Index IPs
  ips.forEach(ip => {
    // Categories
    (ip.categories || []).forEach(cat => {
      const clean = cat.trim();
      if (!clean) return;
      if (!tagMap.has(clean)) {
        tagMap.set(clean, { ipSet: new Set(), ipNameSet: new Set(), assetCount: 0, type: 'CATEGORY' });
      }
      const entry = tagMap.get(clean)!;
      entry.ipSet.add(ip.id);
      entry.ipNameSet.add(ip.name);
      entry.type = 'CATEGORY';
    });

    // Regions
    (ip.regions || []).forEach(reg => {
      const clean = reg.trim();
      if (!clean) return;
      if (!tagMap.has(clean)) {
        tagMap.set(clean, { ipSet: new Set(), ipNameSet: new Set(), assetCount: 0, type: 'REGION' });
      }
      const entry = tagMap.get(clean)!;
      entry.ipSet.add(ip.id);
      entry.ipNameSet.add(ip.name);
      if (entry.type !== 'CATEGORY') entry.type = 'REGION';
    });
  });

  // Index Assets
  assets.forEach(asset => {
    const parentIp = ips.find(i => i.id === asset.ipId);
    (asset.tags || []).forEach(tag => {
      const clean = tag.trim();
      if (!clean) return;
      if (!tagMap.has(clean)) {
        tagMap.set(clean, { ipSet: new Set(), ipNameSet: new Set(), assetCount: 0, type: 'ASSET_TAG' });
      }
      const entry = tagMap.get(clean)!;
      entry.assetCount += 1;
      if (parentIp) {
        entry.ipSet.add(parentIp.id);
        entry.ipNameSet.add(parentIp.name);
      }
    });
  });

  const result: TagInfo[] = [];
  tagMap.forEach((data, name) => {
    result.push({
      name,
      ipCount: data.ipSet.size,
      ipNames: Array.from(data.ipNameSet),
      assetCount: data.assetCount,
      type: data.type
    });
  });

  // Sort by ipCount descending, then assetCount descending
  return result.sort((a, b) => b.ipCount - a.ipCount || b.assetCount - a.assetCount || a.name.localeCompare(b.name));
}

/**
 * Filter tag suggestions based on query string
 */
export function filterTagSuggestions(query: string, tagStats: TagInfo[], limit = 8): TagInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return tagStats.slice(0, limit);
  }

  const exactMatches: TagInfo[] = [];
  const prefixMatches: TagInfo[] = [];
  const containsMatches: TagInfo[] = [];

  tagStats.forEach(item => {
    const lowerName = item.name.toLowerCase();
    if (lowerName === q) {
      exactMatches.push(item);
    } else if (lowerName.startsWith(q)) {
      prefixMatches.push(item);
    } else if (lowerName.includes(q)) {
      containsMatches.push(item);
    }
  });

  const combined = [...exactMatches, ...prefixMatches, ...containsMatches];
  return combined.slice(0, limit);
}
