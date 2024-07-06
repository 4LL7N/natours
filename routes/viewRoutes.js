const express = require('express');
const {getOverview,getTour,Login,getAccount,updateUserData,getMyTours, Signup} = require('../controllers/viewController')
const {isLoggedIn, protect} = require('../controllers/authController')
const {createBookingCheckout} = require('../controllers/bookingController')


const router = express.Router();


router.get('/',createBookingCheckout,isLoggedIn,getOverview );
router.get('/tour/:slug',isLoggedIn,getTour );
router.get('/login',isLoggedIn,Login );

// /login
router.get('/signup',Signup)
router.get('/me',protect,getAccount)
router.get('/my-tours',protect,getMyTours)

router.post('/submit-user-data',protect,updateUserData)

module.exports = router;