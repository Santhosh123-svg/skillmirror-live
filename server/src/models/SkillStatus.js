const mongoose = require("mongoose");


const skillStatusSchema = new mongoose.Schema({
userId: { type: mongoose.Schema.Types.ObjectId, ref:"User" },
skillId: { type: mongoose.Schema.Types.ObjectId, ref:"Skill" },
score: Number,
status: String
},{ timestamps:true });


module.exports = mongoose.model("SkillStatus", skillStatusSchema);
