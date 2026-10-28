import { json } from '../lib/common.js';
export default function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Użyj GET' });
  return json(res, 200, {
    service: 'Prawdziwe Śledztwo',
    interviewConfigured: Boolean(process.env.ZAI_API_KEY),
    evaluationConfigured: Boolean(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID),
  });
}
