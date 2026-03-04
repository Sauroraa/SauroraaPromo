# 🧪 Promoteam - Testing & QA Guide

## 📋 Testing Strategy

```
                    Manual Testing
                         |
                         ▼
    ┌──────────────────────────────┐
    │   User Acceptance Testing    │
    │  - Features work as expected │
    │  - User workflows verified   │
    │  - Performance acceptable    │
    └──────────────────────────────┘
                         ▲
                         |
    E2E Tests (Playwright)
    - Full workflows
    - Cross-browser
    
                         ▲
                         |
    Integration Tests
    - API → Database
    - Service interaction
    
                         ▲
                         |
    Unit Tests
    - Functions tested
    - Mocks used
    - 80%+ coverage target
```

---

## 🧪 Unit Tests

### Backend Tests

#### Installation

```bash
npm install --save-dev jest supertest @testing-library/jest-dom
```

#### Configuration

```javascript
// backend/jest.config.js

module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80
    }
  },
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js']
};
```

#### Test Examples

```javascript
// backend/src/controllers/__tests__/authController.test.js

const { register, login } = require('../authController');
const db = require('../../config/db');
const bcrypt = require('bcryptjs');

jest.mock('../../config/db');
jest.mock('bcryptjs');

describe('Auth Controller', () => {
  describe('register', () => {
    it('should register new user with valid data', async () => {
      const req = {
        body: {
          firstName: 'John',
          lastName: 'Doe',
          instaUsername: 'johndoe',
          email: 'john@example.com',
          password: 'Password123!'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      bcrypt.hash.mockResolvedValue('hashed_password');
      db.query.mockResolvedValue({ insertId: 1 });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          token: expect.any(String)
        })
      );
    });

    it('should reject weak password', async () => {
      const req = {
        body: {
          password: '123'  // Too weak
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject duplicate email', async () => {
      const req = {
        body: {
          email: 'existing@example.com',
          password: 'ValidPassword123!'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      db.query.mockRejectedValue({ code: 'ER_DUP_ENTRY' });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Email already exists' })
      );
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const req = {
        body: {
          email: 'user@example.com',
          password: 'Password123!'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const user = {
        id: 1,
        password_hash: 'hashed_password'
      };

      db.query.mockResolvedValue([user]);
      bcrypt.compare.mockResolvedValue(true);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          refreshToken: expect.any(String)
        })
      );
    });

    it('should reject invalid email', async () => {
      const req = {
        body: {
          email: 'nonexistent@example.com',
          password: 'Password123!'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      db.query.mockResolvedValue([]);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should reject wrong password', async () => {
      const req = {
        body: {
          email: 'user@example.com',
          password: 'WrongPassword123!'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      db.query.mockResolvedValue([{
        id: 1,
        password_hash: 'hashed_password'
      }]);
      bcrypt.compare.mockResolvedValue(false);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
```

#### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- authController.test.js

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Update snapshots
npm test -- -u
```

### Frontend Tests

#### Installation

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

#### Test Examples

```javascript
// frontend/src/components/__tests__/LoginPage.test.jsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../LoginPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as api from '../../lib/api';

vi.mock('../../lib/api');
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

describe('LoginPage', () => {
  const queryClient = new QueryClient();

  it('should render login form', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({
      data: { token: 'test_token' }
    });

    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );

    await user.type(
      screen.getByLabelText(/email/i),
      'test@example.com'
    );
    await user.type(
      screen.getByLabelText(/password/i),
      'Password123!'
    );
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'Password123!'
      });
    });
  });

  it('should display error message on failed login', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } }
    });

    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );

    await user.type(
      screen.getByLabelText(/email/i),
      'test@example.com'
    );
    await user.type(
      screen.getByLabelText(/password/i),
      'WrongPassword'
    );
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );

    await user.type(
      screen.getByLabelText(/email/i),
      'invalid-email'
    );
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });
});
```

---

## 🔗 Integration Tests

### API Integration Tests

```javascript
// backend/src/__tests__/integration/auth.integration.test.js

const request = require('supertest');
const app = require('../../index');
const db = require('../../config/db');

describe('Auth API Integration', () => {
  beforeAll(async () => {
    // Setup test database
    await db.query('TRUNCATE TABLE users');
  });

  afterAll(async () => {
    // Cleanup
    await db.query('TRUNCATE TABLE users');
  });

  describe('POST /api/auth/register', () => {
    it('should register new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          instaUsername: 'testuser',
          email: 'test@example.com',
          password: 'TestPassword123!',
          inviteCode: 'valid-invite-code'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('userId');
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test'
          // Missing required fields
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          instaUsername: 'testuser',
          email: 'test@example.com',
          password: 'TestPassword123!',
          inviteCode: 'valid-code'
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should return 401 for wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('test@example.com');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });
});
```

---

## 🎭 E2E Tests (Playwright)

### Installation

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Test Examples

```javascript
// e2e/auth.spec.js

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Authentication', () => {
  test('should register new user', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Check if register link exists
    const registerLink = page.getByText(/create account/i);
    await registerLink.click();

    // Fill registration form
    await page.getByLabel(/first name/i).fill('Test');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/instagram username/i).fill('testuser');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('TestPassword123!');
    await page.getByLabel(/confirm password/i).fill('TestPassword123!');
    await page.getByLabel(/invite code/i).fill('valid-code');

    // Submit form
    await page.getByRole('button', { name: /register/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`);
    expect(page.url()).toContain('/dashboard');
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Fill login form
    await page.getByLabel(/email/i).fill('admin@promoteam.com');
    await page.getByLabel(/password/i).fill('adminpassword');

    // Submit form
    await page.getByRole('button', { name: /login/i }).click();

    // Wait for redirect and check dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`);
    expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /login/i }).click();

    // Check error message appears
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel(/email/i).fill('admin@promoteam.com');
    await page.getByLabel(/password/i).fill('adminpassword');
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Logout
    await page.getByRole('button', { name: /logout/i }).click();

    // Should redirect to login
    await page.waitForURL(`${BASE_URL}/login`);
    expect(page.url()).toContain('/login');
  });

  test('should persist session on page refresh', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel(/email/i).fill('admin@promoteam.com');
    await page.getByLabel(/password/i).fill('adminpassword');
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Refresh page
    await page.reload();

    // Should still be on dashboard
    expect(page.url()).toContain('/dashboard');
    expect(page.getByText(/dashboard/i)).toBeVisible();
  });
});
```

### Running E2E Tests

```bash
# Run all tests
npx playwright test

# Run specific file
npx playwright test e2e/auth.spec.js

# Run headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Generate report
npx playwright test --reporter=html
npx playwright show-report
```

---

## 📊 Performance Testing

### Load Testing with K6

```javascript
// k6/performance.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp-up
    { duration: '1m', target: 50 },    // Stay
    { duration: '30s', target: 100 },  // Peak
    { duration: '30s', target: 0 },    // Ramp-down
  ],
};

const BASE_URL = 'http://localhost:5000';

export default function () {
  // Login
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: 'admin@promoteam.com',
      password: 'adminpassword'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const token = loginRes.json('token');

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined,
  });

  // Get missions
  const missionsRes = http.get(
    `${BASE_URL}/api/missions`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  check(missionsRes, {
    'get missions status is 200': (r) => r.status === 200,
    'has missions': (r) => r.json('missions').length > 0,
  });

  sleep(1);
}
```

### Running Performance Tests

```bash
# Install K6
curl https://dl.k6.io/install.sh | bash

# Run test
k6 run k6/performance.js

# With output
k6 run k6/performance.js --out json=results.json
```

---

## 🛣️ Test Coverage Report

### Backend

```bash
npm test -- --coverage
```

**Target Coverage:**
- Statements: 80%
- Branches: 70%
- Functions: 70%
- Lines: 80%

**Current Status:** TO BE IMPLEMENTED

### Frontend

```bash
npm test -- --coverage
```

**Target Coverage:** 75%+

**Current Status:** TO BE IMPLEMENTED

---

## ✅ QA Checklist

### Before Release

#### Backend
- [ ] All unit tests passing (80%+ coverage)
- [ ] Integration tests passing
- [ ] No ESLint errors
- [ ] No console.log() statements in production code
- [ ] Error handling comprehensive
- [ ] Rate limiting tested
- [ ] SQL injection tested
- [ ] XSS protection verified
- [ ] CSRF tokens working
- [ ] Input validation complete
- [ ] Database migrations tested

#### Frontend
- [ ] All unit tests passing (75%+ coverage)
- [ ] E2E tests passing
- [ ] No console errors
- [ ] No 404 errors in network tab
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Form validation working
- [ ] Error states handled
- [ ] Loading states visible
- [ ] Accessibility tested (keyboard navigation, screen reader)
- [ ] Performance acceptable (<2s load)
- [ ] Lighthouse score >90

#### Infrastructure
- [ ] Docker build succeeds
- [ ] All services start correctly
- [ ] Database migrations run
- [ ] Health checks working
- [ ] Logs clean (no warnings)
- [ ] SSL certificate valid
- [ ] Rate limiting active
- [ ] Backups working
- [ ] Restore tested

#### Security
- [ ] Secrets not in code
- [ ] npm audit clean
- [ ] OWASP scan passed
- [ ] Passwords hashed
- [ ] Tokens secure
- [ ] CORS configured
- [ ] HTTPS enforced
- [ ] Rate limiting active

#### Documentation
- [ ] README complete
- [ ] API docs updated
- [ ] Deployment guide current
- [ ] Troubleshooting guide useful
- [ ] Code comments present
- [ ] Changelog updated

---

## 🐛 Bug Report Template

```
Title: [SHORT DESCRIPTION]

**Environment:**
- OS: [e.g., Windows 10, macOS 12]
- Browser: [e.g., Chrome 120]
- Version: [App version]

**Steps to Reproduce:**
1. Go to [page]
2. Click [button]
3. Fill [form]
4. Observe [behavior]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshots/Videos:**
[Attach if applicable]

**Console Errors:**
[Error messages]

**System Info:**
[Memory, CPU, Disk space if relevant]

**Additional Context:**
[Any other info]
```

---

**Version:** 1.0
**Last Updated:** 2024
