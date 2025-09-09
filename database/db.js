import mongoose from 'mongoose';
dotenv.config()

const connectToDB = async(req,res)=>{
    try {
       mongoose.connect(process.env.MONGO_URI)
       console.log("MongoDB connected Successfully!");
       
    } catch (error) {
        console.log("MongoDB connection failure: ",error);
        process.exit(1)

    }
}


export default connectToDB;