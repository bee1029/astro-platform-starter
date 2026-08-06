import type { APIRoute } from 'astro';
import { google } from 'googleapis';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const { name, item, quantity } = await request.json();
        if (!name || !item || !quantity) {
            return new Response('Bad Request', { status: 400 });
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        const authClient = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: authClient });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID as string;
        const values = [[new Date().toISOString(), name, item, quantity]];
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Orders!A:D',
            valueInputOption: 'RAW',
            requestBody: {
                values
            }
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        console.error(e);
        return new Response('Internal Server Error', { status: 500 });
    }
};
