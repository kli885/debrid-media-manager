const ALLOWED_HOSTS = [
	'app.real-debrid.com',
	'api.real-debrid.com',
	'api.alldebrid.com',
	'api.torbox.app',
];

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Credentials': 'true',
	'Access-Control-Allow-Headers': 'authorization, content-type',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

export const handler = async (event) => {
	if (event.httpMethod === 'OPTIONS') {
		return {
			statusCode: 200,
			headers: { ...CORS_HEADERS, 'Access-Control-Max-Age': '86400' },
			body: '',
		};
	}

	const urlParam = event.queryStringParameters?.url;
	if (!urlParam) {
		return { statusCode: 400, headers: CORS_HEADERS, body: 'Missing url parameter' };
	}

	let parsedUrl;
	try {
		parsedUrl = new URL(urlParam);
	} catch {
		return { statusCode: 400, headers: CORS_HEADERS, body: 'Invalid url parameter' };
	}

	if (!ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
		return { statusCode: 403, headers: CORS_HEADERS, body: 'Host not allowed' };
	}

	// Forward extra query params (except 'url')
	Object.entries(event.queryStringParameters || {}).forEach(([key, value]) => {
		if (key !== 'url') parsedUrl.searchParams.append(key, value);
	});

	const proxyHeaders = {};
	if (event.headers.authorization) proxyHeaders['authorization'] = event.headers.authorization;
	if (event.headers['content-type']) proxyHeaders['content-type'] = event.headers['content-type'];

	const hasBody = ['POST', 'PUT', 'PATCH'].includes(event.httpMethod);

	const upstream = await fetch(parsedUrl.toString(), {
		method: event.httpMethod,
		headers: proxyHeaders,
		body: hasBody ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body) : undefined,
	});

	const responseBuffer = Buffer.from(await upstream.arrayBuffer());
	const contentType = upstream.headers.get('content-type') || '';

	const responseHeaders = { ...CORS_HEADERS, 'Cache-Control': 'no-store, private' };
	if (contentType) responseHeaders['content-type'] = contentType;
	upstream.headers.forEach((value, key) => {
		if (key.startsWith('x-')) responseHeaders[key] = value;
	});

	return {
		statusCode: upstream.status,
		headers: responseHeaders,
		body: responseBuffer.toString('base64'),
		isBase64Encoded: true,
	};
};
