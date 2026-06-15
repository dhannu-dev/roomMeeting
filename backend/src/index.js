import "dotenv/config";

import { connectDB } from "./config/db.js";
import app from "./app.js";

const PORT = Number(process.env.PORT) || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("Mongodb connection failed", error);
  });
