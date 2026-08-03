const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// @route   POST api/projects
// @desc    Create a new project
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ msg: 'Project name is required' });

    const newProject = new Project({
      name,
      user: req.user.userId
    });

    const project = await newProject.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/projects
// @desc    Get all projects for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.userId }).sort({ created_at: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/projects/:id/complete
// @desc    Mark project as completed
// @access  Private
router.put('/:id/complete', auth, async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });

    // Check user
    if (project.user.toString() !== req.user.userId) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    project.is_completed = true;
    await project.save();

    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
