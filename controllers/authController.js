const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
require('dotenv').config();

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  console.log('JWT_COOKIE_EXPIRES_IN:', process.env.JWT_COOKIE_EXPIRES_IN);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // remove password from output

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body)

  if (
    !req.body.name ||
    !req.body.email ||
    !req.body.password ||
    !req.body.passwordConfirm
  ) {
    next(new AppError('something missing in signup', 400));
  }
  // more secured but need control to pass everything that you need (experience)
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const url = `${req.protocol}://${req.get('host')}/me`

  await new Email(newUser,url).sendWelcome()

  // const token = signToken(newUser._id);

  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist

  if (!email || !password) {
    return next(new AppError('please provide email and password', 400));
  }

  // 2) check if use exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  // 'password' == "'$2a$12$U5Ry8KrrG/zVNbEzLM8g7ePqcyLohu7Stu5dtAhV0mId9tmj6R4L."

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('incorrect email or password', 401)); //401 unauthorized
  }

  //3) if everything is ok, send token to client
  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of its there(if exists)
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  
  if (!token) {
    return next(
      new AppError('Your are not logged in , Please log in to get access', 401),
    );
  }

  // 2) Verification(validation) of token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exist

  const freshUser = await User.findById(decoded.id);

  if (!freshUser) {
    return next(
      new AppError('the user belonging to this token no longer exists', 404),
    );
  }

  // 4) Check if user changed password after the token was issued

  if (freshUser.ChangedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401),
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  //   console.log(freshUser);
  req.user = freshUser;
  res.locals.user = freshUser
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    //1) verify token
    if (req.cookies.jwt === 'loggedout') return next();
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // 2) Check if user still exist

      const freshUser = await User.findById(decoded.id);

      if (!freshUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued

      if (freshUser.ChangedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS LOGGED IN USER
      res.locals.user = freshUser;
      return next();
    
  }
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array , might be for example ["admin","lead-guide"].role default is "user"
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }

  //2)generate the random reset token

  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  //3) sent it to user's email

  
  // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}. \nIf you did not forget your password, please ignore this email!`;
  
  try {
    // await sendEmail({
      //   email: user.email,
      //   subject: 'Your password reset token (valid for 10 min)',
      //   message,
      // });

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user,resetURL).sendPasswordReset()

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    console.log(`error`);

    user.PasswordResetToken = undefined;
    user.PasswordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpired: { $gt: new Date(Date.now()).toISOString() },
  });

  //2) if token has not expired and there is user , set the new password
  if (!user) return next(new AppError('Token is invalid or has expired', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpired = undefined;
  await user.save();

  //3) Update changedPasswordAt property for the user

  //4) Log the user in, send JWT
  // const token = signToken(user._id)

  // res.status(201).json({
  //   status: 'success',
  //   token,
  // });
  createSendToken(user, 201, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)Get user from collection

  const user = await User.findById(req.user.id).select('+password');

  //2)Check if POSTed current password is correct

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  //3) if so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4) Log user in, Send Jwt
  // const token = signToken(user._id)

  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
  createSendToken(user, 200, res);
});
