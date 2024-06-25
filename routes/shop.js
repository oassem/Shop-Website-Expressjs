const express = require('express')
const router = express.Router()
const shopController = require('../controllers/shop')
const isAuth = require('../middleware/is-auth')

router.get('/', shopController.getIndex)
router.get('/cart', isAuth, shopController.getCart)
router.get('/products/:productId', shopController.getProduct)
router.get('/products', shopController.getProducts)
router.get('/orders', isAuth, shopController.getOrders)
router.get('/orders/:orderId', isAuth, shopController.getInvoice)
router.get('/checkout', isAuth, shopController.getCheckout)
router.get('/checkout/success', shopController.getCheckoutSuccess)
router.get('/checkout/cancel', shopController.getCheckout)
router.post('/cart', isAuth, shopController.postCart)
router.post('/delete-cart-item', isAuth, shopController.deleteCartItem)

module.exports = router