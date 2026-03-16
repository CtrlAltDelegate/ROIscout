const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('../config/database');

const BASIC_PRICE_ID = process.env.STRIPE_BASIC_PRICE_ID;
const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function planIdFromPriceId(priceId) {
  if (!priceId) return 'free';
  if (priceId === BASIC_PRICE_ID) return 'basic';
  if (priceId === PRO_PRICE_ID) return 'pro';
  return 'pro'; // fallback for legacy or custom prices
}

async function syncUserSubscriptionPlan(userId, stripeSubscription) {
  if (!stripeSubscription || !stripeSubscription.items?.data?.[0]) return;
  const priceId = stripeSubscription.items.data[0].price.id;
  const plan = planIdFromPriceId(priceId);
  await query(
    'UPDATE users SET subscription_plan = $1, subscription_status = $2 WHERE id = $3',
    [plan, stripeSubscription.status === 'active' ? 'active' : 'free', userId]
  );
}

const stripeController = {
  /**
   * Create Stripe Checkout Session for subscription (redirect to Stripe-hosted page)
   */
  async createCheckoutSession(req, res) {
    try {
      const { priceId, planId, successUrl, cancelUrl } = req.body;
      const userId = req.user.userId;

      const resolvedPriceId = priceId || (planId === 'basic' ? BASIC_PRICE_ID : planId === 'pro' ? PRO_PRICE_ID : null);
      if (!resolvedPriceId) {
        return res.status(400).json({
          error: 'Invalid plan',
          message: 'Provide priceId or planId (basic|pro)',
        });
      }

      const userResult = await query(
        'SELECT email, stripe_customer_id FROM users WHERE id = $1',
        [userId]
      );
      if (!userResult.rows[0]) {
        return res.status(404).json({ error: 'User not found' });
      }
      const { email, stripe_customer_id: customerId } = userResult.rows[0];

      const sessionConfig = {
        mode: 'subscription',
        line_items: [{ price: resolvedPriceId, quantity: 1 }],
        success_url: successUrl || `${FRONTEND_URL}/dashboard?subscription=success`,
        cancel_url: cancelUrl || `${FRONTEND_URL}/pricing?canceled=1`,
        metadata: { userId: userId.toString() },
        subscription_data: { metadata: { userId: userId.toString() } },
      };
      if (customerId) {
        sessionConfig.customer = customerId;
      } else {
        sessionConfig.customer_email = email;
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

      res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
      console.error('Create checkout session error:', error);
      res.status(500).json({
        error: 'Failed to create checkout session',
        message: error.message,
      });
    }
  },

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
      const expanded = await stripe.subscriptions.retrieve(subscription.id, { expand: ['items.data.price'] });
      await syncUserSubscriptionPlan(userId, expanded);

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
        subscription.stripe_subscription_id,
        { expand: ['items.data.price'] }
      );

      // Update local database and user plan
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
      await syncUserSubscriptionPlan(userId, stripeSubscription);

      const priceId = stripeSubscription.items?.data?.[0]?.price?.id;
      const planId = planIdFromPriceId(priceId);

      res.json({
        subscription: {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          planId,
          plan: planId === 'basic' ? 'Basic' : planId === 'pro' ? 'Pro' : (stripeSubscription.items.data[0].price.nickname || 'Pro'),
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
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
   * Webhook handler for Stripe events (must receive raw body; mounted in app.js before express.json)
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
        case 'checkout.session.completed': {
          const session = event.data.object;
          const subscriptionId = session.subscription;
          const userId = session.metadata?.userId ? parseInt(session.metadata.userId, 10) : null;
          if (subscriptionId && userId) {
            const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price'] });
            await query(
              `INSERT INTO subscriptions (user_id, stripe_subscription_id, stripe_customer_id, status, current_period_start, current_period_end)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT (user_id) DO UPDATE SET
                 stripe_subscription_id = $2, status = $4, current_period_start = $5, current_period_end = $6`,
              [
                userId,
                stripeSubscription.id,
                stripeSubscription.customer,
                stripeSubscription.status,
                new Date(stripeSubscription.current_period_start * 1000),
                new Date(stripeSubscription.current_period_end * 1000),
              ]
            );
            await syncUserSubscriptionPlan(userId, stripeSubscription);
            const customerId = typeof stripeSubscription.customer === 'string' ? stripeSubscription.customer : stripeSubscription.customer?.id;
            if (customerId) {
              await query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, userId]);
            }
          }
          break;
        }

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
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
          const subRow = await query('SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1', [subscription.id]);
          if (subRow.rows[0]) {
            const expanded = await stripe.subscriptions.retrieve(subscription.id, { expand: ['items.data.price'] });
            await syncUserSubscriptionPlan(subRow.rows[0].user_id, expanded);
          }
          break;
        }

        case 'invoice.payment_succeeded':
          console.log('Payment succeeded for invoice:', event.data.object.id);
          break;

        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          console.log('Payment failed for invoice:', invoice.id, 'subscription:', invoice.subscription);
          if (invoice.subscription) {
            try {
              const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription, { expand: ['items.data.price'] });
              await query(
                `UPDATE subscriptions SET status = $1, current_period_start = $2, current_period_end = $3 WHERE stripe_subscription_id = $4`,
                [
                  stripeSubscription.status,
                  new Date(stripeSubscription.current_period_start * 1000),
                  new Date(stripeSubscription.current_period_end * 1000),
                  stripeSubscription.id,
                ]
              );
              const subRow = await query('SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1', [stripeSubscription.id]);
              if (subRow.rows[0]) {
                await syncUserSubscriptionPlan(subRow.rows[0].user_id, stripeSubscription);
              }
            } catch (err) {
              console.error('invoice.payment_failed sync error:', err.message);
            }
          }
          break;
        }

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
   * Get pricing plans (Basic $19.99 / Pro $49.99 per Launch Readiness plan)
   */
  async getPricingPlans(req, res) {
    try {
      const plans = [
        {
          id: 'basic',
          name: 'Basic',
          price: 19.99,
          interval: 'month',
          features: [
            'Limited saved searches',
            'Core ROI metrics (yield, GRM, rent-to-price)',
            'Map access'
          ],
          stripePriceId: process.env.STRIPE_BASIC_PRICE_ID || null
        },
        {
          id: 'pro',
          name: 'Pro',
          price: 49.99,
          interval: 'month',
          features: [
            'Unlimited saved searches',
            'CSV export',
            'Email alerts for saved searches',
            'Full metrics suite'
          ],
          stripePriceId: process.env.STRIPE_PRO_PRICE_ID || null
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
