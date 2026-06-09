const { findLicense } = require('./_shared/db');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { licenseKey, deviceId } = JSON.parse(event.body);
    if (!licenseKey) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ valid: false, message: '缺少授权码' })
      };
    }

    const license = await findLicense(licenseKey);
    if (!license) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ valid: false, message: '授权码不存在' })
      };
    }

    if (license.status !== 'active') {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ valid: false, message: '授权码已失效' })
      };
    }

    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ valid: false, message: '授权码已过期' })
      };
    }

    const isBound = !!license.deviceId;
    const isSameDevice = license.deviceId === deviceId;
    let canActivate = false;
    if (!isBound) canActivate = true;
    else if (isSameDevice) canActivate = true;

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        valid: true, canActivate, isBound, isSameDevice,
        license: {
          key: license.key, type: license.type, status: license.status,
          deviceId: license.deviceId, activatedAt: license.activatedAt,
          expiresAt: license.expiresAt
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ valid: false, message: '服务器错误', error: error.message })
    };
  }
};