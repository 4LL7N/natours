const AppError = require("../utils/appError")

const handleCastErrorDB = err => {
  const message = `Invalid  ${err.path}: ${err.value}. `
  return new AppError(message,400)
}

const handleDuplicateFieldsDB = err => {
  const value = Object.values(err.keyValue)[0]
  const message = `Duplicate field value: ${value} PLease use another value`

  return new AppError(message,400)
}

const handleValidationErrorDB = err => {

  const errors = Object.values(err.errors).map(el => el.message)

  const message = `Invalid input data. ${errors.join('. ')}`
  return new AppError(message,400)
}

const handleJWTError = () => new AppError('Invalid Token. Please log in again!',401)

const handleJWTExpiredError = () => new AppError('Your token has expired, please login again',401)

const sendErrorDev = (err,req,res)=>{
  //API
  if(req.originalUrl.startsWith('/api')){

    res.status(err.statusCode).json({
    status:err.status,
    error:err,
    message:err.message,
    stack:err.stack
  })
  }else{
    //RENDERED WEBSITE
    console.error(err);
    res.status(err.statusCode).render('error',{
      title:'Something went wrong',
      msg:err.message
    })  
  }
}

const sendErrorProd = (err,req,res)=>{
  //A) api
  if(req.originalUrl.startsWith('/api')){
    //A)  Operational, trusted error: send message to client
    if(err.isOperational){

      return res.status(err.statusCode).json({
        status:err.status,
        message:err.message
      })
    
    }
    //B)Programming or other unknown error: don't leak error details 
      // 1) LOg error
      console.error(err);
      //2) send generic message
      return res.status(500).json({
        status:'error',
        message:'Something went very wrong'
      })
    
  }
    //B) RENDER WEBSITE
    // A)
    if(err.isOperational){
      return res.status(err.statusCode).render('error',{
        title:'Something went wrong',
        msg:err.message
      }) 
    }
    //B)
      // 1) LOg error
      //2) send generic message
      return res.status(err.statusCode).render('error',{
        title:'Something went wrong',
        msg:'please try again'
      }) 
    
  }



  


module.exports = (err,req,res,next)=>{

    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'

  if(process.env.NODE_ENV == 'development'){
    sendErrorDev(err,req,res)
  }else if(process.env.NODE_ENV == 'production'){
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    let error = err

    // invalid id
    if(error.name === 'CastError') error =  handleCastErrorDB(error)
    
    //Duplicate field (example:name that already exist) with error code
    if(error.code == 11000) error = handleDuplicateFieldsDB(error)

    if(error.name == 'ValidationError') error =  handleValidationErrorDB(error)

    if(error.name == 'JsonWebTokenError') error = handleJWTError(error)

    if(error.name == 'TokenExpiredError') error = handleJWTExpiredError(error)

    sendErrorProd(error,req,res)
  }    
}