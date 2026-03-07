const { validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const mapped = errors.array().map((err) => ({
            field: err.path,
            message: err.msg,
        }));
        return res.status(400).json({
            success: false,
            message: mapped[0].message,
            errors: mapped,
        });
    }

    next();
};

module.exports = validate;
