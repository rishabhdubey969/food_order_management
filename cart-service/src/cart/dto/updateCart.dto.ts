export class UpdateCartDto {
    restaurantId: string;
    items: {
      itemId: string;
      quantity: number;
    }[];
  }