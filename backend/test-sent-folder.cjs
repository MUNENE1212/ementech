const axios = require('axios');

const API_URL = 'http://localhost:5001';

async function testSentFolder() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@ementech.co.ke',
      password: 'Admin2026!'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    console.log('\n📧 Fetching SENT folder emails...');
    const sentResponse = await axios.get(`${API_URL}/api/email?folder=Sent&limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Sent emails found:', sentResponse.data.data.length);
    sentResponse.data.data.forEach(email => {
      console.log('  -', email.subject);
      console.log('    To:', email.to?.map(t => t.email).join(', ') || 'Unknown');
      console.log('    Date:', new Date(email.date).toLocaleString());
      console.log('    Folder:', email.folder);
    });

    console.log('\n✅ Test complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testSentFolder();
