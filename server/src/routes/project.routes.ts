import express  from 'express'
import { authMiddleware } from '../middleware/auth.middleware';
import { deleteProject, getProjectById, getProjectPreview, getPublishedProjects, makeRevision, rollbackToVersion, saveProjectCode } from '../controllers/project.controller';
const projectRouter = express.Router();

projectRouter.post("/revision/:projectId", authMiddleware, makeRevision)
projectRouter.post("/save/:projectId", authMiddleware, saveProjectCode)
projectRouter.post("/rollback/:projectId/:versionId", authMiddleware, rollbackToVersion)
projectRouter.delete("/:projectId", authMiddleware, deleteProject)
projectRouter.get("/preview/:projectId", authMiddleware, getProjectPreview)
projectRouter.get("/published", authMiddleware, getPublishedProjects)
projectRouter.get("/published/:projectId", authMiddleware, getProjectById)

export default projectRouter;
