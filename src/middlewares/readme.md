#middleware

/instagram              (req,res)
                        res.send("ayush")

to check something in middle to check for the 
authentication of the user 

that is before sending the response we check for 
something like authenticate it 
this is done using middleware 

(err, req, res, next)

next is a flag it indicate that it worked 
go ahead 

Middleware is like you are going to something so just you need to check or meet middleware once