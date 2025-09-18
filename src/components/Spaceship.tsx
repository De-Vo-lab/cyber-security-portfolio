import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function Spaceship() {
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

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

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
    const mouse = new THREE.Vector2(0, 0);
    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    window.addEventListener("mousemove", onMouseMove);

    // Resize
    const onResize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // Add a smoothed look-at target for the camera to follow the ship
    const lookAtTarget = new THREE.Vector3(0, 0, 0);

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
          // accelerate deeper to feel like getting pulled into a black hole
          pz = lerp(-1.2, -6, u);
          if (s >= 0.9) {
            const deepU = (s - 0.9) / 0.1; // 0..1
            pz = lerp(pz, -12, deepU);
          }
        }

        // gentle bobbing overlay
        const bob = Math.sin(t * 1.2) * 0.25;

        // APPLY OFFSET so the entire path is shifted up/left
        group.position.set(px + X_OFFSET, py + Y_OFFSET + bob, pz);

        // subtle orbit + mouse parallax
        group.rotation.y += 0.1 * dt; // base orbit
        const targetRotX = mouse.y * 0.25;
        const targetRotY = mouse.x * 0.35;
        group.rotation.x += (targetRotX - group.rotation.x) * 0.05;
        group.rotation.y += (targetRotY - group.rotation.y) * 0.04;

        // keep camera trained on the ship
        lookAtTarget.lerp(group.position, 0.08);
        camera.lookAt(lookAtTarget);

        // ADD: smooth exit fade-out and entrance fade-in to avoid visible "pop"
        // Fade in for first 8% of the cycle, fade out for last 10%
        let opacity = 1;
        if (s < 0.08) {
          opacity = smoothstep(0, 1, s / 0.08);      // 0 -> 1
        } else if (s > 0.9) {
          opacity = smoothstep(1, 0, (s - 0.9) / 0.1); // 1 -> 0
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
        group.visible = opacity > 0.03;
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