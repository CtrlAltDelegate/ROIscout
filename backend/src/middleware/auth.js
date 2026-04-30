const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access Denied',
      message: 'No token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token Expired',
        message: 'Please log in again',
      });
    }
    
    return res.status(403).json({
      error: 'Invalid Token',
      message: 'Token is not valid',
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Don't fail, just don't set user
      req.user = null;
    }
  }

  next();
};

/**
 * Plan-gating middleware — requires minimum subscription plan.
 * planRank: free=0, basic=1, pro=2
 */
const requirePlan = (minimumPlan) => {
  const planRank = { free: 0, basic: 1, pro: 2 };
  return (req, res, next) => {
    const userPlan = req.user?.subscription_plan || req.user?.plan || 'free';
    if ((planRank[userPlan] ?? 0) >= (planRank[minimumPlan] ?? 0)) {
      return next();
    }
    return res.status(403).json({
      error: 'upgrade_required',
      requiredPlan: minimumPlan,
      message: `This feature requires a ${minimumPlan} plan or higher.`,
    });
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requirePlan,
};
