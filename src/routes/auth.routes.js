import { Router } from "express";
import authController from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.get("/get-me", authController.getMe);
authRouter.post("/signUp", authController.postSignUp);
authRouter.get("/refresh-token", authController.postRefreshToken);
authRouter.post("/logOut", authController.postLogOut);
authRouter.post("/logOut-all", authController.postLogOutAll);
authRouter.post("/login", authController.postLogin);

export default authRouter;
