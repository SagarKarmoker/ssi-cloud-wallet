import { Body, Controller, Get } from '@nestjs/common';
import { CredentialService } from './credential.service';
import { WalletDto } from './dto/wallet.dto';

@Controller('api/credential')
export class CredentialController {
  constructor(private readonly credentialService: CredentialService) {}

  @Get('list-credentials')
  async listCredentials(@Body() body: WalletDto) {
    return this.credentialService.listCredentials(body.walletId);
  }
}
