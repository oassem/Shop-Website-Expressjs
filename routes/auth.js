const express = require('express')
const router = express.Router()
const { check } = require('express-validator')
const authController = require('../controllers/auth')
const User = require('../models/user')
const bcrypt = require('bcryptjs')

router.get('/login', authController.getLogin)
router.get('/signup', authController.getSignup)
router.get('/reset', authController.getReset)
router.get('/reset/:token', authController.getNewPassword)
router.post(
    '/login',
    [
        check('email', 'Please enter valid email').isEmail(),

        check('password').custom(async (value, { req }) => {
            return User.findOne({ email: req.body.email }).then(async (user) => {
                if (!user) {
                    return Promise.reject('Invalid email or password')
                } else {
                    const exist = await bcrypt.compare(value, user.password)

                    if (!exist) {
                        return Promise.reject('Invalid email or password')
                    }
                }
            })
        }).trim()
    ],
    authController.postLogin)

router.post('/logout', authController.postLogout)
router.post(
    '/signup',
    [
        check('email', 'Please enter valid email')
            .isEmail()
            .custom(async (value) => {
                return User.findOne({ email: value }).then((user) => {
                    if (user) {
                        return Promise.reject('E-mail already exists')
                    }
                })
            })
            .normalizeEmail(),

        check('password', 'Please enter a password with only numbers and text and at least 5 characters')
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim(),

        check('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords should match')
            }
        }).trim()
    ],
    authController.postSignup)

router.post('/reset', authController.postReset)
router.post('/new-password', authController.postNewPassword)

module.exports = router