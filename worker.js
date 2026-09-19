import receptionistAgent from './services/receptionistAgent.js';
import appointmentService from './services/appointmentService.js';

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

        // Direct Serverless Execution inside Cloudflare Worker (Fallback if no external backend URL is provided)
        if (url.pathname === '/api/chat' && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const { message, sessionId, sessionData = {} } = body;

          if (!message || typeof message !== 'string') {
            return new Response(JSON.stringify({
              success: false,
              message: 'رسالة المحادثة مطلوبة'
            }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }

          const effectiveSessionId = (sessionId && sessionId !== 'default_session')
            ? sessionId
            : 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

          const currentDate = new Date();

          const result = await receptionistAgent.processChatMessage({
            message,
            sessionId: effectiveSessionId,
            sessionData: sessionData || {},
            currentDate
          });

          return new Response(JSON.stringify({
            success: true,
            sessionId: effectiveSessionId,
            reply: result.reply,
            reasoningSteps: result.reasoningSteps || [],
            state: result.state,
            card: result.card || null,
            suggestedSlots: result.suggestedSlots || []
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        if (url.pathname === '/api/appointments' && request.method === 'GET') {
          const apps = await appointmentService.getAllAppointments();
          return new Response(JSON.stringify({ success: true, count: apps.length, data: apps }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        if (url.pathname === '/api/waitlist' && request.method === 'GET') {
          const wl = await appointmentService.getWaitlist();
          return new Response(JSON.stringify({ success: true, count: wl.length, data: wl }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        if (url.pathname === '/api/doctors' && request.method === 'GET') {
          return new Response(JSON.stringify({ success: true, data: appointmentService.DOCTORS_SCHEDULE }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        return new Response(JSON.stringify({ success: false, message: 'Endpoint not found' }), {
          status: 404,
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
