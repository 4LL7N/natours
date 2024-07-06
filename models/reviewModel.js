const mongoose = require('mongoose'); 
const Tour = require('./tourModel');
const AppError = require('../utils/appError');

// review / rating / createdAt / ref to tour / ref to user

const reviewSchema = new mongoose.Schema({
    review:{
        type:String,
        require:[true,'review can not be empty!']
    },
    rating:{
        type:Number,
        min:[0,"rating must be greater or equal 0"],
        max:[10,"rating must be less or equal 10"]
    },
    createAt:{
        type:Date,
        default: Date.now(),
        // select: false,
    },
    tour:{
        type:mongoose.Schema.ObjectId,
        ref:'Tour',
        require:[true, 'Review must belong to tour.']
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        require:[true, 'Review must belong to tour.']
    }
},
{
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },)



//DOCUMENT MIDDLEWARE: RUNS BEFORE .SAVE() AND .CREATE()



//QUERY MIDDLEWARE

reviewSchema.index({tour:1,user:1},{unique:true})

reviewSchema.pre(/^find/, function(next){
    this.populate({
        path:'tour',
        select:'name '
    }).populate({
        path:'user',
        select:'name photo'
    });;
    next()

//     // this.populate({
//     //         path:'user',
//     //         select:'name photo'
//         // });;
//         next()
})


reviewSchema.post(/^find/, function (doc, next) {
    console.log(`query took  ${Date.now() - this.start} millisecond`);
    // console.log(doc);
    next();
  });

reviewSchema.statics.calcAverageRatings = async function(tourId){
    // console.log(tourId," tourrr id");
    // console.log(this, "thissss");
    
    //  const tourr =await Tour.findById(tourId)
    // const tour = await this.aggregate([
    //     {
    //         $match:{tour:tourId}
    //     }
    // ])
    // console.log(tour, " touuuurr");
    const stats = await this.aggregate([
        {
            $match:{tour:tourId}
        },
        {
            $group:{
                _id:'$tour',
                nRating:{$sum:1},
                avgRating: {$avg:'$rating'}
            }
        }
    ])
    
    if(stats.length>0){
    await Tour.findByIdAndUpdate(tourId,{
        ratingsQuantity:stats[0].nRating,
        ratingsAverage:stats[0].avgRating
    })
    }else{
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity:0,
            ratingsAverage:4.5
    })
    }
    // console.log(stats, "asdwd");.
}

reviewSchema.post('save',function(){
    //this points to current review

    
    // Review.calcAverageRatings(this.tour)
    //same thing dow, just Review is not declared at this point
    this.constructor.calcAverageRatings(this.tour)
    
})

// findByIdAndDelete
// findByIdAndDelete
// those order can be detected with  /^findOneAnd/ this


// reviewSchema.pre(/^findOneAnd/,async function(next){
//     this.r = await this.findOne()
//     console.log(this.r, "  find one");
//     next()
// })

reviewSchema.post(/^findOneAnd/,async function(doc,next){
    // await this.findOne(): does not work here, query has already executed
    // console.log(this.r);
    // console.log(this.r.constructor, "  this.r.constructor");
    // console.log(this.r.tour, "  this.tour");
    // await this.r.constructor.calcAverageRatings(this.r.tour._id)

    // console.log(doc.tour.id, "  doc id");
    // console.log(doc.constructor, "  doc constructor");

    //its getting argument that we can use instead of find it in other middleware nad save it into this.r to than use it here
    // console.log(doc);
    if(!doc.tour)next(new AppError('tour that this review must belong, does not exists or can not be find',404))
    await doc.constructor.calcAverageRatings(doc.tour._id)
})

const Review = mongoose.model('Review',reviewSchema)

module.exports = Review


//POST /tour/23948fje(tour id)/review
//GET /tour/23948fje(tour id)/review
//POST /tour/23948fje(tour id)/review/2345242ef(review id)