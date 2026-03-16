// Vercel Serverless Function - Superbet/OTG Partners API Proxy
// Keeps API key secure on server side, never exposed to browser
//
// Usage:
//   GET /api/superbet?action=affiliates
//   GET /api/superbet?action=campaigns
//   GET /api/superbet?action=results&startDate=2024-01-01&endDate=2024-01-31&groupBy=affiliate

const API_BASE = 'https://api-partners.grupootg.com/api/v1';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.OTG_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    const { action, startDate, endDate, groupBy, affiliateIds, campaignIds, page, limit } = req.query;

    let endpoint = '';
    let queryParams = '';

    switch (action) {
        case 'affiliates':
            endpoint = '/external/affiliates';
            break;

        case 'campaigns':
            endpoint = '/external/campaigns';
            break;

        case 'results':
            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'startDate and endDate are required' });
            }
            endpoint = '/external/results';
            const params = new URLSearchParams();
            params.set('startDate', startDate);
            params.set('endDate', endDate);
            if (groupBy) params.set('groupBy', groupBy);
            if (page) params.set('page', page);
            if (limit) params.set('limit', limit);
            if (affiliateIds) {
                const ids = Array.isArray(affiliateIds) ? affiliateIds : [affiliateIds];
                ids.forEach(id => params.append('affiliateIds', id));
            }
            if (campaignIds) {
                const cids = Array.isArray(campaignIds) ? campaignIds : [campaignIds];
                cids.forEach(id => params.append('campaignIds', id));
            }
            queryParams = '?' + params.toString();
            break;

        default:
            return res.status(400).json({
                error: 'Invalid action',
                validActions: ['affiliates', 'campaigns', 'results']
            });
    }

    try {
        const url = API_BASE + endpoint + queryParams;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        // Cache for 5 minutes
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
        return res.status(200).json(data);

    } catch (error) {
        console.error('[SUPERBET_API_ERROR]', error.message);
        return res.status(502).json({
            error: 'Failed to fetch from OTG API',
            message: error.message
        });
    }
}
