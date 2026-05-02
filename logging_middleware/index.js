require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

const LOG_API_URL = 'http://20.207.122.201/evaluation-service/logs';
const MAX_RETRIES = 3;
const RETRY_DELAY = 300;

const VALID_STACKS   = ['backend', 'frontend'];
const VALID_LEVELS   = ['debug', 'info', 'warn', 'error', 'fatal'];
const VALID_PACKAGES = [
  'cache', 'controller', 'cron_job', 'db', 'domain',
  'handler', 'repository', 'route', 'service',
  'auth', 'config', 'middleware', 'utils'
];

function validate(stack, level, pkg) {
  const errors = [];
  if (!VALID_STACKS.includes(stack))    errors.push(`Invalid stack "${stack}". Valid: ${VALID_STACKS.join(', ')}`);
  if (!VALID_LEVELS.includes(level))    errors.push(`Invalid level "${level}". Valid: ${VALID_LEVELS.join(', ')}`);
  if (!VALID_PACKAGES.includes(pkg))    errors.push(`Invalid package "${pkg}". Valid: ${VALID_PACKAGES.join(', ')}`);
  return errors;
}

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function sendWithRetry(payload, attempt = 1) {
  try {
    const token = process.env.TOKEN;
    if (!token) throw new Error('TOKEN not set in environment. Run: export TOKEN=<your_token>');

    const response = await axios.post(LOG_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 8000
    });

    return { ok: true, data: response.data };
  } catch (err) {
    const isRetryable = !err.response || err.response.status >= 500;
    if (isRetryable && attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY * attempt);
      return sendWithRetry(payload, attempt + 1);
    }
    return {
      ok: false,
      attempts: attempt,
      error: err.response?.data || err.message
    };
  }
}

async function Log(stack, level, packageName, message) {
  const s   = String(stack).toLowerCase();
  const l   = String(level).toLowerCase();
  const pkg = String(packageName).toLowerCase();

  const errors = validate(s, l, pkg);
  if (errors.length) {
    console.error('[Logger] Validation failed:', errors.join(' | '));
    return { ok: false, errors };
  }

  const payload = {
    stack: s,
    level: l,
    package: pkg,
    message: String(message),
    timestamp: new Date().toISOString()
  };

  const result = await sendWithRetry(payload);

  if (result.ok) {
    console.log('Log success:', result.data);
  } else {
    console.error(`Log failed (${result.attempts} attempt(s)):`, result.error);
  }

  return result;
}

module.exports = Log;

// Demo calls — runs when executed directly
if (require.main === module) {
  (async () => {
    await Log('backend', 'info',  'route',      'User API called');
    await Log('backend', 'debug', 'controller', 'Processing user request');
    await Log('backend', 'error', 'handler',    'Received string, expected bool');
    await Log('backend', 'fatal', 'db',         'Critical database connection failure');
  })();
}
