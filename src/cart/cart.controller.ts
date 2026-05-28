import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':userId')
  getCartItems(@Param('userId') userId: string) {
    return this.cartService.getCartItems(userId);
  }

  @Post('add')
  addToCart(@Body() body: { userId: string; item: any }) {
    return this.cartService.addToCart(body.userId, body.item);
  }

  @Post('remove')
  removeFromCart(@Body() body: { userId: string; listingId: number; category: string }) {
    return this.cartService.removeFromCart(body.userId, body.listingId, body.category);
  }

  @Post('update-quantity')
  updateCartItemQuantity(@Body() body: { userId: string; listingId: number; category: string; quantity: number }) {
    return this.cartService.updateCartItemQuantity(body.userId, body.listingId, body.category, body.quantity);
  }

  @Delete('clear/:userId')
  clearCart(@Param('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
