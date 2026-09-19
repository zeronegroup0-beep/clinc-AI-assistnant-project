export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      // 1. API Reverse Proxy (Bypasses all Private Network Access prompts)
      if (url.pathname.startsWith('/api')) {
        // Handle CORS Preflight cleanly
        if (request.method === 'OPTIONS') {
          return new Response(null, {
            status: 204,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
              'Access-Control-Max-Age': '86400'
            }
          });
        }

        const backendUrl = env.BACKEND_API_URL;
        if (backendUrl) {
          const cleanBackend = backendUrl.replace(/\/+$/, '');
          const targetUrl = new URL(cleanBackend + url.pathname + url.search);
          const proxyHeaders = new Headers(request.headers);
          proxyHeaders.set('X-Forwarded-Host', url.host);
          proxyHeaders.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

          const proxyRequest = new Request(targetUrl.toString(), {
            method: request.method,
            headers: proxyHeaders,
            body: request.body,
            redirect: 'follow'
          });

          const backendRes = await fetch(proxyRequest);
          const responseHeaders = new Headers(backendRes.headers);
          responseHeaders.set('Access-Control-Allow-Origin', '*');

          return new Response(backendRes.body, {
            status: backendRes.status,
            statusText: backendRes.statusText,
            headers: responseHeaders
          });
        }

        // Informative response if BACKEND_API_URL is not yet set
        return new Response(JSON.stringify({
          success: false,
          message: 'لم يتم ربط رابط خادم الـ API بعد. يرجى ضبط BACKEND_API_URL في إعدادات Cloudflare Workers (مثل رابط Render أو Railway أو Cloudflare Tunnel).'
        }), {
          status: 503,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // 2. Serve static frontend assets
      if (env.ASSETS) {
        const response = await env.ASSETS.fetch(request);
        if (response.status !== 404) {
          return response;
        }

        // SPA fallback for client-side navigation (e.g. /doctors, /services)
        if (!url.pathname.includes('.')) {
          const indexRequest = new Request(new URL('/index.html', request.url), request);
          return await env.ASSETS.fetch(indexRequest);
        }

        return response;
      }

      return new Response('Not Found', { status: 404 });
    } catch (err) {
      return new Response(`Worker Error: ${err.message}`, { status: 500 });
    }
  }
};
