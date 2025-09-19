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

    // Entry animation easing (ship slides in from the right on mount)
    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
    const ENTRY_DURATION_MS = 1800;
    const entryStart = performance.now();

    // Exit animation progress (based on scroll past hero)
    let exitProgress = 0; // 0..1
    const onScroll = () => {
      const vh = window.innerHeight || 1;
      // Start exiting after ~60% of first viewport height
      const startAt = vh * 0.6;
      const dist = Math.max(0, window.scrollY - startAt);
      const span = vh * 0.8; // how much scroll to fully exit
      exitProgress = Math.min(1, dist / span);

      // Fade the whole canvas in sync with exit
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

      // Compute entry easing offset (slides from +6 -> 0)
      const now = performance.now();
      const entryT = Math.min(1, Math.max(0, (now - entryStart) / ENTRY_DURATION_MS));
      const entryEase = easeOutCubic(entryT);
      const entryOffsetX = (1 - entryEase) * 6; // starts far right, eases to 0

      // Exit offset pushes ship further right as user scrolls down
      const exitOffsetX = exitProgress * 4;

      if (group && model) {
        // Gentle idle motion
        const bob = Math.sin(t * 0.6 * ANIM_SPEED) * 0.1; // vertical bob
        const sway = Math.sin(t * 0.5 * ANIM_SPEED) * 0.25; // subtle horizontal sway

        // Position with entry + exit offsets
        group.position.x = anchorX + sway + entryOffsetX + exitOffsetX;
        group.position.y = baseY + bob;
        group.position.z = 0;

        // Soft banking & parallax from mouse
        const targetRotX = mouse.y * 0.20; // damped pitch
        const targetRotY = -0.12 + mouse.x * 0.25; // gentle yaw (slight left bias)
        const targetRotZ = -sway * 0.06; // bank with sway

        group.rotation.x += (targetRotX - group.rotation.x) * 0.06;
        group.rotation.y += (targetRotY - group.rotation.y) * 0.05;
        group.rotation.z += (targetRotZ - group.rotation.z) * 0.08;

        // Engine glow follows and pulses
        const glowOffset = new THREE.Vector3(0, -0.05, -0.5).applyQuaternion(group.quaternion);
        const glowPos = new THREE.Vector3().copy(group.position).add(glowOffset);
        engineLight.position.copy(glowPos);
        engineSprite.position.copy(glowPos);

        engineLight.intensity = 1.1 + Math.sin(t * 8 * ANIM_SPEED) * 0.08;
        engineSprite.material.opacity = 0.68 + Math.sin(t * 7.5 * ANIM_SPEED) * 0.08;

        // Camera smooth tracking of the ship
        lookAtTarget.lerp(group.position, 0.08);
        camera.lookAt(lookAtTarget);

        // Camera breathing (subtle zoom)
        camera.position.z = baseCameraZ + Math.sin(t * 0.35 * ANIM_SPEED) * 0.25;
      }

      // Subtle star drift
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