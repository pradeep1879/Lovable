import express  from 'express'
import { authMiddleware } from '../middleware/auth.middleware';
import { createUserProject, getUserCredits, getUserProject, purchaseCredits, togglePulished, userProjects } from '../controllers/user.controller';
const userRouter = express.Router();

 userRouter.get("/credits", authMiddleware, getUserCredits)
 userRouter.post("/project", authMiddleware, createUserProject)
 userRouter.get("/project/:projectId", authMiddleware, getUserProject)
 userRouter.get("/projects", authMiddleware, userProjects)
 userRouter.get("/publish-toggle/:projectId", authMiddleware, togglePulished)
 userRouter.post("/purchase-credits", authMiddleware, purchaseCredits)
 
export default userRouter;
