import express from "express";
import { submitTask } from "../controllers/submission.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", auth, submitTask);

export default router;
