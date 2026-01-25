export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const objectKey = url.pathname.slice(1); // Remove leading slash

    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*', // Or specify your domain
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Only allow GET for assets
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Fetch from R2
    const object = await env.MY_BUCKET.get(objectKey);
    if (!object) {
      return new Response('Not Found', { status: 404 });
    }

    // Create response with CORS headers
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Access-Control-Allow-Origin', '*'); // Or your domain
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    headers.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache

    return new Response(object.body, { headers });
  },
};