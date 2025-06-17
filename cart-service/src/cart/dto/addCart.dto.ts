export class AddCartDto {
    restaurantId: string;
    items: {
      itemId: string;
      quantity: number;
    }[];
  }