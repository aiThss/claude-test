const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  icon: { type: String, default: '' },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const socialSchema = new mongoose.Schema({
  platform: { type: String, required: true }, // facebook, instagram, twitter, etc
  url: { type: String, required: true },
  active: { type: Boolean, default: true }
});

const profileSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, default: '' },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  coverImage: { type: String, default: '' },

  // Theme settings
  theme: {
    backgroundColor: { type: String, default: '#0f0f1a' },
    cardColor: { type: String, default: '#1a1a2e' },
    primaryColor: { type: String, default: '#6c63ff' },
    secondaryColor: { type: String, default: '#ff6584' },
    textColor: { type: String, default: '#ffffff' },
    subtextColor: { type: String, default: '#a0a0c0' },
    fontFamily: { type: String, default: 'Inter' },
    buttonStyle: { type: String, default: 'rounded', enum: ['rounded', 'pill', 'square', 'glassmorphism'] },
    backgroundStyle: { type: String, default: 'gradient', enum: ['gradient', 'solid', 'mesh', 'image'] },
    backgroundGradient: { type: String, default: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a3e 50%, #0f0f2a 100%)' },
    backgroundImage: { type: String, default: '' },
    animationEnabled: { type: Boolean, default: true }
  },

  links: [linkSchema],
  socials: [socialSchema],

  // SEO
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },

  // Stats
  totalViews: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

profileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Profile', profileSchema);
