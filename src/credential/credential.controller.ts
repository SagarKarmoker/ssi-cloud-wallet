import { Body, Controller, Get, Post, Param, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CredentialService } from './credential.service';
import { WalletDto } from './dto/wallet.dto';

@ApiTags('Credentials')
@Controller('api/credential')
export class CredentialController {
  constructor(private readonly credentialService: CredentialService) {}

  @Get(':walletId/credentials')
  @ApiOperation({ summary: 'List all credentials in wallet' })
  @ApiResponse({ status: 200, description: 'Credentials retrieved successfully' })
  async listCredentials(
    @Param('walletId') walletId: string,
    @Query('wql') wql?: string
  ) {
    return this.credentialService.listCredentials(walletId, wql);
  }

  @Get(':walletId/credentials/w3c')
  @ApiOperation({ summary: 'List all W3C/JSON-LD credentials in wallet' })
  @ApiResponse({ status: 200, description: 'W3C credentials retrieved successfully' })
  async listW3cCredentials(
    @Param('walletId') walletId: string
  ) {
    return this.credentialService.listW3cCredentials(walletId);
  }

  @Get(':walletId/credentials/:credentialId')
  @ApiOperation({ summary: 'Get credential details' })
  @ApiResponse({ status: 200, description: 'Credential details retrieved successfully' })
  async getCredential(
    @Param('walletId') walletId: string,
    @Param('credentialId') credentialId: string
  ) {
    return this.credentialService.getCredential(walletId, credentialId);
  }

  @Get(':walletId/credential-exchange')
  @ApiOperation({ summary: 'List credential exchange records' })
  @ApiResponse({ status: 200, description: 'Credential exchange records retrieved successfully' })
  async getCredentialExchangeRecords(
    @Param('walletId') walletId: string,
    @Query('state') state?: string,
    @Query('connection_id') connectionId?: string
  ) {
    return this.credentialService.getCredentialExchangeRecords(walletId, state, connectionId);
  }

  @Get(':walletId/credential-exchange/:credExId')
  @ApiOperation({ summary: 'Get credential exchange record details' })
  @ApiResponse({ status: 200, description: 'Credential exchange record details retrieved successfully' })
  async getCredentialExchangeRecord(
    @Param('walletId') walletId: string,
    @Param('credExId') credExId: string
  ) {
    return this.credentialService.getCredentialExchangeRecord(walletId, credExId);
  }

  @Post(':walletId/credential-exchange/:credExId/send-request')
  @ApiOperation({ summary: 'Send credential request (accept offer)' })
  @ApiResponse({ status: 200, description: 'Credential request sent successfully' })
  async sendCredentialRequest(
    @Param('walletId') walletId: string,
    @Param('credExId') credExId: string
  ) {
    return this.credentialService.sendCredentialRequest(walletId, credExId);
  }

  @Post(':walletId/credential-exchange/:credExId/store')
  @ApiOperation({ summary: 'Store a received credential' })
  @ApiResponse({ status: 200, description: 'Credential stored successfully' })
  async storeCredential(
    @Param('walletId') walletId: string,
    @Param('credExId') credExId: string,
    @Body('credential_id') credentialId?: string
  ) {
    return this.credentialService.storeCredential(walletId, credExId, credentialId);
  }

  @Post(':walletId/credential-exchange/:credExId/problem-report')
  @ApiOperation({ summary: 'Send problem report for credential exchange' })
  @ApiResponse({ status: 200, description: 'Problem report sent successfully' })
  async sendProblemReport(
    @Param('walletId') walletId: string,
    @Param('credExId') credExId: string,
    @Body('description') description: string
  ) {
    return this.credentialService.sendProblemReport(walletId, credExId, description);
  }

  @Delete(':walletId/credentials/:credentialId')
  @ApiOperation({ summary: 'Remove a credential from wallet' })
  @ApiResponse({ status: 200, description: 'Credential removed successfully' })
  async removeCredential(
    @Param('walletId') walletId: string,
    @Param('credentialId') credentialId: string
  ) {
    return this.credentialService.removeCredential(walletId, credentialId);
  }
}
