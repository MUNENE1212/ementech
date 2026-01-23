/**
 * User Model Validation Test Script
 *
 * Tests the extended User model to verify:
 * - Schema compiles correctly
 * - All new fields are defined
 * - Instance methods work
 * - Static methods work
 * - Indexes are defined
 *
 * Run with: node test-user-model.js
 */

import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ementech_test';

async function runTests() {
  console.log('='.repeat(60));
  console.log('User Model Validation Tests');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  const test = (name, condition) => {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.log(`[FAIL] ${name}`);
      failed++;
    }
  };

  try {
    // Connect to MongoDB
    console.log('\nConnecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully.\n');

    // Test 1: Schema fields exist
    console.log('--- Schema Field Tests ---');
    const schemaPaths = Object.keys(User.schema.paths);

    // Existing fields
    test('name field exists', schemaPaths.includes('name'));
    test('email field exists', schemaPaths.includes('email'));
    test('password field exists', schemaPaths.includes('password'));
    test('role field exists', schemaPaths.includes('role'));
    test('department field exists', schemaPaths.includes('department'));
    test('isActive field exists', schemaPaths.includes('isActive'));
    test('createdAt field exists', schemaPaths.includes('createdAt'));

    // New employee fields
    test('employeeId field exists', schemaPaths.includes('employeeId'));
    test('hireDate field exists', schemaPaths.includes('hireDate'));
    test('jobTitle field exists', schemaPaths.includes('jobTitle'));
    test('reportsTo field exists', schemaPaths.includes('reportsTo'));

    // Company email fields (nested schema - check via schema.path())
    test('companyEmail field exists', schemaPaths.includes('companyEmail'));
    const companyEmailSchema = User.schema.path('companyEmail');
    test('companyEmail.address field exists', companyEmailSchema && companyEmailSchema.schema && companyEmailSchema.schema.path('address') !== undefined);
    test('companyEmail.isConfigured field exists', companyEmailSchema && companyEmailSchema.schema && companyEmailSchema.schema.path('isConfigured') !== undefined);
    test('companyEmail.password field exists', companyEmailSchema && companyEmailSchema.schema && companyEmailSchema.schema.path('password') !== undefined);
    test('companyEmail.configuredAt field exists', companyEmailSchema && companyEmailSchema.schema && companyEmailSchema.schema.path('configuredAt') !== undefined);

    // Invitation fields
    test('invitedBy field exists', schemaPaths.includes('invitedBy'));
    test('invitedAt field exists', schemaPaths.includes('invitedAt'));
    test('invitationToken field exists', schemaPaths.includes('invitationToken'));
    test('invitationExpiry field exists', schemaPaths.includes('invitationExpiry'));
    test('invitationAccepted field exists', schemaPaths.includes('invitationAccepted'));

    // Lead assignment fields
    test('assignedLeads field exists', schemaPaths.includes('assignedLeads'));
    test('maxLeadCapacity field exists', schemaPaths.includes('maxLeadCapacity'));

    // Profile fields
    test('avatar field exists', schemaPaths.includes('avatar'));
    test('phone field exists', schemaPaths.includes('phone'));
    test('bio field exists', schemaPaths.includes('bio'));
    test('skills field exists', schemaPaths.includes('skills'));

    // Permissions field
    test('permissions field exists', schemaPaths.includes('permissions'));

    // Test 2: Instance methods exist
    console.log('\n--- Instance Method Tests ---');
    const instanceMethods = Object.keys(User.schema.methods);
    test('matchPassword method exists', instanceMethods.includes('matchPassword'));
    test('generateInvitationToken method exists', instanceMethods.includes('generateInvitationToken'));
    test('isInvitationValid method exists', instanceMethods.includes('isInvitationValid'));
    test('hasPermission method exists', instanceMethods.includes('hasPermission'));
    test('getAssignedLeadCount method exists', instanceMethods.includes('getAssignedLeadCount'));
    test('canAcceptMoreLeads method exists', instanceMethods.includes('canAcceptMoreLeads'));

    // Test 3: Static methods exist
    console.log('\n--- Static Method Tests ---');
    const staticMethods = Object.keys(User.schema.statics);
    test('findByInvitationToken static exists', staticMethods.includes('findByInvitationToken'));
    test('generateEmployeeId static exists', staticMethods.includes('generateEmployeeId'));
    test('findDirectReports static exists', staticMethods.includes('findDirectReports'));
    test('findWithLeadCapacity static exists', staticMethods.includes('findWithLeadCapacity'));

    // Test 4: Indexes exist
    console.log('\n--- Index Tests ---');
    const indexes = User.schema.indexes();
    const indexFields = indexes.map(idx => JSON.stringify(idx[0]));

    test('employeeId index exists', indexFields.some(f => f.includes('employeeId')));
    test('companyEmail.address index exists', indexFields.some(f => f.includes('companyEmail.address')));
    test('invitationToken index exists', indexFields.some(f => f.includes('invitationToken')));
    test('reportsTo index exists', indexFields.some(f => f.includes('reportsTo')));

    // Test 5: Virtual properties exist
    console.log('\n--- Virtual Property Tests ---');
    const virtuals = Object.keys(User.schema.virtuals);
    test('availableLeadCapacity virtual exists', virtuals.includes('availableLeadCapacity'));
    test('isFullyOnboarded virtual exists', virtuals.includes('isFullyOnboarded'));

    // Test 6: Create a test user instance (in memory, not saved)
    console.log('\n--- Instance Creation Tests ---');
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'employee',
      department: 'engineering',
      employeeId: 'EMP-TEST',
      jobTitle: 'Software Engineer',
      maxLeadCapacity: 30,
      skills: ['JavaScript', 'React'],
      permissions: [
        { resource: 'leads', actions: ['read', 'write'] },
        { resource: 'analytics', actions: ['read'] }
      ]
    });

    test('User instance created successfully', testUser !== null);
    test('hasPermission returns true for assigned permission', testUser.hasPermission('leads', 'read'));
    test('hasPermission returns false for unassigned permission', !testUser.hasPermission('leads', 'delete'));
    test('hasPermission returns false for unassigned resource', !testUser.hasPermission('campaigns', 'read'));
    test('getAssignedLeadCount returns 0 for new user', testUser.getAssignedLeadCount() === 0);
    test('canAcceptMoreLeads returns true for empty leads', testUser.canAcceptMoreLeads() === true);
    test('availableLeadCapacity virtual works', testUser.availableLeadCapacity === 30);

    // Test 7: Test invitation token generation
    console.log('\n--- Invitation Token Tests ---');
    const token = testUser.generateInvitationToken();
    test('generateInvitationToken returns a token', typeof token === 'string' && token.length === 64);
    test('invitationToken is set on user', testUser.invitationToken !== undefined);
    test('invitationExpiry is set on user', testUser.invitationExpiry !== undefined);
    test('invitationExpiry is in the future', testUser.invitationExpiry > new Date());
    test('isInvitationValid returns true for new token', testUser.isInvitationValid());

    // Test 8: Test admin has all permissions
    console.log('\n--- Admin Permission Tests ---');
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });
    test('Admin has permission on any resource', adminUser.hasPermission('anything', 'admin'));
    test('Admin has read on leads', adminUser.hasPermission('leads', 'read'));
    test('Admin has delete on campaigns', adminUser.hasPermission('campaigns', 'delete'));

    // Test 9: Test generateEmployeeId
    console.log('\n--- Employee ID Generation Tests ---');
    const employeeId = await User.generateEmployeeId();
    test('generateEmployeeId returns EMP- format', employeeId.startsWith('EMP-'));
    test('generateEmployeeId has 3 digit padding', /EMP-\d{3,}/.test(employeeId));

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log(`RESULTS: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(60));

    if (failed === 0) {
      console.log('\n[SUCCESS] All User model tests passed!');
    } else {
      console.log('\n[WARNING] Some tests failed. Please review.');
    }

  } catch (error) {
    console.error('\n[ERROR] Test execution failed:', error.message);
    console.error(error.stack);
  } finally {
    // Cleanup
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed.');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
