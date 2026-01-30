const secretOrKey = process.env.SECRET_OR_KEY || 'dev-secret-key';

module.exports = {
    secretOrKey,
    mongoURI: process.env.MONGO_URI,
    isProduction: process.env.NODE_ENV === 'production'
}