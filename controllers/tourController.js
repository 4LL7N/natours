// const fs = require('fs');
// const express = require('express');
const multer = require('multer'); // img upload ext.
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
// const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./handlerFactory');

// const tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
//   );

// exports.checkID = (req,res,next,val) => {
//   // console.log(`tore id is:${val}`);
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid ID',
//     });
//   }
//   next()
// }

// exports.checkBody = (req,res,next) => {

//   if(!req.body.name || !req.body.price){
//     return res.status(400).json({
//       status:'fail',
//       message:'Missing name or price'
//     })
//   }
//   next()
// }

const multerStorage = multer.memoryStorage(); //file name is not set

const multerFilter = (req, file, cb) => {
  // testing if uploading file in format that we want, this time we check if file is image , if its image we pass true if not false with error
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('not an image! please upload only images', 400), false);
  }
};

// const upload = multer({dest:'public/img/users'});
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);
//if one field
// upload.array[name,maxCount] req.files
//if one image
//// upload.single[name] req.file

exports.resizeTourImages = catchAsync(async (req, res, next) => {

  if (!req.files.imageCover || !req.files.images) return next();

  // 1)Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) images
  req.body.images =[]
  await Promise.all(req.files.images.map(async(file,i) => {
    const filename = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`

    await sharp(file.buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${filename}`);

    req.body.images.push(filename)

    // putting everything in body for next function to change tour depending on body
  }))

  
  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summery,difficulty';
  next();
};

exports.getAllTours = getAll(Tour);
// catchAsync(async (req, res) => {
//   //made function to delete try catch block

//   // try {
//   // build query

//   //FILTER ONE

//   // 1A) FILTERING
//   // const queryObj = Object.assign({}, req.query);

//   // const excludeFields = ['page', 'sort', 'limit', 'fields'];

//   // excludeFields.forEach((el) => delete queryObj[el]);

//   // // console.log(req.query);

//   // //1B) FILTERING

//   // let queryStr = JSON.stringify(queryObj);
//   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
//   // // console.log(JSON.parse(queryStr));
//   // //{difficulty:'easy',duration:{$gte:5}}

//   // let query = Tour.find(JSON.parse(queryStr));

//   // const tours = await Tour.find()
//   //   .where('duration')
//   //   .equals(5)
//   //   .where('difficulty')
//   //   .equals('easy');

//   // 2)SORTING

//   // if(req.query.sort){
//   //   const sortBy = req.query.sort.split(',').join(' ')
//   //   console.log(sortBy);

//   //   query = query.sort(sortBy);
//   //   //sort('price ratingsAverage')
//   // }else{
//   //   query = query.sort('-createdAt')
//   // }

//   // if(req.query.fields){
//   //   const fields = req.query.fields.split(',').join(' ');
//   //   query = query.select(fields)
//   // }else{
//   //   query = query.select('-__v')
//   // }

//   //4) Pagination

//   // const page = req.query.page * 1 || 1
//   // const limit = req.query.limit * 1 || 100
//   // const skip = (page-1) * limit

//   // //page=2,limit=10 // 1-10 page 1 , 11-20 page 2 , ...
//   // query = query.skip(skip).limit(limit)

//   // if(req.query.page){
//   //   const numTours = await Tour.countDocuments();
//   //   if(skip >= numTours) throw new Error('this page does not exist')
//   // }

//   //send response

//   // execute query

//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();

//   const tours = await features.query;

//   //send response
//   res.status(200).json({
//     status: 'success',
//     // requestAt:res.requestTime,
//     result: tours.length,
//     data: {
//       tours,
//     },
//   });
//   // } catch (err) {
//   //   // console.log(err);
//   //   res.status(404).json({
//   //     status: 'fail',
//   //     message: err.message,
//   //   });
//   // }
// });

exports.getTour = getOne(Tour, { path: 'reviews' });
// exports.getTour = catchAsync(async (req, res, next) => {
//   // const id = req.params.id * 1
//   // const tour = tours.find((el) => el.id === id);

//   //made function to delete try catch block
//   // try {

//   const tour = await Tour.findById(req.params.id)
//     .populate('reviews')
//     //take this to the query middleware in tourModel
//     .populate({
//       path: 'guides',
//       select: '-__v -passwordChangedAt',
//     });

//     //take it back because , when we were fetching data and not showing guides, it was still there , because it was meddle ware , now its added manually in query and we can not to show it

//   if (!tour) {
//     return next(new AppError('no tour found with that id', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
//   // } catch (err) {
//   //   res.status(404).json({
//   //     status: 'fail',
//   //     message: err,
//   //   });
// });

exports.CreateTour = createOne(Tour);

// exports.CreateTour = catchAsync(async (req, res, next) => {
//   // const newId = tours[tours.length - 1].id + 1;
//   // const newTour = Object.assign({ id: newId }, req.body);

//   // tours.push(newTour);
//   // fs.writeFile(
//   //   `${__dirname}/dev-data/data/tours-simple.json`,
//   //   JSON.stringify(tours),
//   //   (err) => {
//   //     if(!err){
//   //     res.status(201).json({
//   //       status: 'success',
//   //       data: {
//   //         tour: newTour,
//   //       },
//   //     });
//   //   }
//   //   }
//   // );

//   // const newTour = new Tour({})
//   // newTour.save()

//   // same ==

//   //made function to delete try catch block

//   // try {
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
//   // } catch (err) {
//   //   res.status(400).json({
//   //     status: 'fail',
//   //     message: err,
//   //   });
//   // }
// });

exports.PatchTour = updateOne(Tour);

// exports. = catchAsync(async (req, res, next) => {
//   //made function to delete try catch block

//   // try {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!tour) {
//     return next(new AppError('no tour found with that id', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
//   // } catch (err) {
//   //   res.status(400).json({
//   //     status: 'fail',
//   //     message: err,
//   //   });
//   // }
// });

exports.deleteTour = deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   //made function to delete try catch block

//   // try {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('no tour found with that id', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
//   // } catch (err) {
//   //   res.status(400).json({
//   //     status: 'fail',
//   //     message: err,
//   //   });
//   // }
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
  //made function to delete try catch block

  // try{
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // _id:'$ratingsAverage',
        _id: { $toUpper: '$difficulty' },
        num: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
    // {
    //   $match:{_id : {$ne:'EASY'}}
    // }
  ]);

  // console.log('stats',stats);

  res.status(200).json({
    status: 'success',
    data: { stats },
  });

  // }catch(err){
  //   res.status(400).json({
  //     status: 'fail',
  //     message: err,
  //   });
  // }
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  //made function to delete try catch block
  // try{
  const year = req.params.year * 1; //2021
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  // console.log(plan);

  res.status(200).json({
    status: 'success',
    data: { num: plan.length, plan },
  });

  // }catch(err){
  //   res.status(400).json({
  //     status: 'fail',
  //     message: err,
  //   });
  // }
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; //this is distance divided by the radius of the Earth and in this calculation we consider only miles or kilometers

  if (!lat || !lng)
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400,
      ),
    );

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    // it gets lng and lat even so correct form is lat and lng , also after this ,
    // you put radius of sphere you want to find tour and this function gets it in radians , this is why we put radius variable and not distance right away
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng)
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400,
      ),
    );

  // at least one field must have geospatial index to use this ,if you have multiply field you need to use kays (tourSchema.index({startLocation:'2dsphere'}))
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
