require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

/**
 * Send SOS SMS to emergency contacts.
 * @param {Object} payload - The SOS payload (same shape as the SOS button sends).
 * @param {string} payload.username - Name of the person in distress.
 * @param {number} payload.latitude - Latitude of the SOS location.
 * @param {number} payload.longitude - Longitude of the SOS location.
 * @param {string[]} payload.emergency_contacts - Array of phone numbers to notify.
 * @returns {Promise<string[]>} Array of Twilio message SIDs.
 */
async function sendSosSms({ username, latitude, longitude, emergency_contacts }) {
    const name = username || 'Unknown User';
    const body = `SOS for ${name} at https://www.google.com/maps?q=${latitude},${longitude}`;

    const results = [];

    try {
        const message = await client.messages.create({
            body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: "+917478682825",
        });
        console.log(`SMS sent to +917478682825: ${message.sid}`);
        results.push(message.sid);
    } catch (err) {
        console.error(`Failed to send SMS to +917478682825:`, err.message);
    }


    return results;
}

module.exports = sendSosSms;