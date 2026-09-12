import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from 'uuid'

export interface IUser extends Document {
  firstName: string;
  middleName?: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: Date;
  gender: "male" | "female" | "other";
  avatar: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    middleName: {
      type: String,
      trim: true,
      maxlength: [50, "Middle name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: [true, "Gender is required"],
    },
    avatar: {
      type: String,
      default: "", // will be set during registration based on gender
    },

    // Email Verification (for later)
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    // Forgot Password
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Virtual for full name
userSchema.virtual("fullname").get(function (this: IUser){
  return [this.firstName, this.middleName, this.lastName]
    .filter(Boolean)
    .join(" ")
})

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

export default userSchema