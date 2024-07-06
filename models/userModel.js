const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

//name, email , photo ,password , passwordConfirm

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, 'user must have name'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    require: [true, 'user must have email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail],
  },
  photo: {
    type: String,
    default:'default.jpg'
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'guide', 'lead-guide', 'admin'],
      message: 'role is either: user,guide,lead-guide,admin,',
    },
    default: 'user',
  },
  password: {
    type: String,
    require: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    require: [true, 'please confirm your password'],
    validate: {
      // this only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password; // abc === abc  true / abc === csx false (Error)
      },
      message: 'Passwords are not same',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpired: {
    type: Date,
  },
  active:{
    type:Boolean,
    default:true,
    // to not show
    select:false
  }
});

userSchema.pre('save', async function (next) {
  //Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //delete passwordConfirm filed
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next){
  if(!this.isModified('password') || this.isNew)return next()

  this.passwordChangedAt = Date.now() - 1000
  next()
})

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.ChangedPasswordAfter = function (JWTTimeStamp) {
  //JWTTimeStamp == when token was issued

  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return JWTTimeStamp < changedTimestamp; // if after giving token password has been changed , it gives false and that error
  }
  //false means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

    // console.log({resetToken},this.passwordResetToken);

  this.passwordResetExpired = Date.now()+ 10*60*1000

  return resetToken

};

userSchema.pre(/^find/ ,function(next){
  //this points to the current query
  this.find({active:{$ne: false}})
  next();
})

const User = mongoose.model('User', userSchema);

module.exports = User;
