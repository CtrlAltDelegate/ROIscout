# ROI Scout Infrastructure Documentation

## 🏗️ Architecture Overview

ROI Scout is built with a modern, scalable architecture designed for high performance and reliability.

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│   Netlify       │    │   Railway       │    │   Railway       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Cache Layer   │
                       │   (Redis)       │
                       │   Railway       │
                       └─────────────────┘
```

## 🚀 Deployment Environments

### Production
- **Frontend**: Netlify (https://roiscout.netlify.app)
- **Backend**: Railway (https://api.roiscout.com)
- **Database**: Railway PostgreSQL
- **Cache**: Railway Redis
- **CDN**: Netlify Edge Network

### Development
- **Frontend**: Local (http://localhost:3000)
- **Backend**: Local (http://localhost:5000)
- **Database**: Local PostgreSQL or Docker
- **Cache**: Local Redis or Docker

## 🐳 Docker Configuration

### Local Development with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build
```

### Services Included
- **PostgreSQL 15**: Database with persistent storage
- **Redis 7**: Caching layer with persistence
- **Backend API**: Node.js application
- **Frontend**: React development server
- **Nginx**: Reverse proxy (production profile)

## 📊 Database Architecture

### Core Tables
- `users` - User accounts and authentication
- `properties` - Property listings and data
- `subscriptions` - Stripe subscription management
- `usage_records` - API usage tracking
- `saved_searches` - User saved search queries

### Performance Optimizations
- **Materialized Views**: Pre-computed market statistics
- **Indexes**: Optimized for common query patterns
- **Partitioning**: Usage records by date (future)
- **Connection Pooling**: Efficient database connections

### Caching Strategy
- **Redis**: API response caching (5-30 minutes)
- **Materialized Views**: Market data (refreshed every 30 minutes)
- **CDN**: Static assets (1 year)
- **Browser**: API responses (5 minutes)

## 🔐 Security Implementation

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication
- **OAuth 2.0**: Google Sign-In integration
- **bcrypt**: Password hashing (12 rounds)
- **Rate Limiting**: API endpoint protection

### Security Headers
- **Helmet.js**: Security headers middleware
- **CORS**: Cross-origin request protection
- **CSP**: Content Security Policy
- **HTTPS**: SSL/TLS encryption

### Data Protection
- **Input Validation**: Joi schema validation
- **SQL Injection**: Parameterized queries
- **XSS Protection**: Content sanitization
- **CSRF**: Token-based protection

## 💳 Payment Processing

### Stripe Integration
- **Subscriptions**: Recurring billing management
- **Webhooks**: Real-time payment updates
- **Customer Portal**: Self-service billing
- **Usage Tracking**: Metered billing support

### Plans & Pricing
- **Free**: Limited usage (10 searches/month)
- **Pro**: Unlimited usage ($29/month)
- **Enterprise**: API access + features ($99/month)

## 📈 Monitoring & Analytics

### Application Monitoring
- **Health Checks**: Automated endpoint monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time tracking
- **Database Monitoring**: Query performance analysis

### Business Analytics
- **Usage Tracking**: Feature usage statistics
- **Conversion Metrics**: Subscription analytics
- **User Behavior**: Search pattern analysis
- **Revenue Tracking**: Subscription revenue

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
1. **Code Quality**: Linting and formatting
2. **Testing**: Unit and integration tests
3. **Security**: Vulnerability scanning
4. **Build**: Docker image creation
5. **Deploy**: Automated deployment
6. **Notify**: Slack notifications

### Deployment Strategy
- **Blue-Green**: Zero-downtime deployments
- **Feature Flags**: Gradual feature rollouts
- **Rollback**: Quick reversion capability
- **Health Checks**: Post-deployment validation

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- Docker & Docker Compose

### Quick Start
```bash
# Clone repository
git clone https://github.com/your-username/roi-scout.git
cd roi-scout

# Start with Docker
docker-compose up -d

# Or start manually
cd backend && npm install && npm run dev
cd frontend && npm install && npm start
```

### Environment Configuration
Copy `.env.example` files and configure:
- Database credentials
- API keys (Stripe, Google, Real Estate APIs)
- JWT secrets
- External service tokens

## 📦 Package Management

### Backend Dependencies
- **Core**: Express, PostgreSQL, Redis
- **Auth**: JWT, bcrypt, Passport
- **Payments**: Stripe SDK
- **Validation**: Joi
- **Security**: Helmet, CORS
- **Monitoring**: Morgan, Winston

### Frontend Dependencies
- **Core**: React 18, React Router
- **UI**: Tailwind CSS, Lucide Icons
- **State**: React Hooks, Context API
- **HTTP**: Axios
- **Maps**: Mapbox GL JS
- **Charts**: Recharts
- **Payments**: Stripe React

## 🔧 Configuration Management

### Environment Variables
- **Development**: `.env` files
- **Production**: Platform environment variables
- **Secrets**: Encrypted storage (Railway, Netlify)
- **Feature Flags**: Environment-based toggles

### Configuration Files
- `docker-compose.yml` - Local development
- `railway.toml` - Railway deployment
- `netlify.toml` - Netlify deployment
- `nginx.conf` - Web server configuration

## 📊 Performance Optimization

### Backend Optimizations
- **Connection Pooling**: Database connections
- **Query Optimization**: Indexed queries
- **Caching**: Redis response caching
- **Compression**: Gzip middleware
- **Rate Limiting**: API protection

### Frontend Optimizations
- **Code Splitting**: Lazy loading
- **Asset Optimization**: Minification
- **CDN**: Global content delivery
- **Caching**: Browser and CDN caching
- **Bundle Analysis**: Size optimization

## 🚨 Disaster Recovery

### Backup Strategy
- **Database**: Daily automated backups
- **Code**: Git repository (GitHub)
- **Assets**: CDN redundancy
- **Configuration**: Version controlled

### Recovery Procedures
- **Database Restore**: Point-in-time recovery
- **Application Rollback**: Previous deployment
- **Service Recovery**: Health check automation
- **Data Migration**: Schema versioning

## 📞 Support & Maintenance

### Monitoring Alerts
- **Uptime**: Service availability
- **Performance**: Response time thresholds
- **Errors**: Error rate monitoring
- **Resources**: CPU/Memory usage

### Maintenance Windows
- **Database**: Weekly optimization
- **Cache**: Daily cleanup
- **Logs**: Monthly rotation
- **Updates**: Security patches

## 🔮 Scalability Planning

### Horizontal Scaling
- **Load Balancing**: Multiple backend instances
- **Database Sharding**: Data partitioning
- **Cache Clustering**: Redis cluster
- **CDN**: Global edge locations

### Vertical Scaling
- **Resource Allocation**: CPU/Memory upgrades
- **Database Optimization**: Query tuning
- **Cache Optimization**: Memory allocation
- **Connection Limits**: Pool sizing

## 📋 Compliance & Standards

### Data Privacy
- **GDPR**: European data protection
- **CCPA**: California privacy rights
- **Data Retention**: Automated cleanup
- **User Rights**: Data export/deletion

### Security Standards
- **OWASP**: Security best practices
- **SOC 2**: Security compliance
- **PCI DSS**: Payment security
- **ISO 27001**: Information security

---

## 🆘 Troubleshooting

### Common Issues
1. **Database Connection**: Check DATABASE_URL
2. **Redis Connection**: Verify REDIS_URL
3. **API Keys**: Validate external service keys
4. **CORS Errors**: Check FRONTEND_URL configuration
5. **Build Failures**: Verify Node.js version

### Debug Commands
```bash
# Check service health
curl http://localhost:5000/health

# View logs
docker-compose logs backend
docker-compose logs frontend

# Database connection test
psql $DATABASE_URL -c "SELECT 1;"

# Redis connection test
redis-cli -u $REDIS_URL ping
```

### Support Contacts
- **Technical Issues**: tech@roiscout.com
- **Infrastructure**: devops@roiscout.com
- **Security**: security@roiscout.com
