require('dotenv').config();

const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const User = require('../models/User');

const COVER_IMAGE = '/assets/images/anil-sharma-yfKDx1Xp6lI-unsplash(1).jpg';
const SAMPLES = [
  {
    title: 'A Practical Morning Routine for a Healthy Broiler Flock',
    status: 'published',
    blocks: [
      ['heading', 'Start with observation'],
      ['paragraph', 'A calm walk through the shed before feeding helps identify changes in bird movement, sound, litter condition, and water use. Recording these observations each morning makes small problems easier to spot.'],
      ['list', ['Check water flow and drinker height', 'Observe flock distribution and activity', 'Inspect litter for wet patches', 'Record mortality and unusual symptoms']]
    ]
  },
  {
    title: 'What I Learned from Tracking Feed and Water Every Day',
    status: 'published',
    blocks: [
      ['paragraph', 'Daily feed and water records provide a simple picture of flock behaviour. Sudden changes can prompt an early check of equipment, shed conditions, or bird health.'],
      ['quote', 'Consistent records are most useful when they are completed at the same time every day.'],
      ['paragraph', 'I compare today’s totals with recent days and add a short note whenever weather, maintenance, or flock activity may explain a difference.']
    ]
  },
  {
    title: 'Draft Notes: Preparing a Shed Before Chick Placement',
    status: 'draft',
    blocks: [
      ['paragraph', 'Working notes for a pre-placement checklist covering cleaning, litter, brooding temperature, water lines, feed trays, and backup power.'],
      ['list', ['Confirm the shed is clean and dry', 'Test heating and ventilation', 'Flush water lines', 'Prepare arrival records']]
    ]
  },
  {
    title: 'Draft Notes: Simple Ways to Reduce Water Spillage',
    status: 'draft',
    blocks: [
      ['paragraph', 'Ideas to expand: correct drinker height, pressure checks, leak inspection, litter monitoring, and daily water-meter comparisons.']
    ]
  },
  {
    title: 'How I Use Daily Records to Prepare for Farm Reviews',
    status: 'pending_review',
    blocks: [
      ['paragraph', 'Keeping mortality, feed, water, health, and environment entries together makes farm reviews more factual and reduces time spent reconstructing events.'],
      ['heading', 'A useful weekly review'],
      ['list', ['Check for missing daily entries', 'Compare feed and water trends', 'Review health observations', 'Note maintenance that affected the flock']]
    ]
  },
  {
    title: 'Five Checks I Make During Hot Weather',
    status: 'pending_review',
    blocks: [
      ['paragraph', 'Hot weather calls for frequent observation and reliable equipment. These checks support timely decisions without replacing veterinary guidance.'],
      ['list', ['Ventilation is operating correctly', 'Cool drinking water is continuously available', 'Birds are evenly distributed', 'Litter remains dry near drinkers', 'Temperature and humidity readings are recorded']]
    ]
  }
];

function contentBlocks(blocks) {
  return blocks.map(([type, value]) => type === 'list'
    ? { type, value: '', listItems: value }
    : { type, value, headingLevel: type === 'heading' ? 2 : undefined });
}

async function resolveFarmerPrakash() {
  const matches = await User.find({
    role: 'farmer',
    $or: [
      { email: /farmer[._-]?prakash/i },
      { email: /prakash/i },
      { name: /prakash/i }
    ]
  }).sort({ accountStatus: 1, createdAt: 1 });
  if (!matches.length) throw new Error('No farmer_prakash account was found.');
  const exact = matches.find(user => /farmer[._-]?prakash/i.test(user.email || ''));
  return exact || matches[0];
}

async function run() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured.');
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const farmer = await resolveFarmerPrakash();
    const admin = await User.findOne({ role: 'admin', accountStatus: { $ne: 'suspended' } }).sort({ createdAt: 1 });
    const results = [];

    for (const sample of SAMPLES) {
      const existing = await Blog.findOne({ author: farmer._id, title: sample.title, isDeleted: false });
      if (existing) {
        results.push({ title: sample.title, status: existing.status, result: 'already exists' });
        continue;
      }
      const now = new Date();
      const blog = new Blog({
        title: sample.title,
        author: farmer._id,
        authorRole: 'farmer',
        coverImage: COVER_IMAGE,
        contentBlocks: contentBlocks(sample.blocks),
        status: sample.status,
        publishedAt: sample.status === 'published' ? now : undefined,
        approvedBy: sample.status === 'published' ? admin?._id : undefined,
        reviewHistory: sample.status === 'draft' ? [] : sample.status === 'pending_review'
          ? [{ action: 'submitted', adminRole: 'farmer', timestamp: now }]
          : [
              { action: 'submitted', adminRole: 'farmer', timestamp: now },
              { action: 'approved', admin: admin?._id, adminRole: 'admin', comments: 'Approved sample article.', timestamp: now }
            ]
      });
      await blog.save();
      results.push({ title: sample.title, status: blog.status, result: 'created' });
    }

    console.log(JSON.stringify({ farmer: { name: farmer.name, email: farmer.email }, blogs: results }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
