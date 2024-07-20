const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync')

exports.alerts = (req,res,next)=>{
  const {alert} = req.query
  if(alert === 'booking' ){
    res.locals.alert = "Your booking was successful! Please check your email for a confirmation. if your booking doesn't show up here immediately, please come back later"
  }
  next()
}


exports.getOverview =catchAsync(async(req, res) => {

    //1) get tour data from collection
    const tours = await Tour.find()

    //2) Build template
    //3) render that template using tour data from 1)

    res.status(200).render('overview', {
      title: 'All Tours',
      tours
    });
})

exports.getTour =catchAsync(async(req, res,next) => {

    //1) get data, from the requested tour (including reviews and guides)
    const {slug} = req.params

    const tour = await Tour.findOne({slug}).populate({
        path:'reviews',
        fields:'review rating user'
    })

    if(!tour){
      return next(new AppError('There is no tour with that name',404))
    }

    //2) Build template 
    //3) render template using data from 1)
    res.status(200).render('tour', {
      title: `${tour.name} Tour`,
      tour
    });
})

exports.Login = (req,res)=>{
    res.status(200).render('login', {
      title:'Log into your account'
    });
}

exports.Signup = (req,res)=>{

  res.status(200).render('signup', {
    title:'sign up your account'
  });
}

exports.getAccount = (req,res)=>{

    res.status(200).render('account', {
      title:'Your account'
    });
}

exports.getMyTours=catchAsync(async (req,res,next)=>{
  //1) find all bookings
  const booking = await Booking.find({user:req.user.id})
  
  
  //2) find tours with the returned IDs
  const tourIDs = booking.map(el => el.tour)
  //$in finds every id that are in toursIDs array
  const tours = await Tour.find({_id:{$in:tourIDs}})


  res.status(200).render('overview',{
    title:'My Tours',
    tours
  })
})

exports.updateUserData =catchAsync(async (req,res) => {

  // console.log('UPDATE USER' , req.body);

  const UpdateUser = await User.findByIdAndUpdate(req.user.id,{
    name:req.body.name,
    email:req.body.email
  },
  {
    new:true,
    runValidators:true
  }
  )
  res.status(200).render('account', {
    title:'Your account',
    user:UpdateUser
  });
})