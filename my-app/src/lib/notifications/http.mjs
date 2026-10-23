import { NotificationError } from './service.mjs';

const notificationActions = new Set([
  'registerNotificationDevice',
  'unregisterNotificationDevice',
  'notificationCenter',
  'queueAnnouncement',
]);
const statuses = {
  unauthenticated: 401,
  'permission-denied': 403,
  'invalid-argument': 400,
  'not-found': 404,
  unavailable: 503,
};

export function createNotificationHandler({
  verifyToken,
  service,
  schedule,
  enabled,
  origins,
  actions = notificationActions,
}) {
  return async function handle(request) {
    const origin = request.headers.get('origin');
    const headers = { 'Cache-Control': 'no-store', Vary: 'Origin' };
    if (origin && !origins.includes(origin))
      return Response.json(
        { error: { code: 'permission-denied', message: 'Origin not allowed.' } },
        { status: 403, headers },
      );
    if (origin) headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
    const reply = (value, status = 200) =>
      Response.json(value, { status, headers });
    if (request.method === 'OPTIONS')
      return new Response(null, { status: 204, headers });
    if (request.method !== 'POST')
      return reply({ error: { code: 'invalid-argument', message: 'Use POST.' } }, 405);
    try {
      const bearer = request.headers
        .get('authorization')
        ?.match(/^Bearer (\S+)$/i)?.[1];
      if (!bearer)
        throw new NotificationError(
          'unauthenticated',
          'Sign in to connect notifications.',
        );
      let token;
      try {
        token = await verifyToken(bearer);
      } catch {
        throw new NotificationError(
          'unauthenticated',
          'Your session expired. Sign in again.',
        );
      }
      if (token.email_verified !== true)
        throw new NotificationError(
          'permission-denied',
          'Verify your email before connecting notifications.',
        );
      if (Number(request.headers.get('content-length')) > 16384)
        return reply({ error: { code: 'invalid-argument', message: 'Request too large.' } }, 413);
      const raw = await request.text();
      if (new TextEncoder().encode(raw).length > 16384)
        return reply({ error: { code: 'invalid-argument', message: 'Request too large.' } }, 413);
      let input;
      try {
        input = JSON.parse(raw);
      } catch {
        throw new NotificationError(
          'invalid-argument',
          'Invalid JSON request.',
        );
      }
      if (
        !input ||
        !actions.has(input.action) ||
        !input.data ||
        typeof input.data !== 'object' ||
        Array.isArray(input.data)
      ) {
        throw new NotificationError(
          'invalid-argument',
          'Invalid notification request.',
        );
      }
      if (!enabled() && input.action !== 'unregisterNotificationDevice')
        return reply(
          {
            error: {
              code: 'unavailable',
              message:
                'Notifications are not activated yet. Please try again later.',
            },
          },
          503,
        );
      const api = service();
      const result = await api[input.action]({
        auth: { uid: token.uid, token },
        data: input.data,
      });
      if (enabled()) schedule(() =>
        api.drain(input.action === 'queueAnnouncement' ? result.id : undefined),
      );
      return reply({ data: result });
    } catch (error) {
      if (error instanceof NotificationError)
        return reply(
          { error: { code: error.code, message: error.message } },
          statuses[error.code] || 400,
        );
      // Do not expose credentials, Firestore internals or notification tokens.
      console.error(
        'Notification request failed',
        error?.code || error?.name || 'UnknownError',
      );
      return reply(
        {
          error: {
            code: 'internal',
            message: 'Could not connect notifications. Please try again.',
          },
        },
        500,
      );
    }
  };
}
