/*
There are two ways to connect to a database 

*/

// WAY 2: Using mongoose.connect() method in a separate file and then importing it in index.js
// Way 2 is more preferred as it is more modular and can be used in other files as well.
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from "./app.js";
dotenv.config
({
    path: './.env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000 , () => {
        console.log(`App is listening on port ${process.env.PORT || 8000}`);
    })
})
.catch((err) => {
    console.log("Mongo DB connection error: ", err);
})






/*

WAY 1: Using mongoose.connect() method
import express from "express";
const app = express()
// writing express app code here itself is not a good practice as it will make the code messy and hard
//  to maintain. So we will create a separate file for the express app and import it here.
// Express app code is in app.js file and we will import it here.
// we get listen and all from the express app instance which we will import from app.js file.
;(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) =>{
            console.log("ERR: ",error);
            throw error
        })
        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    }
    catch(error){
        console.log("Error: ", error)
        throw err
    }
})()

*/