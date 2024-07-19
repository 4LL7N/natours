const mongoose = require('mongoose');
const dotenv = require('dotenv');

// function that catches errors like console.log(x) x is note defined
process.on('uncaughtException', err => {
  console.log('uncaught exception shuting down');
  console.log(err.name,err.message);
  //1: uncaught exception 0:success

  //at first this code was after code that runs server but this need to be before any code execute

  // server.close(() => {
    process.exit(1)
  // })
})

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB)
  .then(() => console.log(`db connection success ::: ${process.env.DATABASE}  ${process.env.DATABASE_PASSWORD}  `))
const port = process.env.PORT || 3000;



const server = app.listen(port, () => {
  console.log(`running on ${port}...`);
});

//this when there is error outside express example:no connecting db 
process.on('unhandledRejection', err =>{
  console.log('unhandled rejection shuting down');
  console.log(err.name,err.message);
  //1: uncaught exception 0:success
  server.close(() => {
    process.exit(1)
  })
})

process.on('SIGTERM', () =>{
  console.log('SIGTERM RECEIVED. Shutting down gracefully');
  
  //1: uncaught exception 0:success
  server.close(() => {
    console.log('Process terminated!');
  })
})


//Test