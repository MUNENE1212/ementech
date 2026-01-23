import Imap from 'imap';

const imapConfig = {
  host: 'mail.ementech.co.ke',
  port: 993,
  tls: true,
  user: 'admin@ementech.co.ke',
  password: 'Admin2026!',
  tlsOptions: { rejectUnauthorized: false },
  debug: console.log
};

console.log('Testing IMAP connection with debug logging...');
console.log('Config:', JSON.stringify({
  ...imapConfig,
  password: '***HIDDEN***'
}, null, 2));

const imap = new Imap(imapConfig);

imap.once('ready', () => {
  console.log('✅ SUCCESS: IMAP connection ready!');
  imap.end();
});

imap.once('error', (err) => {
  console.error('❌ ERROR:', err.message);
  console.error('Full error:', err);
  process.exit(1);
});

imap.connect();
