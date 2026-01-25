export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const objectKey = url.pathname.slice(1);

    // 1. Enterprise CORS: Allow specific origins or * for public, but handle it explicitly
    // This allows you to block bandwidth theft from other sites
    const allowedOrigins = ['https://your-app.com', 'http://localhost:3000'];
    const origin = request.headers.get('Origin');
    const allowOrigin = allowedOrigins.includes(origin) ? origin : '*'; 

    const corsHeaders = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
      'Access-Control-Max-Age': '86400',
    };

    // Handle Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 });
    }

    // 2. Optimization: Check if browser already has the file (Conditional GET)
    // We can't know the ETag without asking R2, but we can do a cheap "HEAD" request first
    // OR just fetch it and let R2 handle the conditional logic (cheaper/faster in one go)
    
    // 3. Range Request Support (Critical for video/audio)
    const range = request.headers.get('range');
    
    try {
      // Pass the Range header and Conditional headers (If-None-Match) directly to R2
      const object = await env.MY_BUCKET.get(objectKey, {
        range: request.headers.get('range'),
        onlyIf: request.headers, // This passes If-Match / If-None-Match to R2 automatically
      });

      if (!object) {
        return new Response('Not Found', { status: 404 });
      }

      // R2 "onlyIf" check failed (e.g. file hasn't changed), return 304
      if (object.status === 304) {
        return new Response(null, {
          status: 304,
          headers: { ...corsHeaders, 'ETag': object.etag }
        });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.etag); // IMPORTANT: R2 doesn't set this by default
      
      // Merge CORS headers
      Object.keys(corsHeaders).forEach(key => headers.set(key, corsHeaders[key]));

      // Set explicit cache for CDN and Browser
      // public = allow CDN to cache. immutable = file never changes (if true)
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');

      // 4. Handle Partial Content (206) vs Full Content (200)
      const status = object.range ? 206 : 200;
      if (object.range) {
        headers.set('Content-Range', `bytes ${object.range.offset}-${object.range.end}/${object.size}`);
        headers.set('Content-Length', object.range.length);
      }

      return new Response(object.body, {
        headers,
        status
      });

    } catch (e) {
      return new Response('Error fetching object', { status: 500 });
    }
  },
};