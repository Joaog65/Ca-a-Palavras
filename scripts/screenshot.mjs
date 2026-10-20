import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const server = spawn('npx', ['vite', 'preview', '--port', '4188', '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
await sleep(2500);

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

const norm = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const findCells = (grid, word) => {
  const target = norm(word);
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[r].length; c++)
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        const arr = []; let ok = true;
        for (let i = 0; i < target.length; i++) {
          const rr = r + dr*i, cc = c + dc*i;
          if (rr < 0 || rr >= grid.length || cc < 0 || cc >= grid[r].length) { ok = false; break; }
          arr.push({ row: rr, col: cc });
        }
        if (!ok) continue;
        if (arr.map((x) => norm(grid[x.row][x.col])).join('') === target) return arr;
      }
  return null;
};

const readGrid = (p) =>
  p.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('.board .cell'));
    const rows = Math.round(Math.sqrt(cells.length));
    const g = [];
    cells.forEach((c, i) => { const r = Math.floor(i / rows); g[r] = g[r] ?? []; g[r][i % rows] = c.textContent.trim(); });
    return g;
  });

const readWords = (p) =>
  p.evaluate(() => Array.from(document.querySelectorAll('.word-list__text')).map((e) => e.textContent.trim()));

async function markWords(p, indexes, color) {
  const grid = await readGrid(p);
  const words = await readWords(p);
  if (color) {
    await p.click(`[data-testid="color-${color}"]`);
    await sleep(150);
  }
  for (const index of indexes) {
    const cells = findCells(grid, words[index]);
    if (!cells) continue;
    const el1 = await p.$(`[data-testid="cell-${cells[0].row}-${cells[0].col}"]`);
    const el2 = await p.$(`[data-testid="cell-${cells[cells.length-1].row}-${cells[cells.length-1].col}"]`);
    const b1 = await el1.boundingBox();
    const b2 = await el2.boundingBox();
    await p.mouse.move(b1.x + b1.width/2, b1.y + b1.height/2);
    await p.mouse.down();
    await p.mouse.move(b2.x + b2.width/2, b2.y + b2.height/2, { steps: 10 });
    await p.mouse.up();
    await sleep(300);
  }
}

try {
  // ---------- desktop ----------
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });
  await page.goto('http://127.0.0.1:4188/', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.board .cell');
  await page.click('[data-testid="difficulty-medio"]');
  await sleep(700);
  await markWords(page, [0, 3], 'azul');
  await markWords(page, [5], 'rosa');
  await sleep(400);
  await page.screenshot({ path: 'screenshots/desktop.png' });
  console.log('desktop ok');

  // ---------- vitória ----------
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(200);
  await page.click('[data-testid="solution"]');
  await sleep(500);
  const hasDialog = await page.$('[data-testid="confirm-dialog"]');
  console.log('diálogo de confirmação:', Boolean(hasDialog));
  if (hasDialog) {
    await page.click('[data-testid="confirm-accept"]');
  }
  await sleep(1200);
  await page.screenshot({ path: 'screenshots/vitoria.png' });
  console.log('vitoria ok');
  await page.close();

  // ---------- mobile ----------
  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await mobile.goto('http://127.0.0.1:4188/', { waitUntil: 'networkidle0' });
  await mobile.waitForSelector('.board .cell');
  await sleep(500);
  await markWords(mobile, [0, 2], 'verde');
  await sleep(400);
  await mobile.screenshot({ path: 'screenshots/mobile.png' });
  console.log('mobile ok');
  await mobile.close();
} catch (error) {
  console.log('ERRO:', error.message);
} finally {
  await browser.close();
  server.kill('SIGTERM');
}
process.exit(0);
