import config from "../../config/index.js";
import mongoose from "mongoose";

const { mongodbUri } = config 

const connectMongoDB = async() => {
    try {
        await mongoose.connect(mongodbUri)
        console.log("DB connected sucessfully!")
    } catch (err: any) {
        throw new Error(`ERROR connecting to the mongo DB!: ${err.message || err}`)
    }
} 

export default connectMongoDB