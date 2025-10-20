import { ApiProperty } from '@nestjs/swagger';

export class SendPresentationDto {
  @ApiProperty({ description: 'Presentation specification' })
  presentation_spec: any;
}

export class SendPresentationRequestDto {
  @ApiProperty({ description: 'Connection ID to send request to' })
  connection_id: string;

  @ApiProperty({ description: 'Presentation request' })
  presentation_request: any;
}

export class ProblemReportDto {
  @ApiProperty({ description: 'Problem description' })
  description: string;
}