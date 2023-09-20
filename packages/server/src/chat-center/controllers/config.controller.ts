import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { ConfigService } from 'src/config';
import { AuthGuard } from '../guards/auth.guard';
import { SetGreetingConfigDto } from '../dtos/config';

@Controller('config')
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class ConfigController {
  constructor(private configService: ConfigService) {}

  @Put('greeting')
  async setGreetingConfig(@Body() data: SetGreetingConfigDto) {
    await this.configService.setGreetingConfig(data);
  }

  @Get('greeting')
  getGreetingConfig() {
    return this.configService.getGreetingConfig();
  }
}
