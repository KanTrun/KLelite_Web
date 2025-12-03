import { Response, NextFunction } from 'express';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { asyncHandler, successResponse, NotFoundError, BadRequestError } from '../utils';
import { AuthRequest, CartItemInput } from '../types';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  let cart = await Cart.findOne({ user: req.user?._id })
    .populate({
      path: 'items.product',
      select: 'name slug price comparePrice images isAvailable stock',
    });
  
  if (!cart) {
    cart = await Cart.create({ user: req.user?._id, items: [] });
  }
  
  successResponse(res, cart);
});

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private
export const addToCart = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { productId, quantity, size, customization } = req.body as CartItemInput;
  
  // Get product
  const product = await Product.findById(productId);
  if (!product) {
    throw NotFoundError('Không tìm thấy sản phẩm');
  }
  
  if (!product.isAvailable) {
    throw BadRequestError('Sản phẩm hiện không khả dụng');
  }
  
  if (product.stock < quantity) {
    throw BadRequestError(`Chỉ còn ${product.stock} sản phẩm trong kho`);
  }
  
  // Get price based on size
  let price = product.price;
  if (size && product.sizes.length > 0) {
    const sizeOption = product.sizes.find(s => s.name === size);
    if (sizeOption) {
      price = sizeOption.price;
    }
  }
  
  // Get or create cart
  let cart = await Cart.findOne({ user: req.user?._id });
  if (!cart) {
    cart = new Cart({ user: req.user?._id, items: [] });
  }
  
  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(
    item => 
      item.product.toString() === productId &&
      item.size === size &&
      item.customization === customization
  );
  
  if (existingItemIndex > -1) {
    // Update quantity
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    if (newQuantity > product.stock) {
      throw BadRequestError(`Chỉ còn ${product.stock} sản phẩm trong kho`);
    }
    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].price = price;
  } else {
    // Add new item
    cart.items.push({
      product: product._id,
      quantity,
      size,
      customization,
      price,
    });
  }
  
  await cart.save();
  
  // Populate and return
  await cart.populate({
    path: 'items.product',
    select: 'name slug price comparePrice images isAvailable stock',
  });
  
  successResponse(res, cart, 'Thêm vào giỏ hàng thành công');
});

// @desc    Update cart item
// @route   PUT /api/cart/items/:itemId
// @access  Private
export const updateCartItem = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { quantity } = req.body;
  const { itemId } = req.params;
  
  const cart = await Cart.findOne({ user: req.user?._id });
  if (!cart) {
    throw NotFoundError('Không tìm thấy giỏ hàng');
  }
  
  const itemIndex = cart.items.findIndex(item => item._id?.toString() === itemId);
  if (itemIndex === -1) {
    throw NotFoundError('Không tìm thấy sản phẩm trong giỏ hàng');
  }
  
  // Check stock
  const product = await Product.findById(cart.items[itemIndex].product);
  if (!product) {
    throw NotFoundError('Không tìm thấy sản phẩm');
  }
  
  if (quantity > product.stock) {
    throw BadRequestError(`Chỉ còn ${product.stock} sản phẩm trong kho`);
  }
  
  if (quantity <= 0) {
    // Remove item
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
  }
  
  await cart.save();
  
  await cart.populate({
    path: 'items.product',
    select: 'name slug price comparePrice images isAvailable stock',
  });
  
  successResponse(res, cart, 'Cập nhật giỏ hàng thành công');
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:itemId
// @access  Private
export const removeFromCart = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { itemId } = req.params;
  
  const cart = await Cart.findOne({ user: req.user?._id });
  if (!cart) {
    throw NotFoundError('Không tìm thấy giỏ hàng');
  }
  
  const itemIndex = cart.items.findIndex(item => item._id?.toString() === itemId);
  if (itemIndex === -1) {
    throw NotFoundError('Không tìm thấy sản phẩm trong giỏ hàng');
  }
  
  cart.items.splice(itemIndex, 1);
  await cart.save();
  
  await cart.populate({
    path: 'items.product',
    select: 'name slug price comparePrice images isAvailable stock',
  });
  
  successResponse(res, cart, 'Xóa sản phẩm khỏi giỏ hàng thành công');
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const cart = await Cart.findOne({ user: req.user?._id });
  if (!cart) {
    throw NotFoundError('Không tìm thấy giỏ hàng');
  }
  
  cart.items = [];
  await cart.save();
  
  successResponse(res, cart, 'Xóa giỏ hàng thành công');
});

// @desc    Sync cart (for guest checkout)
// @route   POST /api/cart/sync
// @access  Private
export const syncCart = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { items } = req.body as { items: CartItemInput[] };
  
  let cart = await Cart.findOne({ user: req.user?._id });
  if (!cart) {
    cart = new Cart({ user: req.user?._id, items: [] });
  }
  
  // Process each item from local storage
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isAvailable) continue;
    
    let price = product.price;
    if (item.size && product.sizes.length > 0) {
      const sizeOption = product.sizes.find(s => s.name === item.size);
      if (sizeOption) {
        price = sizeOption.price;
      }
    }
    
    const existingItemIndex = cart.items.findIndex(
      cartItem =>
        cartItem.product.toString() === item.productId &&
        cartItem.size === item.size &&
        cartItem.customization === item.customization
    );
    
    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + item.quantity;
      cart.items[existingItemIndex].quantity = Math.min(newQuantity, product.stock);
      cart.items[existingItemIndex].price = price;
    } else {
      cart.items.push({
        product: product._id,
        quantity: Math.min(item.quantity, product.stock),
        size: item.size,
        customization: item.customization,
        price,
      });
    }
  }
  
  await cart.save();
  
  await cart.populate({
    path: 'items.product',
    select: 'name slug price comparePrice images isAvailable stock',
  });
  
  successResponse(res, cart, 'Đồng bộ giỏ hàng thành công');
});
