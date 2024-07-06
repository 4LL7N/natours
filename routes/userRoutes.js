const express = require('express')
const {getAllUsers,createUser,getUser,UpdateUser,DeleteUser,updateMe,deleteMe, getMe,uploadUserPhoto,resizeUserPhoto} = require('../controllers/userConroller')
const {signup,login,forgotPassword,resetPassword,protect,updatePassword, restrictTo,logout} = require('../controllers/authController')


const router = express.Router()

router.post('/signup',signup)
router.post('/login',login)

router.get('/logout',logout)

router.post('/forgotPassword',forgotPassword)
router.patch('/resetPassword/:token',resetPassword)




router.use(protect)//because of this code everything under this is protected

router.patch('/updateMyPassword',updatePassword)


router.get('/me',getMe,getUser)
router.patch('/updateMe',uploadUserPhoto,resizeUserPhoto,updateMe)
router.delete('/deleteMe',deleteMe)

router.use(restrictTo('admin'))

router
    .route('/')
    .get(getAllUsers)
    .post(createUser)

router
    .route('/:id')
    .get(getUser)
    .patch(UpdateUser)
    .delete(DeleteUser)


module.exports = router