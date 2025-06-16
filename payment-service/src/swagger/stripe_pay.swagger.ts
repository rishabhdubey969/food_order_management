import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { CreatePaymentDto } from 'src/api/stripe_pay/DTO/create.payment.dto';


export function PaymmentDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new payment checkout-session' }),
    ApiBody({ type: CreatePaymentDto }),
    ApiResponse({ status: 201, description: ' Payment completed successfully', type: CreatePaymentDto }),
    ApiResponse({ status: 400, description: 'Invalid input' }),
    ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    ApiResponse({ status: 402, description: 'Payment Required' }),
    ApiResponse({ status: 403, description: 'Forbidden Resource' }),
    ApiResponse({ status: 404, description: 'Not Found' }),
    ApiBearerAuth(),
  );
}


export function RetryDoc(){
    return applyDecorators(
        ApiOperation({summary:' to confirm whether the payment is failed or success'}),
        ApiBody({type:CreatePaymentDto}),
        ApiResponse({ status: 201, description: ' Payment completed successfully', type: CreatePaymentDto }),
        ApiResponse({ status: 400, description: 'Invalid input' }),
        ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
        ApiResponse({ status: 402, description: 'Payment Required' }),
        ApiResponse({ status: 403, description: 'Forbidden Resource' }),
        ApiResponse({ status: 404, description: 'Not Found' }),
        ApiBearerAuth(),
        
    );
}

export function RefundDoc(){
    return applyDecorators(
        ApiOperation({summary:' to confirm whether the payment is failed or success'}),
        ApiBody({type:CreatePaymentDto}),
        ApiResponse({ status: 201, description: 'Refund completed successfully', type: CreatePaymentDto }),
        ApiResponse({ status: 400, description: 'Invalid input' }),
        ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
        ApiResponse({ status: 403, description: 'Forbidden Resource' }),
        ApiResponse({ status: 404, description: 'Not Found' }),
        ApiBearerAuth(),
        
    );
}


