const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('../config/database');

const stripeController = {
  /**
   * Create a Stripe customer
   */
  async createCustomer(req, res) {
    try {
      const { email, name } = req.body;
      const userId = req.user.userId;

      // Check if customer already exists
      const existingCustomer = await query(
        'SELECT stripe_customer_id FROM users WHERE id = $1',
        [userId]
      );

      if (existingCustomer.rows[0]?.stripe_customer_id) {
        return res.json({
          customerId: existingCustomer.rows[0].stripe_customer_id,
          message: 'Customer already exists'
        });
      }

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId: userId.toString()
        }
      });

      // Update user with Stripe customer ID
      await query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customer.id, userId]
      );

      res.json({
        customerId: customer.id,
        message: 'Customer created successfully'
      });
    } catch (error) {
      console.error('Create customer error:', error);
      res.status(500).json({
        error: 'Failed to create customer',
        message: error.message
      });
    }
  },

  /**
   * Create a subscription
   */
  async createSubscription(req, res) {
    try {
      const { priceId, paymentMethodId } = req.body;
      const userId = req.user.userId;

      // Get user's Stripe customer ID
      const userResult = await query(
        'SELECT stripe_customer_id, email FROM users WHERE id = $1',
        [userId]
      );

      if (!userResult.rows[0]) {
        return res.status(404).json({ error: 'User not found' });
      }

      let customerId = userResult.rows[0].stripe_customer_id;

      // Create customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userResult.rows[0].email,
          metadata: { userId: userId.toString() }
        });
        customerId = customer.id;

        await query(
          'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
          [customerId, userId]
        );
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_settings: {
          payment_method_options: {
            card: {
              request_three_d_secure: 'if_required',
            },
          },
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      // Save subscription to database
      await query(
        `INSERT INTO subscriptions (user_id, stripe_subscription_id, stripe_customer_id, status, current_period_start, current_period_end)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE SET
         stripe_subscription_id = $2, status = $4, current_period_start = $5, current_period_end = $6`,
        [
          userId,
          subscription.id,
          customerId,
          subscription.status,
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000)
        ]
      );

      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        status: subscription.status
      });
    } catch (error) {
      console.error('Create subscription error:', error);
      res.status(500).json({
        error: 'Failed to create subscription',
        message: error.message
      });
    }
  },

  /**
   * Get subscription status
   */
  async getSubscription(req, res) {
    try {
      const userId = req.user.userId;

      const result = await query(
        'SELECT * FROM subscriptions WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.json({ subscription: null });
      }

      const subscription = result.rows[0];

      // Get latest info from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );

      // Update local database
      await query(
        `UPDATE subscriptions SET 
         status = $1, current_period_start = $2, current_period_end = $3
         WHERE user_id = $4`,
        [
          stripeSubscription.status,
          new Date(stripeSubscription.current_period_start * 1000),
          new Date(stripeSubscription.current_period_end * 1000),
          userId
        ]
      );

      res.json({
        subscription: {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          plan: stripeSubscription.items.data[0].price.nickname || 'Pro Plan'
        }
      });
    } catch (error) {
      console.error('Get subscription error:', error);
      res.status(500).json({
        error: 'Failed to get subscription',
        message: error.message
      });
    }
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(req, res) {
    try {
      const userId = req.user.userId;

      const result = await query(
        'SELECT stripe_subscription_id FROM subscriptions WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No subscription found' });
      }

      const subscriptionId = result.rows[0].stripe_subscription_id;

      // Cancel at period end
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });

      // Update database
      await query(
        'UPDATE subscriptions SET status = $1 WHERE user_id = $2',
        [subscription.status, userId]
      );

      res.json({
        message: 'Subscription will be cancelled at the end of the current period',
        cancelAt: new Date(subscription.current_period_end * 1000)
      });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({
        error: 'Failed to cancel subscription',
        message: error.message
      });
    }
  },

  /**
   * Create billing portal session
   */
  async createBillingPortal(req, res) {
    try {
      const userId = req.user.userId;

      const result = await query(
        'SELECT stripe_customer_id FROM users WHERE id = $1',
        [userId]
      );

      if (!result.rows[0]?.stripe_customer_id) {
        return res.status(404).json({ error: 'No customer found' });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: result.rows[0].stripe_customer_id,
        return_url: `${process.env.FRONTEND_URL}/dashboard`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('Create billing portal error:', error);
      res.status(500).json({
        error: 'Failed to create billing portal',
        message: error.message
      });
    }
  },

  /**
   * Webhook handler for Stripe events
   */
  async handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object;
          await query(
            `UPDATE subscriptions SET 
             status = $1, current_period_start = $2, current_period_end = $3
             WHERE stripe_subscription_id = $4`,
            [
              subscription.status,
              new Date(subscription.current_period_start * 1000),
              new Date(subscription.current_period_end * 1000),
              subscription.id
            ]
          );
          break;

        case 'invoice.payment_succeeded':
          const invoice = event.data.object;
          // Update usage tracking or send confirmation email
          console.log('Payment succeeded for invoice:', invoice.id);
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object;
          // Handle failed payment
          console.log('Payment failed for invoice:', failedInvoice.id);
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook handler error:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  },

  /**
   * Get pricing plans
   */
  async getPricingPlans(req, res) {
    try {
      // In a real app, you'd store these in your database or fetch from Stripe
      const plans = [
        {
          id: 'free',
          name: 'Free',
          price: 0,
          interval: 'month',
          features: [
            '10 property searches per month',
            'Basic ROI calculations',
            'Limited export functionality'
          ],
          stripePriceId: null
        },
        {
          id: 'pro',
          name: 'Pro',
          price: 29,
          interval: 'month',
          features: [
            'Unlimited property searches',
            'Advanced ROI analytics',
            'Full export functionality (CSV, PDF)',
            'Save favorite properties',
            'Share search results',
            'Email alerts for new deals'
          ],
          stripePriceId: process.env.STRIPE_PRO_PRICE_ID
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 99,
          interval: 'month',
          features: [
            'Everything in Pro',
            'API access',
            'Custom integrations',
            'Priority support',
            'Advanced market analytics',
            'Team collaboration features'
          ],
          stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID
        }
      ];

      res.json({ plans });
    } catch (error) {
      console.error('Get pricing plans error:', error);
      res.status(500).json({
        error: 'Failed to get pricing plans',
        message: error.message
      });
    }
  }
};

module.exports = stripeController;
