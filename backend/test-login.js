import dotenv from 'dotenv';
dotenv.config();

const testLogin = async () => {
  try {
    const response = await fetch('https://ementech.co.ke/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@ementech.co.ke',
        password: 'Admin2026!'
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('✅ Login SUCCESSFUL!');
      console.log('Token:', data.token.substring(0, 50) + '...');
      console.log('User:', data.data.name, '|', data.data.email);
    } else {
      console.log('❌ Login FAILED:', data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testLogin();
