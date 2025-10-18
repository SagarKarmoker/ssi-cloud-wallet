import { Body, Controller, Post } from '@nestjs/common';
import { ConnectionService } from './connection.service';

@Controller('api/connection')
export class ConnectionController {
    constructor(private readonly connectionService: ConnectionService) {}

    @Post('accept-invitation')
    acceptInvitation(@Body() body: { walletId: string, invitation: any }) {
        return this.connectionService.acceptInvitation(body.walletId, body.invitation);
    }
}
