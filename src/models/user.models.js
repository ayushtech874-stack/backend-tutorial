import mongoose , {Schema} from "mongoose"
 import bcrypt from "bcrypt"
 import jwt from "jsonwebtoken"

 // pre hook is mongoose middleware 
 // used to encrypt the password
const userSchema = new Schema({
    username: {
        type: String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index: true // searching field enable without this also it will work 
    },
    email:{
        type: String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true
    },
    fullname : {
        type: String,
        required : true,
        index: true,
        trim : true
    },
    avatar:{
        type : String, // cloudinary url
        required : true,
    },
    coverImage: {
        type: String, // cloudinary url
    },
    watchHistory: [
        {
            type:Schema.Types.ObjectId,
            ref:"Video"

        }    
    ],
    password : {
        type : String,
        required : [true, "Password is required"]
    },
    refreshToken:{
        type : String
    }
},{timestamps:true})

userSchema.pre("save",async function (next) {
    if(!this.isModified("password")) return next();
    this.password =await bcrypt.hash(this.password,10)
    next()
    //10 is round
    //we need to add condition so that it doesnt encrypt again and again on every save
})

// bcrypt and bcrypt js use any, 
// used for hashing the password
// here we are using bcrypt

// for token we will use jwt library 
// jsonwebtoken (it has 3 part : header , payload , verifier)

// Method making for validation
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password , this.passsword)
    // returns true and false 
    // password is what user typed
}

// JWT is a bearer token like a key to access 
// here we are using cookies and sessions for better security 
// access token wont store in DB refresh token will be

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id : this._id,
            email:this.email,
            username:this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
    expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User",userSchema)