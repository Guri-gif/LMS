import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs"
import jwt from  "jsonwebtoken"

const userSchema = new Schema(
  {
    fullName: {
      type: `String`,
      required: [true, `Name is Required`],
      minLength: [5, `Name must be 5 character`],
      maxLength: [25, `Name should be less than 25 character`],
      lowercase: true,
      trim: true,
    },
    email: {
      type: `String`,
      required: [true, `email is Required`],
      lowercase: true,
      trim: true,
      unique: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        `Please fill a valid email address`,
      ],
    },
    password: {
      type: `String`,
      required: [true, `Password is required`],
      minLength: [8, "Password must atleast 8 character long"],
      select: false,
      match: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        `Please enter a valid password`
    ]
    },
    avatar: {
      public_id: {
        type: `String`,
        unique: true,
      },
      secure_url: {
        type: `String`,
      },
    },
    role: {
        type: `String`,
        enum: [`USER`, `ADMIN`],
        default: `USER`
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre(`save`, async function(next){
    if(!this.isModified(`password`)){
        return next()
    }
    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods = {
    generateJWTToken: async function(){
        return await jwt.sign(
            {
                id: this.id, email: this.email, subscription: this.subscription, role: this.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRY,
            }
        )
    },
    comparePassword: async function(plainTextPassword){
      return await bycrypt.compare(plainTextPassword, this.password)
    }
}
const User = model (`User`, userSchema);

export default User;
