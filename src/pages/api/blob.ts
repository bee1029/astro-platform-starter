import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (context) => {
    const urlParams = new URL(context.url);
    const key = urlParams.searchParams.get('key');
    if (!key) {
        return new Response('Bad Request', { status: 400 });
    }

    return new Response(
        JSON.stringify({
            blob: null,
            key,
            message: 'Blob storage is not configured for the Node adapter.'
        }),
        {
            headers: { 'Content-Type': 'application/json' }
        }
    );
};
