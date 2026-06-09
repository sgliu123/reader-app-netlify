const { findLicense, updateLicense } = require('./_shared/db');

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
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { licenseKey, deviceId } = JSON.parse(event.body);
    if (!licenseKey || !deviceId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, message: '缺少授权码或设备ID' })
      };
    }

    const license = await findLicense(licenseKey);
    if (!license) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, message: '授权码不存在' })
      };
    }

    if (license.deviceId && license.deviceId !== deviceId) {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: false, message: '授权码已被其他设备绑定',
          boundDevice: license.deviceId
        })
      };
    }

    const days = parseInt(license.type) || 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const updated = await updateLicense(licenseKey, {
      deviceId, activatedAt: new Date().toISOString(),
      expiresAt, status: 'active'
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true, message: '激活成功',
        license: {
          key: updated.key, type: updated.type,
          deviceId: updated.deviceId, activatedAt: updated.activatedAt,
          expiresAt: updated.expiresAt
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, message: '服务器错误', error: error.message })
    };
  }
};