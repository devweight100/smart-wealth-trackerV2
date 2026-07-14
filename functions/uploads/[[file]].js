// functions/uploads/[[file]].js
// Serve uploaded files from R2 (primary) or KV (legacy fallback)
// Updated for v2: uses env.IMAGES (R2) and env.KV_STORE (KV)

export async function onRequest(context) {
  const { request, env } = context;
  const url      = new URL(request.url);
  const filename = url.pathname.replace(/^\/uploads\//, '').split('?')[0];

  if (!filename) {
    return new Response('File Not Found', { status: 404 });
  }

  // CORS & cache headers
  const cacheHeaders = {
    'Cache-Control'               : 'public, max-age=31536000, immutable',
    'Access-Control-Allow-Origin' : '*',
  };

  // 1. Try R2 first (new uploads)
  if (env.IMAGES) {
    try {
      const obj = await env.IMAGES.get(filename);
      if (obj) {
        const mime = obj.httpMetadata?.contentType || guessMime(filename);
        return new Response(obj.body, {
          headers: { 'Content-Type': mime, ...cacheHeaders },
        });
      }
    } catch (e) {
      console.error('[Uploads] R2 get failed:', e.message);
    }
  }

  // 2. Try KV fallback (legacy uploads from v1)
  const kv = env.KV_STORE || env.DB; // DB was the old KV binding name
  if (kv) {
    try {
      const { value, metadata } = await kv.getWithMetadata(filename, { type: 'arrayBuffer' });
      if (value) {
        const mime = metadata?.mimeType || guessMime(filename);
        return new Response(value, {
          headers: {
            'Content-Type'  : mime,
            'Cache-Control' : 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } catch (e) {
      console.error('[Uploads] KV get failed:', e.message);
    }
  }

  return new Response('File Not Found', { status: 404 });
}

function guessMime(filename) {
  const ext = String(filename).split('.').pop().toLowerCase();
  const map  = {
    jpg : 'image/jpeg',
    jpeg: 'image/jpeg',
    png : 'image/png',
    webp: 'image/webp',
    gif : 'image/gif',
    pdf : 'application/pdf',
  };
  return map[ext] || 'application/octet-stream';
}
