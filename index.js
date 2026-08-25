const { handler: httpHandler } = require('./src/handler');

function parseBody(event) {
	if (!event.body) {
		return {};
	}

	try {
		const content = event.isBase64Encoded
			? Buffer.from(event.body, 'base64').toString('utf8')
			: event.body;
		return JSON.parse(content);
	} catch {
		return {};
	}
}

async function handler(event = {}) {
	const requestContext = event.requestContext || {};
	const http = requestContext.http || {};
	const response = {
		statusCode: 200,
		headers: {},
		body: '',
		status(code) {
			this.statusCode = code;
			return this;
		},
		setHeader(name, value) {
			this.headers[name] = value;
			return this;
		},
		json(payload) {
			this.body = JSON.stringify(payload);
			return this;
		},
		send(payload) {
			this.body = payload;
			return this;
		}
	};

	httpHandler({
		method: event.requestContext ? (http.method || event.httpMethod || 'GET') : (event.httpMethod || 'GET'),
		url: event.rawPath || event.path || '/',
		headers: event.headers || {},
		query: event.queryStringParameters || {},
		body: parseBody(event)
	}, response);

	return {
		statusCode: response.statusCode,
		headers: response.headers,
		body: response.body
	};
}

module.exports = { handler };
