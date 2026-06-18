import app from "./src/app.js";
import connectDB from "./src/config/database.js";
import config from "./src/config/config.js";

connectDB();
app.listen(config.PORT, () => {
  console.log("server is running at :", `http://localhost:${config.PORT}`);
});
