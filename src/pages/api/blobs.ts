import type { APIRoute } from 'astro';
import { uploadDisabled } from '../../utils';

export const prerender = false;
const shapes = new Map<string, unknown>();

export const POST: APIRoute = async ({ request }) => {
    if (uploadDisabled) throw new Error('Sorry, uploads are disabled');

    const parameters = await request.json();
    const key = parameters.name;
    shapes.set(key, parameters);
    return new Response(
        JSON.stringify({
            message: `Stored shape "${key}"`
        }),
        {
            headers: { 'Content-Type': 'application/json' }
        }
    );
};

export const GET: APIRoute = async ({ request }) => {
    try {
        const keys = Array.from(shapes.keys());
        return new Response(
            JSON.stringify({
                keys
            }),
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (e) {
        console.error(e);
        return new Response(
            JSON.stringify({
                keys: [],
                error: 'Failed listing blobs'
            }),
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};
