import mongoose from "mongoose"

const connectDB = async () => {
    try {
        // Log when connection is established
        mongoose.connection.on("connected", () => {
            console.log("MongoDB connected...")
        })

        // Log errors
        mongoose.connection.on("error", (err) => {
            console.log("MongoDB connection error:", err)
        })

        // Log when disconnected
        mongoose.connection.on("disconnected", () => {
            console.log("MongoDB disconnected")
        })

        // Connect to MongoDB
        await mongoose.connect(`${process.env.MONGODB_URI}`)

    } catch (error) {
        console.log("MongoDB connection failed:", error.message)
        process.exit(1)
    }
}

export default connectDB