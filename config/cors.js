const cors = require('cors');

const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:5500"
];

const corsOptions = {
    origin: function (origin, callback) {
        console.log("Request Origin:", origin);
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

module.exports = cors(corsOptions);