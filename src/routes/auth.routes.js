import { Router } from "express";
import authController from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.get("/get-me", authController.getMe);
authRouter.post("/signUp", authController.postSignUp);
authRouter.get("/refresh-token", authController.refreshToken);
authRouter.post("/logOut", authController.postLogOut);
authRouter.post("/logOut-all", authController.logOutAll);

export default authRouter;
