const Review = require('../models/reviewModel')
// const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const Booking = require('../models/bookingModel');
// const AppError = require('../utils/appError')
// const catchAsync = require('../utils/catchAsync')
const {deleteOne,updateOne,createOne,getOne, getAll} = require('./handlerFactory');
const AppError = require('../utils/appError');



// exports.getAllReviews = catchAsync( async(req,res,next) => {
//     let filter={}
//     if(req.params.tourId)filter = {tour:req.params.tourId}

//     const reviews = await Review.find(filter)

//     res.status(200).json({
//         status:'success',
//         result: reviews.length,
//         data:{
//             reviews
//         }
//     })

// })
exports.getAllReviews = getAll(Review)

exports.setTourUserIds = (req,res,next)=>{

    if(!req.body.tour)req.body.tour = req.params.tourId
    if(!req.body.user)req.body.user = req.user._id
    next()
}

exports.createReview = createOne(Review)
//  catchAsync(async (req,res,next)=>{
//     //Allows nested routes
//     

//     const newReview = await Review.create(req.body)
    
//     res.status(201).json({
//         status:'success',
//         data:{
//             review:newReview
//         }
//     })

// })

// exports.getReview = catchAsync(async (req,res,next) => {

//     const review = Review.findById(req.params.id)

//     if(!review){
//         return next(new AppError('no review found with that id',404))
//       }

//     res.status(200).json({
//         status:'success',
//         data:{
//             review
//         }
//     })
// })

exports.checkBooked =catchAsync(async (req,res,next)=>{
    //check if user who wants to write review has booked tour
    
    const booking = await Booking.find({user:req.body.user})
    
    if(booking.length < 1)next(new AppError('you can not review tour that you have not booked',400))
    next()
})

exports.getReview = getOne(Review)

// exports.patchReview = catchAsync(async(req,res,next)=>{

//     const reviewCheck = Review.findById(req.params.id)

//     if(!reviewCheck){
//         next(new AppError('no review found with that id',404))
//     }

//     if(req.user.id != reviewCheck.user.id){
//         next(new AppError('you are not the author of review',403))
//     }


//     const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
//         new: true,
//         runValidators: true,
//       });


//     res.status(200).json({
//         status:'success',
//         data:{
//             review
//         }
//     })


// })

exports.patchReview= updateOne(Review)

// exports.deleteReview = catchAsync(async(req,res,next)=>{

//     const reviewCheck = await Review.findById(req.params.id)
    
//     if(!reviewCheck){
//         next(new AppError('no review found with that id',404))
//     }

//     if(req.user._id != reviewCheck.user._id){
//         next(new AppError('you are not the author of review',403))
//     }

//     await Review.findByIdAndDelete(req.params.id)


    

//     res.status(204).json({
//         status:'success',
//         data:null
//     })
// })

exports.deleteReview = deleteOne(Review)