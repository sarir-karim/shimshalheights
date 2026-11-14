import bcrypt from "bcrypt";
import mongoose from "mongoose";

const BCRYPT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["admin", "staff"], default: "staff" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// The hash must never leave the server, whichever way the document is serialised.
const stripSecrets = (_doc, ret) => {
  delete ret.password;
  delete ret.__v;
  return ret;
};
userSchema.set("toJSON", { transform: stripSecrets });
userSchema.set("toObject", { transform: stripSecrets });

export const User = mongoose.model("User", userSchema);
