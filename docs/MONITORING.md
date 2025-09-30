# ROI Scout Monitoring & Error Tracking

This document outlines the monitoring and error tracking setup for ROI Scout.

## 🔍 Error Tracking with Sentry

### Setup Instructions

1. **Create Sentry Account**
   - Go to [sentry.io](https://sentry.io) and create an account
   - Create a new project for "Node.js" (backend) and "React" (frontend)

2. **Environment Variables**
   Add these to your `.env` files:

   **Backend (.env):**
   ```bash
   SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
   SENTRY_RELEASE=roiscout-backend@1.0.0
   SENTRY_ENABLE_DEV=false  # Set to true to enable in development
   ```

   **Frontend (.env):**
   ```bash
   REACT_APP_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
   REACT_APP_SENTRY_RELEASE=roiscout-frontend@1.0.0
   REACT_APP_SENTRY_ENABLE_DEV=false  # Set to true to enable in development
   ```

3. **Railway Environment Variables**
   Add the same variables to your Railway deployment:
   ```bash
   railway variables set SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
   railway variables set SENTRY_RELEASE=roiscout-backend@1.0.0
   ```

4. **Netlify Environment Variables**
   Add to Netlify dashboard under Site Settings > Environment Variables:
   ```
   REACT_APP_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
   REACT_APP_SENTRY_RELEASE=roiscout-frontend@1.0.0
   ```

### Features Enabled

- **Error Tracking**: Automatic capture of unhandled errors
- **Performance Monitoring**: API response times and database queries
- **User Context**: User information attached to errors
- **Breadcrumbs**: Detailed error context and user actions
- **Release Tracking**: Track errors by deployment version
- **Error Filtering**: Skip non-critical errors (network, dev-only)

## 📊 Health Monitoring with UptimeRobot

### Health Check Endpoints

Our application provides multiple health check endpoints:

1. **Basic Health Check**
   - URL: `https://your-api.railway.app/health`
   - Response: Always returns 200 OK with basic info
   - Use for: Basic uptime monitoring

2. **Detailed Health Check**
   - URL: `https://your-api.railway.app/health/detailed`
   - Response: Includes database, Redis, memory status
   - Use for: Comprehensive monitoring

3. **Readiness Check**
   - URL: `https://your-api.railway.app/health/ready`
   - Response: 200 if ready, 503 if not ready
   - Use for: Load balancer health checks

4. **Liveness Check**
   - URL: `https://your-api.railway.app/health/live`
   - Response: Always 200 if process is running
   - Use for: Container orchestration

### UptimeRobot Setup

1. **Create UptimeRobot Account**
   - Go to [uptimerobot.com](https://uptimerobot.com)
   - Create a free account (up to 50 monitors)

2. **Add Monitors**

   **Primary API Monitor:**
   - Monitor Type: HTTP(s)
   - URL: `https://your-api.railway.app/health`
   - Monitoring Interval: 5 minutes
   - Alert Contacts: Your email/SMS

   **Frontend Monitor:**
   - Monitor Type: HTTP(s)
   - URL: `https://your-app.netlify.app`
   - Monitoring Interval: 5 minutes
   - Alert Contacts: Your email/SMS

   **Database Health Monitor:**
   - Monitor Type: HTTP(s)
   - URL: `https://your-api.railway.app/health/detailed`
   - Monitoring Interval: 10 minutes
   - Alert Contacts: Your email/SMS
   - Advanced: Check for "database.*healthy" in response

3. **Alert Channels**
   - Email notifications
   - SMS alerts (paid plans)
   - Slack integration
   - Discord webhooks
   - PagerDuty integration

### Monitoring Checklist

- [ ] Sentry projects created for frontend and backend
- [ ] Environment variables configured
- [ ] UptimeRobot monitors set up
- [ ] Alert contacts configured
- [ ] Test error reporting (trigger test error)
- [ ] Test health check endpoints
- [ ] Verify alert notifications work

## 🚨 Alert Configuration

### Critical Alerts (Immediate Response)
- API completely down (5+ minutes)
- Database connection failures
- High error rates (>5% in 10 minutes)
- Memory usage >95%

### Warning Alerts (Monitor Closely)
- API response time >5 seconds
- Database response time >2 seconds
- Memory usage >80%
- Redis connection issues

### Info Alerts (Track Trends)
- New error types in Sentry
- Performance degradation
- Unusual traffic patterns

## 📈 Performance Monitoring

### Key Metrics to Track

1. **Response Times**
   - API endpoint response times
   - Database query performance
   - Frontend page load times

2. **Error Rates**
   - 4xx/5xx error percentages
   - JavaScript errors in frontend
   - Database connection errors

3. **Resource Usage**
   - Memory consumption
   - CPU usage
   - Database connections

4. **Business Metrics**
   - User registrations
   - Property searches
   - API usage by plan

### Sentry Performance Features

- **Transaction Tracing**: Track API request flows
- **Database Query Monitoring**: Identify slow queries
- **Custom Metrics**: Track business-specific events
- **Release Health**: Monitor deployment impact

## 🔧 Troubleshooting

### Common Issues

1. **Sentry Not Receiving Errors**
   - Check DSN configuration
   - Verify environment variables
   - Test with manual error trigger

2. **UptimeRobot False Positives**
   - Adjust monitoring intervals
   - Use different health check endpoints
   - Configure proper alert thresholds

3. **High Memory Usage Alerts**
   - Check for memory leaks
   - Review database connection pooling
   - Monitor garbage collection

### Debug Commands

```bash
# Test health endpoints locally
curl http://localhost:5000/health
curl http://localhost:5000/health/detailed
curl http://localhost:5000/health/ready

# Test Sentry integration
node -e "require('./backend/src/config/sentry').captureMessage('Test message')"

# Check environment variables
echo $SENTRY_DSN
echo $REACT_APP_SENTRY_DSN
```

## 📋 Maintenance Tasks

### Daily
- [ ] Check Sentry for new errors
- [ ] Review UptimeRobot status
- [ ] Monitor performance metrics

### Weekly
- [ ] Review error trends
- [ ] Check alert configuration
- [ ] Update monitoring thresholds

### Monthly
- [ ] Review monitoring costs
- [ ] Update alert contacts
- [ ] Test disaster recovery procedures

## 🎯 Success Metrics

- **Uptime**: >99.9% availability
- **Response Time**: <2 seconds average
- **Error Rate**: <1% of requests
- **MTTR**: <15 minutes for critical issues
- **Alert Accuracy**: <5% false positives

---

For support with monitoring setup, contact the development team or refer to the main project documentation.
