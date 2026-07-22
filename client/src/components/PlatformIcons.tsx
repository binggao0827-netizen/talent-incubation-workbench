/**
 * 平台 App 图标组件
 * 为抖音、微博、视频号、小红书等平台提供真实的品牌图标
 */

type Platform = "抖音" | "微博" | "视频号" | "小红书";

interface PlatformIconProps {
  platform: Platform;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

/**
 * 平台图标 - 使用真实的 App 图标
 */
export function PlatformIconImage({ platform, size = "md", className = "" }: PlatformIconProps) {
  const iconMap: Record<Platform, string> = {
    "抖音": "/manus-storage/pasted_file_byGS84_image_d7736242.png",
    "微博": "/manus-storage/pasted_file_fZsRTl_image_1878d08c.png",
    "视频号": "/manus-storage/pasted_file_fS2QWB_image_467a4058.png",
    "小红书": "/manus-storage/pasted_file_PoINYn_image_a6ef2882.png",
  };

  const sizeClasses = sizeMap[size];

  return (
    <img
      src={iconMap[platform]}
      alt={`${platform} icon`}
      className={`${sizeClasses} rounded-lg object-cover ${className}`}
    />
  );
}

/**
 * 平台颜色映射
 */
export const platformColorMap: Record<Platform, { bg: string; text: string; border: string }> = {
  "抖音": { bg: "bg-black", text: "text-white", border: "border-black" },
  "微博": { bg: "bg-red-500", text: "text-white", border: "border-red-500" },
  "视频号": { bg: "bg-yellow-500", text: "text-black", border: "border-yellow-500" },
  "小红书": { bg: "bg-red-600", text: "text-white", border: "border-red-600" },
};

/**
 * 平台配置
 */
export const platformConfig: Record<Platform, { name: string; hasApi: boolean; url: string }> = {
  "抖音": { name: "抖音", hasApi: true, url: "https://www.douyin.com" },
  "微博": { name: "微博", hasApi: true, url: "https://www.weibo.com" },
  "视频号": { name: "视频号", hasApi: false, url: "https://channels.weixin.qq.com" },
  "小红书": { name: "小红书", hasApi: false, url: "https://www.xiaohongshu.com" },
};

/**
 * 获取有 API 的平台列表
 */
export function getPlatformsWithApi(): Platform[] {
  return (Object.keys(platformConfig) as Platform[]).filter(
    (platform) => platformConfig[platform].hasApi
  );
}

/**
 * 获取所有平台列表
 */
export function getAllPlatforms(): Platform[] {
  return Object.keys(platformConfig) as Platform[];
}

/**
 * 平台图标渲染组件
 */
export function PlatformIcon({ platform, size = "md", className = "" }: PlatformIconProps) {
  return <PlatformIconImage platform={platform} size={size} className={className} />;
}
