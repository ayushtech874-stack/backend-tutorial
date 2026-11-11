import multer from "multer"
 

//DiskStorage or MemoryStorage 
// we are using diskstorage

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ 
    storage,
    // storage : storage (not needed in ES6) 
})

//function (req , file ,cb)
//file access is in multer and express file upload
//cb is call back fnc