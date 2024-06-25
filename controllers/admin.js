const Product = require('../models/product')
const fileHelper = require('../util/file')
const { validationResult } = require('express-validator')

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hasError: false,
        errorMessage: []
    })
}

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title
    const image = req.file
    const price = req.body.price
    const description = req.body.description

    if (!image) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            errorMessage: 'Attached file is not an image',
            product: {
                title: title,
                price: price,
                description: description
            }
        })
    }

    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            product: {
                title: title,
                price: price,
                description: description,
            },
            hasError: true,
            errorMessage: errors.array()
        })
    }

    const product = new Product({
        title: title,
        price: price,
        description: description,
        userId: req.user,
        imageUrl: image.path
    })

    product.save().then(() => {
        res.redirect('/admin/products')
    }).catch(err => {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
    })
}

exports.getProducts = (req, res, next) => {
    Product.find({ userId: req.user._id })
        .populate('userId')
        .then(products => {
            res.render('admin/products', {
                products: products,
                pageTitle: 'Admin Products',
                path: '/admin/products'
            })
        })
}

exports.getEditProduct = (req, res, next) => {
    const editMode = !!req.query.edit
    const prodId = req.params.productId

    Product.findById(prodId).then(product => {
        res.render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: editMode,
            product: product,
            hasError: false,
            errorMessage: []
        })
    })
}

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId.trim()
    const title = req.body.title
    const description = req.body.description
    const price = req.body.price
    const image = req.file
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            errorMessage: errors.array(),
            product: {
                title: title,
                description: description,
                price: price,
                _id: prodId
            }
        })
    }

    Product.findById(prodId).then(product => {
        if (product.userId == req.user._id.toString()) {
            product.title = title
            product.description = description
            product.price = price
            product.imageUrl = product.imageUrl

            if (image) {
                fileHelper.deleteFile(product.imageUrl)
                product.imageUrl = image.path
            }

            return product.save().then(() => {
                res.redirect('/admin/products')
            })
        }
    })
}

exports.deleteProduct = async (req, res, next) => {
    const prodId = req.params.productId.trim()

    Product.findById(prodId)
        .then(product => {
            return fileHelper.deleteFile(product.imageUrl)
        })
        .then(async () => {
            return Product.deleteOne({ _id: prodId, userId: req.user._id }).then(() => {
                res.status(200).json({ message: 'Success!' })
            })
        })
}