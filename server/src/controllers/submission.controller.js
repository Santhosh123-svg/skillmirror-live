import Submission from "../models/Submission.js";

export const submitTask = async (req, res) => {
  const submission = await Submission.create({
    user: req.user.id,
    task: req.body.taskId,
    answer: req.body.answer
  });

  res.json(submission);
};
