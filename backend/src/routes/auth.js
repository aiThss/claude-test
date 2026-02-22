const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Profile = require('../models/Profile');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username và password là bắt buộc' });
        }

        const profile = await Profile.findOne({ username });
        if (!profile) {
            return res.status(401).json({ message: 'Thông tin đăng nhập không đúng' });
        }

        const isMatch = await bcrypt.compare(password, profile.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Thông tin đăng nhập không đúng' });
        }

        const token = jwt.sign(
            { id: profile._id, username: profile.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: profile._id,
                username: profile.username,
                displayName: profile.displayName
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// POST /api/auth/register (chỉ cho phép tạo lần đầu nếu chưa có profile nào)
router.post('/register', async (req, res) => {
    try {
        const existingCount = await Profile.countDocuments();
        if (existingCount > 0) {
            return res.status(403).json({ message: 'Đã có tài khoản. Không thể đăng ký thêm.' });
        }

        const { username, password, displayName } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username và password là bắt buộc' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const profile = new Profile({
            username,
            password: hashedPassword,
            displayName: displayName || username
        });

        await profile.save();

        const token = jwt.sign(
            { id: profile._id, username: profile.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Tạo tài khoản thành công!',
            token,
            user: { id: profile._id, username: profile.username }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// POST /api/auth/change-password
router.post('/change-password', require('../middleware/auth'), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const profile = await Profile.findById(req.user.id);

        const isMatch = await bcrypt.compare(currentPassword, profile.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
        }

        profile.password = await bcrypt.hash(newPassword, 12);
        await profile.save();

        res.json({ message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;
