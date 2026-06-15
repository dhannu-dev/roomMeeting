import { Router } from "express";
import { createRoom, getAllRooms, getRoomAvailability } from "../controller/room.controller.js";

const router = Router();

router.post("/create", createRoom);
router.get("/", getAllRooms);
router.get("/:id/availability", getRoomAvailability);

export default router;
