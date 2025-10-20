import { Body, Controller, Post } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { AcceptInviteDto } from './dto/acceptInvite.dto';

@Controller('api/connection')
export class ConnectionController {
    constructor(private readonly connectionService: ConnectionService) {}

    @Post('accept-invitation')
    acceptInvitation(@Body() body: AcceptInviteDto) {
        return this.connectionService.acceptInvitation(body.walletId, body.invitation);
    }
}
