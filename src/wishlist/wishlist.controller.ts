import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get(':userId')
  getWishlistItems(@Param('userId') userId: string) {
    return this.wishlistService.getWishlistItems(userId);
  }

  @Post('add')
  addToWishlist(@Body() body: { userId: string; listingId: number }) {
    return this.wishlistService.addToWishlist(body.userId, body.listingId);
  }

  @Post('remove')
  removeFromWishlist(@Body() body: { userId: string; listingId: number }) {
    return this.wishlistService.removeFromWishlist(body.userId, body.listingId);
  }

  @Get('check/:userId/:listingId')
  checkWishlistStatus(@Param('userId') userId: string, @Param('listingId') listingId: number) {
    return this.wishlistService.checkWishlistStatus(userId, listingId);
  }
}
