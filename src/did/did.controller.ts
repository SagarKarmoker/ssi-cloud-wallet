import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DidService } from './did.service';

@ApiTags('DID & Schema Management')
@Controller('api/did')
export class DidController {
  constructor(private readonly didService: DidService) {}

  // DID Management
  @Post(':walletId/create')
  @ApiOperation({ summary: 'Create a new DID' })
  @ApiResponse({ status: 200, description: 'DID created successfully' })
  async createDid(
    @Param('walletId') walletId: string,
    @Body('method') method?: string,
    @Body('options') options?: any
  ) {
    return this.didService.createDid(walletId, method, options);
  }

  @Get(':walletId/list')
  @ApiOperation({ summary: 'List DIDs in wallet' })
  @ApiResponse({ status: 200, description: 'DIDs retrieved successfully' })
  async listDids(
    @Param('walletId') walletId: string,
    @Query('did') did?: string,
    @Query('verkey') verkey?: string,
    @Query('posture') posture?: string
  ) {
    return this.didService.listDids(walletId, did, verkey, posture);
  }

  @Get(':walletId/public')
  @ApiOperation({ summary: 'Get public DID' })
  @ApiResponse({ status: 200, description: 'Public DID retrieved successfully' })
  async getPublicDid(@Param('walletId') walletId: string) {
    return this.didService.getPublicDid(walletId);
  }

  @Post(':walletId/public')
  @ApiOperation({ summary: 'Set public DID' })
  @ApiResponse({ status: 200, description: 'Public DID set successfully' })
  async setPublicDid(
    @Param('walletId') walletId: string,
    @Body('did') did: string
  ) {
    return this.didService.setPublicDid(walletId, did);
  }

  @Get(':walletId/resolve/:did')
  @ApiOperation({ summary: 'Resolve a DID' })
  @ApiResponse({ status: 200, description: 'DID resolved successfully' })
  async resolveDid(
    @Param('walletId') walletId: string,
    @Param('did') did: string
  ) {
    return this.didService.resolveDid(walletId, did);
  }

  // Schema Management
  @Post(':walletId/schema')
  @ApiOperation({ summary: 'Create a new schema' })
  @ApiResponse({ status: 200, description: 'Schema created successfully' })
  async createSchema(
    @Param('walletId') walletId: string,
    @Body('schema_name') schemaName: string,
    @Body('schema_version') schemaVersion: string,
    @Body('attributes') attributes: string[]
  ) {
    return this.didService.createSchema(walletId, schemaName, schemaVersion, attributes);
  }

  @Get(':walletId/schemas')
  @ApiOperation({ summary: 'List schemas' })
  @ApiResponse({ status: 200, description: 'Schemas retrieved successfully' })
  async getSchemas(
    @Param('walletId') walletId: string,
    @Query('schema_issuer_did') schemaIssuerDid?: string,
    @Query('schema_name') schemaName?: string,
    @Query('schema_version') schemaVersion?: string
  ) {
    return this.didService.getSchemas(walletId, schemaIssuerDid, schemaName, schemaVersion);
  }

  @Get(':walletId/schema/:schemaId')
  @ApiOperation({ summary: 'Get schema by ID' })
  @ApiResponse({ status: 200, description: 'Schema retrieved successfully' })
  async getSchema(
    @Param('walletId') walletId: string,
    @Param('schemaId') schemaId: string
  ) {
    return this.didService.getSchema(walletId, schemaId);
  }

  // Credential Definition Management
  @Post(':walletId/credential-definition')
  @ApiOperation({ summary: 'Create a credential definition' })
  @ApiResponse({ status: 200, description: 'Credential definition created successfully' })
  async createCredentialDefinition(
    @Param('walletId') walletId: string,
    @Body('schema_id') schemaId: string,
    @Body('tag') tag: string,
    @Body('support_revocation') supportRevocation?: boolean
  ) {
    return this.didService.createCredentialDefinition(walletId, schemaId, tag, supportRevocation);
  }

  @Get(':walletId/credential-definitions')
  @ApiOperation({ summary: 'List credential definitions' })
  @ApiResponse({ status: 200, description: 'Credential definitions retrieved successfully' })
  async getCredentialDefinitions(
    @Param('walletId') walletId: string,
    @Query('schema_id') schemaId?: string,
    @Query('schema_issuer_did') schemaIssuerDid?: string,
    @Query('schema_name') schemaName?: string,
    @Query('schema_version') schemaVersion?: string,
    @Query('issuer_did') issuerDid?: string,
    @Query('cred_def_id') credDefId?: string
  ) {
    return this.didService.getCredentialDefinitions(
      walletId,
      schemaId,
      schemaIssuerDid,
      schemaName,
      schemaVersion,
      issuerDid,
      credDefId
    );
  }

  @Get(':walletId/credential-definition/:credDefId')
  @ApiOperation({ summary: 'Get credential definition by ID' })
  @ApiResponse({ status: 200, description: 'Credential definition retrieved successfully' })
  async getCredentialDefinition(
    @Param('walletId') walletId: string,
    @Param('credDefId') credDefId: string
  ) {
    return this.didService.getCredentialDefinition(walletId, credDefId);
  }
}