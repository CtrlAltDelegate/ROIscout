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

// POST /api/stripe/checkout-session - Create Checkout Session (redirect to Stripe)
router.post('/checkout-session', stripeController.createCheckoutSession);

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

// Webhook is mounted in app.js with raw body (before express.json)

module.exports = router;
