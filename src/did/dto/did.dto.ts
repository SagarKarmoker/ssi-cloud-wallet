import { ApiProperty } from '@nestjs/swagger';

export class CreateDidDto {
  @ApiProperty({ required: false, description: 'DID method to use (default: key)' })
  method?: string;

  @ApiProperty({ required: false, description: 'Options for DID creation' })
  options?: any;
}

export class CreateSchemaDto {
  @ApiProperty({ description: 'Schema name' })
  schema_name: string;

  @ApiProperty({ description: 'Schema version' })
  schema_version: string;

  @ApiProperty({ description: 'List of attribute names', type: [String] })
  attributes: string[];
}

export class CreateCredentialDefinitionDto {
  @ApiProperty({ description: 'Schema ID' })
  schema_id: string;

  @ApiProperty({ description: 'Credential definition tag' })
  tag: string;

  @ApiProperty({ required: false, description: 'Support revocation', default: false })
  support_revocation?: boolean;
}