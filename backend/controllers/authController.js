const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const redisClient = require('../config/redis');
const { sendSuccess, sendError } = require('../utils/response');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return sendError(res, 'Please provide username and password', 400);
        }

        const existingUserId = await redisClient.get(`username:${username}`);
        if (existingUserId) {
            return sendError(res, 'User already exists', 400);
        }

        const userId = crypto.randomUUID();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await redisClient.hSet(`user:${userId}`, {
            id: userId,
            username,
            password: hashedPassword,
            mfaEnabled: 'false'
        });
        
        await redisClient.set(`username:${username}`, userId);

        sendSuccess(res, { id: userId, username, token: generateToken(userId) }, 201);
    } catch (error) {
        sendError(res, error.message, 500);
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const userId = await redisClient.get(`username:${username}`);
        if (!userId) {
            return sendError(res, 'Invalid credentials', 401);
        }

        const user = await redisClient.hGetAll(`user:${userId}`);
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return sendError(res, 'Invalid credentials', 401);
        }

        if (user.mfaEnabled === 'true') {
            return sendSuccess(res, { mfaRequired: true, userId: user.id });
        }

        sendSuccess(res, {
            id: user.id,
            username: user.username,
            token: generateToken(user.id)
        });
    } catch (error) {
        sendError(res, error.message, 500);
    }
};

exports.setupMFA = async (req, res) => {
    try {
        const userId = req.user.id;
        const secret = speakeasy.generateSecret({ name: `TodoApp (${userId})` });
        
        await redisClient.hSet(`user:${userId}`, {
            mfaSecret: secret.base32
        });

        QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) return sendError(res, 'Error generating QR Code', 500);
            sendSuccess(res, { qrCode: data_url, secret: secret.base32 });
        });
    } catch (error) {
        sendError(res, error.message, 500);
    }
};

exports.verifyMFA = async (req, res) => {
    try {
        const { userId, token } = req.body;
        const user = await redisClient.hGetAll(`user:${userId}`);
        
        if (!user || Object.keys(user).length === 0) {
            return sendError(res, 'User not found', 404);
        }

        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token: token
        });

        if (verified) {
            if (user.mfaEnabled === 'false') {
                await redisClient.hSet(`user:${userId}`, { mfaEnabled: 'true' });
            }
            sendSuccess(res, {
                id: user.id,
                username: user.username,
                token: generateToken(user.id)
            });
        } else {
            sendError(res, 'Invalid OTP', 401);
        }
    } catch (error) {
        sendError(res, error.message, 500);
    }
};
