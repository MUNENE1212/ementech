const axios = require('axios');

const API_URL = 'http://localhost:5001';

async function testEmailAPI() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@ementech.co.ke',
      password: 'Admin2026!' // Properly escaped in Node.js
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 50) + '...');

    console.log('\n📧 Fetching email folders...');
    const foldersResponse = await axios.get(`${API_URL}/api/email/folders/list`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Folders:', foldersResponse.data.data.length);
    foldersResponse.data.data.forEach(folder => {
      console.log('  -', folder.name, '(' + folder.count + ' emails)');
    });

    console.log('\n📧 Fetching INBOX emails...');
    const emailsResponse = await axios.get(`${API_URL}/api/email?folder=INBOX&limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Emails found:', emailsResponse.data.data.length);
    emailsResponse.data.data.forEach(email => {
      console.log('  -', email.subject);
      console.log('    From:', email.from?.email || 'Unknown');
      console.log('    Date:', new Date(email.date).toLocaleString());
    });

    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testEmailAPI();
