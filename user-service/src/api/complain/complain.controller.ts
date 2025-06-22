import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { ComplainService } from './complain.service';
import { CreateComplainDto } from './dto/create-complain.dto';
import { AuthGuard } from 'src/guard/auth.guard';

@Controller('complain')
export class ComplainController {
  constructor(private readonly complainService: ComplainService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  userComplain(@Body() createComplainDto: CreateComplainDto, @Req() req: any) {
    return this.complainService.userComplainService(createComplainDto, req.user.payload.sub);
  }

}
