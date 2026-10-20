/**
 * Testes end-to-end (navegador real) do Caça-Palavras Escolar.
 *
 * Sobe o build de produção com `vite preview`, abre o Google Chrome via
 * puppeteer-core e valida a interação real: arraste com o mouse, toque em
 * tela de celular, troca de cores, botões e fluxo de vitória.
 *
 * Uso: npm run test:e2e
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const PORT = 4183;
const BASE_URL = `http://127.0.0.1:${PORT}/`;
const CHROME = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

let server;
let browser;
let page;
const consoleErrors = [];

/** Espera o servidor de preview responder. */
async function waitForServer(url, timeoutMs = 60000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch {
      /* ainda subindo */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Servidor não respondeu em ${timeoutMs}ms: ${url}`);
}

/** Lê a grade de letras diretamente do DOM. */
async function readGrid() {
  return page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('.board .cell'));
    const size = Math.sqrt(cells.length);
    const rows = Math.round(size);
    const grid = [];
    cells.forEach((cell, index) => {
      const row = Math.floor(index / rows);
      const col = index % rows;
      grid[row] = grid[row] ?? [];
      grid[row][col] = cell.textContent.trim();
    });
    return grid;
  });
}

/** Lê a lista de palavras exibida. */
async function readWordList() {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('.word-list__item')).map((item) => ({
      text: item.querySelector('.word-list__text').textContent.trim(),
      found: item.classList.contains('word-list__item--found'),
    })),
  );
}

/** Procura na grade as células de uma palavra (qualquer uma das 8 direções). */
function findWordCells(grid, word) {
  const target = normalize(word);
  const rows = grid.length;
  const cols = grid[0].length;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      for (const [dr, dc] of DIRECTIONS) {
        const cells = [];
        let ok = true;
        for (let i = 0; i < target.length; i += 1) {
          const r = row + dr * i;
          const c = col + dc * i;
          if (r < 0 || r >= rows || c < 0 || c >= cols) {
            ok = false;
            break;
          }
          cells.push({ row: r, col: c });
        }
        if (!ok) continue;
        const letters = cells.map((cell) => normalize(grid[cell.row][cell.col])).join('');
        if (letters === target) return cells;
      }
    }
  }
  return null;
}

async function cellBox(row, col) {
  const element = await page.$(`[data-testid="cell-${row}-${col}"]`);
  assert.ok(element, `célula ${row},${col} não encontrada`);
  const box = await element.boundingBox();
  assert.ok(box, `célula ${row},${col} sem posição`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Garante que a grade está visível antes de interagir com ela. */
async function scrollBoardIntoView() {
  await page.evaluate(() => {
    const board = document.querySelector('.board');
    if (board) board.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await new Promise((resolve) => setTimeout(resolve, 150));
}

/** Arrasta o mouse de uma célula até outra (simula o arraste do jogador). */
async function dragCells(from, to) {
  await scrollBoardIntoView();
  const start = await cellBox(from.row, from.col);
  const end = await cellBox(to.row, to.col);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 12 });
  await page.mouse.up();
  await new Promise((resolve) => setTimeout(resolve, 220));
}

/** Toque simples em uma célula. */
async function tapCell(row, col) {
  await scrollBoardIntoView();
  const point = await cellBox(row, col);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.up();
  await new Promise((resolve) => setTimeout(resolve, 120));
}

/** Encontra uma palavra da lista cujas células estão visíveis na tela. */
async function findVisibleWord() {
  await scrollBoardIntoView();
  const grid = await readGrid();
  const words = await readWordList();
  const viewport = page.viewport();
  for (const word of words) {
    if (word.found) continue;
    const cells = findWordCells(grid, word.text);
    if (!cells) continue;
    let visible = true;
    for (const cell of cells) {
      const element = await page.$(`[data-testid="cell-${cell.row}-${cell.col}"]`);
      const box = await element.boundingBox();
      if (
        !box ||
        box.y < 0 ||
        box.y + box.height > viewport.height ||
        box.x < 0 ||
        box.x + box.width > viewport.width
      ) {
        visible = false;
        break;
      }
    }
    if (visible) return { word, cells };
  }
  return null;
}

/** Encontra e marca uma palavra (usado para criar progresso nos testes). */
async function markAnyWord() {
  const target = await findVisibleWord();
  assert.ok(target, 'deveria haver uma palavra visível para marcar');
  await dragCells(target.cells[0], target.cells[target.cells.length - 1]);
  const after = await readWordList();
  const found = after.find((word) => word.text === target.word.text);
  assert.ok(
    found?.found,
    `a palavra ${target.word.text} deveria ter sido encontrada (estado: ${after
      .filter((word) => word.found)
      .map((word) => word.text)
      .join(', ')})`,
  );
  return target;
}

/** Aceita o diálogo de confirmação, caso ele esteja aberto. */
async function acceptConfirmIfOpen() {
  const dialog = await page.$('[data-testid="confirm-dialog"]');
  if (!dialog) return false;
  await page.click('[data-testid="confirm-accept"]');
  await new Promise((resolve) => setTimeout(resolve, 400));
  return true;
}

/** Cor de fundo computada das células marcadas de uma palavra. */
async function markedBackgrounds(cells) {
  return page.evaluate(
    (coords) =>
      coords.map((cell) => {
        const element = document.querySelector(`[data-testid="cell-${cell.row}-${cell.col}"]`);
        return element ? getComputedStyle(element).backgroundColor : null;
      }),
    cells,
  );
}

before(async () => {
  if (!existsSync(path.join(projectRoot, 'dist', 'index.html'))) {
    await new Promise((resolve, reject) => {
      const build = spawn('npx', ['vite', 'build'], { cwd: projectRoot, stdio: 'inherit' });
      build.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('build falhou'))));
    });
  }

  server = spawn(
    'npx',
    ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
    { cwd: projectRoot, stdio: 'ignore' },
  );
  await waitForServer(BASE_URL);

  browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(String(error)));

  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.board .cell');
});

after(async () => {
  await browser?.close();
  server?.kill('SIGTERM');
});

describe('Caça-Palavras Escolar — teste end-to-end', () => {
  it('carrega a página sem erros de console', async () => {
    const cells = await page.$$('.board .cell');
    assert.equal(cells.length, 100, 'a grade fácil deve ter 10x10 = 100 células');
    const words = await readWordList();
    assert.ok(words.length > 0, 'a lista de palavras deve estar preenchida');
    assert.equal(consoleErrors.length, 0, `erros no console: ${consoleErrors.join(' | ')}`);
  });

  it('encontra uma palavra arrastando com o mouse e marca com a cor escolhida', async () => {
    const grid = await readGrid();
    const words = await readWordList();
    const target = words.find((word) => !word.found);
    const cells = findWordCells(grid, target.text);
    assert.ok(cells, `a palavra ${target.text} deveria estar na grade`);

    // Escolhe a cor azul antes de marcar.
    await page.click('[data-testid="color-azul"]');
    await dragCells(cells[0], cells[cells.length - 1]);

    const after = await readWordList();
    const found = after.find((word) => word.text === target.text);
    assert.ok(found?.found, `a palavra ${target.text} deveria estar marcada como encontrada`);

    const backgrounds = await markedBackgrounds(cells);
    assert.ok(
      backgrounds.every((color) => color && color !== 'rgba(0, 0, 0, 0)'),
      'as células da palavra encontrada devem ter cor de marca-texto',
    );
    assert.ok(
      backgrounds.every((color) => color === backgrounds[0]),
      'todas as células da palavra devem receber a mesma cor',
    );
    assert.match(backgrounds[0], /96, 165, 250/, 'a cor azul deve ser aplicada');
  });

  it('mantém a cor original das palavras já encontradas ao trocar a cor', async () => {
    const grid = await readGrid();
    const words = await readWordList();
    const firstFound = words.find((word) => word.found);
    const firstCells = findWordCells(grid, firstFound.text);
    const before = await markedBackgrounds(firstCells);

    // Troca para rosa e encontra outra palavra.
    await page.click('[data-testid="color-rosa"]');
    const target = words.find((word) => !word.found);
    const cells = findWordCells(grid, target.text);
    await dragCells(cells[0], cells[cells.length - 1]);

    const after = await markedBackgrounds(firstCells);
    assert.deepEqual(after, before, 'a palavra já encontrada não deve mudar de cor');

    const newBackgrounds = await markedBackgrounds(cells);
    assert.match(newBackgrounds[0], /249, 168, 212/, 'a nova palavra deve usar a cor rosa');

    const list = await readWordList();
    assert.equal(list.filter((word) => word.found).length, 2);
  });

  it('não marca letras aleatórias e desfaz a seleção inválida', async () => {
    const before = await readWordList();
    const grid = await readGrid();
    // Procura um par de células que não forma palavra alguma da lista.
    const list = before.map((word) => normalize(word.text));
    let pair = null;
    for (let row = 0; row < grid.length && !pair; row += 1) {
      for (let col = 0; col < grid[row].length && !pair; col += 1) {
        for (const [dr, dc] of DIRECTIONS) {
          const r = row + dr;
          const c = col + dc;
          if (r < 0 || r >= grid.length || c < 0 || c >= grid[row].length) continue;
          const letters = normalize(grid[row][col] + grid[r][c]);
          if (letters.length >= 2 && !list.includes(letters)) {
            pair = [{ row, col }, { row: r, col: c }];
            break;
          }
        }
      }
    }
    assert.ok(pair, 'deveria existir um par de letras que não forma palavra');
    await dragCells(pair[0], pair[1]);

    const after = await readWordList();
    assert.equal(
      after.filter((word) => word.found).length,
      before.filter((word) => word.found).length,
      'nenhuma palavra deve ser marcada com uma seleção inválida',
    );
    const toast = await page.$eval('[data-testid="toast"]', (el) => el.textContent).catch(() => null);
    assert.ok(toast, 'deveria aparecer um aviso de seleção inválida');
  });

  it('a dica destaca apenas uma letra de uma palavra não encontrada', async () => {
    await page.click('[data-testid="hint"]');
    await new Promise((resolve) => setTimeout(resolve, 150));
    const hints = await page.$$('.cell--hint');
    assert.equal(hints.length, 1, 'apenas uma letra deve piscar');
    const letter = await page.$eval('.cell--hint', (el) => el.textContent.trim());
    assert.ok(letter && letter.length === 1, 'a dica deve ser uma única letra');
  });

  it('reiniciar a partida limpa as marcações e mantém a mesma grade', async () => {
    const gridBefore = await readGrid();
    await page.click('[data-testid="restart"]');
    await page.click('[data-testid="confirm-accept"]');
    await new Promise((resolve) => setTimeout(resolve, 250));
    const gridAfter = await readGrid();
    assert.deepEqual(gridAfter, gridBefore, 'a grade deve ser a mesma após reiniciar');
    const words = await readWordList();
    assert.equal(words.filter((word) => word.found).length, 0, 'as marcações devem ser limpas');
  });

  it('novo jogo gera outra grade e apaga o progresso após confirmação', async () => {
    // Primeiro encontra uma palavra para existir progresso a ser confirmado.
    await markAnyWord();

    const gridBefore = await readGrid();
    await page.click('[data-testid="new-game"]');
    await page.waitForSelector('[data-testid="confirm-dialog"]');
    await page.click('[data-testid="confirm-accept"]');
    await new Promise((resolve) => setTimeout(resolve, 400));
    const gridAfter = await readGrid();
    assert.notDeepEqual(gridAfter, gridBefore, 'um novo jogo deve gerar outra grade');
    const words = await readWordList();
    assert.equal(words.filter((word) => word.found).length, 0, 'o progresso deve ser zerado');
  });

  it('cancela a confirmação quando o jogador desiste', async () => {
    await markAnyWord();
    const gridBefore = await readGrid();
    await page.click('[data-testid="new-game"]');
    await page.waitForSelector('[data-testid="confirm-dialog"]');
    await page.click('[data-testid="confirm-cancel"]');
    await new Promise((resolve) => setTimeout(resolve, 300));
    const gridAfter = await readGrid();
    assert.deepEqual(gridAfter, gridBefore, 'cancelar deve manter a mesma grade');
    const words = await readWordList();
    assert.equal(words.filter((word) => word.found).length, 1, 'cancelar deve manter o progresso');
  });

  it('mudar a dificuldade gera uma grade maior', async () => {
    await markAnyWord();
    await page.click('[data-testid="difficulty-dificil"]');
    // Como há progresso, o jogo pede confirmação antes de trocar.
    await acceptConfirmIfOpen();
    await new Promise((resolve) => setTimeout(resolve, 400));
    const cells = await page.$$('.board .cell');
    assert.equal(cells.length, 14 * 14, 'a dificuldade difícil usa uma grade 14x14');
    const words = await readWordList();
    assert.ok(words.length > 10, 'a dificuldade difícil tem mais palavras');
  });

  it('mudar a categoria troca o conjunto de palavras', async () => {
    await page.select('[data-testid="category-select"]', 'disciplinas');
    await acceptConfirmIfOpen();
    await new Promise((resolve) => setTimeout(resolve, 400));
    const words = await readWordList();
    assert.ok(words.length > 0);
    const disciplines = new Set([
      'MATEMÁTICA', 'PORTUGUÊS', 'CIÊNCIAS', 'HISTÓRIA', 'GEOGRAFIA', 'ARTES',
      'MÚSICA', 'BIOLOGIA', 'FÍSICA', 'QUÍMICA', 'LITERATURA', 'INGLÊS',
    ]);
    for (const word of words) {
      assert.ok(disciplines.has(word.text), `palavra inesperada: ${word.text}`);
    }
  });

  it('mostrar a solução revela todas as palavras e exibe a mensagem de parabéns', async () => {
    await acceptConfirmIfOpen();
    await markAnyWord();

    const before = await page.evaluate(() => ({
      disabled: document.querySelector('[data-testid="solution"]')?.disabled ?? null,
      found: document.querySelectorAll('.word-list__item--found').length,
      overlay: Boolean(document.querySelector('[data-testid="win-overlay"]')),
      dialog: Boolean(document.querySelector('[data-testid="confirm-dialog"]')),
    }));

    await page.click('[data-testid="solution"]');
    await new Promise((resolve) => setTimeout(resolve, 400));
    const after = await page.evaluate(() => {
      const button = document.querySelector('[data-testid="solution"]');
      const rect = button.getBoundingClientRect();
      const top = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return {
        dialog: Boolean(document.querySelector('[data-testid="confirm-dialog"]')),
        overlay: Boolean(document.querySelector('[data-testid="win-overlay"]')),
        toast: document.querySelector('[data-testid="toast"]')?.textContent ?? null,
        found: document.querySelectorAll('.word-list__item--found').length,
        topElement: top ? `${top.tagName}.${top.className}` : null,
        buttonRect: { x: Math.round(rect.x), y: Math.round(rect.y) },
      };
    });
    await page.waitForSelector('[data-testid="confirm-dialog"]', { timeout: 8000 }).catch(() => {
      throw new Error(`diálogo não apareceu — antes: ${JSON.stringify(before)} depois: ${JSON.stringify(after)}`);
    });
    await page.click('[data-testid="confirm-accept"]');
    await new Promise((resolve) => setTimeout(resolve, 500));
    const words = await readWordList();
    assert.ok(
      words.every((word) => word.found),
      'todas as palavras devem estar marcadas após mostrar a solução',
    );
    const overlay = await page.$('[data-testid="win-overlay"]');
    assert.ok(overlay, 'a janela de parabéns deve aparecer');
    const title = await page.$eval('#win-title', (el) => el.textContent);
    assert.match(title, /Parabéns/);
  });

  it('permite jogar novamente depois da vitória', async () => {
    await page.click('[data-testid="play-again"]');
    await new Promise((resolve) => setTimeout(resolve, 400));
    const overlay = await page.$('[data-testid="win-overlay"]');
    assert.equal(overlay, null, 'a janela de parabéns deve ser fechada');
    const words = await readWordList();
    assert.equal(words.filter((word) => word.found).length, 0, 'a nova partida começa zerada');
  });

  it('seleciona palavras por toque (tela de celular)', async () => {
    await page.emulate({
      viewport: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.board .cell');

    const target = await findVisibleWord();
    assert.ok(target, 'deveria haver uma palavra visível na tela do celular');

    const start = await cellBox(target.cells[0].row, target.cells[0].col);
    const end = await cellBox(
      target.cells[target.cells.length - 1].row,
      target.cells[target.cells.length - 1].col,
    );

    await page.touchscreen.touchStart(start.x, start.y);
    for (let step = 1; step <= 10; step += 1) {
      await page.touchscreen.touchMove(
        start.x + ((end.x - start.x) * step) / 10,
        start.y + ((end.y - start.y) * step) / 10,
      );
    }
    await page.touchscreen.touchEnd();
    await new Promise((resolve) => setTimeout(resolve, 300));

    const after = await readWordList();
    const found = after.find((word) => word.text === target.word.text);
    assert.ok(found?.found, `a palavra ${target.word.text} deveria ser encontrada pelo toque`);
  });

  it('funciona no modo "toque na primeira letra e depois na última"', async () => {
    const target = await findVisibleWord();
    assert.ok(target, 'deveria haver uma palavra visível');

    await tapCell(target.cells[0].row, target.cells[0].col);
    await tapCell(
      target.cells[target.cells.length - 1].row,
      target.cells[target.cells.length - 1].col,
    );
    await new Promise((resolve) => setTimeout(resolve, 250));

    const after = await readWordList();
    const found = after.find((word) => word.text === target.word.text);
    assert.ok(found?.found, `a palavra ${target.word.text} deveria ser encontrada com dois toques`);
  });

  it('a interface se adapta a telas pequenas', async () => {
    await page.setViewport({ width: 360, height: 720, isMobile: true, hasTouch: true });
    await new Promise((resolve) => setTimeout(resolve, 250));
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    assert.ok(overflow <= 1, `a página não deve ter rolagem horizontal (excesso: ${overflow}px)`);
    const boardVisible = await page.$eval('.board', (el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    assert.ok(boardVisible, 'a grade deve continuar visível no celular');
  });

  it('a interface se adapta a telas grandes', async () => {
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise((resolve) => setTimeout(resolve, 250));
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    assert.ok(overflow <= 1, 'não deve haver rolagem horizontal em telas grandes');
    const boardWidth = await page.$eval('.board', (el) => el.getBoundingClientRect().width);
    assert.ok(boardWidth > 300, 'a grade deve ocupar um bom espaço na tela');
  });

  it('nenhum erro de console durante toda a sessão', () => {
    assert.equal(consoleErrors.length, 0, `erros no console: ${consoleErrors.join(' | ')}`);
  });
});
