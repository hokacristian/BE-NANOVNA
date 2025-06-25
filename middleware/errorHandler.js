const errorHandler = (err, req, res, next) => {
    console.error('🚨 Unhandled Error:', err);

    // CORS errors
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            error: 'CORS Error',
            message: 'Origin not allowed',
            allowed_origins: [
                "http://localhost:3000",
                "http://127.0.0.1:5500"
            ]
        });
    }

    // Default error response
    res.status(err.status || 500).json({
        error: err.name || 'Internal Server Error',
        message: err.message || 'Something went wrong',
        timestamp: new Date().toISOString()
    });
};

module.exports = errorHandler;