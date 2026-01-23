# Quality Assurance Framework - EmenTech Enterprise Email System

**Project Code**: EMENTECH-EMAIL-001
**Quality Lead**: Project Director (QA Phase)
**Version**: 1.0
**Effective**: January 19, 2026

---

## QA Philosophy

### Quality Definition
For the EmenTech Email System, quality means:
1. **Functional**: All features work as specified
2. **Accessible**: WCAG 2.1 AA compliant, inclusive design
3. **Performant**: Fast, responsive, smooth interactions
4. **Secure**: User data protected, vulnerabilities mitigated
5. **Usable**: Intuitive, learnable, efficient user experience
6. **Reliable**: Consistent behavior, minimal bugs
7. **Maintainable**: Clean code, good documentation

### Quality Targets
- **Zero critical bugs** (Showstoppers)
- **< 5 high-priority bugs** (Significant issues)
- **85+ Lighthouse accessibility score**
- **75+ Lighthouse performance score**
- **80%+ test coverage** (unit + integration)
- **99.9% uptime** for email services
- **< 2 seconds** real-time email delivery

---

## Testing Strategy

### Testing Pyramid

```
                /\
               /  \
              / E2E \
             / (10%) \
            /----------\
           / Integration\
          /   (30%)     \
         /----------------\
        /   Unit Tests    \
       /     (60%)         \
      /----------------------\
```

**Unit Tests (60%)**: Fast, isolated, comprehensive
- Test individual functions and components
- Mock external dependencies
- Run on every commit (CI/CD)
- Target: 80% coverage

**Integration Tests (30%)**: Real interactions
- Test API endpoints with database
- Test Socket.IO events
- Test email server integration
- Run on every PR

**End-to-End Tests (10%)**: User workflows
- Critical user paths only
- Test with real browser (Playwright)
- Test with real email server
- Run before deployment

---

## Comprehensive Testing Plan

### 1. Unit Testing

**Technology**: Jest + React Testing Library

**Backend Unit Tests**:
```javascript
// tests/unit/emailService.test.js
describe('Email Service', () => {
  test('fetchEmails returns email array', async () => {
    const emails = await emailService.fetchEmails('INBOX');
    expect(emails).InstanceOf(Array);
    expect(emails[0]).toHaveProperty('id');
    expect(emails[0]).toHaveProperty('from');
    expect(emails[0]).toHaveProperty('subject');
  });

  test('sendEmail calls SMTP transport', async () => {
    const spy = jest.spyOn(nodemailer, 'createTransport');
    await emailService.sendEmail(mockEmail);
    expect(spy).toHaveBeenCalled();
  });

  test('parseEmail extracts email body correctly', () => {
    const parsed = emailService.parseEmail(rawEmail);
    expect(parsed.body).toBeDefined();
    expect(parsed.attachments).toBeInstanceOf(Array);
  });
});
```

**Frontend Unit Tests**:
```javascript
// tests/unit/Inbox.test.jsx
describe('Inbox Component', () => {
  test('renders email list', () => {
    render(<Inbox emails={mockEmails} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  test('displays unread count', () => {
    render(<Inbox emails={mockEmails} />);
    expect(screen.getByText(/3 unread/i)).toBeInTheDocument();
  });

  test('filters emails by search query', () => {
    render(<Inbox emails={mockEmails} />);
    fireEvent.change(screen.getByLabelText(/search/i), {
      target: { value: 'project' }
    });
    expect(screen.getByText('Project Update')).toBeInTheDocument();
  });
});
```

**Coverage Targets**:
- Backend: 80%+ (statements, branches, functions, lines)
- Frontend: 80%+ (statements, branches, functions, lines)
- Critical paths: 90%+

**Run Frequency**: Every commit (pre-commit hook + CI)

---

### 2. Integration Testing

**Technology**: Jest + Supertest (API), Socket.IO Client Test

**API Integration Tests**:
```javascript
// tests/integration/api.test.js
describe('Email API Integration', () => {
  let server;
  let db;

  beforeAll(async () => {
    server = await startTestServer();
    db = await connectTestDatabase();
  });

  afterAll(async () => {
    await server.close();
    await db.disconnect();
  });

  test('GET /api/v1/email/inbox returns user emails', async () => {
    const user = await createTestUser();
    const token = generateAuthToken(user);

    const response = await request(app)
      .get('/api/v1/email/inbox')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.emails).InstanceOf(Array);
  });

  test('POST /api/v1/email/send sends email via SMTP', async () => {
    const user = await createTestUser();
    const token = generateAuthToken(user);

    const response = await request(app)
      .post('/api/v1/email/send')
      .set('Authorization', `Bearer ${token}`)
      .send({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test body'
      })
      .expect(201);

    expect(response.body.messageId).toBeDefined();
  });
});
```

**Socket.IO Integration Tests**:
```javascript
// tests/integration/socket.test.js
describe('Socket.IO Email Events', () => {
  let clientSocket;
  let serverSocket;

  beforeAll((done) => {
    const io = require('socket.io')(server);
    serverSocket = io;
    clientSocket = ioClient.connect(serverUrl);

    clientSocket.on('connect', done);
  });

  afterAll(() => {
    clientSocket.close();
    serverSocket.close();
  });

  test('client receives new_email event', (done) => {
    clientSocket.on('new_email', (email) => {
      expect(email.from).toBe('sender@example.com');
      expect(email.subject).toBeDefined();
      done();
    });

    serverSocket.emit('new_email', mockEmail);
  });

  test('client joins email room', (done) => {
    clientSocket.emit('join_email', 'admin@ementech.co.ke');
    clientSocket.on('joined', (room) => {
      expect(room).toBe('admin@ementech.co.ke');
      done();
    });
  });
});
```

**Email Server Integration Tests**:
```javascript
// tests/integration/imap.test.js
describe('IMAP Integration', () => {
  test('connects to Dovecot IMAP server', async () => {
    const imap = new Imap({
      user: 'admin@ementech.co.ke',
      password: 'testPassword',
      host: 'mail.ementech.co.ke',
      port: 993,
      tls: true
    });

    await new Promise((resolve, reject) => {
      imap.once('ready', resolve);
      imap.once('error', reject);
      imap.connect();
    });

    expect(imap.state).toBe('authenticated');
    imap.end();
  });

  test('fetches emails from INBOX', async () => {
    const emails = await imapService.fetchEmails('INBOX');
    expect(emails).InstanceOf(Array);
  });
});
```

**Run Frequency**: Every pull request

---

### 3. End-to-End Testing

**Technology**: Playwright

**Critical User Paths**:

**Test 1: Send and Receive Email Flow**
```javascript
// tests/e2e/email-flow.spec.js
test('complete email send and receive flow', async ({ page }) => {
  // Login
  await page.goto('https://ementech.co.ke/email');
  await page.fill('[name="email"]', 'admin@ementech.co.ke');
  await page.fill('[name="password"]', 'testPassword');
  await page.click('button[type="submit"]');

  // Compose email
  await page.click('button:has-text("Compose")');
  await page.fill('[name="to"]', 'recipient@example.com');
  await page.fill('[name="subject"]', 'E2E Test Email');
  await page.fill('[name="body"]', 'This is an automated test');
  await page.click('button:has-text("Send")');

  // Verify sent
  await expect(page.locator('text=Email sent')).toBeVisible();

  // Wait for real-time delivery (simulated)
  await page.waitForTimeout(2000);

  // Check inbox
  await page.click('a:has-text("Inbox")');
  await expect(page.locator('text=E2E Test Email')).toBeVisible();
});
```

**Test 2: Real-time Notification**
```javascript
test('receives real-time notification for new email', async ({ page, context }) => {
  // Grant notification permission
  await context.grantPermissions(['notifications']);

  // Open email app
  await page.goto('https://ementech.co.ke/email');
  await login(page);

  // Simulate incoming email (via API)
  await triggerIncomingEmail();

  // Verify desktop notification
  const [notification] = await Promise.all([
    page.waitForEvent('notification'),
    // Notification appears
  ]);

  expect(notification.title()).toContain('New email');
});
```

**Test 3: Accessibility Navigation**
```javascript
test('keyboard navigation works through email interface', async ({ page }) => {
  await page.goto('https://ementech.co.ke/email');

  // Tab through interface
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');

  // Verify focus management
  const focused = await page.evaluate(() => document.activeElement.tagName);
  expect(focused).toBe('BUTTON');
});
```

**Test Coverage**:
- User registration/login
- Email composition and sending
- Real-time email receiving
- Folder navigation
- Search functionality
- Settings management
- Keyboard navigation
- Screen reader compatibility

**Run Frequency**: Before every deployment (pre-production)

---

## 4. Accessibility Testing

### Automated Accessibility Testing

**Tool**: axe DevTools + jest-axe

```javascript
// tests/accessibility/axe.test.js
describe('Accessibility', () => {
  test('inbox page has no accessibility violations', async () => {
    const render = () => rtl.render(<Inbox />);
    const results = await axe(render.container);
    expect(results).toHaveNoViolations();
  });

  test('email composer meets WCAG 2.1 AA', async () => {
    const render = () => rtl.render(<EmailComposer />);
    const results = await axe(render.container);
    expect(results).toHaveNoViolations();
  });
});
```

**Run**: Every commit, every PR

### Manual Accessibility Testing

**Screen Reader Testing**:
- **NVDA** (Windows, Firefox)
- **JAWS** (Windows, Chrome/Edge)
- **VoiceOver** (macOS, Safari)
- **TalkBack** (Android, Chrome)

**Test Scenarios**:
1. Navigate to inbox
2. Compose new email
3. Read email content
4. Navigate between folders
5. Use search functionality

**Keyboard Navigation Testing**:
1. Tab through all interactive elements
2. Verify logical tab order
3. Test Enter and Space key activation
4. Verify focus indicators visible
5. Test Escape key for closing modals

**Color Contrast Testing**:
- Use axe DevTools contrast checker
- Verify all text ≥ 4.5:1 ratio
- Verify large text ≥ 3:1 ratio
- Verify interactive elements ≥ 3:1 ratio

**Target**: Lighthouse accessibility score 85+

**Test Schedule**:
- Daily: Automated tests
- Day 10, 13, 15: Manual screen reader tests
- Day 16: Full accessibility audit

---

## 5. Performance Testing

### Frontend Performance

**Tools**: Lighthouse, Chrome DevTools

**Metrics**:
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms
- **Time to First Byte (TTFB)**: < 600ms

**Test Plan**:
```javascript
// tests/performance/lighthouse.test.js
test('inbox page meets performance thresholds', async () => {
  const result = await launchLighthouse('https://ementech.co.ke/email/inbox');

  expect(result.score.performance).toBeGreaterThanOrEqual(75);
  expect(result.audits['first-contentful-paint'].score).toBeGreaterThanOrEqual(0.9);
  expect(result.audits['largest-contentful-paint'].score).toBeGreaterThanOrEqual(0.75);
});
```

**Target**: Lighthouse performance score 75+

**Test Schedule**: Day 10, 13, 15

---

### Backend Performance

**Load Testing**: Artillery or k6

**Scenarios**:
```javascript
// tests/performance/load-test.js
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

export default function () {
  let res = http.get('https://ementech.co.ke/api/v1/email/inbox');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

**Targets**:
- 100 concurrent users
- < 500ms average response time
- < 5% error rate
- 99.9% uptime

**Test Schedule**: Day 14

---

### Real-Time Performance

**Socket.IO Performance Tests**:

```javascript
// tests/performance/socket-io-load-test.js
test('handles 100 concurrent WebSocket connections', async () => {
  const clients = [];

  // Create 100 connections
  for (let i = 0; i < 100; i++) {
    const client = ioClient.connect(serverUrl);
    clients.push(client);
  }

  // Wait for all connections
  await Promise.all(clients.map(c => {
    return new Promise(resolve => c.on('connect', resolve));
  }));

  // Broadcast email to all
  serverSocket.emit('new_email', mockEmail);

  // Verify all clients receive within 2 seconds
  const received = await Promise.all(clients.map(c => {
    return new Promise(resolve => {
      c.on('new_email', (email) => resolve(email));
    });
  }));

  expect(received).toHaveLength(100);
});
```

**Targets**:
- < 2 seconds email delivery
- Support 100+ concurrent connections
- < 1% message loss rate

**Test Schedule**: Day 14

---

## 6. Security Testing

### Automated Security Scans

**Tools**: OWASP ZAP, npm audit, Snyk

**Vulnerability Scans**:
```bash
# Dependency vulnerabilities
npm audit
snyk test

# OWASP ZAP baseline scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://ementech.co.ke/email \
  -r zap-report.html
```

**Security Test Cases**:
1. **Authentication**
   - JWT token validation
   - Password hashing (bcrypt)
   - Session management
   - Logout functionality

2. **Authorization**
   - Role-based access control
   - API endpoint protection
   - Email ownership verification

3. **Input Validation**
   - SQL injection prevention
   - XSS prevention
   - CSRF token validation
   - Email header injection prevention

4. **Data Protection**
   - Encrypted IMAP credentials
   - TLS/SSL for data in transit
   - Sensitive data not logged
   - Secure password storage

5. **Rate Limiting**
   - API endpoint throttling
   - Email sending limits
   - Login attempt limits
   - DoS protection

**Target**: Zero HIGH/CRITICAL vulnerabilities

**Test Schedule**: Day 15, pre-deployment

---

## 7. Usability Testing

### User Acceptance Testing (UAT)

**Testers**: 5-10 real users (stakeholders, team members)

**Test Scenarios**:
1. **First-time user onboarding**
   - Login to email system
   - Understand interface
   - Compose first email
   - Navigate inbox

2. **Daily email tasks**
   - Check new emails
   - Respond to emails
   - Search for old emails
   - Organize into folders

3. **Mobile experience**
   - Use on phone
   - Compose email on mobile
   - Navigate with touch

**Success Criteria**:
- 80%+ task completion rate
- 4/5+ user satisfaction rating
- No critical usability issues

**Test Schedule**: Day 17

---

## Quality Gates

### Gate 1: Code Commit
- [ ] Unit tests passing (80%+ coverage)
- [ ] Linting rules passing
- [ ] TypeScript compilation successful
- [ ] No console errors/warnings

### Gate 2: Pull Request
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Code review approved
- [ ] No new high-severity vulnerabilities
- [ ] Documentation updated

### Gate 3: Pre-Deployment
- [ ] All tests passing (unit, integration, E2E)
- [ ] Lighthouse accessibility ≥ 85
- [ ] Lighthouse performance ≥ 75
- [ ] Zero critical bugs
- [ ] < 5 high-priority bugs
- [ ] Security scan clean
- [ ] Performance benchmarks met
- [ ] UAT approved

### Gate 4: Production
- [ ] Monitoring and alerting configured
- [ ] Rollback plan tested
- [ ] Stakeholder sign-off
- [ ] Deployment checklist complete

---

## Bug Classification

### Severity Levels

**Critical (Showstopper)**:
- System crash or data loss
- Security vulnerability
- Complete feature failure
- Email not sending/receiving
- WebSocket connection fails

**High (Major Issue)**:
- Feature partially broken
- Significant performance degradation
- Accessibility violation (WCAG fail)
- User cannot complete task

**Medium (Minor Issue)**:
- Workaround available
- UI/UX inconsistency
- Minor performance issue
- Edge case bug

**Low (Cosmetic)**:
- Typo or grammar error
- Visual inconsistency
- Nice-to-have improvement

### Bug Lifecycle

```
New → Triaged → In Progress → Fixed → Verified → Closed
                ↓
            Deferred
```

---

## QA Timeline

### Week 1 (Jan 19-25): Requirements & Architecture
- Day 1-3: Define test requirements
- Day 4-7: Create test plan and strategy

### Week 2 (Jan 26 - Feb 1): Implementation Begins
- Day 8-10: Write unit tests alongside features
- Day 11-14: Integration testing
- Day 14: Load testing setup

### Week 3 (Feb 2-8): Implementation Complete
- Day 15: Full test suite execution
- Day 16: Accessibility audit
- Day 16: Performance benchmarks
- Day 16: Security scan
- Day 17: Bug fixes
- Day 17: User acceptance testing
- Day 18: Final QA verification

### Day 19-21: Deployment
- Day 19: Pre-deployment testing
- Day 20: Production deployment
- Day 21: Post-deployment monitoring

---

## QA Tools and Infrastructure

### Testing Tools
- **Unit Testing**: Jest, React Testing Library
- **Integration Testing**: Supertest, Socket.IO Client
- **E2E Testing**: Playwright
- **Accessibility**: axe DevTools, jest-axe
- **Performance**: Lighthouse, k6, Artillery
- **Security**: OWASP ZAP, Snyk, npm audit

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm install
      - name: Run unit tests
        run: npm test
      - name: Run integration tests
        run: npm run test:integration
      - name: Run accessibility tests
        run: npm run test:a11y
      - name: Upload coverage
        run: npm run coverage:upload
```

---

## QA Deliverables

1. **Test Plan** (Day 3): Comprehensive testing strategy
2. **Test Suite** (Day 15): All automated tests
3. **Accessibility Report** (Day 16): WCAG 2.1 AA compliance
4. **Performance Report** (Day 16): Benchmarks and metrics
5. **Security Report** (Day 16): Vulnerability scan results
6. **Bug Report** (Day 17): All found issues with severity
7. **UAT Results** (Day 17): User feedback and acceptance
8. **QA Sign-off** (Day 18): Final quality gate approval

---

## Success Metrics

### Must Achieve (Go/No-Go Criteria)
- ✓ Zero critical bugs
- ✓ < 5 high-priority bugs
- ✓ 85+ Lighthouse accessibility
- ✓ 75+ Lighthouse performance
- ✓ All tests passing
- ✓ UAT approved

### Should Achieve
- 80%+ test coverage
- < 2 seconds real-time delivery
- 100 concurrent users supported
- Zero security vulnerabilities
- 4/5+ user satisfaction

### Nice to Have
- 90%+ test coverage
- < 1 second real-time delivery
- 200+ concurrent users
- Automated regression tests
- 5/5 user satisfaction

---

**Document Version**: 1.0
**QA Lead**: Project Director
**Next Review**: Day 10 (Implementation midpoint)
