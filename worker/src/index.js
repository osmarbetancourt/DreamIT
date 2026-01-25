export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const key = url.pathname.slice(1); // Remove leading slash to get the R2 key

      // Only allow GET requests
      if (request.method !== 'GET') {
        return new Response('Method not allowed', {
          status: 405,
          headers: { 'Allow': 'GET' }
        });
      }

      // Handle CORS preflight (OPTIONS)
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type, Range',
            'Access-Control-Max-Age': '86400' // Cache preflight for 24 hours
          }
        });
      }

      // Fetch object from R2 with conditional and range options
      const getOptions = {};

      // Conditional GET: Check If-None-Match header
      const ifNoneMatch = request.headers.get('If-None-Match');
      if (ifNoneMatch) {
        getOptions.onlyIf = { etagMatches: ifNoneMatch.replace(/"/g, '') }; // Remove quotes if present
      }

      // Range requests: Parse Range header (e.g., "bytes=0-1023")
      const rangeHeader = request.headers.get('Range');
      if (rangeHeader) {
        const rangeMatch = rangeHeader.match(/^bytes=(\d+)-(\d*)$/);
        if (rangeMatch) {
          const start = parseInt(rangeMatch[1], 10);
          const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : undefined;
          if (end !== undefined) {
            getOptions.range = { offset: start, length: end - start + 1 };
          } else {
            getOptions.range = { offset: start };
          }
        }
      }

      const object = await env.MY_BUCKET.get(key, getOptions);

      // Handle 404 if object not found
      if (!object) {
        return new Response('Not Found', {
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=300' // Short cache for 404s
          }
        });
      }

      // If conditional GET matches, return 304 Not Modified
      if (object.body === undefined) { // R2 sets body to undefined on conditional match
        return new Response(null, {
          status: 304,
          headers: {
            'ETag': object.httpEtag,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600' // 1 hour cache
          }
        });
      }

      // Build response headers
      const headers = new Headers();

      // CORS headers
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Range');

      // Caching: Set Cache-Control based on content type (e.g., longer for images/models)
      const isStaticAsset = /\.(jpg|jpeg|png|gif|webp|glb|gltf|obj|mp4|webm)$/i.test(key);
      headers.set('Cache-Control', isStaticAsset ? 'public, max-age=31536000' : 'public, max-age=31536000'); // 1 year for assets, 1h for others

      // ETag for conditional requests
      headers.set('ETag', object.httpEtag);

      // Content-Type and other metadata
      object.writeHttpMetadata(headers); // Applies contentType, etc.

      // Handle partial content for range requests
      if (rangeHeader && object.range) {
        headers.set('Content-Range', `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.size}`);
        return new Response(object.body, {
          status: 206, // Partial Content
          headers
        });
      }

      return new Response(object.body, { headers });
    } catch (error) {
      // Error handling: Log and return 500
      console.error('Worker error:', error);
      return new Response('Internal Server Error', {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        }
      });
    }
  }
};