import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dns from "node:dns"; // 1. Add this import
// 2. Set public DNS servers (Google & Cloudflare) to resolve MongoDB SRV records
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}


export default connectDB