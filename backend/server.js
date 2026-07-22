const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = require('stripe')(stripeKey);

const app = express();
const prisma = new PrismaClient();

// Allow Vite dev server port
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }));
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';

// --- AUTH ROUTES ---

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, companyName } = req.body;

    if (!email || !password || !companyName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: companyName },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'OWNER',
          tenantId: tenant.id,
        },
      });

      return { tenant, user };
    });

    const accessToken = jwt.sign(
      { userId: result.user.id, tenantId: result.tenant.id, role: result.user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: result.user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, tenantId: result.tenant.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, tenantId: user.tenantId, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ success: true });
});

// --- MIDDLEWARE ---

const requireAuth = (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.tenantId) {
      return res.status(401).json({ error: 'Unauthorized: Invalid tenant context' });
    }
    req.user = decoded; // { userId, tenantId, role }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// --- PROTECTED ROUTES ---

app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, role: true, tenantId: true },
    });
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: { id: true, name: true, plan: true },
    });

    res.json({ user, tenant });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- DASHBOARD STATS ---
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const invoices = await prisma.invoice.findMany({
      where: { tenantId },
      select: { amount: true, status: true }
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const outstandingInvoices = invoices.filter(i => i.status === 'SENT' || i.status === 'OVERDUE').length;

    const activeCustomers = await prisma.customer.count({ where: { tenantId } });

    res.json({ totalRevenue, outstandingInvoices, activeCustomers });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});


// --- CUSTOMERS ---
app.get('/api/customers', requireAuth, async (req, res) => {
  try {
    const { search } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { invoices: true } },
        invoices: {
          select: { amount: true, status: true }
        }
      }
    });

    // Add computed totals
    const enriched = customers.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      createdAt: c.createdAt,
      invoiceCount: c._count.invoices,
      totalBilled: c.invoices.reduce((sum, inv) => sum + inv.amount, 0),
      totalPaid: c.invoices.filter(i => i.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0),
    }));

    res.json(enriched);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/customers', requireAuth, async (req, res) => {
  try {
    const { name, email, phone, company } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    const existing = await prisma.customer.findFirst({
      where: { email, tenantId: req.user.tenantId }
    });
    if (existing) return res.status(400).json({ error: 'A customer with this email already exists' });

    const customer = await prisma.customer.create({
      data: { name, email, phone: phone || null, company: company || null, tenantId: req.user.tenantId }
    });
    res.json({ ...customer, invoiceCount: 0, totalBilled: 0, totalPaid: 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.patch('/api/customers/:id', requireAuth, async (req, res) => {
  try {
    const { name, email, phone, company } = req.body;
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const updated = await prisma.customer.update({
      where: { id: req.params.id },
      data: { name, email, phone: phone || null, company: company || null }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

app.delete('/api/customers/:id', requireAuth, async (req, res) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: { _count: { select: { invoices: true } } }
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    if (customer._count.invoices > 0) {
      return res.status(400).json({ error: 'Cannot delete customer with existing invoices' });
    }
    await prisma.customer.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Temporary routes have been removed.

// --- INVOICES ---
app.get('/api/invoices', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (status) where.status = status;
    const invoices = await prisma.invoice.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

app.post('/api/invoices', requireAuth, async (req, res) => {
  try {
    const { customerId, amount, dueDate, notes } = req.body;
    if (!customerId || !amount) {
      return res.status(400).json({ error: 'Customer and amount are required' });
    }
    // Verify customer belongs to this tenant
    const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId: req.user.tenantId } });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const invoice = await prisma.invoice.create({
      data: {
        customerId,
        amount: parseFloat(amount),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        tenantId: req.user.tenantId,
        status: 'DRAFT'
      },
      include: { customer: true }
    });
    res.json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

app.patch('/api/invoices/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['DRAFT', 'SENT', 'PAID', 'OVERDUE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status },
      include: { customer: true }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice status' });
  }
});

app.delete('/api/invoices/:id', requireAuth, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status === 'PAID') return res.status(400).json({ error: 'Cannot delete a paid invoice' });
    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

// --- TEAM ---
app.get('/api/team', requireAuth, async (req, res) => {
  try {
    const team = await prisma.user.findMany({
      where: { tenantId: req.user.tenantId },
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    });
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

app.post('/api/team/invite', requireAuth, async (req, res) => {
  try {
    // Only OWNERs can invite members
    if (req.user.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only owners can invite team members' });
    }

    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    const validRoles = ['OWNER', 'STAFF', 'VIEWER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be OWNER, STAFF, or VIEWER' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    // Create user with a temporary password they must reset (in a real app, you'd send an invite email)
    const tempPassword = Math.random().toString(36).slice(-10) + 'Aa1!';
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        tenantId: req.user.tenantId,
      },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    // In production, send invite email with tempPassword here
    console.log(`[INVITE] ${email} invited. Temp password: ${tempPassword}`);

    res.json({ 
      user: newUser, 
      message: `${email} has been added to your workspace. Temp password logged to console (use email service in production).`,
      tempPassword // Return for dev/testing only
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to invite team member' });
  }
});

app.delete('/api/team/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only owners can remove team members' });
    }
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'You cannot remove yourself' });
    }
    await prisma.user.delete({ where: { id: req.params.id, tenantId: req.user.tenantId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove team member' });
  }
});

// --- DASHBOARD ---
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    // Aggregate total revenue
    const revenueResult = await prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { tenantId, status: 'PAID' }
    });

    // Count outstanding invoices
    const outstandingCount = await prisma.invoice.count({
      where: { tenantId, status: { not: 'PAID' } }
    });

    // Count active customers
    const activeCustomers = await prisma.customer.count({
      where: { tenantId }
    });

    res.json({
      totalRevenue: revenueResult._sum.amount || 0,
      outstandingInvoices: outstandingCount,
      activeCustomers: activeCustomers
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// --- STRIPE BILLING & PAYMENTS ---
app.post('/api/billing/create-checkout-session', requireAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    
    if (stripeKey === 'sk_test_placeholder') {
      console.log('Mocking Stripe Checkout (No real key provided)');
      return res.json({ url: 'http://localhost:5173/billing?success=true' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `TenantInvoice ${plan} Plan`,
            },
            unit_amount: 2900, // $29.00
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `http://localhost:5173/billing?success=true`,
      cancel_url: `http://localhost:5173/billing?canceled=true`,
      client_reference_id: req.user.tenantId,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.post('/api/invoices/:id/pay', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status === 'PAID') return res.status(400).json({ error: 'Invoice already paid' });

    if (stripeKey === 'sk_test_placeholder') {
      console.log('Mocking Stripe Payment (No real key provided)');
      // Simulate payment success by updating DB directly
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID' }
      });
      return res.json({ url: 'http://localhost:5173/invoices?success=true' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice #${invoice.id.substring(0, 8)}`,
            },
            unit_amount: Math.round(invoice.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:5173/invoices?success=true`,
      cancel_url: `http://localhost:5173/invoices?canceled=true`,
      metadata: { invoiceId: invoice.id },
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment session' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
