import Imap from 'imap';

const imap = new Imap({
  host: 'mail.ementech.co.ke',
  port: 993,
  tls: true,
  user: 'admin@ementech.co.ke',
  password: 'JpeQQEbwpzQDe8o5OPst',
  tlsOptions: { rejectUnauthorized: false }
});

imap.once('ready', () => {
  console.log('✅ Connected to IMAP server');

  imap.openBox('INBOX', false, (err, box) => {
    if (err) {
      console.error('❌ Error opening INBOX:', err.message);
      imap.end();
      return;
    }

    console.log(`\n📧 INBOX Statistics:`);
    console.log(`   Total messages: ${box.messages.total}`);
    console.log(`   Recent messages: ${box.messages.recent}`);
    console.log(`   Unseen messages: ${box.messages.unseen}`);
    console.log(`   UID validity: ${box.uidvalidity}`);
    console.log(`   UID next: ${box.uidnext}`);

    if (box.messages.total > 0) {
      console.log(`\n📬 Fetching latest 5 emails...`);

      const fetch = imap.fetch(box.messages.total + 1 - Math.min(5, box.messages.total), {
        bodies: 'HEADER',
        markSeen: false
      });

      let count = 0;
      fetch.on('message', (msg, seqno) => {
        msg.on('body', (stream) => {
          let buffer = '';
          stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
          });
          stream.once('end', () => {
            count++;
            const lines = buffer.split('\n');
            const subjectLine = lines.find(line => line.startsWith('Subject:')) || '(No Subject)';
            const fromLine = lines.find(line => line.startsWith('From:')) || 'Unknown sender';
            console.log(`\n${count}. ${subjectLine}`);
            console.log(`   ${fromLine}`);
          });
        });
      });

      fetch.once('error', (err) => {
        console.error('❌ Fetch error:', err.message);
        imap.end();
      });

      fetch.once('end', () => {
        imap.end();
      });
    } else {
      console.log('\n⚠️  No emails in INBOX');
      imap.end();
    }
  });
});

imap.once('error', (err) => {
  console.error('❌ IMAP connection error:', err.message);
  process.exit(1);
});

imap.connect();
