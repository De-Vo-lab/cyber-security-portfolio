import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Add a top-level feature flag to use Sketchfab embed instead of the GLB renderer
const USE_SKETCHFAB = true;

export default function Spaceship() {
  // Inject an early return path that renders the Sketchfab embed when enabled
  // Subtle bobbing + mouse parallax for presence, keeping pointer-events none
  const sketchRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!USE_SKETCHFAB) return;

    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", onMouseMove);

    let t = 0;
    const animate = () => {
      t += 0.016;
      const bob = Math.sin(t * 1.2) * 6; // px
      const parallaxX = mouse.current.x * 6;
      const parallaxY = mouse.current.y * 4;

      if (sketchRef.current) {
        sketchRef.current.style.transform = `translate3d(${parallaxX}px, ${bob + parallaxY}px, 0)`;
        sketchRef.current.style.opacity = "1";
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (USE_SKETCHFAB) {
    return (
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{ width: "100vw", minWidth: 320, maxWidth: "100vw" }}
        aria-hidden="true"
      >
        <div
          ref={sketchRef}
          className="absolute"
          // Positioned near the right-bottom; adjust as desired
          style={{
            right: "6%",
            bottom: "12%",
            width: "520px",
            height: "360px",
            willChange: "transform, opacity",
            transform: "translate3d(0,0,0)",
            opacity: 0,
          }}
        >
          <iframe
            title="Spaceship"
            src="https://sketchfab.com/models/112f726de5944fdc9b7b9bc5b3f9d4e3/embed?preload=1&transparent=1"
            frameBorder="0"
            allow="autoplay; fullscreen; xr-spatial-tracking"
            allowFullScreen
            // Keep it non-interactive to match existing behavior; I can enable interactions if you want
            style={{
              width: "100%",
              height: "100%",
              border: "0",
              pointerEvents: "none",
              filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.6))",
            }}
          />
        </div>
      </div>
    );
  }

  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 15, 60);

    // Narrower FOV for better composition and compatibility
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    camera.position.set(0, 1.2, 8);

    // Create WebGL renderer with graceful fallback if WebGL is unavailable
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: true,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("WebGL not available or context creation failed. Spaceship disabled.", err);
      return; // Exit effect early to avoid runtime errors
    }

    // Improve visual smoothness/perception with better tone mapping
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
renderer.outputColorSpace = THREE.SRGBColorSpace;
mount.appendChild(renderer.domElement);

// Add window event listeners for resize and mouse movement
const onResize = () => {
  const w = (mount?.clientWidth || window.innerWidth);
  const h = (mount?.clientHeight || window.innerHeight);
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
};
window.addEventListener("resize", onResize);

const onMouseMove = (e: MouseEvent) => {
  mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
};
window.addEventListener("mousemove", onMouseMove);

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 0.7);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(4, 6, 8);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x88ccff, 0.8);
    rimLight.position.set(-6, 2, -4);
    scene.add(rimLight);

    // Subtle star-like points to complement background
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 300;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = -Math.random() * 40 - 5;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(
      starsGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.02 })
    );
    scene.add(stars);

    // Load GLB
    const loader = new GLTFLoader();
    const MODEL_PATH = "/assets/xwing.glb";
    const group = new THREE.Group();
    scene.add(group);

    // ADD: cache materials for per-frame fade
    const materials: Array<THREE.Material> = [];

    let model: THREE.Object3D | null = null;
    loader.load(
      MODEL_PATH,
      (gltf) => {
        model = gltf.scene;
        model.traverse((obj: any) => {
          if (obj.isMesh) {
            obj.castShadow = false;
            obj.receiveShadow = false;
            if (obj.material) {
              obj.material.transparent = true;
              // Ensure proper blending for fade
              obj.material.depthWrite = false;
              materials.push(obj.material);
            }
          }
        });

        // Auto-fit camera to model so it doesn't fill the entire viewport
        // and remains nicely framed across devices.
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const sizeVec = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxSize = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);

        // Re-center model around origin for stable animation
        gltf.scene.position.sub(center);

        // Optional: small uniform scale if model is huge or tiny in native units
        const targetScale = 1; // tweak if needed
        gltf.scene.scale.setScalar(targetScale);

        // Compute a camera distance that fits the model with some margin
        const halfFovY = THREE.MathUtils.degToRad(camera.fov * 0.5);
        const distance = (maxSize / (2 * Math.tan(halfFovY))) * 1.25; // 25% margin

        // Clamp to ensure it never gets too close on small models
        const minDistance = 8;
        camera.position.set(0, 1.2, Math.max(distance, minDistance));

        // Update clipping planes to suit model size, then apply
        camera.near = Math.max(0.1, maxSize / 1000);
        camera.far = Math.max(200, maxSize * 10);
        camera.updateProjectionMatrix();

        // Add to scene after fit
        group.add(gltf.scene);
      },
      undefined,
      (err) => {
        // eslint-disable-next-line no-console
        console.error("Failed to load spaceship model:", err);
      }
    );

    // Mouse parallax
    const lookAtTarget = new THREE.Vector3(0, 0, 0);

    // Track previous X to compute horizontal velocity for banking
    let lastPosX = 0;

    let t = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const dt = clock.getDelta();
      t += dt;

      // Float animation
      if (group) {
        // Entry -> Center -> Exit-beyond then repeat
        const speed = 0.14;
        const s = (t * speed) % 1; // 0..1 per full pass

        // Key points
        const P0 = { x: 6, y: -1 };      // start at right-bottom
        const PC = { x: 0, y: 0.2 };     // pass through center
        const PEND = { x: -12, y: 2 };   // far top-left

        // NEW: global offset to shift the full path left/up a bit
        const X_OFFSET = -5.5;
        const Y_OFFSET = 0.6;

        // helpers
        const smoothstep = (a: number, b: number, x: number) => {
          const tt = Math.max(0, Math.min(1, (x - a) / (b - a)));
          return tt * tt * (3 - 2 * tt);
        };
        const lerp = (a: number, b: number, tt: number) => a + (b - a) * tt;

        // piecewise interpolation: 0..0.6 to center, 0.6..1.0 beyond
        let px = 0, py = 0, pz = 0;
        if (s < 0.6) {
          const u = smoothstep(0, 1, s / 0.6);
          px = lerp(P0.x, PC.x, u);
          py = lerp(P0.y, PC.y, u);
          // slight depth pull as it nears the center
          pz = lerp(0, -1.2, u);
        } else {
          const u = smoothstep(0, 1, (s - 0.6) / 0.4);
          px = lerp(PC.x, PEND.x, u);
          py = lerp(PC.y, PEND.y, u);
          // accelerate deeper; begin stronger pull earlier for smoother exit
          pz = lerp(-1.2, -6, u);
          // ramp the "black hole" pull across the last 20% of the cycle
          if (s >= 0.8) {
            const deepU = (s - 0.8) / 0.2; // 0..1
            pz = lerp(pz, -16, deepU);
          }
        }

        // gentle bobbing overlay
        const bob = Math.sin(t * 1.2) * 0.25;

        // Compute banking from horizontal velocity before applying position
        const vx = px - lastPosX;

        // Dampen dynamics near exit so it glides smoothly into the fade
        const exitFactor = s < 0.8 ? 1 : 1 - smoothstep(0, 1, (s - 0.8) / 0.2);

        // target bank angle (lean into turns), damped on exit
        const bankTarget = THREE.MathUtils.clamp(-vx * 0.25 * exitFactor, -0.6, 0.6);

        // APPLY OFFSET so the entire path is shifted up/left
        group.position.set(px + X_OFFSET, py + Y_OFFSET + bob, pz);
// Update lastPosX after applying new position for correct banking
lastPosX = px;

        // Natural banking with damping
        group.rotation.z += (bankTarget - group.rotation.z) * Math.min(1, 8 * dt);

        // subtle orbit + mouse parallax (damped on exit)
        group.rotation.y += 0.1 * dt; // base orbit
const targetRotX = mouse.current.y * 0.25 * exitFactor;
const targetRotY = mouse.current.x * 0.35 * exitFactor;
        group.rotation.x += (targetRotX - group.rotation.x) * Math.min(1, 5 * dt);
        group.rotation.y += (targetRotY - group.rotation.y) * Math.min(1, 4 * dt);

        // keep camera trained on the ship, a touch snappier for smooth tracking
        lookAtTarget.lerp(group.position, Math.min(1, 6 * dt));
        camera.lookAt(lookAtTarget);

        // Smooth entrance/exit fades:
        // Fade in first 12%, fade out last 20% for a softer appear/disappear
        let opacity = 1;
        if (s < 0.12) {
          opacity = smoothstep(0, 1, s / 0.12);            // 0 -> 1
        } else if (s > 0.8) {
          opacity = smoothstep(1, 0, (s - 0.8) / 0.2);     // 1 -> 0
        }

        // Apply opacity to cached materials
        for (const m of materials) {
          m.opacity = opacity;
          m.transparent = true;
          m.depthWrite = false;
          m.needsUpdate = true;
        }

        // Scale with opacity for a nicer vanish/appear
        const baseScale = 1;
        const scaled = 0.7 + 0.3 * opacity; // 0.7 at fade-out, 1 at full
        group.scale.setScalar(baseScale * scaled);

        // Optionally hide at near-zero opacity to avoid any flicker on wrap
        group.visible = opacity > 0.02;

      }

      // Subtle star drift
      stars.rotation.z += 0.01 * dt;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    let raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      starsGeo.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed inset-0 z-10"
      style={{
        width: "100vw",
        minWidth: 320,
        maxWidth: "100vw",
      }}
      aria-hidden="true"
    />
  );
}