export async function postJSON(url: string, body: any) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });
  
    const contentType = res.headers.get('content-type');
    const raw = await res.text();
  
    console.log('[POST]', url, res.status, contentType);
    console.log('[POST body]', raw);
  
    try {
      return { ok: res.ok, data: JSON.parse(raw) };
    } catch {
      return { ok: res.ok, data: raw };
    }
  }
  