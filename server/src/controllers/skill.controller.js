const Skill = require('../models/Skill');

exports.getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.find();
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSkillById = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });
    res.json(skill);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createSkill = async (req, res) => {
  try {
    const { name, description, icon, level } = req.body;
    const skill = new Skill({ name, description, icon, level });
    await skill.save();
    res.status(201).json({ message: 'Skill created', skill });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
