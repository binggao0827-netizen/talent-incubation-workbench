/**
 * 平台 App 图标组件
 * 为抖音、微博、快手、B站等平台提供真实的品牌图标
 */

type Platform = "抖音" | "微博" | "快手" | "B站";

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
 * 抖音图标 - 黑色背景 + 白色音符
 */
export function DouyinIcon({ size = "md", className = "" }: Omit<PlatformIconProps, "platform">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`${sizeMap[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 黑色背景 */}
      <rect width="24" height="24" rx="4" fill="#000000" />
      {/* 白色音符 */}
      <path
        d="M12 3C12 3 14 2 16 2C17.1046 2 18 2.89543 18 4V12C18 13.1046 17.1046 14 16 14C14 14 12 13 12 13V3Z"
        fill="#ffffff"
      />
      <path
        d="M12 13C12 13 10 12 8 12C6.89543 12 6 12.8954 6 14V20C6 21.1046 6.89543 22 8 22C10 22 12 21 12 21V13Z"
        fill="#ffffff"
      />
    </svg>
  );
}

/**
 * 微博图标 - 红色背景 + 白色"微"字
 */
export function WeiboIcon({ size = "md", className = "" }: Omit<PlatformIconProps, "platform">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`${sizeMap[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 红色背景 */}
      <rect width="24" height="24" rx="4" fill="#E74C3C" />
      {/* 白色圆形 */}
      <circle cx="8" cy="8" r="3" fill="#ffffff" />
      <circle cx="16" cy="8" r="3" fill="#ffffff" />
      {/* 白色波浪 */}
      <path
        d="M6 14C6 14 5 16 8 18C11 20 14 19 16 18C18 17 17 15 16 14"
        stroke="#ffffff"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * 快手图标 - 黄色背景 + 白色"K"字
 */
export function KuaishouIcon({ size = "md", className = "" }: Omit<PlatformIconProps, "platform">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`${sizeMap[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 黄色背景 */}
      <rect width="24" height="24" rx="4" fill="#FFD700" />
      {/* 白色"K"字 */}
      <path
        d="M8 4V20M8 4L16 12M8 4L16 4M8 20L16 12"
        stroke="#000000"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * B站图标 - 蓝色背景 + 白色"B"字
 */
export function BilibiliIcon({ size = "md", className = "" }: Omit<PlatformIconProps, "platform">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`${sizeMap[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 蓝色背景 */}
      <rect width="24" height="24" rx="4" fill="#00A0E9" />
      {/* 白色"B"字 */}
      <path
        d="M7 4V20M7 4H14C15.1046 4 16 4.89543 16 6V8C16 9.10457 15.1046 10 14 10H7M7 10H14C15.1046 10 16 10.8954 16 12V18C16 19.1046 15.1046 20 14 20H7"
        stroke="#ffffff"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 平台图标映射
 */
const platformIconMap: Record<Platform, React.FC<Omit<PlatformIconProps, "platform">>> = {
  "抖音": DouyinIcon,
  "微博": WeiboIcon,
  "快手": KuaishouIcon,
  "B站": BilibiliIcon,
};

/**
 * 获取平台图标组件
 */
export function getPlatformIcon(platform: Platform) {
  return platformIconMap[platform];
}

/**
 * 平台图标渲染组件
 */
export function PlatformIcon({ platform, size = "md", className = "" }: PlatformIconProps) {
  const IconComponent = platformIconMap[platform];
  if (!IconComponent) {
    return null;
  }
  return <IconComponent size={size} className={className} />;
}

/**
 * 平台颜色映射
 */
export const platformColorMap: Record<Platform, { bg: string; text: string; border: string }> = {
  "抖音": { bg: "bg-black", text: "text-white", border: "border-black" },
  "微博": { bg: "bg-red-500", text: "text-white", border: "border-red-500" },
  "快手": { bg: "bg-yellow-500", text: "text-black", border: "border-yellow-500" },
  "B站": { bg: "bg-blue-500", text: "text-white", border: "border-blue-500" },
};
