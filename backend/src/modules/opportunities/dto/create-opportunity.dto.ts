import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { OpportunityStatus } from '../enums/opportunity-status.enum';

export class CreateOpportunityDto {
  @IsString({ message: 'Título deve ser uma string' })
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @MaxLength(150, { message: 'Título deve ter no máximo 150 caracteres' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  @MaxLength(1000, { message: 'Descrição deve ter no máximo 1000 caracteres' })
  description?: string;

  @IsNumber({}, { message: 'Valor deve ser um número' })
  @Min(0.01, { message: 'Valor deve ser maior que zero' })
  value: number;

  @IsOptional()
  @IsEnum(OpportunityStatus, {
    message: `Status inválido. Valores aceitos: ${Object.values(OpportunityStatus).join(', ')}`,
  })
  status?: OpportunityStatus;

  @IsOptional()
  @IsDateString({}, { message: 'Data deve estar no formato ISO 8601' })
  expectedCloseDate?: string;

  @IsUUID('4', { message: 'clientId deve ser um UUID válido' })
  clientId: string;
}
