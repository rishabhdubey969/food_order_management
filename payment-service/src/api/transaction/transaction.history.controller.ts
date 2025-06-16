import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionHistoryService } from './transaction.history.service';

@ApiBearerAuth()
@ApiTags('')
@Controller('payment')
export class TransactionHistoryController {
 constructor(
    private transactionHistoryService:TransactionHistoryService,
 ){}
    // @UseGuards()
    @Get()
    async getTransactionHistory(orderId:string){
        return this.transactionHistoryService.getTransactionHistory(orderId);
    }

}
