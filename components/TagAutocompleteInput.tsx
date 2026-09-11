import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TagInfo, filterTagSuggestions } from '../utils/tagUtils';

interface TagAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  tagStats: TagInfo[];
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  mode?: 'single' | 'multi-comma' | 'search';
  onSelectTag?: (tag: TagInfo) => void;
  onEnterPress?: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
  showIcon?: boolean;
  darkTheme?: boolean;
  dropdownPlacement?: 'bottom' | 'top';
}

export const TagAutocompleteInput: React.FC<TagAutocompleteInputProps> = ({
  value,
  onChange,
  tagStats,
  placeholder = '输入标签...',
  className = '',
  inputClassName = '',
  mode = 'single',
  onSelectTag,
  onEnterPress,
  autoFocus = false,
  disabled = false,
  showIcon = true,
  darkTheme = false,
  dropdownPlacement = 'bottom'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract the active word/fragment being typed if in multi-comma mode
  const currentQuery = useMemo(() => {
    if (mode === 'multi-comma') {
      const parts = value.split(/[,，]/);
      return parts[parts.length - 1]?.trim() || '';
    }
    return value.trim();
  }, [value, mode]);

  const suggestions = useMemo(() => {
    return filterTagSuggestions(currentQuery, tagStats, 7);
  }, [currentQuery, tagStats]);

  // Check if current query is an exact match for an existing tag
  const isExactMatch = useMemo(() => {
    if (!currentQuery) return false;
    return tagStats.some(t => t.name.toLowerCase() === currentQuery.toLowerCase());
  }, [currentQuery, tagStats]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (tag: TagInfo) => {
    if (mode === 'multi-comma') {
      const parts = value.split(/[,，]/);
      parts[parts.length - 1] = (parts.length > 1 && parts[parts.length - 1].startsWith(' ') ? ' ' : '') + tag.name;
      const newValue = parts.filter(p => p.trim().length > 0).join(', ') + ', ';
      onChange(newValue);
    } else {
      onChange(tag.name);
    }

    if (onSelectTag) {
      onSelectTag(tag);
    }

    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (onEnterPress) {
          e.preventDefault();
          onEnterPress();
        }
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => (prev + 1) % (suggestions.length + (!isExactMatch && currentQuery ? 1 : 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const total = suggestions.length + (!isExactMatch && currentQuery ? 1 : 0);
      setHighlightIndex(prev => (prev - 1 + total) % total);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && highlightIndex < suggestions.length) {
        handleSelect(suggestions[highlightIndex]);
      } else if (!isExactMatch && currentQuery) {
        // User picked create new tag
        if (mode === 'multi-comma') {
          const parts = value.split(/[,，]/);
          parts[parts.length - 1] = currentQuery;
          onChange(parts.join(', ') + ', ');
        }
        if (onEnterPress) onEnterPress();
        setIsOpen(false);
      } else if (onEnterPress) {
        onEnterPress();
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getTypeLabel = (type: TagInfo['type']) => {
    switch (type) {
      case 'CATEGORY': return 'IP类别';
      case 'REGION': return '地区';
      case 'ASSET_TAG': return '资产';
      default: return '标签';
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        {showIcon && (
          <i className={`fa-solid ${mode === 'search' ? 'fa-magnifying-glass' : 'fa-tag'} absolute left-3.5 text-xs pointer-events-none ${
            darkTheme ? 'text-slate-400' : 'text-slate-400'
          }`}></i>
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`w-full transition-all text-xs font-medium outline-none ${
            showIcon ? 'pl-9 pr-3' : 'px-3'
          } py-2.5 rounded-xl ${
            darkTheme 
              ? 'bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20' 
              : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10'
          } ${inputClassName}`}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className={`absolute right-3 text-xs p-1 rounded-full hover:bg-slate-200/50 ${
              darkTheme ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (suggestions.length > 0 || (!isExactMatch && currentQuery)) && (
        <div 
          className={`absolute z-50 left-0 right-0 ${
            dropdownPlacement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } min-w-[280px] bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden animate-fadeIn`}
          style={{ maxHeight: '280px', overflowY: 'auto' }}
        >
          {/* Header prompt */}
          <div className="bg-slate-50 px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-bold">
            <span className="flex items-center space-x-1">
              <i className="fa-solid fa-wand-magic-sparkles text-indigo-500 mr-1"></i>
              <span>现有标签智能补全 (已关联 IP 统计)</span>
            </span>
            <span className="text-[9px] text-slate-400">↑↓ 键导航 · Enter 选择</span>
          </div>

          <div className="p-1.5 space-y-1">
            {suggestions.map((item, index) => {
              const isSelected = index === highlightIndex;
              return (
                <div
                  key={item.name}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightIndex(index)}
                  className={`px-3 py-2 rounded-xl text-xs cursor-pointer flex items-center justify-between transition-all ${
                    isSelected 
                      ? 'bg-indigo-50 text-indigo-900 font-bold' 
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                      item.type === 'CATEGORY' ? 'bg-indigo-100 text-indigo-600' :
                      item.type === 'REGION' ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      #{item.name.charAt(0)}
                    </span>
                    <div className="truncate">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="font-bold text-slate-900 truncate">{item.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0 font-medium">
                          {getTypeLabel(item.type)}
                        </span>
                      </div>
                      {item.ipNames.length > 0 && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {item.ipNames.slice(0, 2).join('、')}
                          {item.ipNames.length > 2 && ` 等 ${item.ipNames.length} 个 IP`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* IP Count Badge (Key Requirement!) */}
                  <div className="flex items-center space-x-1.5 shrink-0 pl-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center space-x-1 ${
                      item.ipCount > 0 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                      <i className="fa-solid fa-cube text-[9px]"></i>
                      <span>{item.ipCount} 个 IP</span>
                    </span>
                    {item.assetCount > 0 && (
                      <span className="text-[9px] text-slate-400 font-medium hidden sm:inline">
                        {item.assetCount} 资产
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Custom New Tag prompt if query does not match any existing tag */}
            {!isExactMatch && currentQuery && (
              <div
                onClick={() => {
                  if (mode === 'multi-comma') {
                    const parts = value.split(/[,，]/);
                    parts[parts.length - 1] = currentQuery;
                    onChange(parts.join(', ') + ', ');
                  }
                  if (onEnterPress) onEnterPress();
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHighlightIndex(suggestions.length)}
                className={`px-3 py-2 rounded-xl text-xs cursor-pointer flex items-center justify-between border border-dashed border-indigo-200 ${
                  highlightIndex === suggestions.length ? 'bg-indigo-50/70 text-indigo-900' : 'bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <i className="fa-solid fa-plus-circle text-indigo-500"></i>
                  <span className="font-bold text-indigo-700 truncate">创建新标签 "{currentQuery}"</span>
                </div>
                <span className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                  当前关联 0 个 IP (新标签)
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default TagAutocompleteInput;
