import { Body, Controller, Get } from '@nestjs/common';
import { CredentialService } from './credential.service';

@Controller('api/credential')
export class CredentialController {
  constructor(private readonly credentialService: CredentialService) {}

  @Get('list-credentials')
  async listCredentials(@Body() body: { walletId: string }) {
    return this.credentialService.listCredentials(body.walletId);
  }
}
