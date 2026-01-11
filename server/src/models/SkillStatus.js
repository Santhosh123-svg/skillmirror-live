import mongoose from "mongoose";


const skillStatusSchema = new mongoose.Schema({
userId: { type: mongoose.Schema.Types.ObjectId, ref:"User" },
skillId: { type: mongoose.Schema.Types.ObjectId, ref:"Skill" },
score: Number,
status: String
},{ timestamps:true });


export default mongoose.model("SkillStatus", skillStatusSchema);