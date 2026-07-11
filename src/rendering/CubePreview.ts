import * as THREE from "three";
import { FACES, type Face } from "../domain/cube";
import { FACE_COLORS } from "../domain/colors";
import { faceletIndexForCubie, moveRotation, type Axis } from "./moveRotation";

const SPACING = 1.04;
const STICKER_OFFSET = 0.49;
const DEFAULT_ROTATION: [number, number, number] = [-0.46, 0.66, 0.04];

type Coord = { x: number; y: number; z: number };

type StickerTransform = {
  position: [number, number, number];
  rotation: [number, number, number];
};

const STICKER_TRANSFORMS: Record<Face, StickerTransform> = {
  U: { position: [0, STICKER_OFFSET, 0], rotation: [-Math.PI / 2, 0, 0] },
  D: { position: [0, -STICKER_OFFSET, 0], rotation: [Math.PI / 2, 0, 0] },
  R: { position: [STICKER_OFFSET, 0, 0], rotation: [0, Math.PI / 2, 0] },
  L: { position: [-STICKER_OFFSET, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  F: { position: [0, 0, STICKER_OFFSET], rotation: [0, 0, 0] },
  B: { position: [0, 0, -STICKER_OFFSET], rotation: [0, Math.PI, 0] },
};

function isOnFace(face: Face, x: number, y: number, z: number): boolean {
  switch (face) {
    case "U":
      return y === 1;
    case "D":
      return y === -1;
    case "R":
      return x === 1;
    case "L":
      return x === -1;
    case "F":
      return z === 1;
    case "B":
      return z === -1;
  }
}

// Rotate an integer coordinate by `quarter` right-hand quarter turns about +axis.
function rotateCoord(coord: Coord, axis: Axis, quarter: number): Coord {
  let { x, y, z } = coord;
  const times = ((quarter % 4) + 4) % 4;
  for (let i = 0; i < times; i += 1) {
    if (axis === "x") {
      [y, z] = [-z, y];
    } else if (axis === "y") {
      [x, z] = [z, -x];
    } else {
      [x, y] = [-y, x];
    }
  }
  return { x, y, z };
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

type ActiveTurn = {
  pivot: THREE.Group;
  axisVector: THREE.Vector3;
  axis: Axis;
  quarter: number;
  angle: number;
  cubies: THREE.Group[];
  elapsed: number;
  duration: number;
  resolve: () => void;
};

/**
 * Interactive WebGL preview of the cube. Cubies are individual groups so that a
 * single layer can be rotated as a rigid body, which powers animated solution
 * playback via {@link animateMove}.
 */
export class CubePreview {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  private readonly cubeGroup = new THREE.Group();
  private readonly cubieGeometry = new THREE.BoxGeometry(0.96, 0.96, 0.96);
  private readonly stickerGeometry = new THREE.PlaneGeometry(0.82, 0.82);
  private readonly materials = new Map<Face, THREE.MeshStandardMaterial>();
  private readonly boxMaterial = new THREE.MeshStandardMaterial({
    color: "#111827",
    roughness: 0.62,
    metalness: 0.04,
  });
  private readonly cubies: THREE.Group[] = [];
  private drag = { active: false, x: 0, y: 0 };
  private animationFrame = 0;
  private lastTimestamp = 0;
  private activeTurn: ActiveTurn | null = null;
  private turnDurationMs = 320;

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

    this.cubeGroup.rotation.set(...DEFAULT_ROTATION);
    this.scene.add(this.cubeGroup);
    this.bindPointer();
    this.resize();
    window.addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.animate();
  }

  /** Rebuilds the cube from a 54-facelet array at home positions. */
  update(state: readonly Face[]): void {
    this.finishActiveTurn();
    this.buildCube(state);
  }

  /** Milliseconds per quarter turn during animated playback. */
  setTurnDuration(durationMs: number): void {
    this.turnDurationMs = Math.max(80, durationMs);
  }

  get isAnimating(): boolean {
    return this.activeTurn !== null;
  }

  /**
   * Animates a single WCA move by rotating its layer, then bakes the cubies
   * back into the cube group. Resolves when the turn completes. A no-op move
   * (or an in-flight turn) resolves immediately after settling.
   */
  animateMove(token: string): Promise<void> {
    this.finishActiveTurn();
    const move = moveRotation(token);
    if (!move) {
      return Promise.resolve();
    }

    const axisIndex = move.axis;
    const layerCubies = this.cubies.filter(
      (cubie) => (cubie.userData.coord as Coord)[axisIndex] === move.layer,
    );

    const pivot = new THREE.Group();
    this.cubeGroup.add(pivot);
    for (const cubie of layerCubies) {
      pivot.attach(cubie);
    }

    const axisVector = new THREE.Vector3(
      move.axis === "x" ? 1 : 0,
      move.axis === "y" ? 1 : 0,
      move.axis === "z" ? 1 : 0,
    );

    return new Promise<void>((resolve) => {
      this.activeTurn = {
        pivot,
        axisVector,
        axis: move.axis,
        quarter: Math.round(move.angle / (Math.PI / 2)),
        angle: move.angle,
        cubies: layerCubies,
        elapsed: 0,
        duration: this.turnDurationMs * move.turns,
        resolve,
      };
    });
  }

  resetView(): void {
    this.cubeGroup.rotation.set(...DEFAULT_ROTATION);
  }

  dispose(): void {
    window.cancelAnimationFrame(this.animationFrame);
    window.removeEventListener("resize", this.resize);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);

    const canvas = this.renderer.domElement;
    canvas.removeEventListener("pointerdown", this.handlePointerDown);
    canvas.removeEventListener("pointermove", this.handlePointerMove);
    canvas.removeEventListener("pointerup", this.handlePointerEnd);
    canvas.removeEventListener("pointerleave", this.handlePointerEnd);

    this.cubieGeometry.dispose();
    this.stickerGeometry.dispose();
    this.boxMaterial.dispose();
    this.materials.forEach((material) => material.dispose());
    this.materials.clear();
    this.renderer.dispose();
    canvas.remove();
  }

  private buildCube(state: readonly Face[]): void {
    for (const cubie of this.cubies) {
      this.cubeGroup.remove(cubie);
    }
    this.cubies.length = 0;

    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        for (let z = -1; z <= 1; z += 1) {
          const cubie = new THREE.Group();
          cubie.position.set(x * SPACING, y * SPACING, z * SPACING);
          cubie.userData.coord = { x, y, z } satisfies Coord;
          cubie.add(new THREE.Mesh(this.cubieGeometry, this.boxMaterial));

          for (const face of FACES) {
            if (!isOnFace(face, x, y, z)) {
              continue;
            }
            const color = state[faceletIndexForCubie(face, x, y, z)];
            const sticker = new THREE.Mesh(this.stickerGeometry, this.getMaterial(color));
            const transform = STICKER_TRANSFORMS[face];
            sticker.position.set(...transform.position);
            sticker.rotation.set(...transform.rotation);
            cubie.add(sticker);
          }

          this.cubeGroup.add(cubie);
          this.cubies.push(cubie);
        }
      }
    }
  }

  private finishActiveTurn(): void {
    const turn = this.activeTurn;
    if (!turn) {
      return;
    }
    turn.pivot.setRotationFromAxisAngle(turn.axisVector, turn.angle);
    turn.pivot.updateMatrixWorld(true);
    for (const cubie of turn.cubies) {
      this.cubeGroup.attach(cubie);
      const coord = cubie.userData.coord as Coord;
      cubie.userData.coord = rotateCoord(coord, turn.axis, turn.quarter);
    }
    this.cubeGroup.remove(turn.pivot);
    this.activeTurn = null;
    turn.resolve();
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
    canvas.addEventListener("pointerdown", this.handlePointerDown);
    canvas.addEventListener("pointermove", this.handlePointerMove);
    canvas.addEventListener("pointerup", this.handlePointerEnd);
    canvas.addEventListener("pointerleave", this.handlePointerEnd);
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.drag = { active: true, x: event.clientX, y: event.clientY };
    this.renderer.domElement.setPointerCapture(event.pointerId);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.drag.active) {
      return;
    }
    const dx = event.clientX - this.drag.x;
    const dy = event.clientY - this.drag.y;
    this.cubeGroup.rotation.y += dx * 0.008;
    this.cubeGroup.rotation.x += dy * 0.008;
    this.drag.x = event.clientX;
    this.drag.y = event.clientY;
  };

  private readonly handlePointerEnd = (): void => {
    this.drag.active = false;
  };

  private readonly resize = (): void => {
    const rect = this.host.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) {
      window.cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    } else if (this.animationFrame === 0) {
      this.lastTimestamp = 0;
      this.animate();
    }
  };

  private readonly animate = (timestamp = 0): void => {
    this.animationFrame = window.requestAnimationFrame(this.animate);
    const delta = this.lastTimestamp ? timestamp - this.lastTimestamp : 16;
    this.lastTimestamp = timestamp;

    if (this.activeTurn) {
      this.advanceTurn(delta);
    } else if (!this.drag.active) {
      this.cubeGroup.rotation.y += 0.002;
    }

    this.renderer.render(this.scene, this.camera);
  };

  private advanceTurn(delta: number): void {
    const turn = this.activeTurn;
    if (!turn) {
      return;
    }
    turn.elapsed += delta;
    const progress = Math.min(1, turn.elapsed / turn.duration);
    turn.pivot.setRotationFromAxisAngle(turn.axisVector, turn.angle * easeInOut(progress));
    if (progress >= 1) {
      this.finishActiveTurn();
    }
  }
}
