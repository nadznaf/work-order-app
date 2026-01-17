import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { WorkOrderStatus } from '../../../common/enums/workflow.enum';

export class CreateWorkOrderDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

}

export class SubmitWorkOrderDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;
}

export class AssignWorkOrderDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsUUID()
  mechanic_id: string;
}


export class UpdatedWorkOrderDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
  
  @IsOptional()
  @IsString()
  end_date?: string; // ISO Date string
}

export class CreateSparepartRequestDto {
  @IsNotEmpty()
  @IsString()
  work_order_id: string;

  @IsNotEmpty()
  @IsString()
  requested_by: string; // User ID

  @IsNotEmpty()
  items: { name: string; qty: number }[];
}
