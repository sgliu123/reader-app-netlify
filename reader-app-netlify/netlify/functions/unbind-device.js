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
    if (!licenseKey) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, message: '缺少授权码' })
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
        body: JSON.stringify({ success: false, message: '只有绑定的设备才能解绑' })
      };
    }

    await updateLicense(licenseKey, {
      deviceId: null, activatedAt: null,
      expiresAt: null, status: 'active'
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, message: '解绑成功，授权码已释放' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, message: '服务器错误', error: error.message })
    };
  }
};