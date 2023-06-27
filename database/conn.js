import mongoose from "mongoose";

async function connect() {
  try {
    await mongoose.connect(
      process.env.MONGOOSE_QUERY_STRING,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Database Connected");
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
}

export default connect;
