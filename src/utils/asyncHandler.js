// we are going to use 2 ways 
// try catch and other one is using promises 
// Way 1 : promises (Modern Code)
const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))

    }
}

export {asyncHandler}


/*
we should generalise api response and errors in similar way of its 
content displaying
So lets make AppError.js
*/



/*

//way 2: Try catch
//const asyncHandler = () => {}
//const asyncHandler = (func) => () => {}
//const asyncHandler = (func) => async () => {}


const asyncHandler = (fn) => async  (req , res , next) => {
    //higher order function 
    // which can return also or can be stored 
    // in the variable
    try{
        await fn(req,res,next)
    }
    catch(error)
    {
        res.status(error.code || 500).json({
            success : false,
            message : error.message
        })
    }
}
    */
