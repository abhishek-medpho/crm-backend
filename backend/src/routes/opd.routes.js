import { Router } from "express";
import opdController from "../controllers/OPD.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();
const OpdController = new opdController();

router.route("/getOPDBookings").get(verifyJWT, OpdController.getOPDBookings);
router.route("/getDoctorPortfolio").get(verifyJWT, OpdController.getDoctorPortfolio);
router.route("/getMeetings").get(verifyJWT, OpdController.getMeetings);
router.route("/getMatrix").get(verifyJWT, OpdController.getMatrix);

export default router;
