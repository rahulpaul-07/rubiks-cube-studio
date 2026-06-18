import * as THREE from "three";
import type { Face } from "../domain/cube";
import { stickerPlacement } from "./stickerPlacement";

const FACE_COLORS: Record<Face, string> = {
  U: "#f8fafc",
  R: "#e9413a",
  F: "#21b36b",
  D: "#f5c84c",
  L: "#f28a2e",
  B: "#3667d6",
};

export class CubePreview {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  private readonly cubeGroup = new THREE.Group();
  private readonly stickerGroup = new THREE.Group();
  private readonly stickerGeometry = new THREE.PlaneGeometry(0.82, 0.82);
  private readonly materials = new Map<Face, THREE.MeshStandardMaterial>();
  private readonly boxMaterial = new THREE.MeshStandardMaterial({
    color: "#111827",
    roughness: 0.62,
    metalness: 0.04,
  });
  private drag = { active: false, x: 0, y: 0 };

  constructor(private readonly host: HTMLElement) {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.host.appendChild(this.renderer.domElement);
    this.camera.position.set(5.2, 4.4, 6.4);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(new THREE.HemisphereLight("#ffffff", "#aeb7c9", 2.1));
    const keyLight = new THREE.DirectionalLight("#ffffff", 2.4);
    keyLight.position.set(4, 7, 5);
    this.scene.add(keyLight);

    this.cubeGroup.rotation.set(-0.46, 0.66, 0.04);
    this.cubeGroup.add(this.stickerGroup);
    this.scene.add(this.cubeGroup);
    this.createCubies();
    this.bindPointer();
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.animate();
  }

  update(state: readonly Face[]): void {
    this.stickerGroup.clear();
    state.forEach((face, index) => {
      const placement = stickerPlacement(index);
      const sticker = new THREE.Mesh(this.stickerGeometry, this.getMaterial(face));
      sticker.position.set(...placement.position);
      sticker.rotation.set(...placement.rotation);
      this.stickerGroup.add(sticker);
    });
  }

  resetView(): void {
    this.cubeGroup.rotation.set(-0.46, 0.66, 0.04);
  }

  private createCubies(): void {
    const geometry = new THREE.BoxGeometry(0.96, 0.96, 0.96);
    const spacing = 1.04;

    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        for (let z = -1; z <= 1; z += 1) {
          const cubie = new THREE.Mesh(geometry, this.boxMaterial);
          cubie.position.set(x * spacing, y * spacing, z * spacing);
          this.cubeGroup.add(cubie);
        }
      }
    }
  }

  private getMaterial(face: Face): THREE.MeshStandardMaterial {
    const existing = this.materials.get(face);
    if (existing) {
      return existing;
    }
    const material = new THREE.MeshStandardMaterial({
      color: FACE_COLORS[face],
      roughness: 0.5,
      metalness: 0.02,
    });
    this.materials.set(face, material);
    return material;
  }

  private bindPointer(): void {
    const canvas = this.renderer.domElement;
    canvas.addEventListener("pointerdown", (event) => {
      this.drag = { active: true, x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!this.drag.active) {
        return;
      }
      const dx = event.clientX - this.drag.x;
      const dy = event.clientY - this.drag.y;
      this.cubeGroup.rotation.y += dx * 0.008;
      this.cubeGroup.rotation.x += dy * 0.008;
      this.drag.x = event.clientX;
      this.drag.y = event.clientY;
    });
    canvas.addEventListener("pointerup", () => {
      this.drag.active = false;
    });
    canvas.addEventListener("pointerleave", () => {
      this.drag.active = false;
    });
  }

  private resize(): void {
    const rect = this.host.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private animate = (): void => {
    window.requestAnimationFrame(this.animate);
    if (!this.drag.active) {
      this.cubeGroup.rotation.y += 0.002;
    }
    this.renderer.render(this.scene, this.camera);
  };
}
