// Vercel Serverless Function - VUPI Data Management
//
// GET  /api/vupi?affiliate_id=5           → Get data for one affiliate
// GET  /api/vupi?all=true                 → Get all data (admin)
// GET  /api/vupi?totals=true              → Get totals per affiliate
// POST /api/vupi                          → Create entry
// DELETE /api/vupi?id=123                 → Delete entry

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
        var delResp = await fetch(SUPABASE_URL + '/rest/v1/vupi_data?id=eq.' + id, {
            method: 'DELETE', headers: headers
        });
        return res.status(delResp.ok ? 200 : 500).json({ success: delResp.ok });
    }

    // POST
    if (req.method === 'POST') {
        var body = req.body || {};
        if (!body.affiliate_id || !body.date) {
            return res.status(400).json({ error: 'affiliate_id and date are required' });
        }
        var entry = {
            affiliate_id: parseInt(body.affiliate_id),
            affiliate_name: body.affiliate_name || '',
            vupi_username: body.vupi_username || '',
            date: body.date,
            visitas: parseInt(body.visitas) || 0,
            registros: parseInt(body.registros) || 0,
            ftds: parseInt(body.ftds) || 0,
            ftds_amount: parseFloat(body.ftds_amount) || 0,
            qftds: parseInt(body.qftds) || 0,
            depositos: parseInt(body.depositos) || 0,
            deposito_amount: parseFloat(body.deposito_amount) || 0,
            ggr: parseFloat(body.ggr) || 0,
            ngr: parseFloat(body.ngr) || 0,
            cpa: parseFloat(body.cpa) || 0,
            revshare: parseFloat(body.revshare) || 0
        };
        var postResp = await fetch(SUPABASE_URL + '/rest/v1/vupi_data', {
            method: 'POST',
            headers: Object.assign({}, headers, { 'Prefer': 'return=representation' }),
            body: JSON.stringify(entry)
        });
        if (!postResp.ok) return res.status(500).json({ error: 'Failed to create' });
        var result = await postResp.json();
        return res.status(200).json(result);
    }

    // GET
    var params = req.query || {};
    var url = SUPABASE_URL + '/rest/v1/vupi_data?select=*&order=date.desc';

    if (params.affiliate_id) {
        url += '&affiliate_id=eq.' + params.affiliate_id;
    }
    if (params.startDate) {
        url += '&date=gte.' + params.startDate;
    }
    if (params.endDate) {
        url += '&date=lte.' + params.endDate;
    }

    var getResp = await fetch(url, { headers: headers });
    if (!getResp.ok) return res.status(500).json({ error: 'Database error' });
    var data = await getResp.json();

    // If requesting totals per affiliate
    if (params.totals === 'true') {
        var totals = {};
        data.forEach(function(r) {
            var key = r.affiliate_id;
            if (!totals[key]) {
                totals[key] = {
                    affiliate_id: r.affiliate_id,
                    affiliate_name: r.affiliate_name,
                    vupi_username: r.vupi_username,
                    visitas: 0, registros: 0, ftds: 0, ftds_amount: 0,
                    qftds: 0, depositos: 0, deposito_amount: 0,
                    ggr: 0, ngr: 0, cpa: 0, revshare: 0
                };
            }
            var t = totals[key];
            t.visitas += (r.visitas || 0);
            t.registros += (r.registros || 0);
            t.ftds += (r.ftds || 0);
            t.ftds_amount += parseFloat(r.ftds_amount || 0);
            t.qftds += (r.qftds || 0);
            t.depositos += (r.depositos || 0);
            t.deposito_amount += parseFloat(r.deposito_amount || 0);
            t.ggr += parseFloat(r.ggr || 0);
            t.ngr += parseFloat(r.ngr || 0);
            t.cpa += parseFloat(r.cpa || 0);
            t.revshare += parseFloat(r.revshare || 0);
        });
        return res.status(200).json(Object.values(totals));
    }

    return res.status(200).json(data);
};
