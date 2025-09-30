const express = require('express');
const stripeController = require('../controllers/stripeController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication except webhook
router.use((req, res, next) => {
  if (req.path === '/webhook') {
    return next();
  }
  return authenticateToken(req, res, next);
});

// GET /api/stripe/plans - Get pricing plans
router.get('/plans', stripeController.getPricingPlans);

// POST /api/stripe/customer - Create Stripe customer
router.post('/customer', stripeController.createCustomer);

// POST /api/stripe/subscription - Create subscription
router.post('/subscription', stripeController.createSubscription);

// GET /api/stripe/subscription - Get subscription status
router.get('/subscription', stripeController.getSubscription);

// DELETE /api/stripe/subscription - Cancel subscription
router.delete('/subscription', stripeController.cancelSubscription);

// POST /api/stripe/billing-portal - Create billing portal session
router.post('/billing-portal', stripeController.createBillingPortal);

// POST /api/stripe/webhook - Stripe webhook handler (no auth required)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeController.handleWebhook);

module.exports = router;
