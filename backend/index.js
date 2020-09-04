const express = require("express");
const app = express();
const authRoute = require("./verify");

app.use(express.json());

app.use("/api/verify", authRoute);
app.listen(3002, () => {
  console.log("Server Up and Running.");
});