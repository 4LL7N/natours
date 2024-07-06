const express = require('express')
const {getMonthlyPlan,getTourStats,getAllTours,CreateTour,getTour,PatchTour,deleteTour,aliasTopTours,getToursWithin,getDistances,uploadTourImages,resizeTourImages} = require('../controllers/tourController')
const {protect,restrictTo} =require('../controllers/authController')
// const {getAllReviews,createReview,getReview,patchReview,deleteReview} = require('../controllers/reviewController')
const reviewRouter = require('./reviewRoute')

const router = express.Router()

//POST /tour/23948fje(tour id)/review
//GET /tour/23948fje(tour id)/review
//POST /tour/23948fje(tour id)/review/2345242ef(review id)

// router
//     .route('/:tourId/reviews')
//     .post(protect,restrictTo('user'),createReview)

//shorten code of what is above this , make this to not repeat same code
router.use('/:tourId/reviews',reviewRouter)


router.route('/top-5-cheap').get(aliasTopTours,getAllTours)
// router.param("id",checkID)

router.route('/tour-stats').get(getTourStats)

router.route('/monthly-plan/:year').get(protect,restrictTo('admin','lead-guide','guide'),getMonthlyPlan)

router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(getToursWithin)
// /tours-distance?distance=223&center=-40,45&unit=mi could do lke this
// /tours-within/223/center/-40,45/unit/mi but this is way cleaner

router.route('/distance/:latlng/unit/:unit').get(getDistances)

router
    .route('/')
    .get(getAllTours)
    .post(protect,restrictTo('admin','lead-guide'),CreateTour);

router
    .route('/:id')
    .get(getTour)
    .patch(protect,restrictTo('admin','lead-guide'),uploadTourImages,resizeTourImages,PatchTour)
    .delete(protect,restrictTo("admin","lead-guid"),deleteTour);




module.exports = router