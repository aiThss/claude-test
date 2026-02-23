const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');

// Multer config for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const extname = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowed.test(file.mimetype);
        if (extname && mimetype) cb(null, true);
        else cb(new Error('Chỉ chấp nhận file ảnh!'));
    }
});

// ========== PUBLIC ROUTES ==========

// GET /api/profile/admin/* routes handled below (defined first)

// GET /api/profile/:username - Public profile view (must NOT match 'admin')
router.get('/:username', async (req, res) => {
    const { username } = req.params;
    if (username === 'admin') return res.status(404).json({ message: 'Not found' });
    try {
        const profile = await Profile.findOne({ username });
        if (!profile) {
            return res.status(404).json({ message: 'Không tìm thấy profile' });
        }

        // Increment views
        await Profile.findByIdAndUpdate(profile._id, { $inc: { totalViews: 1 } });

        const publicData = {
            username: profile.username,
            displayName: profile.displayName,
            bio: profile.bio,
            avatar: profile.avatar,
            coverImage: profile.coverImage,
            theme: profile.theme,
            links: profile.links.filter(l => l.active).sort((a, b) => a.order - b.order),
            socials: profile.socials.filter(s => s.active),
            metaTitle: profile.metaTitle,
            metaDescription: profile.metaDescription
        };

        res.json(publicData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// POST /api/profile/:username/click/:linkId - Track link click
router.post('/:username/click/:linkId', async (req, res) => {
    try {
        await Profile.updateOne(
            { username: req.params.username, 'links._id': req.params.linkId },
            { $inc: { 'links.$.clicks': 1 } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// ========== ADMIN ROUTES (require auth) ==========

// GET /api/profile/admin/me - Get full profile for admin
router.get('/admin/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findById(req.user.id).select('-password');
        if (!profile) return res.status(404).json({ message: 'Không tìm thấy profile' });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// PUT /api/profile/admin/info - Update basic info
router.put('/admin/info', auth, async (req, res) => {
    try {
        const { displayName, bio, metaTitle, metaDescription } = req.body;
        const profile = await Profile.findByIdAndUpdate(
            req.user.id,
            { displayName, bio, metaTitle, metaDescription, updatedAt: new Date() },
            { new: true }
        ).select('-password');
        res.json({ message: 'Cập nhật thành công!', profile });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// PUT /api/profile/admin/theme - Update theme
router.put('/admin/theme', auth, async (req, res) => {
    try {
        const { theme } = req.body;
        const profile = await Profile.findByIdAndUpdate(
            req.user.id,
            { theme, updatedAt: new Date() },
            { new: true }
        ).select('-password');
        res.json({ message: 'Cập nhật theme thành công!', profile });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// POST /api/profile/admin/upload/avatar - Upload avatar
router.post('/admin/upload/avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Không có file được upload' });
        const avatarUrl = `/uploads/${req.file.filename}`;
        await Profile.findByIdAndUpdate(req.user.id, { avatar: avatarUrl });
        res.json({ message: 'Upload avatar thành công!', url: avatarUrl });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// POST /api/profile/admin/upload/cover - Upload cover image
router.post('/admin/upload/cover', auth, upload.single('cover'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Không có file được upload' });
        const coverUrl = `/uploads/${req.file.filename}`;
        await Profile.findByIdAndUpdate(req.user.id, { coverImage: coverUrl });
        res.json({ message: 'Upload cover thành công!', url: coverUrl });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// ========== LINKS CRUD ==========

// POST /api/profile/admin/links - Add link
router.post('/admin/links', auth, async (req, res) => {
    try {
        const { title, url, icon } = req.body;
        if (!title || !url) return res.status(400).json({ message: 'Tiêu đề và URL là bắt buộc' });

        const profile = await Profile.findById(req.user.id);
        const maxOrder = profile.links.length > 0
            ? Math.max(...profile.links.map(l => l.order)) + 1
            : 0;

        profile.links.push({ title, url, icon: icon || '', order: maxOrder });
        await profile.save();
        res.status(201).json({ message: 'Thêm link thành công!', links: profile.links });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// PUT /api/profile/admin/links/:linkId - Update link
router.put('/admin/links/:linkId', auth, async (req, res) => {
    try {
        const { title, url, icon, active } = req.body;
        const profile = await Profile.findById(req.user.id);
        const link = profile.links.id(req.params.linkId);
        if (!link) return res.status(404).json({ message: 'Không tìm thấy link' });

        if (title !== undefined) link.title = title;
        if (url !== undefined) link.url = url;
        if (icon !== undefined) link.icon = icon;
        if (active !== undefined) link.active = active;

        await profile.save();
        res.json({ message: 'Cập nhật link thành công!', links: profile.links });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// DELETE /api/profile/admin/links/:linkId - Delete link
router.delete('/admin/links/:linkId', auth, async (req, res) => {
    try {
        const profile = await Profile.findById(req.user.id);
        profile.links = profile.links.filter(l => l._id.toString() !== req.params.linkId);
        await profile.save();
        res.json({ message: 'Xóa link thành công!', links: profile.links });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// PUT /api/profile/admin/links/reorder - Reorder links
router.put('/admin/links/reorder', auth, async (req, res) => {
    try {
        const { order } = req.body; // array of { id, order }
        const profile = await Profile.findById(req.user.id);
        order.forEach(({ id, order: newOrder }) => {
            const link = profile.links.id(id);
            if (link) link.order = newOrder;
        });
        await profile.save();
        res.json({ message: 'Sắp xếp lại thành công!', links: profile.links });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// ========== SOCIALS CRUD ==========

// PUT /api/profile/admin/socials - Update all socials
router.put('/admin/socials', auth, async (req, res) => {
    try {
        const { socials } = req.body;
        const profile = await Profile.findByIdAndUpdate(
            req.user.id,
            { socials, updatedAt: new Date() },
            { new: true }
        ).select('-password');
        res.json({ message: 'Cập nhật mạng xã hội thành công!', profile });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// GET /api/profile/admin/stats - Get stats
router.get('/admin/stats', auth, async (req, res) => {
    try {
        const profile = await Profile.findById(req.user.id).select('totalViews links');
        const totalClicks = profile.links.reduce((sum, l) => sum + (l.clicks || 0), 0);
        res.json({
            totalViews: profile.totalViews,
            totalClicks,
            links: profile.links.map(l => ({
                title: l.title,
                clicks: l.clicks || 0
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;
