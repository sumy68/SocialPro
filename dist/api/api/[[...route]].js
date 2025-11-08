// src/api/api/[[...route]].ts
async function handleRequest(request) {
    const url = new URL(request.url);
    console.log('[API Route] Handling request:', request.method, url.pathname);
    try {
        // NodeNext/ESM needs explicit .js for relative imports
        const { app: honoApp } = await import('../../hono.js');
        const response = await honoApp.fetch(request);
        console.log('[API Route] Response status:', response.status);
        return response;
    }
    catch (error) {
        console.error('[API Route] Error:', error);
        return new Response(JSON.stringify({
            error: 'Internal server error',
            message: error?.message || 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
export async function GET(request) {
    return handleRequest(request);
}
export async function POST(request) {
    return handleRequest(request);
}
export async function PUT(request) {
    return handleRequest(request);
}
export async function DELETE(request) {
    return handleRequest(request);
}
export async function OPTIONS(request) {
    return handleRequest(request);
}
