import mongoose from "mongoose";

const connectDb=async() =>{
    try{
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("DataBase connected")
    } catch(error){
        console.log(`DataBase Error ${error}`)

    }
}

export default connectDb