import 'dotenv/config'
import express,  {type  Request, type Response} from 'express'
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';
import userRouter from './src/routes/user.routes';
import projectRouter from './src/routes/project.routes';

const app = express();
const port = 3000;

app.use(express.json({limit:'50mb'}))

const corsOptions = {
    origin: process.env.TRUSTED_ORIGINS?.split(',') || [],
    credentials: true,
}
app.use(cors(corsOptions))

app.all('/api/auth/{*any}', toNodeHandler(auth))

app.get("/", (req:Request, res:Response) =>{
  res.send("Server is live")
})

app.use("/api/v1/user", userRouter)
app.use("/api/v1/project", projectRouter)

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});