import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const PORT = Number(process.env.SCREENSHOT_PORT ?? 3002);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ROOT_DIR = process.cwd();
const IMAGE_DIR = path.join(ROOT_DIR, "public", "images");

async function main() {
  await mkdir(IMAGE_DIR, { recursive: true });

  const server = startDevServer();

  try {
    await waitForServer(`${BASE_URL}/`);

    const planId = await getLatestPlanId();
    const browser = await chromium.launch({
      channel: "chrome",
      headless: true,
    });
    const context = await browser.newContext({
      viewport: { width: 1600, height: 1200 },
      colorScheme: "dark",
      locale: "ja-JP",
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    await capture(page, `${BASE_URL}/`, "top-page.png");
    await capture(page, `${BASE_URL}/plans`, "history-page.png");
    await capture(page, `${BASE_URL}/plans/${planId}`, "detail-page.png");
    await capture(page, `${BASE_URL}/dashboard`, "dashboard-page.png");

    await browser.close();
  } finally {
    server.kill("SIGTERM");
  }
}

function startDevServer() {
  return spawn("npm", ["run", "dev", "--", "--port", String(PORT)], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      FORCE_COLOR: "0",
    },
    stdio: "ignore",
  });
}

async function waitForServer(url, timeoutMs = 45000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, {
        method: "GET",
      });

      if (response.ok) {
        return;
      }
    } catch {
      // Retry until timeout.
    }

    await sleep(1000);
  }

  throw new Error(`開発サーバーの起動を確認できませんでした: ${url}`);
}

async function getLatestPlanId() {
  const response = await fetch(`${BASE_URL}/api/task-plans`);

  if (!response.ok) {
    throw new Error("保存済みプラン一覧を取得できませんでした。");
  }

  const plans = await response.json();

  if (!Array.isArray(plans) || plans.length === 0 || typeof plans[0]?.id !== "number") {
    throw new Error(
      "保存済みプランがありません。先にアプリ上で 1 件以上保存してからスクリーンショットを生成してください。"
    );
  }

  return plans[0].id;
}

async function capture(page, url, fileName) {
  await page.goto(url, {
    waitUntil: "networkidle",
  });
  await page.screenshot({
    path: path.join(IMAGE_DIR, fileName),
    fullPage: true,
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
