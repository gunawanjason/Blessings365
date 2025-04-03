// api/collect.js - Vercel Serverless Function
const axios = require('axios');
const crypto = require('crypto');
const cookieParser = require('cookie-parser'); // Vercel might need this explicitly

// --- Configuration ---
const GA_API_SECRET = process.env.GA_API_SECRET; // Read from Vercel Environment Variables
const GA_MEASUREMENT_PROTOCOL_URL = 'https://www.google-analytics.com/mp/collect';
// --- End Configuration ---

// Helper function to parse cookies if cookie-parser middleware isn't automatically run
// (Vercel might run middleware based on framework detection, but manual parsing is safer)
const parseCookies = (req) => {
  const list = {};
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(`;`).forEach(function(cookie) {
    let [ name, ...rest] = cookie.split(`=`);
    name = name?.trim();
    if (!name) return;
    const value = rest.join(`=`).trim();
    if (!value) return;
    list[name] = decodeURIComponent(value);
  });

  return list;
};


// Export the serverless function handler
export default async function handler(req, res) {
    // Ensure this only handles POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // Manually parse JSON body if Vercel doesn't do it automatically
    // Vercel usually does, but this is a fallback.
    let body;
    if (typeof req.body === 'string') {
        try {
            body = JSON.parse(req.body);
        } catch (e) {
            return res.status(400).send('Bad Request: Invalid JSON');
        }
    } else {
        body = req.body; // Assume Vercel parsed it
    }

    const { measurementId, args } = body;
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress; // Get user IP address (Vercel specific header)
    const userAgent = req.headers['user-agent']; // Get user agent
    const cookies = parseCookies(req); // Parse cookies manually

    if (!measurementId || !args || !GA_API_SECRET) {
        console.error('Missing measurementId, args, or GA_API_SECRET env var.');
        return res.status(400).send('Bad Request: Missing data or server configuration.');
    }

    // --- Construct GA4 Measurement Protocol Payload ---
    let clientId = cookies?.ga_client_id;
    let clientIdGenerated = false;
    if (!clientId) {
        clientId = crypto.randomUUID();
        clientIdGenerated = true;
    }

    let sessionId = cookies?.ga_session_id;
    let sessionIdGenerated = false;
    // Simple session check: if no session cookie, start a new one
    if (!sessionId) {
        sessionId = Date.now().toString();
        sessionIdGenerated = true;
    }

    let eventName = 'page_view';
    let eventParams = {};

    if (args[0] === 'config') {
        eventName = 'page_view';
        eventParams = { 'engagement_time_msec': '1' };
    } else if (args[0] === 'event') {
        eventName = args[1];
        if (args[2] && typeof args[2] === 'object') {
            eventParams = args[2];
        }
        if (!eventParams.engagement_time_msec) {
             eventParams.engagement_time_msec = '1';
        }
    } else {
        console.warn('Unhandled gtag command:', args[0]);
        return res.status(200).send('OK (Unhandled Command)');
    }

    const payload = {
        client_id: clientId,
        non_personalized_ads: false,
        events: [{
            name: eventName,
            params: {
                ...eventParams,
                'session_id': sessionId,
                'debug_mode': false
            },
        }],
    };

    console.log('Sending to GA:', JSON.stringify(payload, null, 2));

    try {
        const response = await axios.post(
            `${GA_MEASUREMENT_PROTOCOL_URL}?measurement_id=${measurementId}&api_secret=${GA_API_SECRET}`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': userAgent
                }
            }
        );

        if (response.status === 204) {
            console.log('GA Event sent successfully.');
            // Set cookies using Set-Cookie header
            const cookieOptions = {
                httpOnly: true,
                path: '/',
                sameSite: 'Lax',
                secure: process.env.NODE_ENV === 'production', // Use secure flag in production
            };

            const cookiesToSet = [];
            if (clientIdGenerated || !cookies?.ga_client_id) {
                 cookiesToSet.push(`ga_client_id=${clientId}; Max-Age=${2 * 365 * 24 * 60 * 60}; ${Object.entries(cookieOptions).map(([k,v]) => v === true ? k : `${k}=${v}`).join('; ')}`);
            }
             if (sessionIdGenerated || !cookies?.ga_session_id) {
                 cookiesToSet.push(`ga_session_id=${sessionId}; Max-Age=${30 * 60}; ${Object.entries(cookieOptions).map(([k,v]) => v === true ? k : `${k}=${v}`).join('; ')}`);
            }

            if (cookiesToSet.length > 0) {
                res.setHeader('Set-Cookie', cookiesToSet);
            }

            res.status(200).send('OK');
        } else {
            console.error('Error sending GA Event:', response.status, response.data);
            res.status(response.status).send('Error forwarding event to GA.');
        }
    } catch (error) {
        console.error('Error sending GA Event:', error.response ? `${error.response.status} ${JSON.stringify(error.response.data)}` : error.message);
        res.status(500).send('Internal Server Error');
    }
}