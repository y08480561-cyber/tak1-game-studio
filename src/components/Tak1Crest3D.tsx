import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

interface Tak1Crest3DProps {
  caption: string;
}

function createBrushedMetalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 1) {
      const shade = 112 + Math.floor(Math.sin(y * 0.7) * 18 + (Math.random() - 0.5) * 26);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(0, y, 256, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.32)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-1.18, 0.86);
  s.lineTo(0.28, 0.86);
  s.lineTo(0.18, 0.52);
  s.lineTo(-0.32, 0.52);
  s.lineTo(-0.56, -0.98);
  s.lineTo(-0.92, -1.16);
  s.lineTo(-0.70, 0.52);
  s.lineTo(-1.05, 0.52);
  s.closePath();
  return s;
}

function createOneShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0.32, 0.86);
  s.lineTo(0.84, 0.86);
  s.lineTo(0.58, -0.78);
  s.lineTo(0.82, -0.78);
  s.lineTo(0.75, -1.04);
  s.lineTo(-0.08, -1.04);
  s.lineTo(0.0, -0.78);
  s.lineTo(0.22, -0.78);
  s.lineTo(0.42, 0.44);
  s.lineTo(0.06, 0.36);
  s.lineTo(0.0, 0.62);
  s.closePath();
  return s;
}

const _dummyObj = new THREE.Object3D();

export function Tak1Crest3D({ caption }: Tak1Crest3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 460;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070709, 0.045);

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 60);
    camera.position.set(0, 0.25, 6.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    // 3-Point Studio Lighting (Warm key, cool fill, crisp rim)
    const hemiLight = new THREE.HemisphereLight(0xbfd4ff, 0x16120c, 0.55);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffe1a6, 2.2);
    keyLight.position.set(4.5, 5.5, 5.0);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -3.2;
      keyLight.shadow.camera.right = 3.2;
      keyLight.shadow.camera.top = 3.2;
      keyLight.shadow.camera.bottom = -3.2;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xdce6f5, 1.45);
    rimLight.position.set(-4.5, 2.5, -4.0);
    scene.add(rimLight);

    // Procedural brushed metal roughness map
    const brushedMap = createBrushedMetalTexture();
    brushedMap.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const silverMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xdbe2eb),
      metalness: 0.94,
      roughness: 0.22,
      roughnessMap: brushedMap,
      anisotropy: 0.75,
      clearcoat: 0.25,
      clearcoatRoughness: 0.2,
    });

    const goldMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xe6b446),
      metalness: 0.96,
      roughness: 0.16,
      roughnessMap: brushedMap,
      anisotropy: 0.85,
      clearcoat: 0.35,
      clearcoatRoughness: 0.15,
    });

    const obsidianMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x0d0f14),
      metalness: 0.28,
      roughness: 0.72,
    });

    const filamentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x94a3b8),
      metalness: 0.85,
      roughness: 0.25,
    });

    // Composite Multi-Part TAK1 Crest Group
    const crestGroup = new THREE.Group();
    scene.add(crestGroup);

    // 1. Obsidian core disc
    const coreGeo = new THREE.CylinderGeometry(1.42, 1.46, 0.14, 56);
    coreGeo.rotateX(Math.PI / 2);
    const coreMesh = new THREE.Mesh(coreGeo, obsidianMat);
    coreMesh.position.z = -0.08;
    coreMesh.receiveShadow = true;
    crestGroup.add(coreMesh);

    // 2. Brushed silver left outer ring arc
    const silverArcGeo = new THREE.TorusGeometry(1.48, 0.075, 20, 64, Math.PI * 1.05);
    const silverArc = new THREE.Mesh(silverArcGeo, silverMat);
    silverArc.rotation.z = Math.PI * 0.48;
    silverArc.castShadow = true;
    crestGroup.add(silverArc);

    // 3. 24K Gold right outer ring arc
    const goldArcGeo = new THREE.TorusGeometry(1.48, 0.075, 20, 64, Math.PI * 0.92);
    const goldArc = new THREE.Mesh(goldArcGeo, goldMat);
    goldArc.rotation.z = -Math.PI * 0.46;
    goldArc.castShadow = true;
    crestGroup.add(goldArc);

    // 4. Precision fine orbital titanium filament
    const orbitGeo = new THREE.TorusGeometry(1.74, 0.015, 12, 80);
    const orbitMesh = new THREE.Mesh(orbitGeo, filamentMat);
    orbitMesh.rotation.x = 0.28;
    orbitMesh.rotation.y = -0.22;
    crestGroup.add(orbitMesh);

    // 5. Extruded Brushed Silver "T" Monolith
    const rawTGeo = new THREE.ExtrudeGeometry(createTShape(), {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.045,
      bevelSize: 0.035,
      bevelSegments: 3,
    });
    const tGeo = mergeVertices(rawTGeo);
    rawTGeo.dispose();
    tGeo.computeTangents();
    const tMesh = new THREE.Mesh(tGeo, silverMat);
    tMesh.position.set(-0.04, 0.06, 0.04);
    tMesh.castShadow = true;
    tMesh.receiveShadow = true;
    crestGroup.add(tMesh);

    // 6. Extruded Metallic Gold "1" Monolith
    const rawOneGeo = new THREE.ExtrudeGeometry(createOneShape(), {
      depth: 0.26,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.035,
      bevelSegments: 3,
    });
    const oneGeo = mergeVertices(rawOneGeo);
    rawOneGeo.dispose();
    oneGeo.computeTangents();
    const oneMesh = new THREE.Mesh(oneGeo, goldMat);
    oneMesh.position.set(0.08, 0.06, 0.08);
    oneMesh.castShadow = true;
    oneMesh.receiveShadow = true;
    crestGroup.add(oneMesh);

    // 7. Instanced Precision Bezel Studs (>20 repeated parts)
    const studGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.06, 10);
    studGeo.rotateX(Math.PI / 2);
    const studCount = 24;
    const studInstanced = new THREE.InstancedMesh(studGeo, goldMat, studCount);
    for (let i = 0; i < studCount; i++) {
      const angle = (i / studCount) * Math.PI * 2;
      _dummyObj.position.set(Math.cos(angle) * 1.32, Math.sin(angle) * 1.32, -0.01);
      _dummyObj.rotation.set(0, 0, angle);
      const scalePulse = i % 6 === 0 ? 1.35 : 0.9;
      _dummyObj.scale.set(scalePulse, scalePulse, 1);
      _dummyObj.updateMatrix();
      studInstanced.setMatrixAt(i, _dummyObj.matrix);
    }
    studInstanced.instanceMatrix.needsUpdate = true;
    studInstanced.computeBoundingSphere();
    crestGroup.add(studInstanced);

    // 8. Soft Radial Contact Shadow Plane
    const shadowTex = createContactShadowTexture();
    const shadowPlaneGeo = new THREE.PlaneGeometry(4.2, 1.3);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(0, -1.95, 0);
    scene.add(shadowPlane);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Pointer interaction state (drag + gentle hover tilt)
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let targetRotY = -0.18;
    let targetRotX = 0.06;
    let currentRotY = -0.18;
    let currentRotX = 0.06;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const dx = e.clientX - prevPointerX;
        const dy = e.clientY - prevPointerY;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
        targetRotY += dx * 0.0085;
        targetRotX = THREE.MathUtils.clamp(targetRotX + dy * 0.006, -0.55, 0.55);
      } else {
        const rect = renderer.domElement.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 0.25;
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 0.16;
        if (!prefersReducedMotion) {
          targetRotX = THREE.MathUtils.clamp(0.06 + ny, -0.4, 0.4);
          if (Math.abs(targetRotY) < 0.7) {
            targetRotY = -0.18 + nx;
          }
        }
      }
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 460;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (!isDragging && !prefersReducedMotion) {
        targetRotY += dt * 0.22;
      }

      currentRotY = THREE.MathUtils.damp(currentRotY, targetRotY, 6, dt);
      currentRotX = THREE.MathUtils.damp(currentRotX, targetRotX, 6, dt);

      crestGroup.rotation.y = currentRotY;
      crestGroup.rotation.x = currentRotX;
      crestGroup.position.y = prefersReducedMotion ? 0 : Math.sin(now * 0.0014) * 0.06;
      orbitMesh.rotation.z += dt * (prefersReducedMotion ? 0 : 0.3);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      coreGeo.dispose();
      silverArcGeo.dispose();
      goldArcGeo.dispose();
      orbitGeo.dispose();
      tGeo.dispose();
      oneGeo.dispose();
      studGeo.dispose();
      shadowPlaneGeo.dispose();

      silverMat.dispose();
      goldMat.dispose();
      obsidianMat.dispose();
      filamentMat.dispose();
      shadowPlaneMat.dispose();

      brushedMap.dispose();
      shadowTex.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[360px] sm:h-[420px] lg:h-[480px] select-none">
      {contextLost ? (
        <div className="w-full h-full flex items-center justify-center rounded-xl border border-white/10 bg-[#0d0e12]">
          <img
            src="/assets/aistudio/image_3e0bd734.png"
            alt="TAK1 Game Studio Crest"
            className="w-48 h-48 object-contain"
          />
        </div>
      ) : (
        <div
          ref={mountRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          aria-label="Interactive 3D TAK1 Emblem"
        />
      )}
      <p className="mt-2 text-center text-xs text-slate-400 tracking-wide">
        {caption}
      </p>
    </div>
  );
}
