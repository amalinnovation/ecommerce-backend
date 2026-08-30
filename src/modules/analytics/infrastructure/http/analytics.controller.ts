import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentVisitorId } from '../../../identity';
import { IngestEventsUseCase } from '../../application/use-cases/ingest-events.use-case';
import { IngestEventsDto } from './dto/ingest-events.dto';

@ApiTags('analytics')
@Controller('v1/events')
export class AnalyticsController {
  constructor(private readonly ingestEvents: IngestEventsUseCase) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Ingesta de eventos de analítica, por lotes' })
  async ingest(@CurrentVisitorId() visitorId: string, @Body() dto: IngestEventsDto): Promise<void> {
    await this.ingestEvents.execute(
      visitorId,
      dto.events.map((event) => ({
        eventType: event.eventType,
        payload: event.payload,
        occurredAt: event.occurredAt ? new Date(event.occurredAt) : undefined,
      })),
    );
  }
}
