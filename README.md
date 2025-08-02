# ROI Scout - Real Estate Investment Analytics

**Find high-return rental markets with data-driven insights**

ROI Scout is a comprehensive SaaS platform that identifies profitable real estate investment opportunities by analyzing median purchase prices and rental rates across different markets. The platform provides interactive heatmaps, detailed ROI calculations, and market comparisons to help investors make informed decisions.

## 🚀 Live Demo

- **Frontend**: [Deploy to Netlify](https://app.netlify.com/start/deploy?repository=your-repo)
- **Backend**: [Deploy to Railway](https://railway.app/new/template)
- **Demo Credentials**: `demo@roiscout.com` / `password123`

## ✨ Features

### Core MVP Features
- 🏠 **Property Analysis**: 3bed/2bath single-family home focus (expandable)
- 🎯 **Smart Filtering**: State > County > Zip code selection with price/rent filters
- 📊 **ROI Calculations**: Rent-to-price ratio, gross rental yield, and GRM
- 🗺️ **Interactive Heatmaps**: Visual market comparison with Mapbox integration
- 📋 **Data Tables**: Sortable, filterable results with pagination
- 💾 **Saved Searches**: Bookmark and track favorite market criteria
- 🔐 **User Authentication**: Secure JWT-based login system
- 📱 **Mobile Responsive**: Works seamlessly on all devices

### Technical Features
- ⚡ **Fast Performance**: PostgreSQL database with optimized queries
- 🔌 **API Integration Ready**: Zillow, Rentometer, GreatSchools API support
- 🛡️ **Security**: Rate limiting, input validation, SQL injection protection
- 📈 **Scalable Architecture**: Microservices-ready design
- 🌙 **Dark Mode**: Investor-friendly UI with modern design

## 🏗️ Tech Stack

### Frontend
- **React 18** with modern hooks and context
- **Tailwind CSS** for responsive styling
- **React Router** for navigation
- **Axios** for API communication
- **Mapbox GL JS** for interactive maps
- **Recharts** for data visualization

### Backend
- **Node.js** with Express framework
- **PostgreSQL** with connection pooling
- **JWT** authentication
- **Joi** validation
- **bcrypt** password hashing
- **Helmet** security middleware

### Infrastructure
- **Netlify** for frontend hosting
- **Railway** for backend and database
- **GitHub Actions** ready for CI/CD

## 📦 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- Git

### 1. Clone Repository
```bash
git clone https://github.com/your-username/roi-scout.git
cd roi-scout
```

### 2. Backend Setup
```bash
cd backend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials and API keys

# Setup database
npm run migrate
npm run seed

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your backend URL and Mapbox token

# Start development server
npm start
```

### 4. Visit Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Zip Data Table
```sql
CREATE TABLE zip_data (
  id SERIAL PRIMARY KEY,
  zip_code VARCHAR(10) NOT NULL,
  state VARCHAR(2) NOT NULL,
  county VARCHAR(100),
  median_price INTEGER,
  median_rent INTEGER,
  rent_to_price_ratio DECIMAL(5,4),
  gross_rental_yield DECIMAL(5,2),
  grm DECIMAL(8,2),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(zip_code, state)
);
```

### Saved Searches Table
```sql
CREATE TABLE saved_searches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  search_name VARCHAR(255) NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API Documentation

### Authentication Endpoints
```
POST /api/auth/signup     # Create new user account
POST /api/auth/login      # User login
GET  /api/auth/profile    # Get user profile (protected)
```

### Data Endpoints
```
GET /api/data/pricing-data    # Get ROI data with filters
GET /api/data/states         # Get available states
GET /api/data/counties/:state # Get counties for state
GET /api/data/zipcodes/:county # Get zip codes for county
```

### Saved Searches Endpoints
```
GET    /api/searches     # Get user's saved searches
POST   /api/searches     # Save a new search
DELETE /api/searches/:id # Delete saved search
```

## 🌐 Deployment

### Railway (Backend)
1. Connect GitHub repository to Railway
2. Set environment variables:
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-production-secret
   ZILLOW_API_KEY=your-api-key
   RENTOMETER_API_KEY=your-api-key
   ```
3. Deploy automatically on push to main

### Netlify (Frontend)
1. Connect GitHub repository to Netlify
2. Build settings:
   - **Build command**: `cd frontend && npm run build`
   - **Publish directory**: `frontend/build`
3. Environment variables:
   ```
   REACT_APP_API_URL=https://your-backend.railway.app/api
   REACT_APP_MAPBOX_TOKEN=your-mapbox-token
   ```

## 🧪 Sample Data

The application includes sample data for demonstration:
- **Users**: Demo accounts with saved searches
- **Markets**: 24 zip codes across CA, TX, FL, NY, OH, MI
- **ROI Range**: 5% - 12% rental yields
- **Price Range**: $75K - $1.25M median prices

## 🔑 Environment Variables

### Backend (.env)
```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/roi_scout
JWT_SECRET=your-super-secret-jwt-key
ZILLOW_API_KEY=your_zillow_api_key
RENTOMETER_API_KEY=your_rentometer_api_key
GREATSCHOOLS_API_KEY=your_greatschools_api_key
```

### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAPBOX_TOKEN=your_mapbox_access_token
```

## 📊 ROI Calculations

### Rent-to-Price Ratio
```
Ratio = (Monthly Rent × 12) ÷ Purchase Price
Good: > 1.0% (1% rule)
```

### Gross Rental Yield
```
Yield = (Annual Rent ÷ Purchase Price) × 100
Excellent: 10%+, Good: 8-10%, Fair: 6-8%
```

### Gross Rent Multiplier (GRM)
```
GRM = Purchase Price ÷ Annual Rent
Lower is better: < 12 is good
```

## 🛠️ Development

### Project Structure
```
roi-scout/
├── frontend/          # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API services
│   │   └── utils/       # Utilities
├── backend/           # Express API
│   ├── src/
│   │   ├── controllers/ # Route handlers
│   │   ├── middleware/  # Express middleware
│   │   ├── models/      # Data models
│   │   ├── routes/      # API routes
│   │   └── services/    # Business logic
├── database/          # Migrations & seeds
└── scripts/           # Utility scripts
```

### Available Scripts

**Backend**
```bash
npm start        # Start production server
npm run dev      # Start development server
npm run migrate  # Run database migrations
npm run seed     # Seed sample data
npm test         # Run tests
```

**Frontend**
```bash
npm start        # Start development server
npm run build    # Build for production
npm test         # Run tests
npm run eject    # Eject from Create React App
```

## 🔮 Roadmap

### Phase 2 Features
- [ ] School district score overlay
- [ ] Market trend analysis
- [ ] Multiple property types (condos, multifamily)
- [ ] Cash flow calculators
- [ ] Email alerts for new opportunities
- [ ] Export functionality (CSV, PDF)
- [ ] Property comparison tools
- [ ] Advanced filtering (crime, walkability)

### Phase 3 Features
- [ ] Mobile app (React Native)
- [ ] AI-powered market predictions
- [ ] Integration with MLS data
- [ ] Property management tools
- [ ] Investment portfolio tracking
- [ ] Social features (sharing, comments)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚨 Troubleshooting

### Common Issues

**Database Connection Failed**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Ensure database exists

**API Calls Failing**
- Check backend is running on port 5000
- Verify REACT_APP_API_URL in frontend .env
- Check CORS configuration

**Map Not Loading**
- Verify REACT_APP_MAPBOX_TOKEN is set
- Check Mapbox account limits
- Ensure token has correct permissions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@roiscout.com
- 💬 Discord: [Join our community](https://discord.gg/roiscout)
- 📚 Documentation: [docs.roiscout.com](https://docs.roiscout.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/roi-scout/issues)

## 🙏 Acknowledgments

- **Zillow** for real estate data APIs
- **Mapbox** for mapping services
- **Railway** for hosting infrastructure
- **Netlify** for frontend deployment
- **Tailwind CSS** for the design system

---

**Built with ❤️ for real estate investors**

*ROI Scout - Find your next profitable investment*
