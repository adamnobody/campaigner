import pc from 'picocolors';

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
const REQUIRE_PROXY = process.env.SMOKE_REQUIRE_PROXY === '1';

function fail(message) {
  throw new Error(message);
}

async function fetchText(url) {
  const res = await fetch(url);
  const text = await res.text();
  return { res, text };
}

function extractAssetPaths(html) {
  const assetPaths = new Set();
  const scriptRegex = /<script[^>]+src="([^"]+)"/g;
  const linkRegex = /<link[^>]+href="([^"]+)"/g;

  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    assetPaths.add(match[1]);
  }
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    if (href.startsWith('/assets/')) {
      assetPaths.add(href);
    }
  }

  return [...assetPaths];
}

async function assertHtmlRoute(pathname) {
  const url = `${FRONTEND_URL}${pathname}`;
  const { res, text } = await fetchText(url);
  if (!res.ok) {
    fail(`${pathname}: expected 200, got ${res.status}`);
  }
  if (!text.includes('<div id="root">')) {
    fail(`${pathname}: expected SPA shell with root element`);
  }
  console.log(pc.green(`✔ ${pathname} returns SPA shell`));
  return text;
}

async function assertAssetLoads(pathname) {
  const html = await assertHtmlRoute(pathname);
  const assets = extractAssetPaths(html).slice(0, 8);
  if (!assets.length) {
    fail(`${pathname}: no JS/CSS assets found in HTML`);
  }

  for (const assetPath of assets) {
    const absolute = assetPath.startsWith('http') ? assetPath : `${FRONTEND_URL}${assetPath}`;
    const res = await fetch(absolute);
    if (!res.ok) {
      fail(`asset load failed ${assetPath}: ${res.status}`);
    }
  }
  console.log(pc.green(`✔ assets for ${pathname} load (${assets.length} files checked)`));
}

async function assertFrontendProxy() {
  const healthUrl = `${FRONTEND_URL}/api/health`;
  try {
    const res = await fetch(healthUrl);
    if (!res.ok) {
      if (REQUIRE_PROXY) {
        fail(`/api/health via frontend failed: ${res.status}`);
      }
      console.log(pc.yellow(`⚠ /api/health via frontend returned ${res.status}; backend may be offline, skipping strict proxy check`));
      return;
    }
    const data = await res.json();
    if (!data?.success) {
      if (REQUIRE_PROXY) {
        fail(`/api/health via frontend did not return success=true`);
      }
      console.log(pc.yellow('⚠ /api/health via frontend did not return success=true; skipping strict proxy check'));
      return;
    }
    console.log(pc.green('✔ frontend proxy to backend works (/api/health)'));
  } catch {
    if (REQUIRE_PROXY) {
      fail('/api/health via frontend failed: backend is unreachable');
    }
    console.log(pc.yellow('⚠ backend is unreachable from frontend proxy; skipping strict proxy check'));
  }
}

async function main() {
  console.log(pc.bold(pc.magenta('\nCampaigner Frontend Smoke')));
  console.log(pc.dim(`Frontend: ${FRONTEND_URL}\n`));

  await assertAssetLoads('/');
  await assertHtmlRoute('/appearance');
  await assertHtmlRoute('/project/1/map');
  await assertFrontendProxy();

  console.log(pc.green(pc.bold('\n✔ Frontend smoke passed\n')));
}

main().catch((error) => {
  console.error(pc.red(`✖ ${error instanceof Error ? error.message : String(error)}`));
  process.exitCode = 1;
});
