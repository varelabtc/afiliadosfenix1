// Vercel Serverless Function - Link Redirect / Click Tracker
//
// URL format:
// /api/go?a=AFFILIATE_ID&h=HOUSE_SLUG&url=BASE64_ENCODED_URL
//
// Flow:
// 1. Affiliate shares: https://afiliadosfenix1.vercel.app/api/go?a=123&h=superbet&url=aHR0cHM6Ly...
// 2. User clicks -> this function logs the click and redirects (302) to the real house link
// 3. Admin can see clicks in Vercel logs

export default function handler(req, res) {
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

    // Redirect to the real house link
    res.setHeader('Location', destinationUrl);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(302).end();
}
