import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    const { tags } = await request.json();

    if (!Array.isArray(tags)) {
        return new Response(`Bad Request: expected tags attribute with array of strings in the body, got ${typeof tags}`, { status: 400 });
    }

    return new Response(
        JSON.stringify({
            success: true,
            invalidated: tags
        }),
        {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }
    );
};
