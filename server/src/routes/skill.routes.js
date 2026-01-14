const express = require("express");

const authMiddleware = require('../middleware/auth.middleware');
const { getAllSkills, getSkillById, createSkill } = require('../controllers/skill.controller');

const router = express.Router();

router.get('/', getAllSkills);
router.get('/:id', getSkillById);
router.post('/', authMiddleware, createSkill);


module.exports = router;
