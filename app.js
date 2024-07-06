const path = require('path')
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser')
const compression = require('compression')

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoute');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter =require('./routes/viewRoutes')


//start express
const app = express();

app.set('view engine','pug')
app.set('views',path.join(__dirname,'views'))

//serving static files
app.use(express.static(path.join(__dirname,'/public')))

/// 1) Global middleware

//Set Security HTTP  headers
// app.use(helmet());
// CORS policy
// app.use(cors());
// app.options('*', cors());

// Further HELMET configuration for Content Security Policy (CSP)
// Source: https://github.com/helmetjs/helmet
const defaultSrcUrls = ['https://js.stripe.com/'];

const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://cdnjs.cloudflare.com/ajax/libs/axios/1.7.2/axios.min.js', // Updated Axios version
  'https://js.stripe.com/v3/',
];

const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
];

const connectSrcUrls = [
  'https://*.stripe.com',
  'https://unpkg.com',
  'https://tile.openstreetmap.org',
  'https://*.cloudflare.com',
  'http://localhost:8000/api/v1/users/login',
  'http://localhost/api/v1/bookings/checkout-session/',
];


const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", ...defaultSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      connectSrc: ["'self'", ...connectSrcUrls],
      fontSrc: ["'self'", ...fontSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      workerSrc: ["'self'", 'blob:'],
      
    },
  })
);


//development logging
if (process.env.NODE_ENV == 'development') {
  app.use(morgan('dev'));
}

//Limit request from api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour',
});

app.use('/api', limiter);

//Body  parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// to get response when i click on submit button in user change form where i set action to be on specific route and which has named input tags (only this input values will be shown)
app.use(express.urlencoded({extended:true,limit:'10kb'}))
app.use(cookieParser())

//reads data from body parser and sanitization Data against NoSQL query injection (deletes $signs or something like that symbols fro example:  "email":{"$gt":""}" this code will let you log in without email)
app.use(mongoSanitize());

//Data sanitization again XSS (converts html code into other symbols example:"name":"<div id='bad-code'>Name</div>"  output: "name": "&lt;div id='bad-code'>Name&lt;/div>")
app.use(xss());

//prevent parameter pollution (example:sort=duration&sort=price)
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

//serving static files
// app.use(express.static(`${__dirname}/public`));

// app.use((req, res, next) => {
//   // console.log('hello from middleware');
//   next();
// });

app.use(compression())

//Test middleware
app.use((req, res, next) => {
  res.requestTime = new Date().toISOString();
  // console.log(x);
  
  next();
});

// 3 routes

app.use('/',viewRouter)
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews',reviewRouter)
app.use('/api/v1/bookings',bookingRouter)


app.all('*', (req, res, next) => {
  // res.status(404).json(
  //   {
  //     status:'fail',
  //     message:`can not find ${req.originalUrl} on this server `
  //   }
  // )
  // next()

  // this before global error handling (below this)

  // const err = new Error(`can not find ${req.originalUrl} on this server `)
  // err.status = 'fail'
  // err.statusCode = 404
  // console.log(req);
  next(new AppError(`can not find ${req.originalUrl} on this server `, 404));
});

// express automatically know that this is error handling middleware because of four argument (err,req,res,next)
//this get Error from any middleware function where we set error in next function next(err) (every time we pass something next function, it sees it as error and every time this error handling middleware will run)
app.use(
  // (err,req,res,next)=>{

  // err.statusCode = err.statusCode || 500
  // err.status = err.status || 'error'
  // res.status(err.statusCode).json({
  //   status:err.status,
  //   message:err.message
  // })
  // next()
  // }

  // take this in errorController.js
  globalErrorHandler,
);

// start server

module.exports = app;
