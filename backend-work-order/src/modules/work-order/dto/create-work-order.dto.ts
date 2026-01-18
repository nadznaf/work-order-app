import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsArray, IsNumber, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
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

export class SparepartItemDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  qty: number;
}

export class CreateSparepartRequestDto {
  @IsNotEmpty()
  @IsString()
  work_order_id: string;

  @IsNotEmpty()
  @IsString()
  requested_by: string; // User ID

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SparepartItemDto)
  items: SparepartItemDto[];
}
