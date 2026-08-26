import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';

const PORT = Number(process.env.PORT || 8787);
const UCloudApi = 'https://api.ucloud.cn/';
const staticRoot = fileURLToPath(new URL('.', import.meta.url));
const mimeTypes: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const configPath = join(staticRoot, 'config.json');
let config: { publicKey?: string; privateKey?: string; bailianApiKey?: string } = {};
try { config = JSON.parse(await readFile(configPath, 'utf8')); } catch { /* First run: config.json does not exist yet. */ }
let publicKey = process.env.UCLOUD_PUBLIC_KEY || config.publicKey || '';
let privateKey = process.env.UCLOUD_PRIVATE_KEY || config.privateKey || '';
let bailianApiKey = process.env.DASHSCOPE_API_KEY || config.bailianApiKey || '';

const bailianEndpoint = process.env.BAILIAN_ENDPOINT || 'https://llm-47zb1avqndgc3jpg.cn-beijing.maas.aliyuncs.com/api/v1/models';

const json = (response: ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  response.end(JSON.stringify(body));
};

const sign = (params: Record<string, string>) => {
  const canonical = Object.keys(params).sort().map((key) => key + params[key]).join('') + privateKey;
  return createHash('sha1').update(canonical, 'utf8').digest('hex');
};

const readBody = (request: IncomingMessage): Promise<string> => new Promise((resolve, reject) => {
  let body = '';
  request.on('data', (chunk) => { body += chunk; });
  request.on('end', () => resolve(body));
  request.on('error', reject);
});

const handler = async (request: IncomingMessage, response: ServerResponse) => {
  if (request.method === 'OPTIONS') return json(response, 204, {});
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  if (request.method === 'GET' && url.pathname === '/api/settings') {
    return json(response, 200, { astraflowConfigured: Boolean(publicKey && privateKey), bailianConfigured: Boolean(bailianApiKey), publicKey: publicKey ? `${publicKey.slice(0, 5)}…${publicKey.slice(-4)}` : '' });
  }

  if (request.method === 'POST' && url.pathname === '/api/settings') {
    try {
      const payload = JSON.parse(await readBody(request)) as { publicKey?: string; privateKey?: string; bailianApiKey?: string };
      publicKey = payload.publicKey?.trim() || '';
      privateKey = payload.privateKey?.trim() || '';
      bailianApiKey = payload.bailianApiKey?.trim() || '';
      if ((!publicKey || !privateKey) && !bailianApiKey) return json(response, 400, { message: 'Configure at least one platform.' });
      config = { publicKey, privateKey, bailianApiKey };
      await writeFile(configPath, JSON.stringify(config, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 });
      return json(response, 200, { configured: true });
    } catch { return json(response, 400, { message: 'Invalid JSON body.' }); }
  }

  if (request.method === 'GET' && url.pathname === '/api/prices') {
    const getAstraflow = async () => {
      if (!publicKey || !privateKey) throw new Error('AstraFlow keys are not configured.');
      const params: Record<string, string> = { Action: 'GetUFSquareModelPrices', Offset: '0', Limit: url.searchParams.get('Limit') || '20', PublicKey: publicKey };
      const keyword = url.searchParams.get('Keyword')?.trim(); if (keyword) params.Keyword = keyword;
      params.Signature = sign(params);
      const upstream = await fetch(`${UCloudApi}?${new URLSearchParams(params)}`);
      return upstream.json();
    };
    const getBailian = async () => {
      if (!bailianApiKey) throw new Error('Bailian API key is not configured.');
      const params = new URLSearchParams({ name: url.searchParams.get('Keyword') || '', page_no: '1', page_size: url.searchParams.get('Limit') || '20', language: 'en-US' });
      const upstream = await fetch(`${bailianEndpoint}?${params}`, { headers: { Authorization: `Bearer ${bailianApiKey}`, 'Content-Type': 'application/json' } });
      if (!upstream.ok) { const body = await upstream.text(); throw new Error(`Bailian request failed (${upstream.status}): ${body.slice(0, 300)}`); } return upstream.json();
    };
    const [astraflow, bailian] = await Promise.allSettled([getAstraflow(), getBailian()]);
    console.log('[Price lookup] upstream statuses:', { astraflow: astraflow.status, bailian: bailian.status });
    if (astraflow.status === 'rejected') console.error('[AstraFlow] price request failed:', astraflow.reason);
    if (bailian.status === 'rejected') console.error('[Bailian] price request failed:', bailian.reason);
    return json(response, 200, { astraflow: astraflow.status === 'fulfilled' ? astraflow.value : { error: astraflow.reason?.message || 'AstraFlow request failed' }, bailian: bailian.status === 'fulfilled' ? bailian.value : { error: bailian.reason?.message || 'Bailian request failed' } });
    /* legacy single-provider implementation below is intentionally unreachable. */
    if (!publicKey || !privateKey) return json(response, 400, { message: 'Configure UCloud keys first.' });
    const params: Record<string, string> = {
      Action: 'GetUFSquareModelPrices',
      Offset: url.searchParams.get('Offset') || '0',
      Limit: url.searchParams.get('Limit') || '20',
      PublicKey: publicKey,
    };
    const keyword = url.searchParams.get('Keyword')?.trim();
    if (keyword) params.Keyword = keyword;
    params.Signature = sign(params);
    try {
      const upstream = await fetch(`${UCloudApi}?${new URLSearchParams(params)}`);
      const text = await upstream.text();
      response.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') || 'application/json' });
      return response.end(text);
    } catch (error) { return json(response, 502, { message: error instanceof Error ? error.message : 'Upstream request failed.' }); }
  }

  if (request.method === 'GET') {
    const requestedPath = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const safePath = normalize(requestedPath).replace(/^([.][.][\\/])+/, '');
    const filePath = join(staticRoot, safePath);
    try {
      const file = await readFile(filePath);
      response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
      return response.end(file);
    } catch { return json(response, 404, { message: 'Not found.' }); }
  }

  return json(response, 404, { message: 'Not found.' });
};

createServer((request, response) => { void handler(request, response); }).listen(PORT, () => {
  console.log(`Price lookup server listening on http://localhost:${PORT}`);
});
