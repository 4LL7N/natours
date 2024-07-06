const Review = require("../models/reviewModel");
const Tour = require("../models/tourModel");
const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.deleteOne = Model =>  catchAsync(async(req,res,next)=>{
    const doc = await Model.findByIdAndDelete(req.params.id);
  
    if (!doc) {
      return next(new AppError(`no document found with that id`, 404));

    }
  
    res.status(204).json({
      status: 'success',
      data: null,
    });
})

exports.updateOne = Model =>  catchAsync(async (req, res, next) => {
  //made function to delete try catch block

  // try {
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!doc) {
    return next(new AppError('no document found with that id', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data:doc,
    },
  });
  
});

exports.createOne = (Model) => catchAsync(async (req, res, next) => {
  
    if(Model == Review && req.body.tour){
      const tour = await Tour.findById(req.body.tour)
      if(!tour)next(new AppError('tour with this id does not exists',404))
    }

    const doc = await Model.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
    

  });
  
exports.getOne = (Model,popOption) => catchAsync(async (req, res, next) => {
  let query = await Model.findById(req.params.id)
  if(popOption)query = query.populate(popOption)

  const doc = await query
  //change this code because not every getOne function has population
  // const doc = await Model.findById(req.params.id)
  //   .populate('reviews')
  //   //take this to the query middleware in docModel
  //   .populate({
  //     path: 'guides',
  //     select: '-__v -passwordChangedAt',
  //   });

    //take it back because , when we were fetching data and not showing guides, it was still there , because it was meddle ware , now its added manually in query and we can not to show it

  if (!doc) {
    return next(new AppError('no document found with that id', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data:doc,
    },
  });
});

exports.getAll = Model => catchAsync(async (req, res) => {

  //to allow for nested GEt reviews on tour(hack)
  let filter={}
  if(req.params.tourId)filter = {tour:req.params.tourId}


  const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // const doc = await features.query.explain();
  const doc = await features.query;


  //send response
  res.status(200).json({
    status: 'success',
    // requestAt:res.requestTime,
    result: doc.length,
    data: {
      doc,
    },
  });
  
});