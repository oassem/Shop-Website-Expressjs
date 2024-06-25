const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Product = require('../models/product')

const userSchema = new Schema({
    password: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    cart: {
        items: [{
            productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true }
        }]
    },

    resetToken: String,
    resetTokenExpiration: Date
})

userSchema.methods.addToCart = function (product) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    })

    let newQuantity = 1
    const updatedCartItems = [...this.cart.items]

    if (cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
        updatedCartItems.push({
            productId: product._id,
            quantity: newQuantity
        });
    }

    const updatedCart = {
        items: updatedCartItems
    }

    this.cart = updatedCart
    return this.save()
}

userSchema.methods.getCart = async function () {
    const cartItems = this.cart.items
    const cartWithProductDetails = []

    for (const item of cartItems) {
        const product = await Product.findById(item.productId);

        if (product) {
            cartWithProductDetails.push({
                ...product.toObject(),
                quantity: item.quantity
            })
        }
    }

    return cartWithProductDetails
}

userSchema.methods.deleteItemFromCart = function (prodId) {
    const updatedCartItems = this.cart.items.filter(item => {
        return item.productId.toString() !== prodId.toString()
    })

    this.cart.items = updatedCartItems
    return this.save()
}

module.exports = mongoose.model('User', userSchema)