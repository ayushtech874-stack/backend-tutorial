class ApiResponse{
    constructor(statusCode,data,message="Success"){
        this.statusCode = statusCode
        this.data = data
        this.message= message
        this.success = statusCode < 400
    }

}
export {ApiResponse}
// There are different types of status code
/*
// Generally memo is given for this type of codes
1. informational responses (100-199)
2. successful responses (200-299)
3. redirection messages (300-399)
4. client error responses (400-499)
5. server error responses (500-599)
*/