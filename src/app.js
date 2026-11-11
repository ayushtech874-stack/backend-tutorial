import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express()

// we will need packages like CORS , cookie-parser ,
// app.use() -> for middlewares and cors and configs

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))
// body parser was used before for this limit , multer is also there
app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended : true , limit: "16kb"}))
// here inside urlencoded its not necessary to write anything still it will work

app.use(express.static("public"))
// public is just a folder(to keep any assets)

app.use(cookieParser())

//routes import

import userRouter from './routes/user.routes.js'

//routes declaration


app.use("/api/v1/users",userRouter)

// url : https://localhost:8000/api/v1/users/register
// when someone goes to /users the control will be given to userRouter  

export {app}