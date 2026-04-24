import type {Request, Response, NextFunction } from "express";
import { auth } from "../../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { setEmitFlags } from "typescript";

export const authMiddleware = async(req:Request, res:Response, next:NextFunction) =>{
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    })

    if(!session || !session?.user){
      return res.status(401).json({message: "Unauthorized user"})
    }

    req.userId = session?.user.id;
    next();
  } catch (error:any) {
    res.status(401).json({ message: error.code || error.message });
  }
}