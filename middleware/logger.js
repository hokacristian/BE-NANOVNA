const logger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    
    if (req.method === 'POST' && req.body) {
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
    }
    
    next();
};

module.exports = logger;