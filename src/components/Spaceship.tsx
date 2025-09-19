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
<<<<<<< HEAD
    const MODEL_PATH = "/assets/racing_ship.glb";
=======
    const MODEL_PATH = "/assets/racing_ship (1).glb";
>>>>>>> 6e407e4 (Your descriptive commit message here)
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

    let model: THREE.Object3D | null = null;
    loader.load(
      MODEL_PATH,
      (gltf) => {
        model = gltf.scene;
        model.traverse((obj: any) => {
          if (obj.isMesh) {
            obj.castShadow = false;
            obj.receiveShadow = false;
<<<<<<< HEAD
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
=======
            // Style materials for visibility: neutral base + subtle emissive
            // try {
            //   const mat = new THREE.MeshStandardMaterial({
            //     color: 0xbfc8da,        // soft steel
            //     metalness: 0.35,
            //     roughness: 0.55,
            //     emissive: new THREE.Color(0x1a3cff),
            //     emissiveIntensity: 0.12,
            //   });
            //   obj.material = mat;
            //   obj.material.transparent = true;
            // } catch {
            //   // ignore if replacement fails
            // }
>>>>>>> 6e407e4 (Your descriptive commit message here)
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

<<<<<<< HEAD
=======
        // Rotate 50 degrees to the left on the horizontal plane
        gltf.scene.rotation.y = (-5 * Math.PI) / 18;

>>>>>>> 6e407e4 (Your descriptive commit message here)
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
<<<<<<< HEAD

        // Ensure group starts facing left (-X). We'll still allow parallax to modulate yaw slightly.
        group.rotation.y = ORIENT_YAW;
=======
>>>>>>> 6e407e4 (Your descriptive commit message here)
      },
      undefined,
      (err) => {
        // eslint-disable-next-line no-console
        console.error("Failed to load spaceship model:", err);
      }
    );

<<<<<<< HEAD
    // Orientation constants: align the ship's "nose" to face RIGHT (+X)
    const ORIENT_YAW = Math.PI / 2; // base yaw so forward points right

=======
>>>>>>> 6e407e4 (Your descriptive commit message here)
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

<<<<<<< HEAD
    let t = 0;
    const clock = new THREE.Clock();
    let prevPx = 6; // track previous x for banking
=======
    // Animation path
    const path = new THREE.CatmullRomCurve3([
        new THREE.Vector3(8, -2, 0),
        new THREE.Vector3(2, -0.5, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-12, 1, 0)
    ]);

    // Warp streaks
    const warpStreaksGeo = new THREE.BufferGeometry();
    const warpStreaksCount = 500;
    const warpStreaksPos = new Float32Array(warpStreaksCount * 3);
    for (let i = 0; i < warpStreaksCount; i++) {
        warpStreaksPos[i * 3 + 0] = (Math.random() - 0.5) * 20;
        warpStreaksPos[i * 3 + 1] = (Math.random() - 0.5) * 20;
        warpStreaksPos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    warpStreaksGeo.setAttribute('position', new THREE.BufferAttribute(warpStreaksPos, 3));
    const warpStreaksMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.03,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const warpStreaks = new THREE.Points(warpStreaksGeo, warpStreaksMat);
    scene.add(warpStreaks);

    let t = 0;
    const clock = new THREE.Clock();
    let hyperjumpState = {
        active: false,
        time: 0,
    };

    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

>>>>>>> 6e407e4 (Your descriptive commit message here)
    const animate = () => {
      const dt = clock.getDelta();
      t += dt;

<<<<<<< HEAD
      // Float animation
      if (group) {
        // Right-bottom -> across -> far top-left with hyperjump exit
        const speed = 0.25; // faster pass
        const s = (t * speed) % 1; // 0..1 per pass

        // Keypoints and offsets
        const P0 = { x: -6, y: -1 };   // start from left-bottom (entry stays smooth)
        const PEND = { x: 10, y: 3 };  // exit to far right-top (hyperjump to the right)
        // Helpers
        const smoothstep = (a: number, b: number, x: number) => {
          const tt = Math.max(0, Math.min(1, (x - a) / (b - a)));
          return tt * tt * (3 - 2 * tt);
        };
        const lerp = (a: number, b: number, tt: number) => a + (b - a) * tt;

        // Long pass interpolation
        const u = smoothstep(0, 1, s);
        const px = lerp(P0.x, PEND.x, u);
        const py = lerp(P0.y, PEND.y, u);

        // Gentle bobbing overlay
        const bob = Math.sin(t * 1.2) * 0.25;

        // Black hole hyperjump phase near the end of the pass
        const hyper = smoothstep(0.78, 1.0, s); // ramp up towards the end
        const hyperDepth = 8;                   // how far into Z it dives
        const hyperScale = 1 - hyper * 0.6;     // scale down as it jumps

        group.position.x = px;
        group.position.y = py + bob;
        group.position.z = -hyper * hyperDepth; // dive deeper into the background

        // Natural banking based on horizontal velocity
        const vx = px - prevPx;
        prevPx = px;
        const bankTarget = THREE.MathUtils.clamp(-vx * 1.8, -0.45, 0.45);
        group.rotation.z += (bankTarget - group.rotation.z) * 0.08;

        // Base yaw points left; softly converge so it doesn't look backward
        const baseYaw = ORIENT_YAW;
        group.rotation.y += (baseYaw - group.rotation.y) * 0.06;

        // Parallax damped and reduced during hyperjump for a glide-out effect
        const parallaxDampen = 1 - hyper * 0.85;
        const targetRotX = (mouse.y * 0.25) * parallaxDampen;
        const targetRotY = (mouse.x * 0.35) * parallaxDampen;
        group.rotation.x += (targetRotX - group.rotation.x) * 0.05;
        group.rotation.y += (targetRotY) * 0.04;

        // Subtle orbit
        group.rotation.y += 0.08 * dt * (1 - hyper); // reduce orbit as it exits

        // Scale down on exit to enhance black hole feel
        const scaled = Math.max(0.2, hyperScale);
        group.scale.setScalar(scaled);

        // Engine glow follows and pulses; fade during hyperjump
        const glowOffset = new THREE.Vector3(-0.6, -0.05, -0.15);
        const glowPos = new THREE.Vector3().copy(group.position).add(glowOffset);
        engineLight.position.copy(glowPos);
        engineSprite.position.copy(glowPos);
        const baseIntensity = 1.2 + Math.sin(t * 12) * 0.15;
        engineLight.intensity = baseIntensity * (1 - hyper * 0.85);
        engineSprite.material.opacity = (0.75 + Math.sin(t * 10) * 0.1) * (1 - hyper * 0.9);

        // Keep camera trained on the ship
        lookAtTarget.lerp(group.position, 0.12); // slightly snappier to keep it visible
=======
      if (group && model) {
        const speed = 0.08;
        let s = (t * speed) % 1.1; // Looping animation

        if (s > 1 && !hyperjumpState.active) {
            hyperjumpState.active = true;
            hyperjumpState.time = 0;
        }

        if (hyperjumpState.active) {
            hyperjumpState.time += dt;
            const jumpProgress = Math.min(hyperjumpState.time / 2, 1); // 2 second jump
            const easedProgress = easeInOutCubic(jumpProgress);

            // Warp streaks
            warpStreaks.position.copy(group.position);
            warpStreaksMat.opacity = easedProgress;
            const positions = warpStreaksGeo.attributes.position.array as Float32Array;
            for (let i = 0; i < warpStreaksCount; i++) {
                positions[i * 3 + 2] += 1 * easedProgress;
                if (positions[i * 3 + 2] > 10) {
                    positions[i * 3 + 2] = -10;
                }
            }
            warpStreaksGeo.attributes.position.needsUpdate = true;


            // Scale down
            const scale = 1 - easedProgress;
            group.scale.set(scale, scale, scale);

            // Z-dive
            group.position.z -= easedProgress * 0.5;

            // Exposure flash
            renderer.toneMappingExposure = 1.2 + easedProgress * 3;

            // Engine glow fade out
            engineSprite.material.opacity = 0.9 * (1 - easedProgress);
            engineLight.intensity = 1.4 * (1 - easedProgress);

            if (jumpProgress >= 1) {
                group.visible = false; // Hide the ship
                t = 0;
                hyperjumpState.active = false;
                group.scale.set(1, 1, 1);
                group.position.z = 0;
                renderer.toneMappingExposure = 1.2;
                engineSprite.material.opacity = 0.9;
                engineLight.intensity = 1.4;
                warpStreaksMat.opacity = 0;
            }
        } else {
            group.visible = true; // Show the ship
            const pathPoint = path.getPointAt(s);
            group.position.copy(pathPoint);

            // Bobbing and drift
            group.position.y += Math.sin(t * 1.5) * 0.1;
            group.position.x += Math.sin(t * 1.2) * 0.05;


            // Banking
            const tangent = path.getTangentAt(s);
            const bankTarget = -tangent.y;
            group.rotation.z += (bankTarget - group.rotation.z) * 0.05;

            // Mouse parallax (soften near exit)
            const parallaxFactor = 1 - s;
            const targetRotX = mouse.y * 0.25 * parallaxFactor;
            const targetRotY = mouse.x * 0.35 * parallaxFactor;
            group.rotation.x += (targetRotX - group.rotation.x) * 0.05;
            group.rotation.y += (targetRotY - group.rotation.y) * 0.04;
        }


        // Engine glow
        const glowOffset = new THREE.Vector3(0, -0.05, -0.5).applyQuaternion(group.quaternion);
        const glowPos = new THREE.Vector3().copy(group.position).add(glowOffset);
        engineLight.position.copy(glowPos);
        engineSprite.position.copy(glowPos);

        // Camera tracking
        lookAtTarget.lerp(group.position, 0.08);
>>>>>>> 6e407e4 (Your descriptive commit message here)
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
<<<<<<< HEAD
=======
      warpStreaksGeo.dispose();
      warpStreaksMat.dispose();
>>>>>>> 6e407e4 (Your descriptive commit message here)
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