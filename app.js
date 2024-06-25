const express = require('express')
const session = require('express-session')
const app = express()

const path = require('path')
const bodyParser = require('body-parser')
const multer = require('multer')
const adminRoutes = require('./routes/admin')
const shopRoutes = require('./routes/shop')
const authRoutes = require('./routes/auth')
const errorsController = require('./controllers/error')
const User = require('./models/user')
const csrf = require('csurf')
const csrfProtection = csrf()
const flash = require('connect-flash')
const mongoose = require('mongoose')
const MongoDBStore = require('connect-mongodb-session')(session)
const store = new MongoDBStore({
    uri: 'mongodb+srv://omarelghazalynweave:HM5ip9T6LomkmVpX@cluster0.hbxmz04.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    collection: 'sessions'
})

const fileStorage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, 'images/')
    },

    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname)
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'))
app.use(express.static(path.join(__dirname, 'public')))
app.use("/images", express.static(path.join(__dirname, 'images')))
app.use(session({ secret: 'my secret', resave: false, saveUninitialized: false, store: store }))
app.use(csrfProtection)
app.use(flash())
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn
    res.locals.csrfToken = req.csrfToken()
    next()
})

app.use((req, res, next) => {
    if (!req.session.user) {
        return next()
    }

    User.findById(req.session.user._id)
        .then(user => {
            req.user = user
            next()
        })
        .catch(err => {
            console.log(err)
            const error = new Error(err)
            error.httpStatusCode = 500
            return next(error)
        })
});


app.use('/admin', adminRoutes)
app.use(shopRoutes)
app.use(authRoutes)
app.get('/500', errorsController.show500)
app.use(errorsController.showError)
app.use((error, req, res, next) => {
    res.status(500).render('500', {
        pageTitle: 'Server error',
        path: '',
        isAuthenticated: req.session.isLoggedIn
    })
})

mongoose.connect('mongodb+srv://omarelghazalynweave:HM5ip9T6LomkmVpX@cluster0.hbxmz04.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0').then(() => {
    app.listen(3000)
})