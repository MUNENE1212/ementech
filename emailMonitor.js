const Imap = require('imap');
const fs = require('fs');

// Email monitoring configuration
const imapConfig = {
  user: 'admin@ementech.co.ke',
  password: 'Admin2026!',
  host: 'localhost',
  port: 993,
  tls: true,
  connTimeout: 10000,
  authTimeout: 5000
};

// Log file
const logFile = '/var/log/email-monitor.log';

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(logMessage.trim());
}

// Global IO reference (will be set from main app)
let io = null;

function setIO(socketIO) {
  io = socketIO;
  log('✅ Socket.IO instance connected to email monitor');
}

// Create IMAP connection
const imap = new Imap(imapConfig);

imap.once('ready', () => {
  log('✅ IMAP connection established');

  // Open INBOX
  imap.openBox('INBOX', false, (err, box) => {
    if (err) {
      log(`❌ Error opening INBOX: ${err.message}`);
      return;
    }

    log(`📬 INBOX opened. ${box.messages.total} messages total`);

    // Start IDLE mode for real-time updates
    startIdle();
  });
});

imap.once('error', (err) => {
  log(`❌ IMAP error: ${err.message}`);
});

imap.once('end', () => {
  log('⚠️  IMAP connection ended. Reconnecting in 5 seconds...');
  setTimeout(() => imap.connect(), 5000);
});

function startIdle() {
  imap.idleStart();
  log('🔄 IDLE mode started - waiting for new emails...');

  // Listen for new email
  imap.on('mail', (numNewEmails) => {
    log(`📧 ${numNewEmails} new email(s) received!`);

    // Fetch new emails
    fetchNewEmails(numNewEmails);
  });

  // Handle IDLE timeout
  imap.on('timeout', () => {
    log('⏱️  IDLE timeout, restarting...');
    imap.idleStart();
  });
}

function fetchNewEmails(count) {
  imap.search(['UNSEEN'], (err, results) => {
    if (err) {
      log(`❌ Search error: ${err.message}`);
      return;
    }

    if (!results || results.length === 0) {
      log('⚠️  No unseen emails found');
      return;
    }

    // Fetch the latest emails
    const fetch = imap.fetch(results.slice(-count), {
      bodies: '',
      markSeen: false,
      struct: true
    });

    let fetchedCount = 0;

    fetch.on('message', (msg, seqno) => {
      let buffer = '';

      msg.on('body', (stream) => {
        stream.on('data', (chunk) => {
          buffer += chunk.toString('utf8');
        });

        stream.once('end', () => {
          // Parse email headers
          const email = parseEmail(buffer);

          // Filter out system emails (Fail2Ban, Cron, etc.)
          const isSystemEmail = /\[Fail2Ban\]|Cron.*@|Cron \<|System notification|Automated alert/i.test(email.subject);

          if (isSystemEmail) {
            log(`🚫 System email filtered out: ${email.subject}`);
            return;
          }

          fetchedCount++;
          log(`📨 New email from: ${email.from}`);

          // Emit Socket.IO event to all connected clients
          if (io) {
            io.emit('new_email', {
              id: email.messageId,
              from: email.from,
              to: email.to,
              subject: email.subject,
              preview: email.preview,
              date: email.date,
              seqno: seqno
            });

            log('📡 Socket.IO event emitted: new_email');
          }
        });
      });
    });

    fetch.once('error', (err) => {
      log(`❌ Fetch error: ${err.message}`);
    });

    fetch.once('end', () => {
      log(`✅ Fetched ${fetchedCount} new email(s) (${count - fetchedCount} filtered)`);
    });
  });
}

function parseEmail(buffer) {
  const lines = buffer.split('\n');
  const email = {
    from: 'Unknown',
    to: 'admin@ementech.co.ke',
    subject: 'No Subject',
    preview: '',
    date: new Date().toISOString(),
    messageId: Date.now().toString()
  };

  let inHeaders = true;
  let bodyLines = [];

  for (const line of lines) {
    if (inHeaders) {
      if (line.startsWith('From: ')) {
        email.from = line.substring(6).trim();
      } else if (line.startsWith('To: ')) {
        email.to = line.substring(4).trim();
      } else if (line.startsWith('Subject: ')) {
        email.subject = line.substring(9).trim();
      } else if (line.startsWith('Date: ')) {
        email.date = line.substring(6).trim();
      } else if (line.trim() === '') {
        inHeaders = false;
      }
    } else {
      bodyLines.push(line);
    }
  }

  // Create preview
  email.preview = bodyLines.slice(0, 3).join(' ').substring(0, 150);

  return email;
}

// Start monitoring
log('🚀 Email Monitor Daemon Starting...');
imap.connect();

// Graceful shutdown
process.on('SIGINT', () => {
  log('🛑 Shutting down email monitor...');
  imap.idleEnd();
  imap.end();
  process.exit(0);
});

module.exports = { imap, fetchNewEmails, setIO };
