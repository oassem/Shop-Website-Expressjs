exports.showError = (req, res, next) => {
    res.status(404).render('error', {
        pageTitle: 'Page not found',
        path: '',
        isAuthenticated: req.session.isLoggedIn
    })
}

exports.show500 = (req, res, next) => {
    res.status(500).render('500', {
        pageTitle: 'Server error',
        path: '',
        isAuthenticated: req.session.isLoggedIn
    })
}