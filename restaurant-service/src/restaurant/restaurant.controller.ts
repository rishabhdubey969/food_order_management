import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateRestaurantDto } from './dto/restaurant.dto';
import { UpdateRestaurantDto } from './dto/updateRestaurant.dto';
import { CreateMenuItemDto } from './dto/createMenuItem.dto';
import { CouponDto } from './dto/coupon.dto';
import { UpdateCoponDto } from './dto/updateCoupon.dto';
import { GrpcAuthGuard } from './guards/auth.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from './common/role.enum';
import { JwtAuthGuard } from './guards/jwtAuth.guard';
import { ManagerGuard } from './guards/manager.guard';
import { UpdateMenuItemDto } from './dto/updateMenuItem.dto';
import { MongoIdValidationPipe } from './pipes/mongo-id-validation.pipe';
import { SearchFoodDto } from './dto/search-food.dto';
import { Restaurant } from './schema/restaurant.schema';
import { PaginatedRestaurantsDto } from './dto/pagination-restaurant.dto';
import { MenuItem } from './schema/menuItem.schema';
import { Coupon } from './schema/copon.schema';

interface MediaService {
  getSignedUrl(fileName: string, fileType: string, folderName: string): Promise<string>;
}

@Controller('restaurant')
@ApiTags('Restaurants')
@ApiBearerAuth()
export class RestaurantController {

  // Media service to get signed URLs from external gRPC service
  private readonly mediaService: MediaService;

  constructor(private readonly restaurantService: RestaurantService) { }

  /**
   * Creates a new restaurant and assigns it to the authenticated manager.
   * Requires JWT authentication and manager-specific authorization.
   *
   * @param dto The data transfer object containing the details for the new restaurant.
   * @param req The request object, containing user information (specifically manager ID) from the JWT payload.
   * @returns The newly created restaurant object.
   */
  @UseGuards(JwtAuthGuard, ManagerGuard)
  @ApiBearerAuth('JWT') // Indicates that this endpoint requires a JWT token
  @Post('create') // Changed from 'create/:managerId' as managerId is taken from token
  @ApiOperation({ summary: 'Create a restaurant and assign it to the authenticated manager' })
  @ApiBody({
    type: CreateRestaurantDto,
    description: 'Data for creating a new restaurant.',
    examples: { // Provide an example payload for clarity
      aValidRestaurant: {
        summary: 'Example Restaurant Creation',
        value: {
          name: 'The Cozy Corner',
          description: 'A delightful place for comfort food.',
          address: '123 Main St, Anytown',
          phone: '+1234567890',
          location: {
            type: 'Point',
            coordinates: [-73.935242, 40.730610] // [longitude, latitude]
          },
          // managerId is derived from JWT, no need to include here
          tags: ['cafe', 'comfort food']
        } as CreateRestaurantDto,
      },
    },
  })
  @ApiCreatedResponse({
    description: 'The restaurant has been successfully created and assigned to the manager.',
    type: Restaurant,
    example: {
      _id: "65e23c72b212f0a1c9d2f3c7",
      name: "The Cozy Corner",
      description: "A delightful place for comfort food.",
      address: "123 Main St, Anytown",
      phone: "+1234567890",
      location: { type: "Point", coordinates: [-73.935242, 40.730610] },
      managerId: "65e23c72b212f0a1c9d2f3c6",
      isActive: true,
      tags: ["cafe", "comfort food"],
      isBlocked: false,
      isDeleted: false,
      createdAt: "2024-06-20T10:00:00.000Z",
      updatedAt: "2024-06-20T10:00:00.000Z",
      __v: 0
    }
  })
  @ApiBadRequestResponse({
    description: `
      - Invalid request payload (validation errors from CreateRestaurantDto).
      - Manager not verified (manager's 'isActiveManager' is false).
      - Manager already has a verified restaurant.
      - Invalid manager ID format (if you add validation for managerId in service).
    `,
    schema: {
      example: {
        statusCode: 400,
        message: [
          "Search query must be a string.",
          "Search query cannot be empty."
        ],
        error: "Bad Request"
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing JWT token.',
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
        error: "Unauthorized"
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Forbidden. User does not have manager role.',
    schema: {
      example: {
        statusCode: 403,
        message: "Forbidden resource",
        error: "Forbidden"
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Not Found. Authenticated manager ID not found in the database.',
    schema: {
      example: {
        statusCode: 404,
        message: "Manager not found",
        error: "Not Found"
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error. An unexpected error occurred on the server.',
    schema: {
      example: {
        statusCode: 500,
        message: "An unknown error occurred",
        error: "Internal Server Error"
      }
    }
  })
  async createRestaurant(@Body() dto: CreateRestaurantDto, @Req() req: any) {
    const managerId = req.user.sub;
    return this.restaurantService.createRestaurant(dto, managerId);
  }

  /**
     * Retrieves a paginated list of restaurants near specified geographical coordinates.
     *
     * @param latitude The latitude coordinate of the user's location.
     * @param longitude The longitude coordinate of the user's location.
     * @param req The request object, potentially containing user context for personalized results (e.g., from authentication middleware).
     * @param limit (Optional) The maximum number of restaurants to return per page. Defaults to 10.
     * @param offset (Optional) The number of restaurants to skip before starting to return results. Defaults to 0.
     * @returns A paginated list of restaurant objects sorted by proximity to the given coordinates.
     */
  @Get('nearby')
  @ApiOperation({ summary: 'Get restaurants nearby based on coordinates' })
  @ApiQuery({
    name: 'latitude',
    type: Number,
    required: true,
    description: 'The latitude coordinate of the user\'s current location.',
    example: 40.7128, // Example: New York City latitude
  })
  @ApiQuery({
    name: 'longitude',
    type: Number,
    required: true,
    description: 'The longitude coordinate of the user\'s current location.',
    example: -74.0060, // Example: New York City longitude
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    example: 10,
    description: 'The maximum number of restaurants to return per page. Defaults to 10. Max limit might be enforced by server.',
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: false,
    example: 0,
    description: 'The number of restaurants to skip before starting to return results. Defaults to 0.',
  })
  @ApiOkResponse({
    description: 'Successfully retrieved a paginated list of nearby restaurants.',
    type: PaginatedRestaurantsDto, // Use your new DTO for the response type
    // Provide a detailed example of the paginated response structure
    example: {
      data: [
        {
          _id: "65e23c72b212f0a1c9d2f3c7",
          name: "Central Park Cafe",
          description: "A cozy spot near Central Park.",
          address: "100 Central Park South, New York",
          phone: "+12125551234",
          location: { type: "Point", coordinates: [-73.9749, 40.7648] },
          managerId: "65e23c72b212f0a1c9d2f3c6",
          isActive: true,
          tags: ["cafe", "lunch"],
          isBlocked: false,
          isDeleted: false,
          createdAt: "2024-06-19T10:00:00.000Z",
          updatedAt: "2024-06-19T10:00:00.000Z",
          __v: 0
        },
        {
          _id: "65e23c72b212f0a1c9d2f3c8",
          name: "Times Square Diner",
          description: "Classic American diner experience.",
          address: "1500 Broadway, New York",
          phone: "+12125555678",
          location: { type: "Point", coordinates: [-73.9855, 40.7580] },
          managerId: "65e23c72b212f0a1c9d2f3c9",
          isActive: true,
          tags: ["diner", "24/7"],
          isBlocked: false,
          isDeleted: false,
          createdAt: "2024-06-18T10:00:00.000Z",
          updatedAt: "2024-06-18T10:00:00.000Z",
          __v: 0
        }
      ],
      limit: 10,
      offset: 0
    },
  })
  @ApiBadRequestResponse({
    description: `
      - Invalid latitude or longitude format (e.g., not a number, out of range).
      - Invalid limit or offset format (e.g., not a number, negative).
    `,
    schema: {
      example: {
        statusCode: 400,
        message: "Validation failed (numeric string is expected)", // Example error from ParseIntPipe
        error: "Bad Request"
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error. An unexpected error occurred while fetching nearby restaurants.',
    schema: {
      example: {
        statusCode: 500,
        message: "An unknown error occurred",
        error: "Internal Server Error"
      }
    }
  })
  async getNearbyRestaurants(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Req() req: any,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ) {
    const user = req.user;
    return this.restaurantService.getNearbyRestaurants(latitude, longitude, +limit, +offset, user);
  }

  /**
     * Retrieves a paginated list of all restaurants.
     * Requires authentication and the 'ADMIN' role.
     *
     * @param limit (Optional) The maximum number of restaurants to return per page. Defaults to 10.
     * @param offset (Optional) The number of restaurants to skip before starting to return results. Defaults to 0.
     * @returns A paginated list of restaurant objects.
     */
  @UseGuards(GrpcAuthGuard)
  @ApiBearerAuth('JWT') // Indicates that this endpoint requires a JWT token
  @Get('all')
  @Roles(Role.ADMIN) // Specifies that only users with the 'ADMIN' role can access
  @ApiOperation({ summary: 'Get a paginated list of all restaurants (Admin access only)' })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    example: 10,
    description: 'The maximum number of restaurants to return per page. Defaults to 10. Server may enforce a max limit.',
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: false,
    example: 0,
    description: 'The number of restaurants to skip before starting to return results. Defaults to 0.',
  })
  @ApiOkResponse({
    description: 'Successfully retrieved a paginated list of all restaurants.',
    type: PaginatedRestaurantsDto, // Use your PaginatedRestaurantsDto for consistency
      example: {
        data: [
          // Example Restaurant objects (similar to getNearbyRestaurants)
          {
            _id: "65e23c72b212f0a1c9d2f3c7",
            name: "Admin View Cafe 1",
            description: "An example restaurant for admin listing.",
            address: "123 Admin St, City",
            phone: "+1111111111",
            location: { type: "Point", coordinates: [-73.0000, 40.0000] },
            managerId: "65e23c72b212f0a1c9d2f3c6",
            isActive: true,
            tags: ["admin-tag"],
            isBlocked: false,
            isDeleted: false,
            createdAt: "2024-06-19T10:00:00.000Z",
            updatedAt: "2024-06-19T10:00:00.000Z",
            __v: 0
          },
          {
            _id: "65e23c72b212f0a1c9d2f3c8",
            name: "Admin View Diner 2",
            description: "Another example for admin list.",
            address: "456 Admin Ave, City",
            phone: "+2222222222",
            location: { type: "Point", coordinates: [-73.5000, 40.5000] },
            managerId: "65e23c72b212f0a1c9d2f3c9",
            isActive: false,
            tags: ["admin-tag"],
            isBlocked: true,
            isDeleted: false,
            createdAt: "2024-06-18T10:00:00.000Z",
            updatedAt: "2024-06-18T10:00:00.000Z",
            __v: 0
          }
        ],
        limit: 10,
        offset: 0
      },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing JWT token.',
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
        error: "Unauthorized"
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Forbidden. User does not have the "ADMIN" role.',
    schema: {
      example: {
        statusCode: 403,
        message: "Forbidden resource",
        error: "Forbidden"
      }
    }
  })
  @ApiBadRequestResponse({
    description: `
      - Invalid 'limit' or 'offset' format (e.g., not a number, negative).
    `,
    schema: {
      example: {
        statusCode: 400,
        message: "Validation failed (numeric string is expected)",
        error: "Bad Request"
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error. An unexpected error occurred while fetching all restaurants.',
    schema: {
      example: {
        statusCode: 500,
        message: "An unknown error occurred",
        error: "Internal Server Error"
      }
    }
  })
  async getAllRestaurants(@Query('limit') limit = 10, @Query('offset') offset = 0) {
    return this.restaurantService.getAllRestaurants(+limit, +offset);
  }

/**
   * Updates an existing restaurant's details by its ID.
   * Requires authentication and either the 'ADMIN' or 'MANAGER' role.
   *
   * @param id The unique identifier of the restaurant to update.
   * @param dto The data transfer object containing the updated restaurant details.
   * @returns The successfully updated restaurant object.
   */
  @UseGuards(JwtAuthGuard, ManagerGuard) 
  @ApiBearerAuth('JWT') 
  @Put(':id')
  @ApiOperation({ summary: 'Update an existing restaurant by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The unique identifier (MongoDB ObjectId) of the restaurant to update.',
    example: '65e23c72b212f0a1c9d2f3c7',
  })
  @ApiBody({
    type: UpdateRestaurantDto,
    description: 'Data for updating the restaurant. Only provide fields to be updated.',
    examples: {
      updateName: {
        summary: 'Update Restaurant Name',
        value: {
          name: 'The Renovated Bistro',
        } as UpdateRestaurantDto,
      },
      updateLocationAndDescription: {
        summary: 'Update Location and Description',
        value: {
          description: 'Now with outdoor seating!',
          location: {
            type: 'Point',
            coordinates: [-73.935242, 40.730610]
          }
        } as UpdateRestaurantDto,
      },
    },
  })
  @ApiOkResponse({
    description: 'The restaurant has been successfully updated.',
    type: Restaurant,
        example: {
            _id: "65e23c72b212f0a1c9d2f3c7",
            name: "The Renovated Bistro", 
            description: "Now with outdoor seating!", 
            address: "123 Main St, Anytown",
            phone: "+1234567890",
            location: { type: "Point", coordinates: [-73.935242, 40.730610] },
            managerId: "65e23c72b212f0a1c9d2f3c6",
            isActive: true,
            tags: ["cafe", "comfort food"],
            isBlocked: false,
            isDeleted: false,
            createdAt: "2024-06-20T10:00:00.000Z",
            updatedAt: "2024-06-20T11:30:00.000Z",
            __v: 1 
        }
  })
  @ApiBadRequestResponse({
    description: `
      - Invalid restaurant ID format (e.g., not a valid ObjectId).
      - Invalid request payload (validation errors from UpdateRestaurantDto).
      - Attempting to update a restaurant not owned by the manager (if your service implements this logic).
    `,
    schema: {
        example: {
            statusCode: 400,
            message: "Invalid ID format: \"invalid-id\". Must be a valid MongoDB ObjectId.",
            error: "Bad Request"
        }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing JWT token.',
    schema: {
        example: {
            statusCode: 401,
            message: "Unauthorized",
            error: "Unauthorized"
        }
    }
  })
  @ApiForbiddenResponse({
    description: 'Forbidden. User does not have ADMIN or MANAGER role, or manager is attempting to update a restaurant they do not own.',
    schema: {
        example: {
            statusCode: 403,
            message: "Forbidden resource",
            error: "Forbidden"
        }
    }
  })
  @ApiNotFoundResponse({
    description: 'Not Found. Restaurant with the given ID does not exist.',
    schema: {
        example: {
            statusCode: 404,
            message: "Restaurant not found",
            error: "Not Found"
        }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error. An unexpected error occurred while updating the restaurant.',
    schema: {
        example: {
            statusCode: 500,
            message: "An unknown error occurred",
            error: "Internal Server Error"
        }
    }
  })
  async updateRestaurant(@Param('id', MongoIdValidationPipe) id: string, @Body() dto: UpdateRestaurantDto) {
    return this.restaurantService.updateRestaurant(id, dto);
  }

/**
   * Retrieves the restaurant associated with the authenticated manager.
   * Requires JWT authentication and manager-specific authorization.
   *
   * @param req The request object, containing user information (specifically manager ID) from the JWT payload.
   * @returns The restaurant object managed by the authenticated manager, or throws a NotFound exception if no restaurant is linked.
   */
  @UseGuards(JwtAuthGuard, ManagerGuard)
  @ApiBearerAuth('JWT') 
  @Get('manager')
  @ApiOperation({ summary: 'Get the restaurant managed by the authenticated manager' })
  @ApiOkResponse({
    description: 'Successfully retrieved the restaurant managed by the authenticated manager.',
    type: Restaurant,
      example: {
        _id: "65e23c72b212f0a1c9d2f3c7",
        name: "Manager's Grill House",
        description: "A premium restaurant managed by the authenticated user.",
        address: "456 Oak Ave, Managertown",
        phone: "+1987654321",
        location: {
          type: 'Point',
          coordinates: [-74.0060, 40.7128] 
        },
        managerId: "65e23c72b212f0a1c9d2f3c6", 
        isActive: true,
        tags: ["grill", "fine-dining"],
        isBlocked: false,
        isDeleted: false,
        createdAt: "2024-05-15T10:00:00.000Z",
        updatedAt: "2024-05-15T10:00:00.000Z",
        __v: 0
      }
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing JWT token.',
    schema: {
        example: {
            statusCode: 401,
            message: "Unauthorized",
            error: "Unauthorized"
        }
    }
  })
  @ApiForbiddenResponse({
    description: 'Forbidden. User does not have the manager role.',
    schema: {
        example: {
            statusCode: 403,
            message: "Forbidden resource",
            error: "Forbidden"
        }
    }
  })
  @ApiNotFoundResponse({
    description: 'Not Found. No restaurant is linked to the authenticated manager.',
    schema: {
        example: {
            statusCode: 404,
            message: "Restaurant not found for this manager",
            error: "Not Found"
        }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error. An unexpected error occurred while retrieving the restaurant.',
    schema: {
        example: {
            statusCode: 500,
            message: "An unknown error occurred",
            error: "Internal Server Error"
        }
    }
  })
  async getByManager(@Req() req: any) {
    const managerId = req.user.sub; 
    return await this.restaurantService.getRestaurantByManagerId(managerId);
  }

/**
   * Retrieves restaurants based on a comma-separated list of tags.
   *
   * @param tags (Optional) A comma-separated string of tags (e.g., "fastfood,pizza,vegetarian") to filter restaurants.
   * @returns A list of restaurant objects that match any of the provided tags.
   */
  @Get('tags')
  @ApiOperation({ summary: 'Get restaurants filtered by a comma-separated list of tags' })
  @ApiQuery({
    name: 'tags',
    type: String,
    required: false, 
    description: 'A comma-separated string of tags to filter restaurants (e.g., "fastfood,pizza,vegetarian").',
    example: 'pizza,italian,vegetarian', 
  })
  @ApiOkResponse({
    description: 'Successfully retrieved a list of restaurants matching the provided tags.',
    type: [Restaurant], 
      example: [
        {
          _id: "65e23c72b212f0a1c9d2f3c7",
          name: "Pizza Heaven",
          description: "Authentic Italian pizzas and more.",
          address: "10 Pizza Lane, Food City",
          phone: "+1112223333",
          location: { type: "Point", coordinates: [-74.0000, 40.7000] },
          managerId: "65e23c72b212f0a1c9d2f3c6",
          isActive: true,
          tags: ["pizza", "italian", "dine-in"], 
          isBlocked: false,
          isDeleted: false,
          createdAt: "2024-06-15T10:00:00.000Z",
          updatedAt: "2024-06-15T10:00:00.000Z",
          __v: 0
        },
        {
          _id: "65e23c72b212f0a1c9d2f3c8",
          name: "Veggie Delight",
          description: "Healthy and delicious vegetarian options.",
          address: "20 Green Street, Veggie Town",
          phone: "+4445556666",
          location: { type: "Point", coordinates: [-73.9000, 40.8000] },
          managerId: "65e23c72b212f0a1c9d2f3c9",
          isActive: true,
          tags: ["vegetarian", "healthy", "vegan"], 
          isBlocked: false,
          isDeleted: false,
          createdAt: "2024-06-10T10:00:00.000Z",
          updatedAt: "2024-06-10T10:00:00.000Z",
          __v: 0
        }
      ]
  })
  @ApiBadRequestResponse({
    description: 'Bad Request. Invalid format for tags if custom validation is applied (e.g., empty tag after split).',
    schema: {
        example: {
            statusCode: 400,
            message: "Invalid tags format", 
            error: "Bad Request"
        }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error. An unexpected error occurred while fetching restaurants by tags.',
    schema: {
        example: {
            statusCode: 500,
            message: "An unknown error occurred",
            error: "Internal Server Error"
        }
    }
  })
  async getByTags(@Query('tags') tags ?: string) {
    const tagArray = tags ? tags.split(',') : [];
    return await this.restaurantService.findByTags(tagArray);
  }

/**
* Generates a pre-signed URL for uploading a restaurant image.
* This endpoint is typically used by the client to get a secure URL to upload a file directly to storage (e.g., S3).
* Requires either the 'ADMIN' or 'MANAGER' role.
*
* @param body An object containing the name and type of the file to be uploaded.
* @param body.fileName The desired name of the file (e.g., "my-restaurant-logo.png").
* @param body.fileType The MIME type of the file (e.g., "image/jpeg", "image/png").
* @returns An object containing the pre-signed URL for file upload.
*/
@Post('signed-url')
@Roles(Role.ADMIN, Role.MANAGER)
async getRestaurantImageSignedUrl(@Body() body: { fileName: string; fileType: string }) {
  const { fileName, fileType } = body;
  const signedUrl = await this.mediaService.getSignedUrl(fileName, fileType, 'restaurant');
  return { signedUrl };
}

/**
* Generates a pre-signed URL for uploading a menu item image.
* This endpoint is typically used by the client to get a secure URL to upload a file directly to storage (e.g., S3).
* Requires either the 'ADMIN' or 'MANAGER' role.
*
* @param body An object containing the name and type of the file to be uploaded.
* @param body.fileName The desired name of the file (e.g., "my-menu-item-image.jpg").
* @param body.fileType The MIME type of the file (e.g., "image/jpeg", "image/png").
* @returns An object containing the pre-signed URL for file upload.
*/
@Post('menu/signed-url')
@Roles(Role.ADMIN, Role.MANAGER)
async getMenuImageSignedUrl(@Body() body: { fileName: string; fileType: string }) {
  const { fileName, fileType } = body;
  const signedUrl = await this.mediaService.getSignedUrl(fileName, fileType, 'menu');
  return { signedUrl };
}

/**
   * Creates a new menu item for the authenticated manager's restaurant.
   * Requires JWT authentication and manager-specific authorization.
   *
   * @param dto The data transfer object containing the details for the new menu item.
   * @param req The request object, containing user information (specifically manager ID) from the JWT payload.
   * @returns The newly created menu item object.
   */
  @UseGuards(JwtAuthGuard, ManagerGuard)
  @ApiBearerAuth('JWT') 
  @Post('/menu') 
  @ApiOperation({ summary: 'Create a new menu item for the authenticated manager\'s restaurant' })
  @ApiBody({
    type: CreateMenuItemDto,
    description: 'Data for creating a new menu item.',
    examples: { 
      aValidMenuItem: {
        summary: 'Example Menu Item Creation',
        value: {
          name: 'Classic Margherita Pizza',
          description: 'Our signature pizza with fresh basil and mozzarella.',
          price: 12.99,
          imageUrl: 'https://example.com/margherita.jpg',
          tags: ['pizza', 'vegetarian', 'italian']
          // restaurantId and isAvailable are handled internally/defaulted
        } as CreateMenuItemDto,
      },
    },
  })
  @ApiCreatedResponse({
    description: 'The menu item has been successfully created.',
    type: MenuItem,
    example: { 
      _id: "65e23c72b212f0a1c9d2f3c7",
      name: "Classic Margherita Pizza",
      description: "Our signature pizza with fresh basil and mozzarella.",
      price: 12.99,
      imageUrl: "https://example.com/margherita.jpg",
      restaurantId: "65e23c72b212f0a1c9d2f3c6",
      isAvailable: true,
      tags: ['pizza', 'vegetarian', 'italian'],
      createdAt: "2024-06-20T10:00:00.000Z",
      updatedAt: "2024-06-20T10:00:00.000Z",
      __v: 0
    }
  })
  @ApiBadRequestResponse({
    description: `
      - Invalid request payload (validation errors from CreateMenuItemDto).
      - Invalid data (e.g., negative price).
    `,
    schema: {
        example: {
            statusCode: 400,
            message: [
                "name must be a string",
                "price must be a positive number"
            ],
            error: "Bad Request"
        }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing JWT token.',
    schema: {
        example: {
            statusCode: 401,
            message: "Unauthorized",
            error: "Unauthorized"
        }
    }
  })
  @ApiForbiddenResponse({
    description: 'Forbidden. User does not have the manager role.',
    schema: {
        example: {
            statusCode: 403,
            message: "Forbidden resource",
            error: "Forbidden"
        }
    }
  })
  @ApiNotFoundResponse({
    description: 'Not Found. Authenticated manager does not have a restaurant linked to their account.',
    schema: {
        example: {
            statusCode: 404,
            message: "No restaurant found for the authenticated manager",
            error: "Not Found"
        }
    }
  })
  @ApiConflictResponse({
    description: 'Conflict. A menu item with the same name already exists in this restaurant.',
    schema: {
        example: {
            statusCode: 409,
            message: "Menu item 'Classic Margherita Pizza' already exists in your restaurant.",
            error: "Conflict"
        }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error. An unexpected error occurred while creating the menu item.',
    schema: {
        example: {
            statusCode: 500,
            message: "An unknown error occurred",
            error: "Internal Server Error"
        }
    }
  })
  async createMenu(@Body() dto: CreateMenuItemDto, @Req() req: any) {
    const managerId = req.user.sub; 
    return this.restaurantService.createMenuItem(dto, managerId);
  }

 /**
   * Retrieves a single menu item by its ID for a specific restaurant.
   *
   * @param restaurantId The unique identifier of the restaurant the menu item belongs to.
   * @param itemId The unique identifier of the menu item to retrieve.
   * @returns The menu item object if found, otherwise throws a NotFound exception.
   */
  @Get(':restaurantId/menu/:itemId')
  @ApiOperation({ summary: 'Get a single menu item by its ID for a specific restaurant' })
  @ApiParam({
    name: 'restaurantId',
    type: String,
    description: 'The unique identifier (MongoDB ObjectId) of the restaurant the menu item belongs to.',
    example: '65e23c72b212f0a1c9d2f3c6', 
  })
  @ApiParam({
    name: 'itemId',
    type: String,
    description: 'The unique identifier (MongoDB ObjectId) of the menu item to retrieve.',
    example: '65e23c72b212f0a1c9d2f3c7', 
  })
  @ApiOkResponse({
    description: 'Successfully retrieved the menu item.',
    type: MenuItem, 
    example: { 
      _id: "65e23c72b212f0a1c9d2f3c7",
      name: "Classic Margherita Pizza",
      description: "Our signature pizza with fresh basil and mozzarella.",
      price: 12.99,
      imageUrl: "https://example.com/margherita.jpg",
      restaurantId: "65e23c72b212f0a1c9d2f3c6", 
      isAvailable: true,
      tags: ['pizza', 'vegetarian', 'italian'],
      createdAt: "2024-06-20T10:00:00.000Z",
      updatedAt: "2024-06-20T10:00:00.000Z",
      __v: 0
    }
  })
  @ApiBadRequestResponse({
    description: `
      - Invalid 'restaurantId' format (e.g., not a valid ObjectId).
      - Invalid 'itemId' format (e.g., not a valid ObjectId).
    `,
    schema: {
        example: {
            statusCode: 400,
            message: "Invalid ID format: \"invalid-id\". Must be a valid MongoDB ObjectId.",
            error: "Bad Request"
        }
    }
  })
  @ApiNotFoundResponse({
    description: 'Not Found. Either the restaurant or the menu item was not found.',
    schema: {
        example: {
            statusCode: 404,
            message: "Menu item not found in the specified restaurant.", 
            error: "Not Found"
        }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error. An unexpected error occurred while retrieving the menu item.',
    schema: {
        example: {
            statusCode: 500,
            message: "An unknown error occurred",
            error: "Internal Server Error"
        }
    }
  })
  async getMenuItemById(
    @Param('restaurantId', MongoIdValidationPipe) restaurantId: string,
    @Param('itemId', MongoIdValidationPipe) itemId: string
  ) {
    return this.restaurantService.getItemById(restaurantId, itemId);
  }

/**
* Updates an existing menu item.
* Allows for partial or full updates of a menu item's details.
*
* @param itemId The unique identifier of the menu item to update.
* @param updateMenuItemDto The data transfer object containing the fields to update for the menu item.
* @returns The successfully updated menu item.
*/
@Put('menuItem/:itemId')
@ApiOperation({ summary: 'Update an existing menu item' }) 
@ApiParam({
  name: 'itemId',
  description: 'The ID of the menu item to update',
  type: String,
  example: '60c72b2f9b1e8a001c8e4d3a',
})
@ApiBody({
  type: UpdateMenuItemDto,
  description: 'Data to update the menu item',
  examples: {
    partialUpdate: {
      summary: 'Update price and description',
      value: {
        price: 15.99,
        description: 'A delicious new description for the dish.',
      },
    },
    fullUpdate: {
      summary: 'Full update of menu item details',
      value: {
        name: 'Spicy New Burger',
        description: 'Our classic burger with a spicy kick!',
        price: 12.50,
        imageUrl: 'http://example.com/spicy-burger.jpg',
        tags: ['spicy', 'burger', 'new'],
        copons: ['SUMMER20'],
      },
    },
  },
})
@ApiResponse({
  status: 200,
  description: 'The menu item has been successfully updated.',
  type: CreateMenuItemDto, // Assuming the response shape is similar to CreateMenuItemDto
})
@ApiResponse({ status: 404, description: 'Menu item not found.' })
@ApiResponse({ status: 400, description: 'Invalid input or validation error.' })
@ApiResponse({ status: 500, description: 'Internal server error.' })
async updateMenuItem(@Param('itemId', MongoIdValidationPipe) itemId: string, @Body() updateMenuItemDto: UpdateMenuItemDto) {
  return await this.restaurantService.updateMenuItem(itemId, updateMenuItemDto);
}

/**
* Deletes a specific menu item by its ID.
*
* @param itemId The unique identifier of the menu item to delete.
* @returns The deleted menu item object, or throws a NotFound exception if the item does not exist.
*/
@Delete('menu/:itemId')
async deleteItem(@Param('itemId', MongoIdValidationPipe) itemId: string) {
  return await this.restaurantService.deleteItem(itemId);
}

/**
   * Retrieves all menu items for a specific restaurant.
   *
   * @param restaurantId The unique identifier of the restaurant for which to retrieve menu items.
   * @returns A list of menu item objects associated with the specified restaurant.
   */
  // @UseGuards(JwtAuthGuard, ManagerGuard) // Uncomment if authentication is needed
  // @ApiBearerAuth('JWT') // Uncomment if authentication is needed
  @Get(':restaurantId/menu')
  @ApiOperation({ summary: 'Get all menu items for a specific restaurant' })
  @ApiParam({
    name: 'restaurantId',
    type: String,
    description: 'The unique identifier (MongoDB ObjectId) of the restaurant.',
    example: '65e23c72b212f0a1c9d2f3c6',
  })
  @ApiOkResponse({
    description: 'Successfully retrieved the list of menu items.',
    type: [MenuItem], 
      example: [
        {
          _id: "65e23c72b212f0a1c9d2f3c7",
          name: "Classic Margherita Pizza",
          description: "Our signature pizza with fresh basil and mozzarella.",
          price: 12.99,
          imageUrl: "https://example.com/margherita.jpg",
          restaurantId: "65e23c72b212f0a1c9d2f3c6",
          isAvailable: true,
          tags: ['pizza', 'vegetarian', 'italian'],
          createdAt: "2024-06-20T10:00:00.000Z",
          updatedAt: "2024-06-20T10:00:00.000Z",
          __v: 0
        },
        {
          _id: "65e23c72b212f0a1c9d2f3c8",
          name: "Spicy Pepperoni",
          description: "A classic with a kick!",
          price: 14.50,
          imageUrl: "https://example.com/pepperoni.jpg",
          restaurantId: "65e23c72b212f0a1c9d2f3c6",
          isAvailable: true,
          tags: ['pizza', 'spicy'],
          createdAt: "2024-06-20T10:05:00.000Z",
          updatedAt: "2024-06-20T10:05:00.000Z",
          __v: 0
        }
      ]
  })
  @ApiBadRequestResponse({
    description: 'Bad Request. Invalid restaurant ID format (e.g., not a valid ObjectId).',
    schema: {
        example: {
            statusCode: 400,
            message: "Invalid ID format: \"invalid-id\". Must be a valid MongoDB ObjectId.",
            error: "Bad Request"
        }
    }
  })
  @ApiNotFoundResponse({
    description: 'Not Found. Restaurant with the given ID was not found, or it has no menu items.',
    schema: {
        example: {
            statusCode: 404,
            message: "Restaurant not found or no menu items exist for this restaurant.",
            error: "Not Found"
        }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error. An unexpected error occurred while retrieving menu items.',
    schema: {
        example: {
            statusCode: 500,
            message: "An unknown error occurred",
            error: "Internal Server Error"
        }
    }
  })
  async getMenuItems(@Param('restaurantId', MongoIdValidationPipe) restaurantId: string) {
    return this.restaurantService.getMenuItems(restaurantId);
  }

/**
   * Retrieves all menu items for that specific manager.
   *
   * @param req taken this to get manager ID  from  token.
   * @returns A list of menu items of the restaurant to that specific manager.
   */
  @Get('menuItem') 
  @UseGuards(JwtAuthGuard, ManagerGuard) 
  @ApiBearerAuth('JWT') 
  @ApiOperation({ summary: 'Get all menu items for the authenticated manager\'s restaurant' })
  @ApiOkResponse({
    description: 'Successfully retrieved the list of menu items for the manager\'s restaurant.',
    type: [MenuItem], 
      example: [
        {
          _id: "65e23c72b212f0a1c9d2f3c7",
          name: "Manager's Special Burger",
          description: "Our special burger, only for our valued manager's restaurant.",
          price: 15.00,
          imageUrl: "https://example.com/manager-burger.jpg",
          restaurantId: "65e23c72b212f0a1c9d2f3c6", 
          isAvailable: true,
          tags: ['burger', 'special'],
          createdAt: "2024-06-20T10:10:00.000Z",
          updatedAt: "2024-06-20T10:10:00.000Z",
          __v: 0
        },
        {
          _id: "65e23c72b212f0a1c9d2f3c8",
          name: "Fresh Garden Salad",
          description: "A light and healthy option.",
          price: 8.50,
          imageUrl: "https://example.com/salad.jpg",
          restaurantId: "65e23c72b212f0a1c9d2f3c6", 
          isAvailable: true,
          tags: ['salad', 'healthy'],
          createdAt: "2024-06-20T10:15:00.000Z",
          updatedAt: "2024-06-20T10:15:00.000Z",
          __v: 0
        }
      ]
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing JWT token.',
    schema: {
        example: {
            statusCode: 401,
            message: "Unauthorized",
            error: "Unauthorized"
        }
    }
  })
  @ApiForbiddenResponse({
    description: 'Forbidden. User does not have the manager role.',
    schema: {
        example: {
            statusCode: 403,
            message: "Forbidden resource",
            error: "Forbidden"
        }
    }
  })
  @ApiNotFoundResponse({
    description: 'Not Found. No restaurant is linked to the authenticated manager, or the restaurant has no menu items.',
    schema: {
        example: {
            statusCode: 404,
            message: "No restaurant found for the authenticated manager or no menu items exist.",
            error: "Not Found"
        }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error. An unexpected error occurred while retrieving menu items for the manager.',
    schema: {
        example: {
            statusCode: 500,
            message: "An unknown error occurred",
            error: "Internal Server Error"
        }
    }
  })
  async getMenuItemForManager(@Req() req: any){
    const managerId = req.user.sub;
    return await this.restaurantService.getMenuItemForManager(managerId);
  }

/**
   * Retrieves all coupons associated with a specific restaurant.
   *
   * @param restaurantId The unique identifier of the restaurant for which to retrieve coupons.
   * @returns A list of coupon objects associated with the specified restaurant.
   */
  @Get('coupons/:restaurantId')
  @ApiOperation({ summary: 'Get all coupons for a specific restaurant' })
  @ApiParam({
    name: 'restaurantId',
    type: String,
    description: 'The unique identifier (MongoDB ObjectId) of the restaurant.',
    example: '65e23c72b212f0a1c9d2f3c6',
  })
  @ApiOkResponse({
    description: 'Successfully retrieved the list of coupons for the specified restaurant.',
    type: [Coupon], 
      example: [
        {
          _id: "65e23c72b212f0a1c9d2f3c9",
          code: "SUMMERFUN",
          discountPercentage: 15,
          minOrderAmount: 50,
          restaurantId: "65e23c72b212f0a1c9d2f3c6",
          isActive: true,
          expirationDate: "2025-08-31T23:59:59.000Z",
          createdAt: "2025-06-01T10:00:00.000Z",
          updatedAt: "2025-06-01T10:00:00.000Z"
        },
        {
          _id: "65e23c72b212f0a1c9d2f3ca",
          code: "FREEDELIVERY",
          discountPercentage: 0,
          maxDiscountAmount: 5, 
          minOrderAmount: 20,
          restaurantId: "65e23c72b212f0a1c9d2f3c6",
          isActive: true,
          expirationDate: "2025-07-15T23:59:59.000Z",
          createdAt: "2025-06-05T14:30:00.000Z",
          updatedAt: "2025-06-05T14:30:00.000Z"
        }
      ]
  })
  @ApiBadRequestResponse({
    description: 'Bad Request. Invalid restaurant ID format (e.g., not a valid ObjectId).',
    schema: {
        example: {
            statusCode: 400,
            message: "Invalid ID format: \"invalid-id\". Must be a valid MongoDB ObjectId.",
            error: "Bad Request"
        }
    }
  })
  @ApiNotFoundResponse({
    description: 'Not Found. Restaurant with the given ID was not found, or it has no coupons.',
    schema: {
        example: {
            statusCode: 404,
            message: "Restaurant not found or no coupons exist for this restaurant.",
            error: "Not Found"
        }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error. An unexpected error occurred while retrieving coupons.',
    schema: {
        example: {
            statusCode: 500,
            message: "An unknown error occurred",
            error: "Internal Server Error"
        }
    }
  })
  async getCoupons(@Param('restaurantId', MongoIdValidationPipe) restaurantId: string) {
    return await this.restaurantService.getCoupons(restaurantId);
  }


/**
   * Creates a new coupon for a specific restaurant.
   * Requires authentication and either the 'ADMIN' or 'MANAGER' role.
   *
   * @param restaurantId The unique identifier of the restaurant for which the coupon is being created.
   * @param dto The data transfer object containing the details of the new coupon.
   * @returns The newly created coupon object.
   */
  @UseGuards(GrpcAuthGuard)
  @Post('coupons/:restaurantId')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a new coupon for a restaurant' })
  @ApiParam({
    name: 'restaurantId',
    type: String,
    description: 'The unique identifier (MongoDB ObjectId) of the restaurant.',
    example: '65e23c72b212f0a1c9d2f3c6',
  })
  @ApiBody({
    type: CouponDto,
    description: 'The data transfer object containing the coupon details.',
    examples: {
      'application/json': {
        summary: 'Example Coupon DTO',
        value: {
          code: 'WELCOME10',
          discountPercentage: 10,
          minOrderAmount: 25,
          expirationDate: '2025-12-31T23:59:59.000Z',
          isActive: true,
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'The coupon has been successfully created.',
    type: CouponDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request. Invalid input data or restaurant ID format.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed',
        errors: [
          {
            property: 'code',
            constraints: {
              isNotEmpty: 'code should not be empty',
            },
          },
        ],
      },
    },
  })
    @ApiForbiddenResponse({
        description: 'Forbidden.  The user does not have permission to create coupons.',
        schema: {
            example: {
                statusCode: 403,
                message: 'Forbidden',
                error: 'Forbidden'
            }
        }
    })
  @ApiNotFoundResponse({
    description: 'Not Found. Restaurant with the given ID was not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Restaurant not found',
        error: 'Not Found',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error. An unexpected error occurred.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    },
  })
  async createCoupon(
    @Param('restaurantId', MongoIdValidationPipe) restaurantId: string,
    @Body() dto: CouponDto,
  ) {
    return this.restaurantService.createCoupon(restaurantId, dto);
  }


/**
   * Updates an existing coupon by its ID.
   * Requires authentication and either the 'ADMIN' or 'MANAGER' role.
   *
   * @param couponId The unique identifier of the coupon to update.
   * @param dto The data transfer object containing the updated coupon details.
   * @returns The updated coupon object.
   */
  @UseGuards(GrpcAuthGuard)
  @Put('coupons/:couponId')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update an existing coupon by ID' })
  @ApiParam({
    name: 'couponId',
    type: String,
    description: 'The unique identifier (MongoDB ObjectId) of the coupon to update.',
    example: '65e23c72b212f0a1c9d2f3c9', 
  })
  @ApiBody({
    type: UpdateCoponDto,
    description: 'Data for updating the coupon. Only provide fields to be updated.',
    examples: {
      updateDiscount: {
        summary: 'Update coupon discount percentage',
        value: {
          discountPercentage: 25,
        } as UpdateCoponDto, 
      },
      deactivateCoupon: {
        summary: 'Deactivate a coupon',
        value: {
          isActive: false,
          expirationDate: '2025-06-20T18:30:00.000Z'
        } as UpdateCoponDto,
      },
    },
  })
  @ApiOkResponse({
    description: 'The coupon has been successfully updated.',
    type: Coupon, 
    schema: {
        example: {
            _id: "65e23c72b212f0a1c9d2f3c9",
            code: "SUMMERFUN",
            discountPercentage: 25, 
            minOrderAmount: 50,
            restaurantId: "65e23c72b212f0a1c9d2f3c6",
            isActive: true,
            expirationDate: "2025-08-31T23:59:59.000Z",
            createdAt: "2025-06-01T10:00:00.000Z",
            updatedAt: "2025-06-20T18:30:00.000Z" 
        }
    }
  })
  @ApiBadRequestResponse({
    description: `
      - Invalid coupon ID format (e.g., not a valid ObjectId).
      - Invalid request payload (validation errors from UpdateCouponDto).
      - Invalid data (e.g., negative discount percentage, expiration date in the past).
    `,
    schema: {
        example: {
            statusCode: 400,
            message: "Validation failed (numeric string is expected)",
            error: "Bad Request"
        }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing JWT token.',
    schema: {
        example: {
            statusCode: 401,
            message: "Unauthorized",
            error: "Unauthorized"
        }
    }
  })
  @ApiForbiddenResponse({
    description: 'Forbidden. User does not have ADMIN or MANAGER role, or manager is attempting to update a coupon they do not own/manage.',
    schema: {
        example: {
            statusCode: 403,
            message: "Forbidden resource",
            error: "Forbidden"
        }
    }
  })
  @ApiNotFoundResponse({
    description: 'Not Found. Coupon with the given ID does not exist.',
    schema: {
        example: {
            statusCode: 404,
            message: "Coupon not found",
            error: "Not Found"
        }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error. An unexpected error occurred while updating the coupon.',
    schema: {
        example: {
            statusCode: 500,
            message: "An unknown error occurred",
            error: "Internal Server Error"
        }
    }
  })
  async updateCoupon(@Param('couponId', MongoIdValidationPipe) couponId: string, @Body() dto: UpdateCoponDto) {
    return await this.restaurantService.updateCoupon(couponId, dto);
  }

/**
   * Deletes a coupon by its ID.
   * Authentication and authorization (e.g., ADMIN or MANAGER role) are highly recommended for this endpoint.
   *
   * @param couponId The unique identifier of the coupon to delete.
   * @returns A success message or the deleted coupon object confirmation.
   */
  // @UseGuards(GrpcAuthGuard)
  // @ApiBearerAuth('JWT')
  // @Roles(Role.ADMIN, Role.MANAGER) 
  @Delete('coupon/:couponId')
  @ApiOperation({ summary: 'Delete a coupon by ID' })
  @ApiParam({
    name: 'couponId',
    type: String,
    description: 'The unique identifier (MongoDB ObjectId) of the coupon to delete.',
    example: '65e23c72b212f0a1c9d2f3c9', 
  })
  @ApiOkResponse({
    description: 'The coupon has been successfully deleted.',
      example: {
        message: 'Coupon with ID 65e23c72b212f0a1c9d2f3c9 successfully deleted.',
        deletedCount: 1, 
      },
  })
  @ApiBadRequestResponse({
    description: 'Bad Request. Invalid coupon ID format (e.g., not a valid ObjectId).',
    schema: {
      example: {
        statusCode: 400,
        message: "Invalid ID format: \"invalid-id\". Must be a valid MongoDB ObjectId.",
        error: "Bad Request",
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Not Found. Coupon with the given ID does not exist.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Coupon not found',
        error: 'Not Found',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error. An unexpected error occurred while deleting the coupon.',
    schema: {
      example: {
        statusCode: 500,
        message: 'An unknown error occurred',
        error: 'Internal Server Error',
      },
    },
  })
  async deleteCoupon(@Param('couponId', MongoIdValidationPipe) couponId: string) {
    return await this.restaurantService.deleteCoupon(couponId);
  }

/**
   * Searches for restaurants that offer a specific food item.
   * Requires user authentication and the 'USER' role.
   *
   * @param query The food item to search for (e.g., "pizza", "sushi").
   * @returns A list of restaurants that offer the specified food, or an empty array if none are found.
   */
  // @UseGuards(GrpcAuthGuard)
  @Get('search/food')
  // @Roles(Role.USER) 
  @ApiBearerAuth('JWT') 
  @ApiOperation({ summary: 'Search for restaurants by a specific food item' })
  @ApiQuery({
    name: 'q', 
    type: SearchFoodDto,
    required: true,
    description: 'The food item to search for (e.g., "pizza", "sushi").',
    example: 'burger',
  })
  @ApiOkResponse({
    description: 'Successfully retrieved a list of restaurants that offer the specified food.',
    type: [Restaurant], 
      example: [
        {
          _id: "65e23c72b212f0a1c9d2f3c7",
          name: "Burger Haven",
          description: "Home of the best burgers in town.",
          address: "123 Burger St, Food City",
          phone: "+1234567890",
          location: { type: "Point", coordinates: [-74.0000, 40.7000] },
          managerId: "65e23c72b212f0a1c9d2f3c6",
          isActive: true,
          tags: ["burger", "fastfood", "american"],
          isBlocked: false,
          isDeleted: false,
          createdAt: "2024-06-15T10:00:00.000Z",
          updatedAt: "2024-06-15T10:00:00.000Z",
          __v: 0
        },
        {
          _id: "65e23c72b212f0a1c9d2f3c8",
          name: "The Diner Co.",
          description: "Classic diner with a wide menu including burgers.",
          address: "456 Diner Ave, Retroville",
          phone: "+4445556666",
          location: { type: "Point", coordinates: [-73.9000, 40.8000] },
          managerId: "65e23c72b212f0a1c9d2f3c9",
          isActive: true,
          tags: ["diner", "american", "shakes", "burger"],
          isBlocked: false,
          isDeleted: false,
          createdAt: "2024-06-10T10:00:00.000Z",
          updatedAt: "2024-06-10T10:00:00.000Z",
          __v: 0
        }
      ]
  })
  @ApiBadRequestResponse({
    description: 'Bad Request. Invalid search query (e.g., empty query if required, or other validation errors if `SearchFoodDto` is complex).',
    schema: {
        example: {
            statusCode: 400,
            message: "Validation failed (query string is expected)", 
            error: "Bad Request"
        }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing JWT token.',
    schema: {
        example: {
            statusCode: 401,
            message: "Unauthorized",
            error: "Unauthorized"
        }
    }
  })
  @ApiForbiddenResponse({
    description: 'Forbidden. User does not have the "USER" role.',
    schema: {
        example: {
            statusCode: 403,
            message: "Forbidden resource",
            error: "Forbidden"
        }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error. An unexpected error occurred while searching for restaurants.',
    schema: {
        example: {
            statusCode: 500,
            message: "An unknown error occurred",
            error: "Internal Server Error"
        }
    }
  })
  async searchByFood(@Query('q') query: SearchFoodDto) { 
    return this.restaurantService.searchRestaurantsByFood(query);
  }

  /**
   * Retrieves a single restaurant by its ID.
   *
   * @param id The unique identifier of the restaurant.
   * @returns The restaurant object if found, otherwise throws a NotFound exception.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single restaurant by its ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The unique identifier (MongoDB ObjectId) of the restaurant.',
    example: '65e23c72b212f0a1c9d2f3c6', 
  })
  @ApiOkResponse({
    description: 'Successfully retrieved the restaurant.',
    type: Restaurant, 
      example: {
        _id: "65e23c72b212f0a1c9d2f3c6",
        name: "The Grand Buffet",
        description: "A lavish buffet experience with global cuisines.",
        address: "789 Feast St, Gastronomy City",
        phone: "+1122334455",
        location: {
          type: 'Point',
          coordinates: [-73.9855, 40.7580] 
        },
        managerId: "65e23c72b212f0a1c9d2f3c5",
        isActive: true,
        tags: ["buffet", "international", "fine-dining"],
        isBlocked: false,
        isDeleted: false,
        createdAt: "2024-05-10T09:00:00.000Z",
        updatedAt: "2024-05-10T09:00:00.000Z",
        __v: 0
      }
  })
  @ApiBadRequestResponse({
    description: 'Bad Request. Invalid restaurant ID format (e.g., not a valid MongoDB ObjectId).',
    schema: {
      example: {
        statusCode: 400,
        message: "Validation failed (ObjectId is expected)",
        error: "Bad Request"
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Not Found. Restaurant with the given ID was not found.',
    schema: {
      example: {
        statusCode: 404,
        message: "Restaurant not found",
        error: "Not Found"
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error. An unexpected error occurred while retrieving the restaurant.',
    schema: {
      example: {
        statusCode: 500,
        message: "An unknown error occurred",
        error: "Internal Server Error"
      }
    }
  })
  async getRestaurantById(@Param('id', MongoIdValidationPipe) id: string) {
    return this.restaurantService.getRestaurantById(id);
  }
}
