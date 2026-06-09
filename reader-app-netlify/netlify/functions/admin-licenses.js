const { 
  getLicenses, addLicense, deleteLicense, 
  updateLicense, generateLicenseKey 
} = require('./_shared/db');

function verifyAdmin(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === process.env.ADMIN_TOKEN;
}

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: ''
    };
  }

  if (!verifyAdmin(event)) {
    return {
      statusCode: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: '未授权访问' })
    };
  }

  try {
    const method = event.httpMethod;
    const path = event.path.replace('/.netlify/functions/admin-licenses', '');

    if (method === 'GET' && path === '/') {
      const licenses = await getLicenses();
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, licenses })
      };
    }

    if (method === 'POST' && path === '/') {
      const body = JSON.parse(event.body);
      const licenseData = {
        key: body.key || generateLicenseKey(),
        type: body.type || '30',
        status: body.status || 'active',
        deviceId: null, activatedAt: null, expiresAt: null,
        maxDevices: body.maxDevices || 1, note: body.note || ''
      };
      await addLicense(licenseData);
      return {
        statusCode: 201,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, license: licenseData })
      };
    }

    if (method === 'PUT' && path.startsWith('/')) {
      const key = path.substring(1);
      const body = JSON.parse(event.body);
      const updated = await updateLicense(key, body);
      if (!updated) {
        return {
          statusCode: 404,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: '授权码不存在' })
        };
      }
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, license: updated })
      };
    }

    if (method === 'DELETE' && path.startsWith('/')) {
      const key = path.substring(1);
      await deleteLicense(key);
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, message: '授权码已删除' })
      };
    }

    return {
      statusCode: 404,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: '接口不存在' })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: '服务器错误', message: error.message })
    };
  }
};