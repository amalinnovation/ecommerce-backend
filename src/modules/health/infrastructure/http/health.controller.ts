import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

class HealthResponseDto {
  status!: 'ok';
  timestamp!: string;
}

@ApiTags('health')
@Controller('v1/health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Confirma que el servicio está arriba' })
  @ApiOkResponse({ type: HealthResponseDto })
  check(): HealthResponseDto {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
