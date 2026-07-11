import { expect, test } from "@playwright/test";

const SOLVED = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

test.describe("Scan wizard and animated playback", () => {
  test("scan button opens the camera modal, Escape closes it", async ({ page }) => {
    await page.goto("/");
    await page.locator("#scanBtn").click();

    const modal = page.locator(".scan-overlay");
    await expect(modal).toBeVisible();
    await expect(page.locator(".scan-modal h2")).toHaveText("Scan with camera");

    await page.keyboard.press("Escape");
    await expect(modal).toHaveCount(0);
  });

  test("wizard advances to Verify after editing the cube", async ({ page }) => {
    await page.goto("/");
    await page.locator("#scrambleBtn").click();
    await expect(page.locator('.wizard-step[data-stage="verify"]')).toHaveClass(/active/);
  });

  test("solving enables playback and stepping advances the move counter", async ({ page }) => {
    await page.goto("/");

    // A known solvable state: a checkerboard via slice moves.
    await page.locator("#stateInput").fill(SOLVED);
    await page.locator("#algorithmInput").fill("R U R' U'");
    await page.locator("#applyAlgorithmBtn").click();
    await expect(page.locator("#statusPill")).toHaveText("Moves applied");

    await page.locator("#solveBtn").click();
    await expect(page.locator("#statusPill")).toContainText("Solved in", { timeout: 20000 });
    await expect(page.locator("#playBtn")).not.toBeDisabled();

    await page.locator("#nextStepBtn").click();
    await expect(page.locator("#stepLabel")).toHaveText(/^1 \//);
    await expect(page.locator('.wizard-step[data-stage="play"]')).toHaveClass(/active/);
  });
});
