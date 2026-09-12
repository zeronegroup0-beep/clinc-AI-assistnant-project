export default {
  async fetch(request, env) {
    try {
      // If assets binding is present, serve static asset
      if (env.ASSETS) {
        const response = await env.ASSETS.fetch(request);
        if (response.status !== 404) {
          return response;
        }

        // SPA fallback for client-side navigation (e.g. /doctors, /services)
        const url = new URL(request.url);
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
