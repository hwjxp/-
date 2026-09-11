import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';

interface ThreeDViewerProps {
  title: string;
  format?: string;
  fileSize?: string;
  polyCount?: number;
  onDownload?: () => void;
}

type ShadingMode = 'pbr' | 'wireframe' | 'clay' | 'normal';
type LightingPreset = 'studio' | 'sunset' | 'cyberpunk' | 'neutral';

export const ThreeDViewer: React.FC<ThreeDViewerProps> = ({
  title,
  format = 'FBX / OBJ',
  fileSize = '260 MB',
  polyCount = 850000,
  onDownload,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // States
  const [shadingMode, setShadingMode] = useState<ShadingMode>('pbr');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('studio');
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showStats, setShowStats] = useState<boolean>(true);

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const lightsRef = useRef<{
    ambient: THREE.AmbientLight;
    key: THREE.DirectionalLight;
    fill: THREE.DirectionalLight;
    rim: THREE.DirectionalLight;
  } | null>(null);

  // Interaction tracking
  const isDraggingRef = useRef<boolean>(false);
  const prevPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number>(0);
  const rotationVelocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const autoRotateRef = useRef<boolean>(isAutoRotate);
  autoRotateRef.current = isAutoRotate;

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Slate-900
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2.5, 6.5);
    camera.lookAt(0, 0.5, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Ground Grid
    const grid = new THREE.GridHelper(10, 20, 0x6366f1, 0x334155);
    grid.position.y = -1.2;
    scene.add(grid);
    gridHelperRef.current = grid;

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x818cf8, 1.0);
    fillLight.position.set(-5, 4, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf472b6, 1.4);
    rimLight.position.set(0, 6, -6);
    scene.add(rimLight);

    lightsRef.current = { ambient: ambientLight, key: keyLight, fill: fillLight, rim: rimLight };

    // 6. Build High-Fidelity 3D Stylized Model
    const modelGroup = new THREE.Group();

    // Center Torus Knot / Elder Wand / Stylized Figurine Concept
    const mainGeometry = new THREE.TorusKnotGeometry(1.0, 0.32, 128, 32);
    const pbrMaterial = new THREE.MeshStandardMaterial({
      color: 0x4f46e5,
      metalness: 0.65,
      roughness: 0.25,
    });
    const mainMesh = new THREE.Mesh(mainGeometry, pbrMaterial);
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    mainMesh.name = 'Main3DMesh';
    modelGroup.add(mainMesh);

    // Pedestal Base Ring
    const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.25, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.4,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -1.2;
    baseMesh.receiveShadow = true;
    modelGroup.add(baseMesh);

    // Decorative Orbit Rings
    const ringGeo = new THREE.TorusGeometry(2.0, 0.04, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.1,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo, ringMat);
    ringMesh1.rotation.x = Math.PI / 3;
    modelGroup.add(ringMesh1);

    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // 7. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (modelGroupRef.current) {
        if (autoRotateRef.current && !isDraggingRef.current) {
          modelGroupRef.current.rotation.y += 0.008;
        }
        // Smooth inertia
        modelGroupRef.current.rotation.y += rotationVelocityRef.current.x;
        modelGroupRef.current.rotation.x += rotationVelocityRef.current.y;
        rotationVelocityRef.current.x *= 0.92;
        rotationVelocityRef.current.y *= 0.92;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      mainGeometry.dispose();
      baseGeo.dispose();
      ringGeo.dispose();
    };
  }, []);

  // Update Shading Mode
  useEffect(() => {
    if (!modelGroupRef.current) return;
    const mainMesh = modelGroupRef.current.getObjectByName('Main3DMesh') as THREE.Mesh;
    if (!mainMesh) return;

    if (shadingMode === 'pbr') {
      mainMesh.material = new THREE.MeshStandardMaterial({
        color: 0x4f46e5,
        metalness: 0.65,
        roughness: 0.25,
        wireframe: false,
      });
    } else if (shadingMode === 'wireframe') {
      mainMesh.material = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
      });
    } else if (shadingMode === 'clay') {
      mainMesh.material = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.0,
        roughness: 0.6,
        wireframe: false,
      });
    } else if (shadingMode === 'normal') {
      mainMesh.material = new THREE.MeshNormalMaterial({
        wireframe: false,
      });
    }
  }, [shadingMode]);

  // Update Lighting Preset
  useEffect(() => {
    if (!lightsRef.current || !sceneRef.current) return;
    const { ambient, key, fill, rim } = lightsRef.current;

    if (lightingPreset === 'studio') {
      sceneRef.current.background = new THREE.Color(0x0f172a);
      ambient.color.setHex(0xffffff);
      ambient.intensity = 0.8;
      key.color.setHex(0xffffff);
      key.intensity = 1.8;
      fill.color.setHex(0x818cf8);
      rim.color.setHex(0xf472b6);
    } else if (lightingPreset === 'sunset') {
      sceneRef.current.background = new THREE.Color(0x1a0f1e);
      ambient.color.setHex(0xffedd5);
      ambient.intensity = 0.6;
      key.color.setHex(0xf97316);
      key.intensity = 2.4;
      fill.color.setHex(0x9333ea);
      rim.color.setHex(0xfbbf24);
    } else if (lightingPreset === 'cyberpunk') {
      sceneRef.current.background = new THREE.Color(0x030712);
      ambient.color.setHex(0x06b6d4);
      ambient.intensity = 0.5;
      key.color.setHex(0x06b6d4);
      key.intensity = 2.0;
      fill.color.setHex(0xd946ef);
      rim.color.setHex(0xec4899);
    } else if (lightingPreset === 'neutral') {
      sceneRef.current.background = new THREE.Color(0x1e293b);
      ambient.color.setHex(0xffffff);
      ambient.intensity = 1.2;
      key.color.setHex(0xffffff);
      key.intensity = 1.2;
      fill.color.setHex(0xffffff);
      rim.color.setHex(0xffffff);
    }
  }, [lightingPreset]);

  // Update Grid
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // Mouse & Touch Controls
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevPointerRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !modelGroupRef.current) return;
    const dx = e.clientX - prevPointerRef.current.x;
    const dy = e.clientY - prevPointerRef.current.y;

    rotationVelocityRef.current = { x: dx * 0.006, y: dy * 0.006 };
    prevPointerRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Zoom via Wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (!cameraRef.current) return;
    const delta = e.deltaY * 0.005;
    cameraRef.current.position.z = Math.max(2.5, Math.min(12, cameraRef.current.position.z + delta));
  };

  // Touch pinch zoom on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistanceRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && cameraRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = (touchDistanceRef.current - dist) * 0.01;
      cameraRef.current.position.z = Math.max(2.5, Math.min(12, cameraRef.current.position.z + delta));
      touchDistanceRef.current = dist;
    }
  };

  // Reset Camera View Presets
  const setCameraPreset = (view: 'front' | 'top' | 'iso') => {
    if (!cameraRef.current || !modelGroupRef.current) return;
    modelGroupRef.current.rotation.set(0, 0, 0);
    if (view === 'front') {
      cameraRef.current.position.set(0, 0.5, 6);
    } else if (view === 'top') {
      cameraRef.current.position.set(0, 7, 0.1);
    } else if (view === 'iso') {
      cameraRef.current.position.set(4, 4, 5);
    }
    cameraRef.current.lookAt(0, 0, 0);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        {/* Format Badge & Title */}
        <div className="flex items-center space-x-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-slate-200 pointer-events-auto shadow-md">
          <div className="w-5 h-5 rounded bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
            3D
          </div>
          <span className="font-bold text-xs truncate max-w-xs">{title}</span>
          <span className="font-mono text-[10px] text-indigo-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            {format} · {fileSize}
          </span>
        </div>

        {/* Shading & Lighting Modes */}
        <div className="flex items-center space-x-1.5 bg-slate-900/85 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-700 pointer-events-auto text-xs shadow-md">
          {/* Shading modes */}
          <div className="flex items-center space-x-1 border-r border-slate-700 pr-1.5">
            <button
              onClick={() => setShadingMode('pbr')}
              className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                shadingMode === 'pbr' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="PBR 材质着色"
            >
              PBR
            </button>
            <button
              onClick={() => setShadingMode('wireframe')}
              className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                shadingMode === 'wireframe' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="多边形线框模式 (Wireframe)"
            >
              线框
            </button>
            <button
              onClick={() => setShadingMode('clay')}
              className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                shadingMode === 'clay' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="雕刻白模模式 (Clay)"
            >
              白模
            </button>
            <button
              onClick={() => setShadingMode('normal')}
              className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                shadingMode === 'normal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="法线贴图模式 (Normal Map)"
            >
              法线
            </button>
          </div>

          {/* Stats Toggle */}
          <button
            onClick={() => setShowStats(!showStats)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              showStats ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="查看模型面数与尺寸信息"
          >
            <i className="fa-solid fa-cube text-[11px]"></i>
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="flex-1 w-full h-full min-h-[350px] sm:min-h-[460px] cursor-grab active:cursor-grabbing relative overflow-hidden"
      >
        {/* Model Stats HUD (Overlay) */}
        {showStats && (
          <div className="absolute bottom-16 left-3 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 text-slate-300 text-xs font-mono space-y-1 shadow-xl pointer-events-none animate-fadeIn">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">面数 (Triangles):</span>
              <span className="text-indigo-400 font-bold">{(polyCount).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">顶点 (Vertices):</span>
              <span className="text-slate-200 font-bold">{(Math.round(polyCount * 0.58)).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">模型包围盒:</span>
              <span className="text-emerald-400 font-bold">120 × 165 × 110 mm</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">UV 映射状态:</span>
              <span className="text-amber-400 font-bold">UDIM 0~3 (Ready)</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating 3D Toolbar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700 shadow-2xl flex items-center space-x-1 sm:space-x-2 text-slate-300 text-xs">
        {/* Auto Rotate Toggle */}
        <button
          onClick={() => setIsAutoRotate(!isAutoRotate)}
          className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 text-[11px] font-bold transition-colors cursor-pointer ${
            isAutoRotate ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
          }`}
          title="切换 360° 转台自动旋转"
        >
          <i className="fa-solid fa-arrows-rotate text-[10px]"></i>
          <span>转台</span>
        </button>

        {/* Grid Toggle */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            showGrid ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'
          }`}
          title="切换地面参考网格"
        >
          <i className="fa-solid fa-border-all text-[11px]"></i>
        </button>

        <div className="w-px h-4 bg-slate-700 mx-0.5"></div>

        {/* Camera Presets */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCameraPreset('front')}
            className="px-2 py-0.5 hover:bg-slate-800 rounded font-mono font-bold text-[10px] text-slate-300 cursor-pointer"
            title="前视图"
          >
            前视
          </button>
          <button
            onClick={() => setCameraPreset('top')}
            className="px-2 py-0.5 hover:bg-slate-800 rounded font-mono font-bold text-[10px] text-slate-300 cursor-pointer"
            title="顶视图"
          >
            顶视
          </button>
          <button
            onClick={() => setCameraPreset('iso')}
            className="px-2 py-0.5 hover:bg-slate-800 rounded font-mono font-bold text-[10px] text-slate-300 cursor-pointer"
            title="等轴透视图 (45°)"
          >
            透视
          </button>
        </div>

        <div className="w-px h-4 bg-slate-700 mx-0.5"></div>

        {/* Lighting Presets */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setLightingPreset('studio')}
            className={`w-6 h-6 rounded flex items-center justify-center text-[10px] cursor-pointer ${
              lightingPreset === 'studio' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="棚拍三点光 (Studio)"
          >
            <i className="fa-solid fa-lightbulb"></i>
          </button>
          <button
            onClick={() => setLightingPreset('sunset')}
            className={`w-6 h-6 rounded flex items-center justify-center text-[10px] cursor-pointer ${
              lightingPreset === 'sunset' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="夕阳暖光 (Sunset)"
          >
            <i className="fa-solid fa-sun"></i>
          </button>
          <button
            onClick={() => setLightingPreset('cyberpunk')}
            className={`w-6 h-6 rounded flex items-center justify-center text-[10px] cursor-pointer ${
              lightingPreset === 'cyberpunk' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="赛博朋克霓虹光 (Cyberpunk)"
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </button>
        </div>

        {onDownload && (
          <>
            <div className="w-px h-4 bg-slate-700 mx-0.5"></div>
            <button
              onClick={onDownload}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center space-x-1 cursor-pointer"
              title="下载高模工程源文件"
            >
              <i className="fa-solid fa-download text-[10px]"></i>
              <span className="hidden sm:inline">下载</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
