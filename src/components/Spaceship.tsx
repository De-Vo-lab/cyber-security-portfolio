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

    // Add cinematic tone mapping + exposure for better visibility
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // Lights (increase brightness and add subtle ambient)
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
    const MODEL_PATH = "/assets/racing_ship.glb";
    const group = new THREE.Group();
    scene.add(group);

    // Engine glow (light + sprite) that follows the ship
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

    // Add: Hyperjump streaks group (line segments that grow and brighten during hyperjump)
    const hyperGroup = new THREE.Group();
    scene.add(hyperGroup);
    const hyperLines: Array<{
      line: THREE.Line;
      geom: THREE.BufferGeometry;
      mat: THREE.LineBasicMaterial;
      offset: THREE.Vector3;
      rand: number;
    }> = [];
    {
      const HYPER_LINE_COUNT = 22;
      for (let i = 0; i < HYPER_LINE_COUNT; i++) {
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(2 * 3);
        geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.LineBasicMaterial({
          color: 0x88ccff,
          transparent: true,
          opacity: 0.0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        const line = new THREE.Line(geom, mat);
        hyperGroup.add(line);

        const offset = new THREE.Vector3(
          0.6 + (Math.random() - 0.5) * 0.2,
          -0.05 + (Math.random() - 0.5) * 0.2,
          -0.15 + (Math.random() - 0.5) * 0.2
        );

        hyperLines.push({
          line,
          geom,
          mat,
          offset,
          rand: Math.random(),
        });
      }
    }
    hyperGroup.visible = false;

    let model: THREE.Object3D | null = null;
    loader.load(
      MODEL_PATH,
      (gltf) => {
        model = gltf.scene;
        model.traverse((obj: any) => {
          if (obj.isMesh) {
            obj.castShadow = false;
            obj.receiveShadow = false;
            // Preserve original materials and avoid unintended transparency
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const m of mats) {
              if (m && typeof m === "object" && "transparent" in m) {
                (m as any).transparent = false;
                if ("opacity" in m && typeof (m as any).opacity === "number") {
                  (m as any).opacity = 1;
                }
                if ("needsUpdate" in m) {
                  (m as any).needsUpdate = true;
                }
              }
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
        // Increase margin so the camera frames the model smaller on screen
        const distance = (maxSize / (2 * Math.tan(halfFovY))) * 2.2; // was 1.25

        // Clamp to ensure it never gets too close on small models
        const minDistance = 8;
        camera.position.set(0, 1.2, Math.max(distance, minDistance));

        // Update clipping planes to suit model size, then apply
        camera.near = Math.max(0.1, maxSize / 1000);
        camera.far = Math.max(200, maxSize * 10);
        camera.updateProjectionMatrix();

        // Add to scene after fit
        group.add(gltf.scene);

        // Ensure group starts facing left (-X). We'll still allow parallax to modulate yaw slightly.
        group.rotation.y = ORIENT_YAW;

        // Compute a stable right-side anchor in world space (z = 0 plane)
        // based on the canvas' fixed position on the right side of the page.
        let anchorX = 3.2; // fallback default
        const computeWorldXAtScreenRatio = () => {
          if (!mount) return;

          // Position the ship around ~left third of the right-side canvas,
          // which visually keeps it on the right of the page without covering the hero text.
          const rect = mount.getBoundingClientRect();
          const screenX = rect.left + rect.width * 0.32; // tweakable anchor inside the canvas
          const screenY = rect.top + rect.height * 0.5;

          // Convert screen -> NDC
          const ndc = new THREE.Vector3(
            (screenX / window.innerWidth) * 2 - 1,
            -(screenY / window.innerHeight) * 2 + 1,
            0.5
          );

          // Unproject to world and intersect with z=0 plane
          ndc.unproject(camera);
          const origin = camera.position.clone();
          const dir = ndc.sub(origin).normalize();
          const EPS = 1e-6;

          if (Math.abs(dir.z) < EPS) {
            // Ray nearly parallel to z=0 plane; keep previous value
            return;
          }

          const t = (0 - origin.z) / dir.z; // hit z=0 plane
          const hit = origin.add(dir.multiplyScalar(t));
          if (Number.isFinite(hit.x)) {
            anchorX = hit.x;
          }
        };

        // Initial compute (in case model load fails or before it completes)
        computeWorldXAtScreenRatio();

        // Recompute right-side anchor now that the camera framing is finalized
        computeWorldXAtScreenRatio();

        // Ensure group starts facing left (-X). We'll still allow parallax to modulate yaw slightly.
        group.rotation.y = ORIENT_YAW;
      },
      undefined,
      (err) => {
        // eslint-disable-next-line no-console
        console.error("Failed to load spaceship model:", err);
      }
    );

    // Orientation constants: align the ship's "nose" to face left (-X)
    const ORIENT_YAW = -Math.PI / 2; // base yaw so forward points left

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
      computeWorldXAtScreenRatio();
    };
    window.addEventListener("resize", onResize);

    // Add a smoothed look-at target for the camera to follow the ship
    const lookAtTarget = new THREE.Vector3(0, 0, 0);

    const BASE_SCALE = 0.8; // new: globally shrink visual size a bit

    let t = 0;
    const clock = new THREE.Clock();
    // Initialize prevPx to the anchor X to avoid initial banking jerk
    let prevPx = 3.2;
    const animate = () => {
      const dt = clock.getDelta();
      t += dt;

      if (group) {
        // Fixed anchor on the right side; no sweeping/path progression
        const P0 = { x: anchorX, y: 0.2 };

        // Gentle bobbing
        const bob = Math.sin(t * 1.2) * 0.2;

        // Apply anchored position
        const px = P0.x;
        const py = P0.y;
        group.position.x = px;
        group.position.y = py + bob;
        group.position.z = 0;

        // Subtle banking (mouse-influenced) with damping
        const vx = px - prevPx;
        prevPx = px;
        const mouseBank = THREE.MathUtils.clamp(-mouse.x * 0.2, -0.3, 0.3);
        const bankTarget = THREE.MathUtils.clamp(-vx * 1.8 + mouseBank, -0.45, 0.45);
        group.rotation.z += (bankTarget - group.rotation.z) * 0.08;

        // Base yaw points left; softly converge
        const baseYaw = ORIENT_YAW;
        group.rotation.y += (baseYaw - group.rotation.y) * 0.06;

        // Parallax (no hyper dampening)
        const targetRotX = mouse.y * 0.25;
        const targetRotY = mouse.x * 0.35;
        group.rotation.x += (targetRotX - group.rotation.x) * 0.04;
        group.rotation.y += targetRotY * 0.035;

        // Very subtle drift
        group.rotation.y += 0.04 * dt;

        // Constant scale (no vanish)
        group.scale.setScalar(BASE_SCALE);

        // Engine glow follows and pulses; no fade out
        const glowOffset = new THREE.Vector3(0.6, -0.05, -0.15);
        const glowPos = new THREE.Vector3().copy(group.position).add(glowOffset);
        engineLight.position.copy(glowPos);
        engineSprite.position.copy(glowPos);
        const baseIntensity = 1.15 + Math.sin(t * 11) * 0.12;
        engineLight.intensity = baseIntensity;
        engineSprite.material.opacity = 0.72 + Math.sin(t * 9.5) * 0.1;

        // Keep hyperjump visuals disabled and exposure constant
        hyperGroup.visible = false;
        renderer.toneMappingExposure = 1.2;

        // Keep camera trained on the ship
        lookAtTarget.lerp(group.position, 0.12);
        camera.lookAt(lookAtTarget);
      }

      // Subtle background star drift
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
      engineSpriteMat.dispose();
      // Add: dispose hyperjump resources
      for (const item of hyperLines) {
        item.geom.dispose();
        item.mat.dispose();
      }
      scene.remove(hyperGroup);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed inset-y-0 right-0 z-10"
      style={{
        width: "55vw",
        minWidth: 320,
        maxWidth: "900px",
      }}
      aria-hidden="true"
    />
  );
}