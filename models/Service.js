const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    service_id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    display_name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    assigned_doctor_id: {
        type: String,
        required: true
    },
    assigned_doctor_name: {
        type: String,
        required: true
    },
    keywords: [{
        type: String
    }],
    price: {
        type: Number
    },
    durationMinutes: {
        type: Number,
        default: 30
    }
}, {
    timestamps: true
});

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
