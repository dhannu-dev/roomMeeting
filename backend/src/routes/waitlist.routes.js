import { Router } from "express";
import { createWaitlist } from "../controller/waitlist.controller.js";

const router = Router();

router.post("/", createWaitlist);

export default router;
