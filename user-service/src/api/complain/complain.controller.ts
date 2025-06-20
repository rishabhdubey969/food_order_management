import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ComplainService } from './complain.service';
import { CreateComplainDto } from './dto/create-complain.dto';
import { UpdateComplainDto } from './dto/update-complain.dto';

@Controller('complain')
export class ComplainController {
  constructor(private readonly complainService: ComplainService) {}

  @Post()
  create(@Body() createComplainDto: CreateComplainDto) {
    return this.complainService.create(createComplainDto);
  }

  @Get()
  findAll() {
    return this.complainService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.complainService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateComplainDto: UpdateComplainDto) {
    return this.complainService.update(+id, updateComplainDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.complainService.remove(+id);
  }
}
