import {Router} from "express"
import {refreshAccessToken,
     registerUser ,
      loginUser,
      logoutUser,
      changeCurrentPassword,
      getCurrentUser, 
      updateUserAvatar, 
      updateUserCoverImage,
      getUserChannelProfile, 
      getWatchHistory, 
      updateAccountDetails} from "../controllers/user.controller.js";

import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

//router.route("/register").post(registerUser)
router.route("/register").post(
upload.fields([
    {
        name : "avatar",
        maxCount:1
    },
    {
        name: "coverImage",
        maxCount:1
    }
]),
    registerUser
)

router.route("/login").post(loginUser)
//securedRoutes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
// in this route verifyJWT is not needed no middleware required in this logic

router.route("/change-password").post(verifyJWT, changePassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)


// here params are used so this syntax is used to get the username from the url and then we can use it in the controller to get the user profile
//and the name here username should match with the name in the controller where we are getting the username from the params
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router

//middleware: jaate hue mil lena
// to add this middleware we will be using it in route 
// we can add multiple middleware in same route