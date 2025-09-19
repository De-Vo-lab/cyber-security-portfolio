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

    // Constants
    const ANIM_SPEED = 0.7; // Global speed scaler (bobbing, sway, engine pulse, camera breathing)
    const BASE_SCALE = 0.8; // Slightly smaller ship for better balance
    const RIGHT_ANCHOR_RATIO = 0.86; // Where to anchor on the canvas (0 left .. 1 right)

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 15, 60);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    camera.position.set(0, 1.2, 8);

    // Renderer with graceful fallback (no failIfMajorPerformanceCaveat)
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("WebGL not available or context creation failed. Spaceship disabled.", err);
      return;
    }

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // Lights (brighter, cinematic)
    const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 0.9);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(4, 6, 8);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x88ccff, 1.1);
    rimLight.position.set(-6, 2, -4);
    scene.add(rimLight);

    const ambient = new THREE.AmbientLight(0x335577, 0.25);
    scene.add(ambient);

    // Subtle star points
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 300;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3 + 0] = (Math.random() - 0.5) * 60;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      starPositions[i * 3 + 2] = -Math.random() * 40 - 5;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.02 }));
    scene.add(stars);

    // Group for the model
    const group = new THREE.Group();
    scene.add(group);

    // Engine glow (light + sprite)
    const engineLight = new THREE.PointLight(0x66aaff, 1.4, 6, 2.0);
    scene.add(engineLight);
    const engineSpriteMat = new THREE.SpriteMaterial({
      color: 0x6fa8ff,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const engineSprite = new THREE.Sprite(engineSpriteMat);
    engineSprite.scale.set(0.35, 0.35, 0.35);
    scene.add(engineSprite);

    // Mouse parallax
    const mouse = new THREE.Vector2(0, 0);
    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    window.addEventListener("mousemove", onMouseMove);

    // Helper: compute world X at a given screen ratio on z=0 plane
    const computeWorldXAtScreenRatio = (ratioX: number, depthZ = 0): number => {
      const ndcX = ratioX * 2 - 1; // -1..1
      const ndcY = 0; // center vertically
      const ndcZ = 0.5;

      const p = new THREE.Vector3(ndcX, ndcY, ndcZ).unproject(camera);
      const dir = p.sub(camera.position).normalize();

      // intersect with z = depthZ plane
      const t = (depthZ - camera.position.z) / dir.z;
      const worldPoint = new THREE.Vector3().copy(camera.position).add(dir.multiplyScalar(t));
      return worldPoint.x;
    };

    // Track anchor and base positions
    let anchorX = computeWorldXAtScreenRatio(RIGHT_ANCHOR_RATIO, 0);
    const baseY = 0;

    // Smooth camera look target
    const lookAtTarget = new THREE.Vector3(0, 0, 0);

    // Camera breathing base Z
    let baseCameraZ = camera.position.z;

    // Add: cinematic hyperjump sequence setup
    const CINEMATIC_DURATION_MS = 3000; // faster overall sequence
    const cinematicStart = performance.now();
    let cinematicDone = false;

    // Update: only allow scroll fade after cinematic is done
    let exitProgress = 0;
    const onScroll = () => {
      if (!cinematicDone) return;
      const vh = window.innerHeight || 1;
      const startAt = vh * 0.6;
      const dist = Math.max(0, window.scrollY - startAt);
      const span = vh * 0.8;
      exitProgress = Math.min(1, dist / span);
      if (renderer?.domElement) {
        renderer.domElement.style.opacity = String(1 - exitProgress);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Load model (with timeout)
    const loader = new GLTFLoader();
    const MODEL_PATH = "/assets/racing_ship (1).glb";
    let model: THREE.Object3D | null = null;

    let loadTimedOut = false;
    const timeoutId = window.setTimeout(() => {
      loadTimedOut = true;
      // eslint-disable-next-line no-console
      console.warn("Spaceship model load timed out (15s). Disabling to prevent freeze.");
    }, 15000);

    loader.load(
      MODEL_PATH,
      (gltf) => {
        if (loadTimedOut) return;
        window.clearTimeout(timeoutId);

        model = gltf.scene;
        model.traverse((obj: any) => {
          if (obj.isMesh) {
            obj.castShadow = false;
            obj.receiveShadow = false;
            // Preserve original materials & textures
          }
        });

        // Fit camera to model
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const sizeVec = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxSize = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);

        // Re-center around origin
        gltf.scene.position.sub(center);

        // Orient slightly facing left
        gltf.scene.rotation.y = (-5 * Math.PI) / 18;

        // Scale down slightly for balance
        gltf.scene.scale.setScalar(BASE_SCALE);

        // Compute camera distance with larger framing distance for better centering
        const halfFovY = THREE.MathUtils.degToRad(camera.fov * 0.5);
        const distance = (maxSize / (2 * Math.tan(halfFovY))) * 2.2; // increased from 1.25 to 2.2
        const minDistance = 8;
        camera.position.set(0, 1.2, Math.max(distance, minDistance));

        camera.near = Math.max(0.1, maxSize / 1000);
        camera.far = Math.max(200, maxSize * 10);
        camera.updateProjectionMatrix();

        baseCameraZ = camera.position.z;

        // Add model
        group.add(gltf.scene);

        // Position at right-side world anchor
        anchorX = computeWorldXAtScreenRatio(RIGHT_ANCHOR_RATIO, 0);
        group.position.set(anchorX, baseY, 0);
      },
      undefined,
      (err) => {
        window.clearTimeout(timeoutId);
        // eslint-disable-next-line no-console
        console.error("Failed to load spaceship model:", err);
      }
    );

    // Resize
    const onResize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      // Recompute world anchor on resize only (prevent per-frame drift)
      anchorX = computeWorldXAtScreenRatio(RIGHT_ANCHOR_RATIO, 0);
    };
    window.addEventListener("resize", onResize);

    // Animate
    const clock = new THREE.Clock();
    let raf = 0;

    const animate = () => {
      const dt = clock.getDelta();
      const t = clock.getElapsedTime();
      const now = performance.now();

      if (group && model) {
        if (!cinematicDone) {
          // Cinematic timeline progress 0..1
          const u = Math.min(1, (now - cinematicStart) / CINEMATIC_DURATION_MS);

          // Phases:
          // A: 0.00–0.25  fast entry (right -> near-right)
          // B: 0.25–0.70 sweep to left
          // C: 0.70–0.90 return to center
          // D: 0.90–1.00 hyperjump vanish (fade + push forward)

          // Anchor reference on z=0 plane
          const rightAnchor = anchorX;

          // Easing
          const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
          const easeInOut = (x: number) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

          let x = rightAnchor;
          let y = baseY;
          let z = 0;

          if (u <= 0.25) {
            // Phase A: from offscreen far right (+8) to near-right (+0.5) — faster, more dramatic
            const p = easeOut(u / 0.25);
            x = rightAnchor + (1 - p) * 8 + p * 0.5;
            y = baseY + Math.sin(t * 1.0 * ANIM_SPEED) * 0.08;
          } else if (u <= 0.70) {
            // Phase B: near-right (+0.5) to left side (-4) — deeper sweep
            const p = easeInOut((u - 0.25) / 0.45);
            x = (1 - p) * (rightAnchor + 0.5) + p * -4;
            y = baseY + Math.sin(t * 1.1 * ANIM_SPEED) * 0.1;
          } else if (u <= 0.90) {
            // Phase C: left (-4) back to center (0) — set up for hyperjump
            const p = easeInOut((u - 0.70) / 0.20);
            x = (1 - p) * -4 + p * 0;
            y = baseY + Math.sin(t * 1.2 * ANIM_SPEED) * 0.12;
          } else {
            // Phase D: hyperjump vanish — stronger push forward in z and faster fade
            const p = (u - 0.90) / 0.10;
            x = 0;
            y = baseY;
            z = -10 * easeOut(p); // stronger vanish push
            if (renderer?.domElement) {
              renderer.domElement.style.opacity = String(1 - p);
            }
          }

          // Apply position
          group.position.set(x, y, z);

          // Stronger cinematic banking: react more to path & mouse
          const targetRotY =
            (Math.atan2(rightAnchor - x, 3.5) * 0.8) + (mouse.x * 0.2);
          const targetRotX = (mouse.y * 0.2);
          const targetRotZ = -(rightAnchor - x) * 0.1;

          group.rotation.x += (targetRotX - group.rotation.x) * 0.1;
          group.rotation.y += (targetRotY - group.rotation.y) * 0.1;
          group.rotation.z += (targetRotZ - group.rotation.z) * 0.12;

          // Engine pulse stays active
          const glowOffset = new THREE.Vector3(0, -0.05, -0.5).applyQuaternion(group.quaternion);
          const glowPos = new THREE.Vector3().copy(group.position).add(glowOffset);
          engineLight.position.copy(glowPos);
          engineSprite.position.copy(glowPos);
          engineLight.intensity = 1.1 + Math.sin(t * 8 * ANIM_SPEED) * 0.08;
          engineSprite.material.opacity = 0.68 + Math.sin(t * 7.5 * ANIM_SPEED) * 0.08;

          // Camera: keep smooth look + breathing
          lookAtTarget.lerp(group.position, 0.1);
          camera.lookAt(lookAtTarget);
          camera.position.z = baseCameraZ + Math.sin(t * 0.35 * ANIM_SPEED) * 0.25;

          if (u >= 1) {
            cinematicDone = true;
            if (renderer?.domElement) renderer.domElement.style.opacity = "0";
            setTimeout(() => {
              cancelAnimationFrame(raf);
            }, 50);
          }
        } else {
          // Post-cinematic: keep ship hidden; allow scroll fade logic to control canvas (already at 0 opacity)
          // Optional: no-op on positions; early render exit to save work
        }
      }

      // Subtle star drift continues during cinematic
      stars.rotation.z += 0.01 * dt;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      try {
        mount.removeChild(renderer.domElement);
      } catch {}
      renderer.dispose();
      starsGeo.dispose();
      engineSpriteMat.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed inset-y-0 right-0 z-10"
      style={{
        // Expand canvas to full viewport width to avoid clipping at center
        width: "100vw",
        minWidth: 320,
        // Remove the previous hard cap so the canvas truly spans edge-to-edge
        // maxWidth removed
      }}
      aria-hidden="true"
    />
  );
}