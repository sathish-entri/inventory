import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";
import { EMAIL_PROVIDER, StubEmailProvider } from "../integrations/providers";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow("JWT_ACCESS_SECRET"),
        signOptions: { expiresIn: config.get("JWT_ACCESS_EXPIRES_IN", "15m") },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, { provide: EMAIL_PROVIDER, useClass: StubEmailProvider }],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
