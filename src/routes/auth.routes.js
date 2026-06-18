import { Router } from "express";

const authRouter = Router();

authRouter.get("/", authController.getLogin);

export default authRouter;
