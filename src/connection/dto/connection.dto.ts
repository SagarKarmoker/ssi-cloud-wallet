import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'Message content' })
  content: string;
}

export class CreateInvitationDto {
  @ApiProperty({ required: false, description: 'Include public DID' })
  use_public_did?: boolean;

  @ApiProperty({ required: false, description: 'Alias for the connection' })
  alias?: string;
}