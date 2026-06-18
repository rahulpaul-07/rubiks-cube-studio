import { test, expect } from "@playwright/test";

test.describe("Rubik's Cube Studio", () => {
  test("should load the application and show solved state", async ({ page }) => {
    await page.goto("/");

    // Check main headings
    await expect(page.locator("h1")).toHaveText("Rubik's Cube Studio");
    await expect(page.locator("#statusPill")).toHaveText("Ready");

    // Check initial cube state
    await expect(page.locator("#stateLabel")).toHaveText("Solved state");
    await expect(page.locator("#moveCountLabel")).toHaveText("0 moves");

    // Verify standard facelet input reflects solved state
    const input = page.locator("#stateInput");
    await expect(input).toHaveValue("UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB");
  });

  test("should generate a scramble", async ({ page }) => {
    await page.goto("/");

    // Generate a scramble
    await page.locator("#scrambleBtn").click();

    // State should update
    await expect(page.locator("#statusPill")).toHaveText("Scramble generated");
    await expect(page.locator("#stateLabel")).toHaveText("Solvable input shape");
    await expect(page.locator("#moveCountLabel")).toContainText("Scramble: ");

    // Input should change from solved state
    const input = page.locator("#stateInput");
    await expect(input).not.toHaveValue("UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB");
  });

  test("should validate and solve a scrambled cube", async ({ page }) => {
    await page.goto("/");

    // Import a specific scrambled state (checkerboard)
    await page
      .locator("#stateInput")
      .fill("UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB");
    // Just apply algorithm
    await page.locator("#algorithmInput").fill("M2 E2 S2");
    await page.locator("#applyAlgorithmBtn").click();

    // Wait for the move application
    await expect(page.locator("#statusPill")).toHaveText("Moves applied");

    // Click solve
    await page.locator("#solveBtn").click();

    // Solver initialization takes some time
    await expect(page.locator("#statusPill")).toContainText("Solved in", { timeout: 15000 });

    // Playback controls should become active
    await expect(page.locator("#playBtn")).not.toBeDisabled();
    await expect(page.locator("#solutionTitle")).toContainText("solution");
  });
});
