import { FACES, FACE_NAMES, STICKERS_PER_FACE, SOLVED_FACELETS, type Face } from "../domain/cube";
import { faceletsFromCubeString } from "../domain/facelets";
import { averageRgba, classifyColor } from "../domain/colorDetection";

type ScanStep = {
  face: Face;
  instruction: string;
};

// Faces are scanned holding the up (white) face upward for the side faces, then
// tilting for up/down. Centers are forced to the scanned face, so orientation
// mistakes only ever affect edges/corners, which the Verify step can repaint.
const SCAN_SEQUENCE: readonly ScanStep[] = [
  { face: "F", instruction: "Show the Front (green) face. Keep white pointing up." },
  { face: "R", instruction: "Turn left to the Right (red) face. Keep white pointing up." },
  { face: "B", instruction: "Show the Back (blue) face. Keep white pointing up." },
  { face: "L", instruction: "Show the Left (orange) face. Keep white pointing up." },
  { face: "U", instruction: "Tilt down to the Up (white) face. Keep green toward the bottom." },
  { face: "D", instruction: "Tilt up to the Down (yellow) face. Keep green toward the top." },
];

export type CubeScannerOptions = {
  onComplete: (facelets: Face[]) => void;
  onCancel: () => void;
};

/**
 * Webcam capture flow: samples a 3x3 grid from the video for each face and
 * classifies each sticker into a cube face. Renders its own modal overlay so it
 * stays decoupled from the main editor layout.
 */
export class CubeScanner {
  private overlay: HTMLDivElement | null = null;
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private readonly canvas = document.createElement("canvas");
  private stepIndex = 0;
  private mirror = true;
  private readonly captured = new Map<Face, Face[]>();

  constructor(private readonly options: CubeScannerOptions) {}

  async open(): Promise<void> {
    this.stepIndex = 0;
    this.captured.clear();
    this.renderOverlay();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      if (this.video) {
        this.video.srcObject = this.stream;
        await this.video.play();
      }
      this.setHint(SCAN_SEQUENCE[0].instruction);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Camera unavailable";
      this.setHint(`Camera unavailable: ${message}. Close and paint the cube manually instead.`);
    }
  }

  close(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this.video = null;
  }

  private renderOverlay(): void {
    const overlay = document.createElement("div");
    overlay.className = "scan-overlay";
    overlay.innerHTML = `
      <div class="scan-modal" role="dialog" aria-modal="true" aria-label="Scan cube with camera">
        <div class="scan-head">
          <h2>Scan with camera</h2>
          <button type="button" class="scan-close" data-action="cancel" aria-label="Close scanner">&times;</button>
        </div>
        <div class="scan-video-wrap" data-mirror="true">
          <video class="scan-video" playsinline muted></video>
          <div class="scan-grid">${Array.from({ length: 9 }, () => "<span></span>").join("")}</div>
        </div>
        <p class="scan-hint" data-role="hint">Starting camera&hellip;</p>
        <div class="scan-progress" data-role="progress"></div>
        <label class="scan-mirror"><input type="checkbox" data-action="mirror" checked /> Mirror video</label>
        <div class="scan-actions">
          <button type="button" class="btn" data-action="cancel">Cancel</button>
          <button type="button" class="btn primary" data-action="capture">Capture ${FACE_NAMES.F}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.video = overlay.querySelector<HTMLVideoElement>(".scan-video");

    overlay.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const action = target.closest<HTMLElement>("[data-action]")?.dataset.action;
      if (action === "cancel" || target === overlay) {
        this.close();
        this.options.onCancel();
      } else if (action === "capture") {
        this.captureCurrentFace();
      }
    });

    const mirrorToggle = overlay.querySelector<HTMLInputElement>('[data-action="mirror"]');
    mirrorToggle?.addEventListener("change", () => {
      this.mirror = mirrorToggle.checked;
      overlay
        .querySelector<HTMLElement>(".scan-video-wrap")
        ?.setAttribute("data-mirror", String(this.mirror));
    });

    this.renderProgress();
  }

  private captureCurrentFace(): void {
    const video = this.video;
    if (!video || !video.videoWidth) {
      return;
    }
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    this.canvas.width = vw;
    this.canvas.height = vh;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    if (this.mirror) {
      ctx.save();
      ctx.translate(vw, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, vw, vh);
    if (this.mirror) {
      ctx.restore();
    }

    // The overlay grid is inset 12% of the centered square (object-fit: cover).
    const side = Math.min(vw, vh);
    const originX = (vw - side) / 2;
    const originY = (vh - side) / 2;
    const inset = 0.12 * side;
    const cell = (side - 2 * inset) / 3;
    const sample = cell * 0.5;

    const step = SCAN_SEQUENCE[this.stepIndex];
    const stickers: Face[] = [];
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const cx = originX + inset + cell * (col + 0.5);
        const cy = originY + inset + cell * (row + 0.5);
        const region = ctx.getImageData(cx - sample / 2, cy - sample / 2, sample, sample);
        stickers.push(classifyColor(averageRgba(region.data)));
      }
    }
    // Centers are fixed on a 3x3, so anchor them to the scanned face.
    stickers[4] = step.face;
    this.captured.set(step.face, stickers);

    this.stepIndex += 1;
    if (this.stepIndex >= SCAN_SEQUENCE.length) {
      this.finish();
      return;
    }
    this.renderProgress();
    this.setHint(SCAN_SEQUENCE[this.stepIndex].instruction);
    const captureBtn = this.overlay?.querySelector<HTMLButtonElement>('[data-action="capture"]');
    if (captureBtn) {
      captureBtn.textContent = `Capture ${FACE_NAMES[SCAN_SEQUENCE[this.stepIndex].face]}`;
    }
  }

  private finish(): void {
    const facelets = faceletsFromCubeString(SOLVED_FACELETS);
    for (const face of FACES) {
      const scanned = this.captured.get(face);
      if (!scanned) {
        continue;
      }
      const base = FACES.indexOf(face) * STICKERS_PER_FACE;
      for (let i = 0; i < STICKERS_PER_FACE; i += 1) {
        facelets[base + i] = scanned[i];
      }
    }
    this.close();
    this.options.onComplete(facelets);
  }

  private renderProgress(): void {
    const container = this.overlay?.querySelector<HTMLElement>('[data-role="progress"]');
    if (!container) {
      return;
    }
    container.innerHTML = SCAN_SEQUENCE.map((step, index) => {
      const state =
        this.captured.has(step.face) === true
          ? "done"
          : index === this.stepIndex
            ? "active"
            : "pending";
      return `<span class="scan-chip ${state}">${step.face}</span>`;
    }).join("");
  }

  private setHint(message: string): void {
    const hint = this.overlay?.querySelector<HTMLElement>('[data-role="hint"]');
    if (hint) {
      hint.textContent = message;
    }
  }
}
