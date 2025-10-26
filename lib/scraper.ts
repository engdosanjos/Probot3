import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ========================= CONFIG =========================
const LIST_URL = process.env.LIST_URL || 'https://www.livescore.in/br/futebol/';
const HEADLESS = String(process.env.HEADLESS || '1') !== '0';
const POLL_MS = Math.max(3_000, Number(process.env.STATS_POLL_MS || 20_000)); // intervalo do loop
const NAV_TIMEOUT_MS = Math.max(15_000, Number(process.env.NAV_TIMEOUT_MS || 30_000));
const FILTER_WAIT_MS = Math.max(3_000, Number(process.env.FILTER_WAIT_MS || 8_000));
const DETAIL_URL_PREFIX = 'https://www.livescore.in';
const DETAIL_STATS_SUFFIX = '#/resumo-de-jogo/estatisticas-de-jogo/0';
const LOG_BASIC = String(process.env.LOG_BASIC || '1') === '1';
const UPDATE_CONCURRENCY = Math.max(1, Number(process.env.SCRAPER_CONCURRENCY || 3)); // atualizações em paralelo

const DETAIL_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

// ----------------- helpers -----------------
function extractExternalId(url: string, header?: { home?: string; away?: string }) {
  const midMatch = url.match(/[?&]mid=([^&#]+)/);
  if (midMatch?.[1]) return `mid:${midMatch[1]}`;
  const pathMatch = url.match(/\/jogo\/futebol\/([^\/]+)\/([^\/\?#]+)/);
  if (pathMatch?.[1] && pathMatch?.[2]) return `slug:${pathMatch[1]}__${pathMatch[2]}`;
  if (header?.home && header?.away) return `teams:${header.home}__${header.away}`;
  return `url:${url.split('#')[0]}`;
}

function normalizeDetailUrl(href: string) {
  if (!href) return '';
  let url = href.startsWith('http') ? href : DETAIL_URL_PREFIX + href;
  if (!url.includes(DETAIL_STATS_SUFFIX)) {
    url += DETAIL_STATS_SUFFIX;
  }
  return url;
}

export class FootballScraper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private isRunning = false;

  // mantém UMA aba da lista e várias abas de partidas
  private listPage: Page | null = null;
  private openPages = new Map<string, Page>(); // externalId -> Page

  async init() {
    console.log('[scraper] Initializing browser with Playwright...');
    this.browser = await chromium.launch({
      headless: HEADLESS,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    this.context = await this.browser.newContext({
      userAgent: DETAIL_UA,
      viewport: { width: 1366, height: 768 },
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
    });
    await this.context.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    });
    console.log('[scraper] Browser initialized successfully');
  }

  async close() {
    try {
      for (const [, page] of this.openPages) {
        try { await page.close(); } catch {}
      }
      this.openPages.clear();
      if (this.listPage) { try { await this.listPage.close(); } catch {} }
      this.listPage = null;

      if (this.context) { await this.context.close(); this.context = null; }
      if (this.browser)  { await this.browser.close();  this.browser = null; }
    } catch (e) {
      console.error('[scraper] Error while closing browser/context:', e);
    }
  }

  // ========== LIST PAGE (ABRE UMA VEZ E REUSA) ==========
  private async ensureListPage() {
    if (!this.context) throw new Error('Browser context not initialized');
    if (this.listPage && !this.listPage.isClosed()) return;

    this.listPage = await this.context.newPage();
    await this.listPage.goto(LIST_URL, { timeout: NAV_TIMEOUT_MS, waitUntil: 'domcontentloaded' });
    await this.acceptCookiesIfAny(this.listPage);
    await this.ensureLiveFilter(this.listPage);
    if (LOG_BASIC) console.log('[scraper] List page ready (Ao Vivo selecionado).');
  }

  private async acceptCookiesIfAny(page: Page) {
    const candidates = [
      "//button[span[contains(., 'Aceitar') or contains(., 'Concordo') or contains(., 'OK')]]",
      "button:has-text('Aceitar')",
      "button:has-text('Concordo')",
      "button:has-text('OK')",
      "button:has-text('Aceitar todos')",
    ];
    for (const sel of candidates) {
      try {
        const btn = page.locator(sel);
        if (await btn.count()) {
          if (await btn.first().isVisible()) {
            await btn.first().click({ timeout: 1000 }).catch(() => {});
            await page.waitForTimeout(200);
            break;
          }
        }
      } catch {}
    }
  }

  // Garantia forte do filtro Ao Vivo + presença de linhas ao vivo visíveis
  private async ensureLiveFilter(page: Page) {
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(200);

    const isAoVivoSelected = async () => {
      try {
        const sel = page.locator('.filters__tab.selected .filters__text', { hasText: /ao\s*vivo/i });
        return (await sel.count()) > 0;
      } catch { return false; }
    };

    try {
      await page.waitForSelector('.filters__group .filters__tab', { timeout: FILTER_WAIT_MS });
    } catch {}

    if (!(await isAoVivoSelected())) {
      const aoVivoTab = page
        .locator('.filters__group .filters__tab', { has: page.locator('.filters__text', { hasText: /ao\s*vivo/i }) })
        .first();
      await aoVivoTab.scrollIntoViewIfNeeded().catch(() => {});
      // clique no label ou no tab
      await aoVivoTab.locator('.filters__text', { hasText: /ao\s*vivo/i }).first().click({ timeout: 3000 }).catch(async () => {
        await aoVivoTab.click({ timeout: 3000 }).catch(() => {});
      });

      // aguardar seleção visual OU surgimento de linhas ao vivo
      await Promise.race([
        page.waitForSelector('.filters__tab.selected .filters__text', { hasText: /ao\s*vivo/i, timeout: 3000 }),
        page.waitForSelector("div.event__match.event__match--live[data-event-row='true']", { timeout: 3000 }),
      ]).catch(() => {});
    }

    // confirmação final: exige ao menos 1 linha AO VIVO visível
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll("div.event__match.event__match--live[data-event-row='true']");
      for (const r of Array.from(rows)) {
        const el = r as HTMLElement;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        if (rect.height > 0 && rect.width > 0 && style.visibility !== 'hidden' && style.display !== 'none') {
          return true;
        }
      }
      return false;
    }, { timeout: 8000 }).catch(() => {});
  }

  // Coleta apenas as linhas visíveis marcadas como AO VIVO (sem varrer todos os <a/>)
  private async collectLiveLinksFromList(): Promise<string[]> {
    if (!this.listPage) return [];
    const hrefs = await this.listPage.evaluate(() => {
      const out = new Set<string>();
      const rows = Array.from(document.querySelectorAll(
        "div.event__match.event__match--live[data-event-row='true']"
      )) as HTMLElement[];

      for (const row of rows) {
        const rect = row.getBoundingClientRect();
        const style = window.getComputedStyle(row);
        const visible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        if (!visible) continue;

        const a = row.querySelector("a.eventRowLink") as HTMLAnchorElement | null;
        const h = a?.getAttribute('href');
        if (h) out.add(h);
      }

      return Array.from(out);
    });

    // normaliza e deduplica
    const norm = hrefs
      .map((h) => normalizeDetailUrl(h))
      .filter(Boolean) as string[];

    const unique = Array.from(new Set(norm));

    // (opcional) sanity: se vier absurdamente alto, loga para depuração
    if (unique.length > 200) {
      console.warn('[scraper] Unusually high live count; got:', unique.length);
    }

    // log de mids únicos ajuda a confirmar contagem correta
    const mids = unique.map(u => (u.match(/[?&]mid=([^&#]+)/)?.[1] || 'no-mid'));
    const uniqMids = new Set(mids);
    if (LOG_BASIC) console.log(`[scraper] Live links on list: ${unique.length} | unique mids: ${uniqMids.size}`);

    return unique;
  }

  // ========== PARTIDA (READERS) ==========
  private async readHeaderBasic(page: Page) {
    const getTxt = async (sel: string) => {
      try {
        const loc = page.locator(sel);
        if ((await loc.count()) === 0) return '';
        const t = await loc.first().textContent();
        return String(t || '').trim();
      } catch { return ''; }
    };

    const home = await getTxt('.duelParticipant__home .participant__participantName a');
    const away = await getTxt('.duelParticipant__away .participant__participantName a');
    const league = await getTxt('.detail__breadcrumbs [data-testid="wcl-breadcrumbs"] li:nth-child(3) span');
    const status =
      (await getTxt('.detailScore__status .fixedHeaderDuel__detailStatus')) ||
      (await getTxt('.fixedScore__status .fixedHeaderDuel__detailStatus')) ||
      (await getTxt('.fixedHeaderDuel__detailStatus'));
    const minuteTxt =
      (await getTxt('.detailScore__status .eventTime')) ||
      (await getTxt('.fixedScore__status .eventTime')) ||
      (await getTxt('.fixedHeaderDuel .eventTime'));
    const minute = (() => {
      const m = parseInt(String(minuteTxt || '').replace(/[^\d]/g, ''), 10);
      return Number.isFinite(m) ? m : null;
    })();

    let goalsHome: number | null = null, goalsAway: number | null = null;
    try {
      const spans = await page.locator('.detailScore__wrapper span:not(.detailScore__divider)').allTextContents();
      const nums = (spans || []).map((s: any) => parseInt(String(s || '').replace(/[^\d]/g, ''), 10))
                                 .filter((x: any) => Number.isFinite(x));
      if (nums.length >= 2) { goalsHome = nums[0]; goalsAway = nums[1]; }
    } catch {}

    return { home, away, league, status, minute, goalsHome, goalsAway };
  }

  private async readStatRowByLabel(page: Page, label: string) {
    try {
      const row = page.locator(
        `xpath=//div[@data-testid='wcl-statistics' and .//div[@data-testid='wcl-statistics-category']//strong[contains(normalize-space(.), "${label}")]]`,
      );
      if (await row.count()) {
        const hTxt = await row.locator(".wcl-homeValue_3Q-7P [data-testid='wcl-scores-simpleText-01']").first().textContent().catch(() => '');
        const aTxt = await row.locator(".wcl-awayValue_Y-QR1 [data-testid='wcl-scores-simpleText-01']").first().textContent().catch(() => '');
        const h = parseInt(String(hTxt || '').replace(/[^\d]/g, ''), 10) || 0;
        const a = parseInt(String(aTxt || '').replace(/[^\d]/g, ''), 10) || 0;
        return { home: h, away: a };
      }
    } catch {}
    return { home: 0, away: 0 };
  }

  private async readStatRowByAnyLabel(page: Page, labels: string[]) {
    for (const lb of labels) {
      const v = await this.readStatRowByLabel(page, lb);
      if ((v.home || v.away) && (v.home >= 0 || v.away >= 0)) return v;
    }
    return { home: 0, away: 0 };
  }

  private async readFloatRowByLabel(page: Page, label: string) {
    try {
      const row = page.locator(
        `xpath=//div[@data-testid='wcl-statistics' and .//div[@data-testid='wcl-statistics-category']//strong[contains(normalize-space(.), "${label}")]]`,
      );
      if (await row.count()) {
        const hTxt = await row.locator(".wcl-homeValue_3Q-7P [data-testid='wcl-scores-simpleText-01']").first().textContent().catch(() => '');
        const aTxt = await row.locator(".wcl-awayValue_Y-QR1 [data-testid='wcl-scores-simpleText-01']").first().textContent().catch(() => '');
        const toNum = (t: any) => {
          const s = String(t || '').trim().replace(',', '.').replace(/[^\d.]/g, '');
          const v = parseFloat(s);
          return Number.isFinite(v) ? v : 0;
        };
        return { home: toNum(hTxt), away: toNum(aTxt) };
      }
    } catch {}
    return { home: 0, away: 0 };
  }

  private async readStatsSnapshot(page: Page) {
    const hasStats = await page.locator("[data-testid='wcl-statistics']").count().catch(() => 0);
    if (!hasStats) return null;
    const shotsTotal = await this.readStatRowByLabel(page, 'Total de finalizações');
    const shotsOn    = await this.readStatRowByLabel(page, 'Finalizações no alvo');
    const shotsOff   = await this.readStatRowByLabel(page, 'Finalizações para fora');
    const shotsBlk   = await this.readStatRowByLabel(page, 'Finalizações bloqueadas');
    const bigChances = await this.readStatRowByAnyLabel(page, ['Chances claras', 'Grandes oportunidades']);
    const corners    = await this.readStatRowByLabel(page, 'Escanteios');
    const dangAtt    = await this.readStatRowByLabel(page, 'Ataques perigosos');
    const xg         = await this.readFloatRowByLabel(page, 'xG');

    return {
      st_home: shotsTotal.home, st_away: shotsTotal.away,
      sot_home: shotsOn.home,   sot_away: shotsOn.away,
      soff_home: shotsOff.home, soff_away: shotsOff.away,
      sblk_home: shotsBlk.home, sblk_away: shotsBlk.away,
      bc_home: bigChances.home, bc_away: bigChances.away,
      xg_home: xg.home,         xg_away: xg.away,
      corners_home: corners.home, corners_away: corners.away,
      da_home: dangAtt.home,      da_away: dangAtt.away,
    };
  }

  // ========================= PUBLIC API =========================
  async startScraping() {
    if (this.isRunning) { console.log('[scraper] Already running'); return; }
    this.isRunning = true;
    console.log('[scraper] Starting football data scraping...');
    try {
      await this.init();
      await this.loop();
    } catch (e) {
      console.error('[scraper] Fatal error:', e);
    } finally {
      this.isRunning = false;
      await this.close();
    }
  }

  stop() {
    this.isRunning = false;
    console.log('[scraper] Stopping scraper...');
  }

  // ========================= MAIN LOOP =========================
  private async loop() {
    if (!this.context) throw new Error('Browser context not initialized');

    while (this.isRunning) {
      try {
        await this.ensureListPage();

        // 1) Ler todos os links ao vivo (sem recarregar a lista)
        const links = await this.collectLiveLinksFromList();
        const desired = new Map<string, string>(); // externalId -> url
        for (const link of links) {
          const ext = extractExternalId(link);
          desired.set(ext, link);
        }

        // 2) Abrir novas guias que ainda não existem
        for (const [ext, link] of desired) {
          if (!this.openPages.has(ext)) {
            try {
              const p = await this.context!.newPage();
              await p.goto(link, { timeout: NAV_TIMEOUT_MS, waitUntil: 'domcontentloaded' });
              this.openPages.set(ext, p);
              if (LOG_BASIC) console.log(`[scraper] Opened new match tab: ${ext}`);
            } catch (e) {
              console.error(`[scraper] Failed to open match ${ext}:`, e);
            }
          }
        }

        // 3) Fechar guias de partidas que saíram do Ao Vivo
        for (const [ext, page] of Array.from(this.openPages.entries())) {
          if (!desired.has(ext)) {
            try { await page.close(); } catch {}
            this.openPages.delete(ext);
            if (LOG_BASIC) console.log(`[scraper] Closed tab (no longer live): ${ext}`);
          }
        }

        // 4) Atualizar TODAS as guias abertas (concorrência controlada)
        const entries = Array.from(this.openPages.entries());
        for (let i = 0; i < entries.length && this.isRunning; i += UPDATE_CONCURRENCY) {
          const batch = entries.slice(i, i + UPDATE_CONCURRENCY);
          await Promise.all(batch.map(async ([ext, page]) => {
            try {
              // garantir seção de estatísticas visível (sem reload)
              const statsReady = await page
                .waitForSelector("[data-testid='wcl-statistics']", { timeout: 3000 })
                .then(() => true)
                .catch(() => false);
              if (!statsReady) {
                const tabStats = page.locator("button, a", { hasText: /estat[íi]sticas/i }).first();
                if (await tabStats.count()) {
                  await tabStats.click().catch(() => {});
                  await page.waitForSelector("[data-testid='wcl-statistics']", { timeout: 2000 }).catch(() => {});
                }
              }

              const header = await this.readHeaderBasic(page);
              if (!header.home || !header.away) return;

              // encerrar e fechar se a partida acabou
              const isFinished = /encerrado|final|ft|terminado/i.test(String(header.status || ''));
              if (isFinished) {
                await this.upsertAll(ext, header, null); // ainda atualiza placar final
                try { await page.close(); } catch {}
                this.openPages.delete(ext);
                if (LOG_BASIC) console.log(`[scraper] Closed finished match: ${ext}`);
                return;
              }

              const stats = await this.readStatsSnapshot(page);

              await this.upsertAll(ext, header, stats);
              if (LOG_BASIC) {
                console.log(`[scraper] Updated ${ext} | ${header.home} ${header.goalsHome ?? 0}-${header.goalsAway ?? 0} ${header.away} (${header.minute || 0}')`);
              }
            } catch (e) {
              console.error(`[scraper] Update error (${ext}):`, e);
            }
          }));
        }

        // 5) dormir até o próximo ciclo
        await new Promise(r => setTimeout(r, POLL_MS));
      } catch (e) {
        console.error('[scraper] Loop error:', e);
        await new Promise(r => setTimeout(r, 10_000));
      }
    }
  }

  // Upserts agrupados (liga, times, jogo e snapshots)
  private async upsertAll(externalId: string, header: any, stats: any | null) {
    const league = await prisma.league.upsert({
      where: { name: header.league || 'Unknown League' },
      update: { country: 'Unknown' },
      create: { name: header.league || 'Unknown League', country: 'Unknown' },
    });

    const upsertTeam = (name: string) =>
      prisma.team.upsert({
        where: { name },
        update: { league: header.league || 'Unknown League', country: 'Unknown' },
        create: { name, league: header.league || 'Unknown League', country: 'Unknown' },
      });

    const homeTeam = await upsertTeam(header.home);
    const awayTeam = await upsertTeam(header.away);

    const match = await prisma.match.upsert({
      where: { externalId },
      update: {
        status: header.status || 'Live',
        minute: header.minute,
        goalsHome: header.goalsHome ?? 0,
        goalsAway: header.goalsAway ?? 0,
        isBeingTracked: true,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        leagueId: league.id,
      },
      create: {
        externalId,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        leagueId: league.id,
        status: header.status || 'Live',
        minute: header.minute,
        goalsHome: header.goalsHome ?? 0,
        goalsAway: header.goalsAway ?? 0,
        isBeingTracked: true,
      },
      include: { _count: true },
    });

    if (stats) {
      await prisma.match.update({
        where: { id: match.id },
        data: {
          shotsHome: stats.st_home || 0,
          shotsAway: stats.st_away || 0,
          shotsOnHome: stats.sot_home || 0,
          shotsOnAway: stats.sot_away || 0,
          shotsOffHome: stats.soff_home || 0,
          shotsOffAway: stats.soff_away || 0,
          shotsBlkHome: stats.sblk_home || 0,
          shotsBlkAway: stats.sblk_away || 0,
          cornersHome: stats.corners_home || 0,
          cornersAway: stats.corners_away || 0,
          xgHome: stats.xg_home || 0,
          xgAway: stats.xg_away || 0,
          bigChancesHome: stats.bc_home || 0,
          bigChancesAway: stats.bc_away || 0,
          dangAttHome: stats.da_home || 0,
          dangAttAway: stats.da_away || 0,
        },
      });

      await prisma.statSnapshot.create({
        data: {
          matchId: match.id,
          minute: header.minute || 0,
          shotsHome: stats.st_home || 0,
          shotsAway: stats.st_away || 0,
          shotsOnHome: stats.sot_home || 0,
          shotsOnAway: stats.sot_away || 0,
          cornersHome: stats.corners_home || 0,
          cornersAway: stats.corners_away || 0,
          xgHome: stats.xg_home || 0,
          xgAway: stats.xg_away || 0,
          bigChancesHome: stats.bc_home || 0,
          bigChancesAway: stats.bc_away || 0,
        },
      });
    }
  }
}
