// Vercel Serverless Function - Link Redirect / Click Tracker
//
// URL format:
// /api/go?a=AFFILIATE_ID&h=HOUSE_SLUG&url=BASE64_ENCODED_URL
//
// Flow:
// 1. Affiliate shares tracking link
// 2. User clicks -> this function:
//    a. Looks up the affiliate's registration link from Supabase
//    b. Serves a page that loads the registration link (sets tracking cookie)
//    c. Then redirects to the actual destination URL
// 3. The betting house now attributes the user to the affiliate

const SUPABASE_URL = 'https://zaopgwnrzadisqtxrlst.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5IHTgZdNubSyGzyuKWPPUg_cxXH_KCH';

// Map house slugs to bettingHouses IDs
const HOUSE_IDS = {
    'superbet': '1',
    'sportingbet': '2'
};

module.exports = async function handler(req, res) {
    const params = req.query || {};

    const affiliateId = params.a || params.aff || '';
    const house = params.h || params.house || '';
    const encodedUrl = params.url || '';
    const subId = params.sub || params.subid || '';

    // Decode the destination URL
    let destinationUrl = '';
    try {
        destinationUrl = Buffer.from(encodedUrl, 'base64').toString('utf-8');
    } catch (e) {
        destinationUrl = '';
    }

    // Validate
    if (!destinationUrl || !destinationUrl.startsWith('http')) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid or missing link'
        });
    }

    // Log the click
    const logEntry = {
        type: 'CLICK',
        timestamp: new Date().toISOString(),
        affiliate_id: affiliateId,
        house: house,
        subid: subId,
        destination: destinationUrl,
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
        user_agent: req.headers['user-agent'] || '',
        referer: req.headers['referer'] || '',
        country: req.headers['x-vercel-ip-country'] || '',
        city: req.headers['x-vercel-ip-city'] || ''
    };

    console.log('[CLICK]', JSON.stringify(logEntry));

    // Fetch affiliate's registration link from Supabase
    let registrationLink = '';
    try {
        const houseId = HOUSE_IDS[house] || '1';
        const supabaseUrl = SUPABASE_URL + '/rest/v1/users?id=eq.' + affiliateId + '&select=house_links';
        const response = await fetch(supabaseUrl, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data && data[0] && data[0].house_links) {
                registrationLink = data[0].house_links[houseId] || '';
            }
        }
    } catch (e) {
        console.error('[GO_SUPABASE_ERROR]', e.message);
    }

    // If destination is already the registration link, just redirect
    if (!registrationLink || registrationLink === destinationUrl) {
        res.setHeader('Location', destinationUrl);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.status(302).end();
    }

    // Serve intermediate page that:
    // 1. Loads registration link in hidden iframe (sets affiliate tracking cookie)
    // 2. After short delay, redirects to the actual destination
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
        .loader {
            text-align: center;
        }
        .spinner {
            width: 40px;
            height: 40px;
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
