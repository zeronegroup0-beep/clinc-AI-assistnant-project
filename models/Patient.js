const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { encrypt, decrypt } = require('../utils/encryption');

const patientSchema = new mongoose.Schema({
    // Encrypted field: Name
    name: {
        type: String,
        required: [true, 'Patient name is required'],
        set: (value) => value ? encrypt(value) : value,
        get: (value) => value ? decrypt(value) : value,
    },
    // Non-encrypted field: Email (Used for login, needs to be queryable without decryption overhead, or hashed. Usually left plain or blinded if highly secure)
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    // Encrypted field: Phone
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        set: (value) => value ? encrypt(value) : value,
        get: (value) => value ? decrypt(value) : value,
    },
    // Encrypted field: Medical Record details
    medical_record: {
        type: String,
        set: (value) => value ? encrypt(value) : value,
        get: (value) => value ? decrypt(value) : value,
    },
    role: {
        type: String,
        enum: ['patient', 'admin'],
        default: 'patient'
    }
}, {
    timestamps: true,
    // Ensure getters are applied when converting to JSON or Object
    toJSON: { getters: true, virtuals: false },
    toObject: { getters: true, virtuals: false }
});

// Pre-save hook to hash the password
patientSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password for login
patientSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
