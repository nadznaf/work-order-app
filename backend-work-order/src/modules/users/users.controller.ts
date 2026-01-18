
import { Controller, Get, Query, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(@Query('role') role?: string) {
    if (role) {
      return this.prisma.user.findMany({
        where: { role: role as any },
        select: { id: true, name: true, role: true }
      });
    }
    return this.prisma.user.findMany({
      select: { id: true, name: true, role: true }
    });
  }
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, role: true }
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }
}
