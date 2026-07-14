// functions/api/lib/storage.js
// File Storage Abstraction (KV + R2)

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_EXT  = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ─── Upload a file to R2 (preferred) or KV (fallback) ────────────────────────

export async function uploadFile(env, file) {
  if (!file) throw new Error('No file provided');

  const originalName = file.name || 'upload';
  const ext = '.' + originalName.split('.').pop().toLowerCase();

  if (!ALLOWED_EXT.includes(ext)) {
    throw new Error(`ไฟล์ประเภท ${ext} ไม่รองรับ (รองรับ: jpg, png, webp, pdf เท่านั้น)`);
  }

  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
    throw new Error('ไฟล์มีขนาดเกิน 10MB');
  }

  const uniqueName = `bill-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const mimeType   = file.type || guessMime(ext);

  // Try R2 first
  if (env.IMAGES) {
    try {
      let uploadData = arrayBuffer;

      // Compress images (only jpg/png → webp conversion if possible)
      // Note: Full WebP conversion requires Cloudflare Image Resizing (paid)
      // For free tier: store as-is but limit dimensions via client
      await env.IMAGES.put(uniqueName, uploadData, {
        httpMetadata: { contentType: mimeType },
        customMetadata: { originalName, uploadedAt: new Date().toISOString() },
      });

      return {
        filename       : uniqueName,
        fileUrl        : `/uploads/${uniqueName}`,
        mimeType,
        fileSize       : arrayBuffer.byteLength,
        storageBackend : 'r2',
      };
    } catch (e) {
      console.error('[Storage] R2 upload failed, falling back to KV:', e.message);
    }
  }

  // Fallback: KV storage
  if (env.KV_STORE) {
    await env.KV_STORE.put(uniqueName, arrayBuffer, {
      metadata: { mimeType, originalName, filename: uniqueName },
    });
    return {
      filename       : uniqueName,
      fileUrl        : `/uploads/${uniqueName}`,
      mimeType,
      fileSize       : arrayBuffer.byteLength,
      storageBackend : 'kv',
    };
  }

  throw new Error('ไม่มี storage ที่ใช้งานได้ (R2 หรือ KV)');
}

// ─── Serve a file from R2 or KV ───────────────────────────────────────────────

export async function serveFile(env, filename) {
  // Try R2 first
  if (env.IMAGES) {
    try {
      const obj = await env.IMAGES.get(filename);
      if (obj) {
        const mime = obj.httpMetadata?.contentType || guessMime(filename);
        return new Response(obj.body, {
          headers: {
            'Content-Type' : mime,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    } catch (e) {
      console.error('[Storage] R2 get failed:', e.message);
    }
  }

  // Try KV
  if (env.KV_STORE) {
    const { value, metadata } = await env.KV_STORE.getWithMetadata(filename, { type: 'arrayBuffer' });
    if (value) {
      const mime = metadata?.mimeType || guessMime(filename);
      return new Response(value, {
        headers: {
          'Content-Type' : mime,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
  }

  return new Response('File not found', { status: 404 });
}

// ─── Delete a file ────────────────────────────────────────────────────────────

export async function deleteFile(env, filename) {
  if (!filename) return;
  const key = filename.replace('/uploads/', '').split('/').pop();

  if (env.IMAGES) {
    try { await env.IMAGES.delete(key); } catch {}
  }
  if (env.KV_STORE) {
    try { await env.KV_STORE.delete(key); } catch {}
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function guessMime(filename) {
  const ext = String(filename).split('.').pop().toLowerCase();
  const map = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf' };
  return map[ext] || 'application/octet-stream';
}
