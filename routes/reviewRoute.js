const express = require('express')
const {getAllReviews,createReview,getReview,patchReview,deleteReview,setTourUserIds, checkBooked} = require('../controllers/reviewController')
const {protect,restrictTo} =require('../controllers/authController')

const router = express.Router({mergeParams:true})

///POST /tour/23948fje(tour id)/review
//GET /tour/23948fje(tour id)/review
//POST /reviews

router.use(protect)

router
    .route('/')
    .get(getAllReviews)
    .post(restrictTo('user'),setTourUserIds,checkBooked,createReview)
    
router
    .route('/:id')
    .get(getReview)
    .patch(restrictTo('user','admin'),patchReview)
    .delete(restrictTo('user','admin'),deleteReview)


module.exports = router