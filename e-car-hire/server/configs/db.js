import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log("Database is connected"));
        mongoose.connection.on('error', (err) => console.error("MongoDB connection error:", err.message));

        const mongoUri = process.env.MONGODB_URI?.trim();
        if (!mongoUri) throw new Error("Missing MONGODB_URI environment variable");

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
        });
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
}

export default connectDB;