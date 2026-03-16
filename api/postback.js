// Vercel Serverless Function - Postback Endpoint
// Receives conversion events from betting houses
//
// URL format:
// /api/postback?affiliate_id=123&house=superbet&event=registration&subid=abc123&payout=150
//
// Parameters:
// - affiliate_id: ID do afiliado no sistema
// - house: slug da casa (superbet, sportingbet)
// - event: tipo de evento (registration, ftd, deposit, qualification)
// - subid: sub ID para tracking
// - payout: valor do CPA (opcional, usa o padrão se não informado)
// - click_id: ID do clique (opcional)
// - player_id: ID do jogador na casa (opcional)

export default function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

    const params = req.query || {};

    const affiliateId = params.affiliate_id || params.aff_id || params.uid;
    const house = params.house || params.brand || params.operator;
    const event = params.event || params.type || params.action || 'conversion';
    const subId = params.subid || params.sub_id || params.clickid || '';
    const payout = params.payout || params.amount || params.commission || '';
    const playerId = params.player_id || params.playerid || '';
    const clickId = params.click_id || params.clickid || '';

    // Log the postback
    const logEntry = {
        timestamp: new Date().toISOString(),
        affiliate_id: affiliateId,
        house: house,
        event: event,
        subid: subId,
        payout: payout,
        player_id: playerId,
        click_id: clickId,
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
        user_agent: req.headers['user-agent'] || '',
        raw_query: req.url
    };

    console.log('[POSTBACK]', JSON.stringify(logEntry));

    // Validate required fields
    if (!affiliateId) {
        return res.status(400).json({
            status: 'error',
            message: 'affiliate_id is required',
            received: params
        });
    }

    // Return success
    return res.status(200).json({
        status: 'ok',
        message: 'Postback received',
        data: logEntry
    });
}
