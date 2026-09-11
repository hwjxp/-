import React, { useState, useRef, useEffect } from 'react';
import { Asset, User, AssetComment } from '../types';
import { MOCK_USERS } from '../constants';

interface AssetCommentsSectionProps {
  asset: Asset;
  currentUser: User;
  onUpdateAsset?: (updatedAsset: Asset) => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '🚀', '🎉', '👏', '🎯', '✨', '👀', '💡', '💯', '🙌'];
const QUICK_REACTION_EMOJIS = ['👍', '❤️', '🔥', '🚀', '👀'];

export const AssetCommentsSection: React.FC<AssetCommentsSectionProps> = ({
  asset,
  currentUser,
  onUpdateAsset,
}) => {
  const [comments, setComments] = useState<AssetComment[]>(asset.comments || []);
  const [commentText, setCommentText] = useState('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

  // Sync internal comments when asset prop changes
  useEffect(() => {
    setComments(asset.comments || []);
  }, [asset.comments, asset.id]);

  // Close emoji / mention dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (mentionDropdownRef.current && !mentionDropdownRef.current.contains(e.target as Node)) {
        setShowMentionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered members for @mention
  const mentionCandidates = MOCK_USERS.filter(u => {
    if (!mentionQuery) return true;
    const q = mentionQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.department.toLowerCase().includes(q);
  });

  // Handle textarea text changes and detect '@'
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setCommentText(val);

    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const queryCandidate = textBeforeCursor.slice(lastAtIndex + 1);
      if (!queryCandidate.includes(' ') && !queryCandidate.includes('\n')) {
        setMentionQuery(queryCandidate);
        setShowMentionDropdown(true);
        return;
      }
    }
    setShowMentionDropdown(false);
  };

  // Insert @mention into text
  const insertMention = (userName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setCommentText(prev => `${prev}@${userName} `);
      setShowMentionDropdown(false);
      return;
    }

    const cursorPos = textarea.selectionStart || 0;
    const textBeforeCursor = commentText.slice(0, cursorPos);
    const textAfterCursor = commentText.slice(cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    let newText = '';
    if (lastAtIndex !== -1) {
      newText = textBeforeCursor.slice(0, lastAtIndex) + `@${userName} ` + textAfterCursor;
    } else {
      newText = `${commentText}@${userName} `;
    }

    setCommentText(newText);
    setShowMentionDropdown(false);
    
    setTimeout(() => {
      textarea.focus();
    }, 50);
  };

  // Insert emoji into text
  const insertEmoji = (emoji: string) => {
    setCommentText(prev => prev + emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Handle Image Upload (up to 9 images)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 9 - attachedImages.length;
    if (remainingSlots <= 0) {
      alert('最多只能上传 9 张图片');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setAttachedImages(prev => {
            if (prev.length >= 9) return prev;
            return [...prev, result];
          });
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  // Remove attached image
  const removeAttachedImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Submit comment
  const handleSubmitComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim() && attachedImages.length === 0) return;

    // Detect @mentions from text
    const mentionMatches = commentText.match(/@([\w\u4e00-\u9fa5()（）\s-]+?)(?=[,，\s]|$)/g) || [];
    const extractedMentions = Array.from(new Set(mentionMatches.map(m => m.replace(/^@/, '').trim())));

    const now = new Date();
    const timeString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newComment: AssetComment = {
      id: `cmt-${Date.now()}`,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: currentUser.role,
        department: currentUser.department,
      },
      content: commentText.trim(),
      images: attachedImages.length > 0 ? [...attachedImages] : undefined,
      timestamp: timeString,
      mentions: extractedMentions.length > 0 ? extractedMentions : undefined,
      reactions: []
    };

    const updatedComments = [newComment, ...comments];
    setComments(updatedComments);
    setCommentText('');
    setAttachedImages([]);
    setShowEmojiPicker(false);
    setShowMentionDropdown(false);

    if (onUpdateAsset) {
      onUpdateAsset({
        ...asset,
        comments: updatedComments,
      });
    }
  };

  // Delete comment
  const handleDeleteComment = (commentId: string) => {
    const updatedComments = comments.filter(c => c.id !== commentId);
    setComments(updatedComments);
    if (onUpdateAsset) {
      onUpdateAsset({
        ...asset,
        comments: updatedComments,
      });
    }
  };

  // Toggle emoji reaction on a comment
  const handleToggleReaction = (commentId: string, emoji: string) => {
    const updatedComments = comments.map(c => {
      if (c.id !== commentId) return c;
      const reactions = c.reactions || [];
      const existing = reactions.find(r => r.emoji === emoji);

      let newReactions;
      if (existing) {
        if (existing.userIds.includes(currentUser.id)) {
          // Remove reaction
          newReactions = reactions
            .map(r => r.emoji === emoji ? { ...r, count: r.count - 1, userIds: r.userIds.filter(id => id !== currentUser.id) } : r)
            .filter(r => r.count > 0);
        } else {
          // Add user to reaction
          newReactions = reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, userIds: [...r.userIds, currentUser.id] } : r);
        }
      } else {
        newReactions = [...reactions, { emoji, count: 1, userIds: [currentUser.id] }];
      }

      return { ...c, reactions: newReactions };
    });

    setComments(updatedComments);
    if (onUpdateAsset) {
      onUpdateAsset({
        ...asset,
        comments: updatedComments,
      });
    }
  };

  // Render comment text with highlighted mentions
  const renderCommentContent = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(@[\w\u4e00-\u9fa5()（）\s-]+?)(?=[,，\s]|$)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        return (
          <span key={idx} className="inline-block bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.5 rounded text-xs mx-0.5">
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="space-y-4">
      {/* Lightbox Modal for Full Image Inspection */}
      {previewImageModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImageModal(null)}
        >
          <button 
            onClick={() => setPreviewImageModal(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-lg cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          <img 
            src={previewImageModal} 
            alt="预览图" 
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <i className="fa-solid fa-comments text-indigo-600"></i>
          <h3 className="text-sm font-bold text-slate-900">讨论与评论</h3>
          <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        </div>
        <span className="text-xs text-slate-400">支持文字、图片(至多9张)、@成员与表情</span>
      </div>

      {/* Simplified Comment Input Box */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3.5 space-y-3 relative">
        <div className="flex items-start space-x-3">
          {/* User Avatar */}
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 mt-0.5 border border-indigo-200">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              currentUser.name.slice(0, 1)
            )}
          </div>

          <div className="flex-1 min-w-0 relative">
            <textarea
              ref={textareaRef}
              value={commentText}
              onChange={handleTextChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmitComment();
                }
              }}
              placeholder="发表你的想法或建议... (支持输入 @ 提及成员，快捷键 Ctrl/Cmd + Enter 发送)"
              rows={2}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all resize-none"
            />

            {/* @Mention Autocomplete Dropdown */}
            {showMentionDropdown && (
              <div 
                ref={mentionDropdownRef}
                className="absolute left-0 top-full mt-1 z-30 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 max-h-48 overflow-y-auto custom-scrollbar animate-fadeIn"
              >
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  选择团队成员
                </div>
                {mentionCandidates.length === 0 ? (
                  <div className="px-2 py-2 text-xs text-slate-400 text-center">无匹配成员</div>
                ) : (
                  mentionCandidates.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => insertMention(u.name)}
                      className="w-full flex items-center space-x-2.5 px-2 py-1.5 rounded-lg hover:bg-indigo-50 text-left transition-colors cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-[10px] overflow-hidden shrink-0">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          u.name.slice(0, 1)
                        )}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate leading-tight">{u.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{u.department}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Attached Images Preview Grid (Up to 9 images) */}
        {attachedImages.length > 0 && (
          <div className="pl-11">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-600">
                已选图片 ({attachedImages.length}/9)
              </span>
              {attachedImages.length < 9 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                >
                  + 继续添加
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-2">
              {attachedImages.map((img, idx) => (
                <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white">
                  <img 
                    src={img} 
                    alt={`图片 ${idx + 1}`} 
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setPreviewImageModal(img)} 
                  />
                  <button
                    type="button"
                    onClick={() => removeAttachedImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-rose-600 text-white text-[10px] flex items-center justify-center transition-colors cursor-pointer"
                    title="移除图片"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                  <span className="absolute bottom-0.5 left-1 text-[9px] text-white bg-black/50 px-1 rounded font-mono">
                    {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions Bar: Image Upload + @Mention + Emoji + Submit */}
        <div className="flex items-center justify-between pl-11 pt-1">
          <div className="flex items-center space-x-1.5 relative">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />

            {/* Upload Image Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachedImages.length >= 9}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1.5 transition-colors cursor-pointer ${
                attachedImages.length >= 9 
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="上传图片 (最多9张)"
            >
              <i className="fa-regular fa-image text-slate-500"></i>
              <span>图片</span>
              {attachedImages.length > 0 && (
                <span className="text-[10px] font-bold text-indigo-600">
                  {attachedImages.length}/9
                </span>
              )}
            </button>

            {/* @ Mention Button */}
            <button
              type="button"
              onClick={() => {
                setShowMentionDropdown(!showMentionDropdown);
                setMentionQuery('');
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="提及团队成员"
            >
              <i className="fa-solid fa-at text-slate-500"></i>
              <span>成员</span>
            </button>

            {/* Emoji Button */}
            <div className="relative" ref={emojiPickerRef}>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="插入表情"
              >
                <span>😊</span>
                <span>表情</span>
              </button>

              {/* Emoji Picker Popup */}
              {showEmojiPicker && (
                <div className="absolute left-0 bottom-full mb-2 z-30 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 grid grid-cols-6 gap-1.5 w-52 animate-fadeIn">
                  {COMMON_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-base transition-transform hover:scale-125 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={() => handleSubmitComment()}
            disabled={!commentText.trim() && attachedImages.length === 0}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer ${
              !commentText.trim() && attachedImages.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <i className="fa-solid fa-paper-plane text-[10px]"></i>
            <span>发送</span>
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3 pt-2">
        {comments.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <i className="fa-regular fa-comment-dots text-2xl text-slate-300 mb-1.5 block"></i>
            <p className="text-xs text-slate-500 font-medium">暂无评论与讨论</p>
            <p className="text-[11px] text-slate-400 mt-0.5">发表第一条评论，与团队成员在线沟通</p>
          </div>
        ) : (
          comments.map(c => {
            const isMyComment = c.author.id === currentUser.id;
            return (
              <div key={c.id} className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-3.5 border border-slate-100 transition-colors space-y-2.5 group">
                {/* Author Info & Date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                      {c.author.avatar ? (
                        <img src={c.author.avatar} alt={c.author.name} className="w-full h-full object-cover" />
                      ) : (
                        c.author.name.slice(0, 1)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{c.author.name}</span>
                        {c.author.department && (
                          <span className="text-[10px] text-slate-400">{c.author.department}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                    </div>
                  </div>

                  {/* Delete Button (for author or admin) */}
                  {(isMyComment || currentUser.role === 'SUPER_ADMIN') && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 text-xs px-2 py-1 rounded transition-all cursor-pointer"
                      title="删除该评论"
                    >
                      <i className="fa-regular fa-trash-can"></i>
                    </button>
                  )}
                </div>

                {/* Content */}
                {c.content && (
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-9.5">
                    {renderCommentContent(c.content)}
                  </p>
                )}

                {/* Attached Images Grid */}
                {c.images && c.images.length > 0 && (
                  <div className="pl-9.5">
                    <div className={`grid gap-2 ${
                      c.images.length === 1 
                        ? 'grid-cols-1 max-w-xs' 
                        : c.images.length <= 4 
                          ? 'grid-cols-2 max-w-sm' 
                          : 'grid-cols-3 max-w-md'
                    }`}>
                      {c.images.map((img, imgIdx) => (
                        <div 
                          key={imgIdx} 
                          className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setPreviewImageModal(img)}
                        >
                          <img src={img} alt="附件图片" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emoji Reaction Bar */}
                <div className="flex items-center flex-wrap gap-1.5 pl-9.5 pt-1">
                  {/* Current Active Reactions */}
                  {(c.reactions || []).map(r => {
                    const hasReacted = r.userIds.includes(currentUser.id);
                    return (
                      <button
                        key={r.emoji}
                        onClick={() => handleToggleReaction(c.id, r.emoji)}
                        className={`px-2 py-0.5 rounded-full text-[11px] border font-medium flex items-center space-x-1 transition-colors cursor-pointer ${
                          hasReacted
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{r.emoji}</span>
                        <span>{r.count}</span>
                      </button>
                    );
                  })}

                  {/* Quick Reaction Buttons */}
                  <div className="flex items-center space-x-1 opacity-60 hover:opacity-100 transition-opacity">
                    {QUICK_REACTION_EMOJIS.map(emoji => {
                      const alreadyInList = (c.reactions || []).some(r => r.emoji === emoji);
                      if (alreadyInList) return null;
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(c.id, emoji)}
                          className="w-6 h-6 rounded-full hover:bg-white hover:border hover:border-slate-200 flex items-center justify-center text-xs transition-transform hover:scale-110 cursor-pointer"
                          title={`回应 ${emoji}`}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
