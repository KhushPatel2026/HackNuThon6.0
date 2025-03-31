const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  accountBalance: { type: Number, default: 0 },
});

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
