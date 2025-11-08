async function handleRequest(request: Request) {
  const url = new URL(request.url);
  console.log('[API Route] Handling request:', request.method, url.pathname);
  
  try {
    const { app: honoApp } = await import('../../hono');
    const response = await honoApp.fetch(request);
    console.log('[API Route] Response status:', response.status);
    return response;
  } catch (error: any) {
    console.error('[API Route] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}

export async function PUT(request: Request) {
  return handleRequest(request);
}

export async function DELETE(request: Request) {
  return handleRequest(request);
}

export async function OPTIONS(request: Request) {
  return handleRequest(request);
}
