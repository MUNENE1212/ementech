import Imap from 'imap';

const imapConfig = {
  host: 'mail.ementech.co.ke',
  port: 993,
  tls: true,
  user: 'admin@ementech.co.ke',
  password: 'testpass123',
  tlsOptions: { rejectUnauthorized: false },
  debug: console.log
};

console.log('Testing IMAP with simple password...');
const imap = new Imap(imapConfig);

imap.once('ready', () => {
  console.log('✅ SUCCESS!');
  imap.end();
});

imap.once('error', (err) => {
  console.error('❌ ERROR:', err.message);
  process.exit(1);
});

imap.connect();
