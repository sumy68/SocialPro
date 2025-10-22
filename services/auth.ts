import { postJSON } from '../util/debugFetch'; // Pfad ggf. anpassen

const result = await postJSON(`${BACKEND_URL}/oauth/token`, tokenPayload);
console.log('[OAuth][debug] result:', result);
