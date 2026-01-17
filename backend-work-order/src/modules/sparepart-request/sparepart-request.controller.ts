import { Body, Controller, Param, Post, Headers } from '@nestjs/common';
import { SparepartRequestService } from './sparepart-request.service';
import { CreateSparepartRequestDto } from '../work-order/dto/create-work-order.dto';

@Controller('sparepart-requests')
export class SparepartRequestController {
  constructor(private readonly service: SparepartRequestService) {}

  @Post()
  async create(@Body() dto: CreateSparepartRequestDto, @Headers('x-role') role: string) {
    return this.service.create(dto, role);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Body() body: { approver_id: string }, @Headers('x-role') role: string) {
    return this.service.approve(id, body.approver_id, role);
  }
}
