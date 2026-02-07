export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(origin)
      });
    }

    if (url.pathname.startsWith('/api/')) {
      if (!env.BACKEND_URL) {
        return new Response('BACKEND_URL not configured', { status: 500 });
      }

      const targetUrl = new URL(url.pathname + url.search, env.BACKEND_URL);
      const headers = new Headers(request.headers);
      const init = {
        method: request.method,
        headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? null : await request.arrayBuffer(),
        redirect: 'manual'
      };

      const response = await fetch(targetUrl.toString(), init);
      const responseHeaders = new Headers(response.headers);
      const corsHeaders = buildCorsHeaders(origin);
      corsHeaders.forEach((value, key) => responseHeaders.set(key, value));

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
    }

    if (url.pathname === '/' || !url.pathname.includes('.')) {
      const indexUrl = new URL('/index.html', request.url);
      return env.ASSETS.fetch(new Request(indexUrl, request));
    }

    return env.ASSETS.fetch(request);
  }
};

function buildCorsHeaders(origin) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
    headers.set('Access-Control-Allow-Origin', '*');
  }

  return headers;
}
