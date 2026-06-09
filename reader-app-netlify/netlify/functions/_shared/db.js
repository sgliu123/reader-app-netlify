// Netlify Blob Storage 封装 - 授权数据管理
const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'licenses';

function getBlobStore() {
  return getStore({
    name: STORE_NAME,
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });
}

async function initLicenses() {
  const store = getBlobStore();
  try {
    const exists = await store.get('license-list');
    if (exists) return JSON.parse(exists);
  } catch (e) {}

  const defaultLicenses = [{
    key: 'UCA6-66Q1-2345-6789',
    type: '30',
    status: 'active',
    deviceId: null,
    activatedAt: null,
    expiresAt: null,
    maxDevices: 1,
    createdAt: new Date().toISOString()
  }];

  await store.set('license-list', JSON.stringify(defaultLicenses));
  return defaultLicenses;
}

async function getLicenses() {
  const store = getBlobStore();
  try {
    const data = await store.get('license-list');
    return data ? JSON.parse(data) : await initLicenses();
  } catch (e) {
    return await initLicenses();
  }
}

async function saveLicenses(licenses) {
  const store = getBlobStore();
  await store.set('license-list', JSON.stringify(licenses));
}

async function findLicense(key) {
  const licenses = await getLicenses();
  return licenses.find(l => l.key === key);
}

async function updateLicense(key, updates) {
  const licenses = await getLicenses();
  const index = licenses.findIndex(l => l.key === key);
  if (index === -1) return null;
  licenses[index] = { ...licenses[index], ...updates };
  await saveLicenses(licenses);
  return licenses[index];
}

async function addLicense(licenseData) {
  const licenses = await getLicenses();
  if (licenses.find(l => l.key === licenseData.key)) {
    throw new Error('授权码已存在');
  }
  licenses.push({ ...licenseData, createdAt: new Date().toISOString() });
  await saveLicenses(licenses);
  return licenseData;
}

async function deleteLicense(key) {
  const licenses = await getLicenses();
  const filtered = licenses.filter(l => l.key !== key);
  await saveLicenses(filtered);
  return true;
}

function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const parts = [];
  for (let i = 0; i < 4; i++) {
    let part = '';
    for (let j = 0; j < 4; j++) {
      part += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    parts.push(part);
  }
  return parts.join('-');
}

module.exports = {
  getLicenses, saveLicenses, findLicense, updateLicense,
  addLicense, deleteLicense, initLicenses, generateLicenseKey
};