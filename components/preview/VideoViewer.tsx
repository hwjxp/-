import React, { useState, useRef, useEffect } from 'react';

interface VideoViewerProps {
  title: string;
  thumbnail: string;
  videoSrc?: string;
  fileSize?: string;
  onDownload?: () => void;
}

// Dependable online HTML5 video samples
const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
];

export const VideoViewer: React.FC<VideoViewerProps> = ({
  title,
  thumbnail,
  videoSrc,
  fileSize = '820 MB',
  onDownload,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [videoError, setVideoError] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeout = useRef<any>(null);

  const activeSrc = videoSrc || SAMPLE_VIDEOS[0];

  // Format time MM:SS
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Format SMPTE frame (assuming 30fps)
  const formatTimecode = (secs: number) => {
    if (isNaN(secs)) return '00:00:00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const f = Math.floor((secs % 1) * 30);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 30);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val > 0 && isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  // Step frame forward / backward (1 frame = 1/30s)
  const stepFrame = (deltaFrames: number) => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + deltaFrames * (1 / 30)));
    }
  };

  // Handle Fullscreen
  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Auto-hide controls on inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2800);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-full flex flex-col bg-black rounded-2xl overflow-hidden border border-slate-700 shadow-2xl select-none group/player"
    >
      {/* Top Overlay Badge Bar */}
      <div className={`absolute top-3 left-3 right-3 z-30 flex items-center justify-between transition-opacity duration-300 pointer-events-none ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="flex items-center space-x-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white pointer-events-auto">
          <i className="fa-solid fa-film text-indigo-400 text-xs"></i>
          <span className="font-bold text-xs truncate max-w-xs">{title}</span>
          <span className="font-mono text-[10px] text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-700/50">
            4K 60FPS · ProRes 422
          </span>
        </div>

        <div className="flex items-center space-x-2 pointer-events-auto">
          <span className="font-mono text-[10px] text-slate-300 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10">
            {fileSize}
          </span>
          {onDownload && (
            <button
              onClick={onDownload}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1 cursor-pointer"
            >
              <i className="fa-solid fa-cloud-arrow-down text-xs"></i>
              <span className="hidden sm:inline">下载母带</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Video Viewport */}
      <div 
        className="flex-1 w-full h-full flex items-center justify-center relative cursor-pointer overflow-hidden bg-black"
        onClick={togglePlay}
      >
        {!videoError ? (
          <video
            ref={videoRef}
            src={activeSrc}
            poster={thumbnail}
            loop={isLooping}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={() => setVideoError(true)}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full max-h-[66vh] object-contain"
          />
        ) : (
          /* Fallback Poster Player Simulation */
          <div className="relative w-full h-full flex items-center justify-center">
            <img src={thumbnail} alt={title} className="w-full h-full object-contain opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
          </div>
        )}

        {/* Big Center Play/Pause Button when paused */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-all">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600/90 hover:bg-indigo-600 text-white flex items-center justify-center text-2xl sm:text-3xl shadow-2xl transition-transform hover:scale-110 border-2 border-white/30">
              <i className="fa-solid fa-play ml-1"></i>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Professional Video Control Bar */}
      <div className={`bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-6 pb-3 px-3 sm:px-5 transition-opacity duration-300 z-30 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Scrubber Timeline */}
        <div className="flex items-center space-x-3 mb-2">
          <span className="font-mono text-xs font-bold text-slate-300 shrink-0">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 group/track flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.05}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2.5 transition-all"
            />
          </div>
          <span className="font-mono text-xs text-slate-400 shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between text-xs text-slate-200">
          {/* Left Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title={isPlaying ? '暂停 (Space)' : '播放 (Space)'}
            >
              <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play ml-0.5'} text-xs`}></i>
            </button>

            {/* Frame Step Back */}
            <button
              onClick={() => stepFrame(-1)}
              className="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="后退 1 帧 (精准质检)"
            >
              <i className="fa-solid fa-backward-step text-[11px]"></i>
            </button>

            {/* Frame Step Forward */}
            <button
              onClick={() => stepFrame(1)}
              className="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="前进 1 帧 (精准质检)"
            >
              <i className="fa-solid fa-forward-step text-[11px]"></i>
            </button>

            {/* SMPTE Timecode */}
            <span className="font-mono text-[11px] font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-800/40 px-2 py-0.5 rounded hidden md:inline-block">
              {formatTimecode(currentTime)}
            </span>

            {/* Volume Control */}
            <div className="flex items-center space-x-1.5 group/vol">
              <button
                onClick={toggleMute}
                className="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title={isMuted ? '取消静音' : '静音'}
              >
                <i className={`fa-solid ${
                  isMuted || volume === 0 
                    ? 'fa-volume-xmark text-red-400' 
                    : volume < 0.5 
                      ? 'fa-volume-low' 
                      : 'fa-volume-high'
                } text-xs`}></i>
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Speed Selector */}
            <div className="flex items-center space-x-1 bg-white/10 px-1.5 py-0.5 rounded-lg border border-white/10">
              {[0.5, 1.0, 1.5, 2.0].map(rate => (
                <button
                  key={rate}
                  onClick={() => handleRateChange(rate)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                    playbackRate === rate 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Loop Toggle */}
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isLooping ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-slate-400'
              }`}
              title={isLooping ? '循环播放已开启' : '循环播放已关闭'}
            >
              <i className="fa-solid fa-repeat text-[11px]"></i>
            </button>

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="全屏播放"
            >
              <i className="fa-solid fa-expand text-[11px]"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
