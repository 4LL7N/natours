const mongoose = require('mongoose');
const slugify = require('slugify');
// EMBEDDING
// const User = require('./userModel')
//const validator = require('validator') //library fro validation

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal than 10 characters'],
      // validate: [validator.isAlpha,'Tour name must oly contain characters']
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      require: [true, 'A tour must have duration'],
    },
    maxGroupSize: {
      type: Number,
      require: [true, 'A tour must have group size'],
    },
    difficulty: {
      type: String,
      require: [true, 'A tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy,medium,difficulty',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0 '],
      max: [5, 'Rating must be below 5.0 '],
      //this runs when new value is set
      set:val=>Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (value) {
          //this only points to current doc on new document creation (patch , update)
          return value < this.price; // 100<200 error will be when this return false
        },
        message: 'Discount price ({VALUE}) should be below the regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      require: [true, 'a tour must have description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      require: [true, 'a tour must have cover image'],
    },
    images: {
      type: [String],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: {
      type: [Date],
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
        // also acn be polygons or lines or other geometries
      },
      coordinates: [Number], //first longitude second latitude,
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number], //first longitude second latitude,
        address: String,
        description: String,
        day:Number
      },
    ],
    //EMBEDDING
    // guides:{
    //   type:Array
    // }
    guides:[
      {
        type:mongoose.Schema.ObjectId,
        ref:'User'
      }
    ],
    // child referencing but instead we using Virtual populating
    // reviews:[
    //   {
    //     type:mongoose.Schema.ObjectId,
    //     ref:'Review'
    //   }
    // ]
    
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

// tourSchema.index({price:1})
tourSchema.index({price:1,ratingsAverage:-1})
tourSchema.index({slug:1})

tourSchema.index({startLocation:'2dsphere'})//telling that start location should be indexed to a 2d sphere 

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//virtual populate
tourSchema.virtual('reviews', {
  ref:'Review',
  foreignField:'tour',
  localField:'_id'
})

//DOCUMENT MIDDLEWARE: RUNS BEFORE .SAVE() AND .CREATE()

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//EMBEDDING
// tourSchema.pre('save', async function(next){
//   const guidesPromises = this.guides.map(async id => await User.findById(id) )
//   this.guides =  await Promise.all(guidesPromises)
//   next()
// })


// tourSchema.pre('save', (next) => {
//   console.log('will save document..');
//   next()
// })

// tourSchema.post('save',  (doc,next) => {
//   console.log(doc);
//   next()
// })

//QUERY MIDDLEWARE

// tourSchema. pre('find', function(next){
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

// tourSchema. pre('findOne', function(next){
//   this.find({secretTour: {$ne : true}})
//   next()
// })

tourSchema.pre(/^find/, function(next){
  this.populate({
    path:'guides',
    select:'-__v -passwordChangedAt'
  });
  next()
})

tourSchema.post(/^find/, function (doc, next) {
  console.log(`query took  ${Date.now() - this.start} millisecond`);
  // console.log(doc);
  next();
});


//AGGREGATION MIDDLEWARE

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
