// Vercel Serverless Function - URL Shortener
//
// POST /api/l  → Create short link (body: { affiliate_id, house, url })
// GET  /api/l?c=CODE → Redirect using short code
//
const SUPABASE_URL = 'https://zaopgwnrzadisqtxrlst.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5IHTgZdNubSyGzyuKWPPUg_cxXH_KCH';

const HOUSE_IDS = {
    'superbet': '1',
    'sportingbet': '2',
    'estrelabet': '3',
    'vupi': '4'
};

function extractUrl(text) {
    if (!text) return text;
    var matches = text.match(/https?:\/\/[^\s]+/g);
    if (matches && matches.length > 0) return matches[matches.length - 1];
    return text;
}

function generateCode(len) {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    var code = '';
    for (var i = 0; i < len; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

module.exports = async function handler(req, res) {
    // ─── CREATE SHORT LINK ───
    if (req.method === 'POST') {
        try {
            var body = req.body || {};
            var affiliateId = body.affiliate_id;
            var house = body.house;
            var url = body.url;

            if (!affiliateId || !house || !url) {
                return res.status(400).json({ error: 'affiliate_id, house, and url are required' });
            }

            // Extract URL if user pasted share message text
            url = extractUrl(url);

            // Generate unique code (try up to 5 times)
            var code = '';
            for (var attempt = 0; attempt < 5; attempt++) {
                code = generateCode(6);
                // Check if code exists
                var checkResp = await fetch(SUPABASE_URL + '/rest/v1/short_links?code=eq.' + code + '&select=id', {
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
                });
                var existing = await checkResp.json();
                if (!existing || existing.length === 0) break;
                code = '';
            }

            if (!code) {
                return res.status(500).json({ error: 'Failed to generate unique code' });
            }

            // Insert into Supabase
            var insertResp = await fetch(SUPABASE_URL + '/rest/v1/short_links', {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    code: code,
                    affiliate_id: parseInt(affiliateId),
                    house: house,
                    url: url
                })
            });

            if (!insertResp.ok) {
                var errText = await insertResp.text();
                console.error('[SHORT_INSERT_ERROR]', errText);
                return res.status(500).json({ error: 'Failed to create short link' });
            }

            var result = await insertResp.json();
            return res.status(200).json({
                code: code,
                short_url: 'https://fenixafiliados.com/api/l?c=' + code
            });
        } catch (e) {
            console.error('[SHORT_CREATE_ERROR]', e.message);
            return res.status(500).json({ error: e.message });
        }
    }

    // ─── RESOLVE SHORT LINK ───
    var code = (req.query || {}).c || '';
    if (!code) {
        return res.status(400).json({ error: 'Missing code parameter' });
    }

    // Look up short link
    var lookupResp = await fetch(SUPABASE_URL + '/rest/v1/short_links?code=eq.' + code + '&select=affiliate_id,house,url', {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
    });

    if (!lookupResp.ok) {
        return res.status(500).json({ error: 'Database error' });
    }

    var links = await lookupResp.json();
    if (!links || links.length === 0) {
        return res.status(404).json({ error: 'Link not found' });
    }

    var link = links[0];
    var affiliateId = link.affiliate_id;
    var house = link.house;
    var destinationUrl = extractUrl(link.url);

    // Auto-fix protocol
    if (destinationUrl && !destinationUrl.startsWith('http')) {
        destinationUrl = 'https://' + destinationUrl.replace(/^[htps:\/]+/, '');
    }

    // Log the click
    console.log('[CLICK_SHORT]', JSON.stringify({
        type: 'CLICK',
        code: code,
        affiliate_id: affiliateId,
        house: house,
        destination: destinationUrl,
        ip: req.headers['x-forwarded-for'] || '',
        user_agent: req.headers['user-agent'] || '',
        country: req.headers['x-vercel-ip-country'] || ''
    }));

    // Fetch affiliate's registration link
    var registrationLink = '';
    try {
        var houseId = HOUSE_IDS[house] || '1';
        var supaResp = await fetch(SUPABASE_URL + '/rest/v1/users?id=eq.' + affiliateId + '&select=house_links', {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
        });

        if (supaResp.ok) {
            var data = await supaResp.json();
            if (data && data[0] && data[0].house_links) {
                registrationLink = data[0].house_links[houseId] || '';
            }
        }
    } catch (e) {
        console.error('[SHORT_SUPABASE_ERROR]', e.message);
    }

    // Auto-fix registration link protocol
    if (registrationLink && !registrationLink.startsWith('http')) {
        registrationLink = 'https://' + registrationLink.replace(/^[htps:\/]+/, '');
    }

    // Direct redirect if destination = registration link
    if (!registrationLink || registrationLink === destinationUrl) {
        res.setHeader('Location', destinationUrl);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.status(302).end();
    }

    // Intermediate page with iframe tracking
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redirecionando...</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0a0a0a;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .loader { text-align: center; }
        .spinner {
            width: 40px; height: 40px;
            border: 3px solid rgba(232, 89, 12, 0.2);
            border-top-color: #E8590C;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 16px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        p { font-size: 14px; color: #888; }
    </style>
</head>
<body>
    <div class="loader">
        <div class="spinner"></div>
        <p>Redirecionando...</p>
    </div>
    <iframe src="${registrationLink}" style="display:none;width:0;height:0;border:none;" sandbox="allow-same-origin allow-scripts allow-popups allow-forms"></iframe>
    <script>
        setTimeout(function() {
            window.location.href = "${destinationUrl}";
        }, 1500);
    </script>
</body>
</html>`);
}
