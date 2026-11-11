import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId) =>{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //refresh token in DB
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false}) 

        return {accessToken, refreshToken}
    }
    catch(error)
    {
        throw new ApiError(500,"Something went Wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler ( async (req,res) => {
    /*return res.status(200).json({
        message: "ok"
    })
    //return not neccessary
    */

    const {fullname, email, username, password} = req.body
    console.log("email: ",email)
    /*
    if(fullname === "")
    { 
        throw new ApiError(400,"FullName is required")
    }
    */
    if(
        [fullname,email,username,password].some((field) => 
            field?.trim() === "")
        )
    {
        throw new ApiError(400, "All fields are required")
    }
    // we can write validations more strictly
    //checking for already existing user
    // using $or to check multiple things in the form of objects in an array
    const existedUser =await User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser)
    {
        throw new ApiError(409 , "User with email or username already exists")
    }

    //req.body comes with data from express
    //multer gives files access also
    //console.log(req.files)

    const avatarLocalPath= req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    //the above line has an issue that we are not 100% sure that cover image will be there or not 
    //So we will be tackling it in a different way 
    // one thing on console.log we understood that is cloudinary sends response in objects of array format
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 )
    {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    if(!avatarLocalPath)
    {
        throw new ApiError(400, "Avatar file is required")
    }

    // upload them to cloudinary (cloudinary.js)
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar)
    {
        throw new ApiError(400, "Avatar not Found!")
    }

    // database entry 

    const user = await User.create(
        {
            fullname,
            avatar: avatar.url,
            coverImage : coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        }
    )
    //check if user is there or not 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
        // this fields will not come 
    )
    //here database calling is more less optimal
    if(!createdUser)
    {
        throw new ApiError(500 , "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully")
    )
})

const loginUser = asyncHandler(async(req,res)=> {
    const {email,username , password} = req.body
    //login on email or username or both 
    if(!username && !email)
    {
        throw new ApiError(400,"username or email is required") 
    }

    //checking for registered user either username or email
    const user = await User.findOne({
        $or: [{username},{email}]
        //find either on the basis of username or email
    })
    if(!user)
    {
        throw new ApiError(404,"User does not exist")
    }
    //check for password 
    //await User. // you will not get coz this is mongoose object 
    //we need to check it using our created object that is user
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid)
    {
        throw new ApiError(401,"Invalid User Credentials")
    }

    // refresh and access token generation is done multiple times 
    // so wrap it up in seperte method and call whenever you need
    // this method can take time so use await
    const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id)

    // send in cookies
    // so decide now what all to send 

    //calling database is expensive so do it wisely 
    // see this part lect 15 26 mins

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //send cookies options

    const options = { 
        httpOnly : true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {   // this is payload / data
                //sending this here again if user wants to save access
                //and refresh again in his own DB(depending on case)
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req,res) => {
    // to logout 
    //1. find user and clear cookies 
    //2. delete refreshToken in user.models.js
    // we cant find user by id because we cant ask users from themshelves 
    // because in this way user can enter any email or username to logout anyone 
    // so to solve this we will use our own middleware 
    // custom middleware designing to tackle this problem
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    )

    const options= {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged Out"))
})

//endpoint where access token will get refreshed
const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    //req,body if we are getting mobile data
    if(!incomingRefreshToken)
    {
        throw new ApiError(401,"Unauthorised Request")
    }
    try{
        const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)
    if(!user)
    {
        throw new ApiError(401,"Invalid refresh token")
    }

    if(incomingRefreshToken !== user?.refreshToken)
    {
        throw new ApiError(401,"Refresh Token is expired or used")
    }

    const options = {
        httpOnly:true,
        secure:true
    }

    const {accessToken , newRefreshToken} = await generateAccessAndRefreshTokens(user._id)

    return res
    .status(200)
    .cookie("accessToken",accessToken , options)
    .cookie("refreshToken",newRefreshToken, options)
    .json(
        new ApiResponse(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "Access Token refreshed"
        )
    )
    }
    catch(error)
    {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }
    
})

const changeCurrentPassword = asyncHandler(async(req,res) =>{
    const {oldPassword , newPassword} = req.body
    // if one can change the password then definetely he is still active/logged in 
    //so we directly take user by middleware we created and saved in req.user
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect)
    {
        throw new ApiError(400 , "Wrong old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200),{},"Password changed successfully")
})


const getCurrentUser = asyncHandler(async(req,res) =>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res) =>{
    const {fullname,email} = req.body

    if(!fullname || !email)
    {
        throw new ApiError(400 , "All fields are required")
    }

    const user =await  User.findByIdAndUpdate
    (
        req.user?._idid,
        {
            //mongodb operator
            $set : {
                fullname,
                email : email
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"account details updated successfully"))
})

//File updates
// add middlewares especially multer
const updateUserAvatar = asyncHandler(async(req,res) => {
    //req.files / req.file(one file) from multer middleware
    const avatarLocalPath =  req.file?.path

    if(!avatarLocalPath)
    {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalpath)

    if(!avatar.url)
    {
        throw new ApiError(400,"error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")
    

    
    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar Image is updated")
    )
})

const updateUserCoverImage = asyncHandler(async(req,res) => {
    //req.files / req.file(one file) from multer middleware
    const coverImageLocalPath =  req.file?.path

    if(!coverImageLocalPath)
    {
        throw new ApiError(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalpath)

    if(!coverImage.url)
    {
        throw new ApiError(400,"error while uploading on coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Cover Image is updated")
    )
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

export {
    registerUser,
    loginUser, 
    logoutUser, 
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}