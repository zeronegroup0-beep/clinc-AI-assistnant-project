const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const waitlistSchema = new mongoose.Schema({
    // Encrypted field: Patient Name
    patientName: {
        type: String,
        required: [true, 'Patient name is required'],
        set: (value) => value ? encrypt(value) : value,
        get: (value) => value ? decrypt(value) : value,
    },
    // Encrypted field: WhatsApp / Phone Number
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        set: (value) => value ? encrypt(value) : value,
        get: (value) => value ? decrypt(value) : value,
    },
    doctor: {
        type: String,
        required: [true, 'Doctor name is required'],
        default: 'د. أحمد شريف (الأسنان)'
    },
    requestedDate: {
        type: String,
        required: [true, 'Requested date is required']
    },
    requestedTime: {
        type: String,
        required: [true, 'Requested time is required']
    },
    status: {
        type: String,
        enum: ['waiting', 'notified', 'cancelled'],
        default: 'waiting'
    },
    notes: {
        type: String
    }
}, {
    timestamps: true,
    toJSON: { getters: true, virtuals: false },
    toObject: { getters: true, virtuals: false }
});

const Waitlist = mongoose.model('Waitlist', waitlistSchema);

module.exports = Waitlist;
