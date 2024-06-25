const User = require('../models/user')
const randomInt = require('../util/randomInt')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const sendgridTransport = require('nodemailer-sendgrid-transport')
const { validationResult } = require('express-validator')
const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}))


exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: req.flash('error'),
        oldInput: { email: '', password: '' },
        validationErrors: []
    })
}

exports.getSignup = (req, res, next) => {
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: req.flash('error'),
        oldInput: { email: '', password: '', confirmPassword: '' },
        validationErrors: []
    })
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email
    const password = req.body.password
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array(),
            oldInput: { email: email, password: password },
            validationErrors: errors.array()
        })
    }

    User.findOne({ email: email }).then(async (user) => {
        req.session.isLoggedIn = true
        req.session.user = user
        await req.session.save()
        return res.redirect('/')
    })
}

exports.postSignup = async (req, res, next) => {
    const email = req.body.email
    const password = req.body.password
    const confirmPassword = req.body.confirmPassword
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array(),
            oldInput: { email: email, password: password, confirmPassword: confirmPassword },
            validationErrors: errors.array()
        })
    }

    const user = new User({
        email: email,
        password: await bcrypt.hash(password, 12),
        cart: { items: [] }
    })

    user.save().then(async () => {
        await transporter.sendMail({
            to: email,
            from: 'omar.elghazaly@nweave.com',
            subject: 'Signup Complete',
            html: '<h1>You successfully signed up!</h1>'
        })

        return res.redirect('/login')
    })
}

exports.postLogout = (req, res, next) => {
    req.session.destroy(() => {
        res.redirect('/')
    })
}

exports.getReset = (req, res, next) => {
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Password Reset',
        errorMessage: req.flash('error')
    })
}

exports.postReset = (req, res, next) => {

    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            return res.redirect('/reset')
        }

        const token = buffer.toString('hex')

        User.findOne({ email: req.body.email }).then(user => {
            if (user) {
                user.resetToken = token
                user.resetTokenExpiration = Date.now() + 3600000
                return user.save()
            }

        }).then(async () => {
            await transporter.sendMail({
                to: req.body.email,
                from: 'omar.elghazaly@nweave.com',
                subject: 'Password reset #' + randomInt.generateRandomId(),
                html: `
                <p>You requested a password reset</p>
                <p>Click this <a href="http://127.0.0.1:3000/reset/${token}">link</a> to set a new password</p>
                `
            })

            return res.redirect('/login')
        })
    })
}

exports.getNewPassword = (req, res, next) => {

    const token = req.params.token

    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } }).then(user => {
        if (user) {
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'New Password',
                errorMessage: req.flash('error'),
                userId: user._id.toString()
            })
        }
    })
}

exports.postNewPassword = (req, res, next) => {
    return res.redirect('/login')
}