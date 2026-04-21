// Vercel Serverless Function - Promotional Links Management
// Admin can add custom promotional links per house that affiliates will see
//
// GET    /api/promo-links?house=superbet   → list links for a house
// GET    /api/promo-links                  → list all links
// POST   /api/promo-links                  → create link { house, name, url }
// DELETE /api/promo-links?id=123           → delete a link

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

        var delResp = await fetch(SUPABASE_URL + '/rest/v1/promo_links?id=eq.' + id, {
            method: 'DELETE',
            headers: headers
        });
        return res.status(delResp.ok ? 200 : 500).json({ success: delResp.ok });
    }

    // POST
    if (req.method === 'POST') {
        var body = req.body || {};
        if (!body.house || !body.name || !body.url) {
            return res.status(400).json({ error: 'house, name and url are required' });
        }

        var entry = {
            house_slug: body.house,
            name: body.name,
            url: body.url
        };

        var postResp = await fetch(SUPABASE_URL + '/rest/v1/promo_links', {
            method: 'POST',
            headers: Object.assign({}, headers, { 'Prefer': 'return=representation' }),
            body: JSON.stringify(entry)
        });

        if (!postResp.ok) {
            var errText = await postResp.text();
            return res.status(500).json({ error: 'Failed to create promo link', details: errText });
        }

        var result = await postResp.json();
        return res.status(200).json(result);
    }

    // GET
    var params = req.query || {};
    var url = SUPABASE_URL + '/rest/v1/promo_links?';
    var filters = [];

    if (params.house) {
        filters.push('house_slug=eq.' + encodeURIComponent(params.house));
    }

    filters.push('order=created_at.desc');
    filters.push('select=*');
    url += filters.join('&');

    var getResp = await fetch(url, { headers: headers });

    if (!getResp.ok) {
        return res.status(500).json({ error: 'Database error' });
    }

    var data = await getResp.json();
    return res.status(200).json(data);
}
