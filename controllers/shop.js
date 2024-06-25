const fs = require('fs')
const path = require('path')
const Product = require('../models/product')
const Order = require('../models/order')
const pdfkit = require('pdfkit')
const stripe = require('stripe')('sk_test_51PQ8hmJDncsUSGwa1CCuwUKWDeJPuOh5kifu6y4gljml6brKzv8fPh6oosZvY7Qt1EdtiB1efwZyRTcTwhN8RWiC00paQnzY6X')
const ITEMS_PER_PAGE = 1

exports.getIndex = (req, res, next) => {

    const page = +req.query.page || 1
    let totalItems

    Product.find().countDocuments().then(numProducts => {

        totalItems = numProducts

        return Product.find()
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE)

    }).then(products => {
        res.render('shop/index', {
            products: products,
            pageTitle: 'Homepage',
            path: '/',
            currentPage: page,
            hasNextPage: (ITEMS_PER_PAGE * page) < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        })
    })
}

exports.getProducts = (req, res, next) => {

    const page = +req.query.page || 1
    let totalItems

    Product.find().countDocuments().then(numProducts => {

        totalItems = numProducts

        return Product.find()
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE)

    }).then(products => {
        res.render('shop/product-list', {
            products: products,
            pageTitle: 'Products',
            path: '/products',
            currentPage: page,
            hasNextPage: (ITEMS_PER_PAGE * page) < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        })
    })
}

exports.getProduct = (req, res, next) => {

    const productId = req.params.productId

    Product.findById(productId)
        .then(product => {
            res.render('shop/product-detail', {
                product: product,
                pageTitle: product.title,
                path: '/products'
            })
        })
}


exports.getCart = (req, res, next) => {
    req.user.getCart().then(products => {
        res.render('shop/cart', {
            path: '/cart',
            pageTitle: 'My Cart',
            cartData: products,
        });
    })
}

exports.postCart = (req, res, next) => {

    const prodId = req.body.productId.trim()

    Product.findById(prodId).then(product => {
        return req.user.addToCart(product)
    }).then(() => {
        res.redirect('/cart')
    })
}

exports.deleteCartItem = (req, res, next) => {
    const prodId = req.body.productId
    
    req.user.deleteItemFromCart(prodId).then(() => {
        res.redirect('/cart')
    })
}

exports.postOrder = (req, res, next) => {
    req.user.populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items.map((i) => {
                return { quantity: i.quantity, product: { ...i.productId._doc } }
            })

            const order = new Order({
                user: { email: req.user.email, userId: req.user._id },
                products: products
            })

            order.save()
            req.user.cart.items = []
            req.user.save()
        }).then(() => {
            res.redirect('/orders')
        })
}

exports.getCheckout = async (req, res, next) => {

    const cartProducts = await req.user.getCart();
    let total = 0;

    const products = cartProducts.map(prod => {
        total += prod.quantity * prod.price;
        return {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: prod.title,
                    description: prod.description,
                },
                unit_amount: prod.price * 100, // Amount in cents
            },
            quantity: prod.quantity
        };
    });

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: products,
        success_url: `${req.protocol}://${req.get('host')}/checkout/success`,
        cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel`
    });

    res.render('shop/checkout', {
        pageTitle: 'Checkout',
        path: '/checkout',
        products: cartProducts,
        totalSum: total,
        sessionId: session.id
    });
}

exports.getCheckoutSuccess = (req, res, next) => {
    req.user.populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items.map((i) => {
                return { quantity: i.quantity, product: { ...i.productId._doc } }
            })

            const order = new Order({
                user: { email: req.user.email, userId: req.user._id },
                products: products
            })

            order.save()
            req.user.cart.items = []
            req.user.save()
        }).then(() => {
            res.redirect('/orders')
        })
}

exports.getOrders = async (req, res, next) => {
    Order.find({ 'user.userId': req.user._id })
        .then(orders => {
            res.render('shop/orders', {
                pageTitle: 'My Orders',
                path: '/orders',
                orders: orders
            })
        })
}

exports.getInvoice = (req, res, next) => {

    const orderId = req.params.orderId

    Order.findById(orderId).then(order => {
        if (order.user.userId.toString() !== req.user._id.toString()) {
            return next(new Error('Unauthorized'))
        }

        const invoiceName = 'invoice-' + orderId + '.pdf'
        const invoicePath = path.join('invoices', invoiceName)

        // Create empty PDF
        const pdfDoc = new pdfkit()
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'attachment; filename="' + invoiceName + '"')

        // Populate PDF with data
        pdfDoc.pipe(fs.createWriteStream(invoicePath))
        pdfDoc.pipe(res)

        // Add content to the PDF
        pdfDoc.font('Helvetica-Bold');
        pdfDoc.fontSize(36).fillColor('#333').text('Invoice', { underline: true });

        let totalPrice = 0;

        order.products.forEach((p, index) => {
            totalPrice += p.quantity * p.product.price;

            // Add product title and quantity with some styling
            pdfDoc.moveDown().font('Helvetica').fontSize(14).fillColor('#666').text(`${index + 1}. ${p.product.title} - ${p.quantity} x $${p.product.price}`, {
                lineGap: 10,
                indent: 20,
                align: 'justify',
            });
        });

        // Add total invoice with some styling
        pdfDoc.moveDown().fontSize(18).fillColor('#333').text(`\nTotal Invoice: $${totalPrice}`, {
            lineGap: 20,
            align: 'right',
            underline: true,
        });

        pdfDoc.end();
    })
}