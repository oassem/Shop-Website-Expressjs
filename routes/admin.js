const express = require('express')
const router = express.Router()
const adminController = require('../controllers/admin')
const isAuth = require('../middleware/is-auth')
const { check } = require('express-validator')

router.get('/products', isAuth, adminController.getProducts)
router.get('/add-product', isAuth, adminController.getAddProduct)
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct)
router.post(
    '/edit-product',
    [
        check('title').isString().isLength({ min: 3 }).trim(),
        check('price').isNumeric().trim(),
        check('description').isLength({ min: 5 }).trim()
    ],
    isAuth,
    adminController.postEditProduct)

router.post(
    '/add-product',
    [
        check('title').isString().isLength({ min: 3 }).trim(),
        check('price').isNumeric().trim(),
        check('description').isLength({ min: 5 }).trim()
    ],
    isAuth,
    adminController.postAddProduct)

router.delete('/product/:productId', isAuth, adminController.deleteProduct)

module.exports = router