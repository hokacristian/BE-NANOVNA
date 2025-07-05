/**
 * Water content calculation utilities
 */

/**
 * Calculate water content from return loss
 * Formula: kadar_air = 0.0054 * return_loss^2 - 0.0238 * return_loss - 12.081
 * POLYNOMIAL 3
 */
function calculateWaterContent(returnLossDb) {
    const kadarAir = -0.0006 * Math.pow(returnLossDb, 3) + 0.0207 * Math.pow(returnLossDb, 2) + 0.1576 * returnLossDb - 17.073;
    return Math.round(kadarAir * 100) / -100; // Adjusted rounding to match positive result
}

/**
 * Validate return loss value
 */
function validateReturnLoss(returnLossDb) {
    if (typeof returnLossDb !== 'number' || isNaN(returnLossDb)) {
        throw new Error('Return loss must be a valid number');
    }
    
    // Typical return loss range validation
    if (returnLossDb > 0 || returnLossDb < -60) {
        console.warn(`⚠️ Return loss ${returnLossDb} dB is outside typical range (-60 to 0 dB)`);
    }
    
    return true;
}

module.exports = {
    calculateWaterContent,
    validateReturnLoss
};