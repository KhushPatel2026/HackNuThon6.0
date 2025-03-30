const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plaidAccessToken: { type: String }, // Store Plaid access token
  senderDetails: { // Store sender details
    name: String,
    accountNumber: String,
    routingNumber: String,
    ip: String,
  },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;