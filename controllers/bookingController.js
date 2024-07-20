const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
// const AppError = require('../utils/appError');
// const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./handlerFactory');

exports.getBooking = getOne(Booking);
exports.getAllBooking = getAll(Booking);
exports.updateBooking = updateOne(Booking);
exports.deleteBooking = deleteOne(Booking);
exports.createBooking = createOne(Booking);

exports.checkRoom = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourID);
  // const maxSize =
  // maxGroupSize
  const bookings = await Booking.find({ tour: req.params.tourID });

  if (bookings.length == tour.maxGroupSize)
    return next(new AppError('tour group is already full', 409));

  next();
});

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1) Get the current booked tour

  const tour = await Tour.findById(req.params.tourID);

  // 2) Create checkout session
  // console.log(tour.summery);
  const session = await stripe.checkout.sessions.create({
    // information about session
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}`, // do not need anymore, using stipes webhook
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    //information about product
    line_items: [
      {
        price_data: {
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`http://www.natours.dev/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100, // expected in cents
          currency: 'usd',
        },
        quantity: 1,
      },
    ],
    metadata: {
      name: `${tour.name} Tour`,
      description: tour.summary,
      images: `http://www.natours.dev/img/tours/${tour.imageCover}`,
      client_reference_id: req.params.tourID,
      amount:tour.price
    },
    // error: {
    // charge: 'ch_',
    // code: 'card_declined',
    // decline_code: '<<REASON HERE>>',
    // doc_url: 'https://docs.stripe.com/error-codes#card-declined',
    // message: 'Your card was declined.',
    //     type: 'card_error'
    // },
    mode: 'payment',
  });
  // 3) create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

const createBookingCheckout = async  session => {
  const tour = session.client_reference_id
  const user = (await User.findOne({email:session.customer_email})).id
  const price = session.metadata.amount
  console.log(tour, "  tour");
  console.log(user, "  user");
  console.log(price, "  price");
  // await Booking.create({tour,user,price})
}

exports.webhookCheckout = (req, res, next) => {
  const signature = req.header['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook error:${err.message}`);
  }

  console.log(event.data.object);

  if(event.type ==='checkout.session.completed'){
    createBookingCheckout(event.data.object)
  }
  res.status(200).json({received:true})
};

// do not need anymore, using stipes webhook
// exports.createBookingCheckout =catchAsync(async (req,res, next) => {
//   // this is only temporary , because it's UNSECURE: everyone can make booking without paying
//   const {tour,user,price} = req.query

//   if(!tour||!user||!price)return next()

//   await Booking.create({tour,user,price})

//   res.redirect(req.originalUrl.split('?')[0])
// })
