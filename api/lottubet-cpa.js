// Vercel Serverless Function - Manual Lottu.bet CPA Management
// Since Lottu.bet has no API, admin manually registers CPAs per affiliate
//
// GET  /api/lottubet-cpa?affiliate_id=5                 → Get CPAs for one affiliate
// GET  /api/lottubet-cpa?all=true                       → Get all CPAs (admin)
// GET  /api/lottubet-cpa?all=true&startDate=X&endDate=Y → Filtered
// POST /api/lottubet-cpa                                → Create CPA entry
// DELETE /api/lottubet-cpa?id=123                        → Delete CPA entry

const SUPABASE_URL = 'https://zaopgwnrzadisqtxrlst.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5IHTgZdNubSyGzyuKWPPUg_cxXH_KCH';

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    var headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json'
    };

    // DELETE
    if (req.method === 'DELETE') {
        var id = (req.query || {}).id;
        if (!id) return res.status(400).json({ error: 'id is required' });

        var delResp = await fetch(SUPABASE_URL + '/rest/v1/lottubet_cpas?id=eq.' + id, {
            method: 'DELETE',
            headers: headers
        });
        return res.status(delResp.ok ? 200 : 500).json({ success: delResp.ok });
    }

    // POST (Create)
    if (req.method === 'POST') {
        var body = req.body || {};
        if (!body.affiliate_id || !body.date) {
            return res.status(400).json({ error: 'affiliate_id and date are required' });
        }

        var entry = {
            affiliate_id: parseInt(body.affiliate_id),
            affiliate_name: body.affiliate_name || '',
            amount: parseFloat(body.amount) || 100,
            ftds: parseInt(body.ftds) || 1,
            registrations: parseInt(body.registrations) || 0,
            date: body.date,
            description: body.description || 'CPA Lottu.bet',
            status: body.status || 'approved'
        };

        var postResp = await fetch(SUPABASE_URL + '/rest/v1/lottubet_cpas', {
            method: 'POST',
            headers: Object.assign({}, headers, { 'Prefer': 'return=representation' }),
            body: JSON.stringify(entry)
        });

        if (!postResp.ok) {
            var errText = await postResp.text();
            console.error('[LOTTUBET_CPA_CREATE_ERROR]', errText);
            return res.status(500).json({ error: 'Failed to create CPA entry', details: errText });
        }

        var result = await postResp.json();
        return res.status(200).json(result);
    }

    // GET
    var params = req.query || {};
    var url = SUPABASE_URL + '/rest/v1/lottubet_cpas?';
    var filters = [];

    if (params.affiliate_id) {
        filters.push('affiliate_id=eq.' + params.affiliate_id);
    }

    if (params.startDate) {
        filters.push('date=gte.' + params.startDate);
    }

    if (params.endDate) {
        filters.push('date=lte.' + params.endDate);
    }

    filters.push('order=date.desc');
    filters.push('select=*');

    url += filters.join('&');

    var getResp = await fetch(url, { headers: headers });

    if (!getResp.ok) {
        return res.status(500).json({ error: 'Database error' });
    }

    var data = await getResp.json();
    return res.status(200).json(data);
}
