import { Body, Controller, Get, Param, Patch, Post, Headers } from '@nestjs/common';
import { WorkOrderService } from './work-order.service';
import { CreateWorkOrderDto, AssignWorkOrderDto, UpdatedWorkOrderDto } from './dto/create-work-order.dto';

@Controller('work-orders')
export class WorkOrderController {
  constructor(private readonly service: WorkOrderService) {}

  @Post()
  async create(
    @Body() dto: CreateWorkOrderDto,
    @Headers('x-role') role: string,
    @Headers('x-user-id') userId: string
  ) {
    return this.service.create(dto, userId, role);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string, @Headers('x-role') role: string) {
    return this.service.submit(id, role);
  }

  @Post(':id/assign')
  async assign(@Param('id') id: string, @Body() body: { mechanic_id: string }, @Headers('x-role') role: string) {
    return this.service.assign({ id, mechanic_id: body.mechanic_id }, role);
  }

  @Post(':id/update')
  async update(@Param('id') id: string, @Body() dto: UpdatedWorkOrderDto, @Headers('x-role') role: string) {
    return this.service.update(id, dto, role);
  }



  @Post(':id/start')
  async start(@Param('id') id: string, @Headers('x-role') role: string) {
    return this.service.startWorking(id, role);
  }

  @Post(':id/complete')
  async complete(@Param('id') id: string, @Body() body: { end_date?: string }, @Headers('x-role') role: string) {
    return this.service.complete(id, body.end_date, role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    console.log(`[Controller] GET /work-orders/${id} hit`);
    return this.service.findOne(id);
  }

  @Get()
  async findAll() {
      return this.service.findAll();
  }
}
