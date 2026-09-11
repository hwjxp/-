import React, { useState, useEffect, useRef } from 'react';

export interface LazyImageProps {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string; // e.g. 'aspect-[5/4]', 'aspect-video', 'aspect-square'
  category?: string; // e.g. '2D' | '3D' | 'GRAPHIC' | 'VIDEO' etc.
  placeholderIcon?: string; // FontAwesome icon class
  rootMargin?: string;
  threshold?: number;
  objectFit?: 'cover' | 'contain' | 'fill';
  onClick?: () => void;
  children?: React.ReactNode; // Overlays (badges, gradients, etc.)
}

const CATEGORY_ICONS: Record<string, { icon: string; label: string; bg: string; text: string }> = {
  '2D': { icon: 'fa-paintbrush', label: '2D 原画', bg: 'bg-blue-50/80', text: 'text-blue-400' },
  '3D': { icon: 'fa-cube', label: '3D 模型', bg: 'bg-purple-50/80', text: 'text-purple-400' },
  'GRAPHIC': { icon: 'fa-vector-square', label: '平面物料', bg: 'bg-cyan-50/80', text: 'text-cyan-400' },
  'PACKAGING': { icon: 'fa-box-open', label: '包装延展', bg: 'bg-emerald-50/80', text: 'text-emerald-400' },
  'DISPLAY': { icon: 'fa-shop', label: '陈列物料', bg: 'bg-amber-50/80', text: 'text-amber-400' },
  'PHOTO': { icon: 'fa-camera', label: '实拍摄影', bg: 'bg-rose-50/80', text: 'text-rose-400' },
  'VIDEO': { icon: 'fa-film', label: '动态视频', bg: 'bg-violet-50/80', text: 'text-violet-400' }
};

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  aspectRatio = 'aspect-[5/4]',
  category,
  placeholderIcon,
  rootMargin = '250px 0px',
  threshold = 0.01,
  objectFit = 'cover',
  onClick,
  children
}) => {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Determine category visual styling
  const catMeta = (category && CATEGORY_ICONS[category]) || {
    icon: placeholderIcon || 'fa-file-image',
    label: category || '物料资产',
    bg: 'bg-slate-100',
    text: 'text-slate-400'
  };

  // IntersectionObserver to trigger loading when near viewport
  useEffect(() => {
    // Reset state on src change
    setIsLoaded(false);
    setHasError(false);

    if (!src) {
      setHasError(true);
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          // Once in view, we don't need to observe anymore
          if (containerRef.current) {
            observer.unobserve(containerRef.current);
          }
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    const currentEl = containerRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
      observer.disconnect();
    };
  }, [src, rootMargin, threshold, retryCount]);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsLoaded(false);
    setRetryCount(prev => prev + 1);
  };

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`relative w-full ${aspectRatio} overflow-hidden bg-slate-100 select-none ${containerClassName}`}
    >
      {/* 1. Shimmer Loading Skeleton State */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200/60 to-slate-100 animate-pulse">
          {/* Shimmer gradient wave */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
          
          <div className="flex flex-col items-center space-y-1 text-slate-400 z-10">
            <i className={`fa-solid ${catMeta.icon} text-lg opacity-40`}></i>
            <span className="text-[9px] font-medium tracking-wider text-slate-400/80 font-mono">
              加载中...
            </span>
          </div>
        </div>
      )}

      {/* 2. Error Fallback State with Retry Option */}
      {hasError ? (
        <div className={`absolute inset-0 z-0 flex flex-col items-center justify-center p-3 text-center ${catMeta.bg}`}>
          <div className="w-10 h-10 rounded-xl bg-white/80 border border-slate-200/80 flex items-center justify-center mb-1.5 shadow-2xs">
            <i className={`fa-solid ${catMeta.icon} text-base ${catMeta.text}`}></i>
          </div>
          <span className="text-[10px] font-bold text-slate-700 truncate max-w-full px-2">
            {alt || catMeta.label}
          </span>
          <span className="text-[9px] text-slate-400 mt-0.5">
            封面暂缺或加载异常
          </span>
          {src && (
            <button
              type="button"
              onClick={handleRetry}
              className="mt-2 px-2 py-0.5 rounded text-[9px] font-bold bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-2xs flex items-center space-x-1 transition-all cursor-pointer"
            >
              <i className="fa-solid fa-rotate-right text-[8px]"></i>
              <span>重试</span>
            </button>
          )}
        </div>
      ) : (
        /* 3. Actual Image Element with Smooth Fade-in Transition */
        isInView && src && (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={() => {
              setIsLoaded(true);
              setHasError(false);
            }}
            onError={() => {
              setHasError(true);
              setIsLoaded(false);
            }}
            className={`w-full h-full ${objectFit === 'contain' ? 'object-contain' : 'object-cover'} transition-all duration-500 ease-out ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'
            } ${className}`}
          />
        )
      )}

      {/* 4. Child Overlays (e.g. Category Badges, Heart, Version Tags, etc.) */}
      {children}
    </div>
  );
};

export default LazyImage;
