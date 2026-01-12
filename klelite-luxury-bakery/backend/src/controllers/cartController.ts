import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, successResponse, NotFoundError, BadRequestError } from '../utils';
import { AuthRequest, CartItemInput } from '../types';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  let cart = await prisma.cart.findUnique({
    where: { userId: req.user!.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              comparePrice: true,
              images: true,
              isAvailable: true,
              stock: true
            }
          }
        }
      }
    }
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId: req.user!.id,
        totalItems: 0,
        totalPrice: 0
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                comparePrice: true,
                images: true,
                isAvailable: true,
                stock: true
              }
            }
          }
        }
      }
    });
  }

  successResponse(res, cart);
});


// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private
export const addToCart = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { productId, quantity, size, customization } = req.body as CartItemInput;

  // Get product
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { sizes: true }
  });

  if (!product) {
    throw NotFoundError('Không tìm thấy sản phẩm');
  }

  if (!product.isAvailable) {
    throw BadRequestError('Sản phẩm hiện không khả dụng');
  }

  if (product.stock < quantity) {
    throw BadRequestError(`Chỉ còn ${product.stock} sản phẩm trong kho`);
  }

  // Track cart add activity
  if (req.user) {
    prisma.userActivity.create({
      data: {
        userId: req.user.id,
        productId: product.id,
        activityType: 'ADD_TO_CART',
        metadata: { quantity, size }
      }
    }).catch(err => console.error('Error tracking cart add:', err));
  }

  // Get price based on size
  let price = Number(product.price);
  if (size && product.sizes.length > 0) {
    const sizeOption = product.sizes.find(s => s.name === size);
    if (sizeOption) {
      price = Number(sizeOption.price);
    }
  }

  // Get or create cart
  let cart = await prisma.cart.findUnique({
    where: { userId: req.user!.id },
    include: { items: true }
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId: req.user!.id,
        totalItems: 0,
        totalPrice: 0
      },
      include: { items: true }
    });
  }

  // Check if item already exists in cart
  const existingItem = cart.items.find(
    item =>
      item.productId === productId &&
      item.size === size &&
      JSON.stringify(item.customization) === JSON.stringify(customization)
  );

  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + quantity;
    if (newQuantity > product.stock) {
      throw BadRequestError(`Chỉ còn ${product.stock} sản phẩm trong kho`);
    }

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: newQuantity,
        price: price
      }
    });
  } else {
    // Add new item
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity,
        size,
        customization,
        price,
      }
    });
  }

  // Update cart totals
  const updatedCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              comparePrice: true,
              images: true,
              isAvailable: true,
              stock: true
            }
          }
        }
      }
    }
  });

  // Calculate totals
  const totalItems = updatedCart!.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = updatedCart!.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  await prisma.cart.update({
    where: { id: cart.id },
    data: { totalItems, totalPrice }
  });

  const finalCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              comparePrice: true,
              images: true,
              isAvailable: true,
              stock: true
            }
          }
        }
      }
    }
  });

  successResponse(res, finalCart, 'Thêm vào giỏ hàng thành công');
});

// @desc    Update cart item
// @route   PUT /api/cart/items/:itemId
// @access  Private
export const updateCartItem = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { quantity } = req.body;
  const { itemId } = req.params;

  const cart = await prisma.cart.findUnique({
    where: { userId: req.user!.id },
    include: { items: true }
  });

  if (!cart) {
    throw NotFoundError('Không tìm thấy giỏ hàng');
  }

  const item = cart.items.find(item => item.id === itemId);
  if (!item) {
    throw NotFoundError('Không tìm thấy sản phẩm trong giỏ hàng');
  }

  // Check stock
  const product = await prisma.product.findUnique({
    where: { id: item.productId }
  });

  if (!product) {
    throw NotFoundError('Không tìm thấy sản phẩm');
  }

  if (quantity > product.stock) {
    throw BadRequestError(`Chỉ còn ${product.stock} sản phẩm trong kho`);
  }

  if (quantity <= 0) {
    // Remove item
    await prisma.cartItem.delete({
      where: { id: itemId }
    });
  } else {
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity }
    });
  }

  // Update cart totals
  const updatedCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: true }
  });

  const totalItems = updatedCart!.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = updatedCart!.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  await prisma.cart.update({
    where: { id: cart.id },
    data: { totalItems, totalPrice }
  });

  const finalCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              comparePrice: true,
              images: true,
              isAvailable: true,
              stock: true
            }
          }
        }
      }
    }
  });

  successResponse(res, finalCart, 'Cập nhật giỏ hàng thành công');
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:itemId
// @access  Private
export const removeFromCart = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { itemId } = req.params;

  const cart = await prisma.cart.findUnique({
    where: { userId: req.user!.id },
    include: { items: true }
  });

  if (!cart) {
    throw NotFoundError('Không tìm thấy giỏ hàng');
  }

  const item = cart.items.find(item => item.id === itemId);
  if (!item) {
    throw NotFoundError('Không tìm thấy sản phẩm trong giỏ hàng');
  }

  await prisma.cartItem.delete({
    where: { id: itemId }
  });

  // Update cart totals
  const updatedCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: true }
  });

  const totalItems = updatedCart!.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = updatedCart!.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  await prisma.cart.update({
    where: { id: cart.id },
    data: { totalItems, totalPrice }
  });

  const finalCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              comparePrice: true,
              images: true,
              isAvailable: true,
              stock: true
            }
          }
        }
      }
    }
  });

  successResponse(res, finalCart, 'Xóa sản phẩm khỏi giỏ hàng thành công');
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const cart = await prisma.cart.findUnique({
    where: { userId: req.user!.id }
  });

  if (!cart) {
    throw NotFoundError('Không tìm thấy giỏ hàng');
  }

  // Delete all cart items
  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id }
  });

  // Update cart totals
  await prisma.cart.update({
    where: { id: cart.id },
    data: { totalItems: 0, totalPrice: 0 }
  });

  const updatedCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: true }
  });

  successResponse(res, updatedCart, 'Xóa giỏ hàng thành công');
});

// @desc    Sync cart (for guest checkout)
// @route   POST /api/cart/sync
// @access  Private
export const syncCart = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { items } = req.body as { items: CartItemInput[] };

  let cart = await prisma.cart.findUnique({
    where: { userId: req.user!.id },
    include: { items: true }
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId: req.user!.id,
        totalItems: 0,
        totalPrice: 0
      },
      include: { items: true }
    });
  }

  // Process each item from local storage
  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: { sizes: true }
    });

    if (!product || !product.isAvailable) continue;

    let price = Number(product.price);
    if (item.size && product.sizes.length > 0) {
      const sizeOption = product.sizes.find(s => s.name === item.size);
      if (sizeOption) {
        price = Number(sizeOption.price);
      }
    }

    const existingItem = cart.items.find(
      cartItem =>
        cartItem.productId === item.productId &&
        cartItem.size === item.size &&
        JSON.stringify(cartItem.customization) === JSON.stringify(item.customization)
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + item.quantity;
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: Math.min(newQuantity, product.stock),
          price
        }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: Math.min(item.quantity, product.stock),
          size: item.size,
          customization: item.customization,
          price,
        }
      });
    }
  }

  // Update cart totals
  const updatedCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: true }
  });

  const totalItems = updatedCart!.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = updatedCart!.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  await prisma.cart.update({
    where: { id: cart.id },
    data: { totalItems, totalPrice }
  });

  const finalCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              comparePrice: true,
              images: true,
              isAvailable: true,
              stock: true
            }
          }
        }
      }
    }
  });

  successResponse(res, finalCart, 'Đồng bộ giỏ hàng thành công');
});
