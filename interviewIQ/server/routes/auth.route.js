import express from "express"
import { googleAuth, logoutUser } from "../controllers/auth.controller.js"
const authrouter =express.Router()

authrouter.post("/google",googleAuth)
authrouter.get("/logout",logoutUser)




export default authrouter