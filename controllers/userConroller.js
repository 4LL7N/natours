const multer = require('multer'); // img upload ext.
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { deleteOne, updateOne, getOne, getAll } = require('./handlerFactory');

//cb = callback
// const multerStorage = multer.diskStorage({
//   destination:(req,file,cb) => {
//     //first error second destination
//     cb(null,'public/img/users');
//   },
//   filename:(req,file,cb)=>{
//     // user-34234242524(id)-34234524(current time).jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null,`user-${req.user.id}-${Date.now()}.${ext}`)
//   }
// })

const multerStorage = multer.memoryStorage();//file name is not set

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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto =catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`)

  next()
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getAllUsers = getAll(User);
// catchAsync(async (req, res, next) => {
//   const users = await User.find();

//   //send response
//   res.status(200).json({
//     status: 'success',
//     // requestAt:res.requestTime,
//     result: users.length,
//     data: {
//       users,
//     },
//   });
// });

exports.updateMe = catchAsync(async (req, res, next) => {
  //1) create error if user POSTs password data

  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password update. Please use /updateMyPassword',
        400,
      ),
    );
  }

  //2) filtered out unwanted fields names that re not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  if (req.file) filteredBody.photo = req.file.filename;
  //3) Update user document
  const updatesUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatesUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route not defined',
  });
};

// exports.getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'this route not defined! please use /signup instead',
//   });
// };

exports.getUser = getOne(User);

// exports.UpdateUser = (req, res) => {
// exports.UpdateUser  res.status(500).json({
//     status: 'error',
//     message: 'this route not defined',
//   });
// };
//not ofr updating password
exports.UpdateUser = updateOne(User);

// exports.DeleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'this route not defined',
//   });
// };
exports.DeleteUser = deleteOne(User);
