import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";

interface TrendingImageCardProps {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

/**
 * 热榜图片显示组件
 * - 处理图片加载状态
 * - 处理图片加载错误
 * - 显示占位符
 */
export function TrendingImageCard({
  src,
  alt = "热榜图片",
  size = "md",
  className = "",
}: TrendingImageCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 如果没有图片 URL，显示占位符
  if (!src) {
    return (
      <div className={`${sizeMap[size]} rounded bg-muted flex items-center justify-center flex-shrink-0 ${className}`}>
        <ImageIcon className={`${size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5"} text-muted-foreground`} />
      </div>
    );
  }

  // 如果加载失败，显示占位符
  if (hasError) {
    return (
      <div className={`${sizeMap[size]} rounded bg-muted flex items-center justify-center flex-shrink-0 ${className}`}>
        <ImageIcon className={`${size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5"} text-muted-foreground`} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeMap[size]} rounded object-cover bg-muted flex-shrink-0 ${className} ${isLoading ? "opacity-50" : "opacity-100"}`}
      onLoad={() => setIsLoading(false)}
      onError={() => {
        setIsLoading(false);
        setHasError(true);
      }}
      loading="lazy"
    />
  );
}
