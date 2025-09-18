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
        // two-point line segment
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(2 * 3);
        geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.LineBasicMaterial({
          color: 0x88ccff,
          transparent: true,
          opacity: 0.0, // animated
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        const line = new THREE.Line(geom, mat);
        hyperGroup.add(line);

        // Slight random spread around engine offset
        const offset = new THREE.Vector3(
          0.6 + (Math.random() - 0.5) * 0.2, // start a bit behind the ship (positive x since nose points -x)
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
    };
    window.addEventListener("resize", onResize);

    // Add a smoothed look-at target for the camera to follow the ship
    const lookAtTarget = new THREE.Vector3(0, 0, 0);

    let t = 0;
    const clock = new THREE.Clock();
    // Initialize prevPx to match the starting x position to avoid an initial banking jerk
    let prevPx = 5.2; // track previous x for banking (updated to match P0.x)
    const animate = () => {
      const dt = clock.getDelta();
      t += dt;

      // Float animation
      if (group) {
        // Right-bottom -> across -> far top-left with hyperjump exit
        const speed = 0.25; // faster pass
        const s = (t * speed) % 1; // 0..1 per pass

        // Keypoints: start bottom-right -> pass through true page center (adjusted left within right-aligned canvas) -> vanish
        const P0 = { x: 5.2, y: -1.0 };  // start at bottom-right

        // Compute the true page center inside the right-fixed canvas:
        // Convert the page center to canvas-local NDC X using the canvas width fraction,
        // then map NDC -> world X at the current camera distance so the ship passes through the true page center.
        const canvasFraction =
          (mount.clientWidth || window.innerWidth) / window.innerWidth;
        const ndcX = THREE.MathUtils.clamp(
          1 - 1 / Math.max(0.1, canvasFraction), // e.g. for 0.55 => ~ -0.818
          -0.95,
          0.95
        );
        const depth = Math.max(0.001, camera.position.z);
        const halfWidthWorld =
          Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) *
          depth *
          camera.aspect;
        const centerWorldX = ndcX * halfWidthWorld;

        const PC = { x: centerWorldX, y: 0.1 };  // true page center in world coords (slightly above 0 for aesthetic framing)

        // Helpers
        const smootherstep = (a: number, b: number, x: number) => {
          const tt = Math.max(0, Math.min(1, (x - a) / (b - a)));
          return tt * tt * tt * (tt * (tt * 6 - 15) + 10);
        };
        const lerp = (a: number, b: number, tt: number) => a + (b - a) * tt;

        // Phase 1: move from bottom-right to adjusted center (gentle start)
        const u = smootherstep(0.05, 0.6, s);
        let px = lerp(P0.x, PC.x, u);
        let py = lerp(P0.y, PC.y, u);
        // Phase 2: settle smoothly at adjusted center before hyperjump
        const settle = smootherstep(0.6, 0.8, s);
        px = lerp(px, PC.x, settle);
        py = lerp(py, PC.y, settle);

        // Gentle bobbing overlay (slightly reduced amplitude for calmer motion)
        const bob = Math.sin(t * 1.2) * 0.2;

        // Hyperjump triggers just after center settle for a center-vanish effect
        const hyper = smootherstep(0.7, 1.0, s);
        const hyperDepth = 8;                 // how far into Z it dives
        const hyperScale = 1 - hyper * 0.6;   // scale down as it jumps

        group.position.x = px;
        group.position.y = py + bob;
        group.position.z = -hyper * hyperDepth; // dive deeper into the background

        // Natural banking based on horizontal velocity (increase damping for smoothness)
        const vx = px - prevPx;
        prevPx = px;
        const bankTarget = THREE.MathUtils.clamp(-vx * 1.8, -0.45, 0.45);
        group.rotation.z += (bankTarget - group.rotation.z) * 0.08;

        // Base yaw points left; softly converge (slightly more damping)
        const baseYaw = ORIENT_YAW;
        group.rotation.y += (baseYaw - group.rotation.y) * 0.06;

        // Parallax damped and reduced during hyperjump for a glide-out effect (more smoothing)
        const parallaxDampen = 1 - hyper * 0.85;
        const targetRotX = (mouse.y * 0.25) * parallaxDampen;
        const targetRotY = (mouse.x * 0.35) * parallaxDampen;
        group.rotation.x += (targetRotX - group.rotation.x) * 0.04;
        group.rotation.y += (targetRotY) * 0.035;

        // Subtle orbit reduced for steadier motion
        group.rotation.y += 0.04 * dt * (1 - hyper); // reduce orbit as it exits

        // Scale down on exit to enhance black hole feel
        const scaled = Math.max(0.2, hyperScale);
        group.scale.setScalar(scaled);

        // Engine glow follows and pulses; fade during hyperjump
        const glowOffset = new THREE.Vector3(0.6, -0.05, -0.15);
        const glowPos = new THREE.Vector3().copy(group.position).add(glowOffset);
        engineLight.position.copy(glowPos);
        engineSprite.position.copy(glowPos);
        const baseIntensity = 1.15 + Math.sin(t * 11) * 0.12;
        engineLight.intensity = baseIntensity * (1 - hyper * 0.85);
        engineSprite.material.opacity = (0.72 + Math.sin(t * 9.5) * 0.1) * (1 - hyper * 0.9);

        // Update hyperjump streaks (unchanged structure, just uses new hyper timing)
        hyperGroup.position.copy(group.position);
        hyperGroup.rotation.copy(group.rotation);
        for (const item of hyperLines) {
          const start = new THREE.Vector3().copy(group.position).add(item.offset);
          const length =
            0.6 + item.rand * 0.6 + hyper * 4.0;
          const spreadY = (item.rand - 0.5) * 0.2 * (1 + hyper * 1.5);
          const spreadZ = (item.rand - 0.5) * 0.2 * (1 + hyper * 1.5);
          const end = new THREE.Vector3(
            start.x + length,
            start.y + spreadY,
            start.z + spreadZ
          );

          const posAttr = item.geom.getAttribute("position") as THREE.BufferAttribute;
          posAttr.setXYZ(0, start.x, start.y, start.z);
          posAttr.setXYZ(1, end.x, end.y, end.z);
          posAttr.needsUpdate = true;

          item.mat.opacity = THREE.MathUtils.clamp(0.12 + hyper * 0.9, 0, 1);
        }

        // Slight exposure bump during hyperjump for a flash effect (subtly reduced)
        renderer.toneMappingExposure = 1.2 + hyper * 0.3;

        // Keep camera trained on the ship (a touch smoother)
        lookAtTarget.lerp(group.position, 0.12);
        camera.lookAt(lookAtTarget);
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