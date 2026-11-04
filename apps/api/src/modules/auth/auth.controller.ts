import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { ForgotPasswordDto, LoginDto, RefreshDto, RegisterDto, ResetPasswordDto, VerifyEmailDto } from "./dto";
import { CurrentUser, type AuthUser } from "../../common/current-user.decorator";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.auth.register(dto, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    this.setRefreshCookie(res, tokens.refreshToken);
    return tokens;
  }

  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.auth.login(dto, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    this.setRefreshCookie(res, tokens.refreshToken);
    return tokens;
  }

  @Post("refresh")
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = (req as any).cookies as Record<string, string> | undefined;
    const token = dto.refreshToken ?? cookies?.refreshToken;
    const tokens = await this.auth.refresh(token ?? "", {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    this.setRefreshCookie(res, tokens.refreshToken);
    return tokens;
  }

  @Post("logout")
  async logout(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = (req as any).cookies as Record<string, string> | undefined;
    const token = dto.refreshToken ?? cookies?.refreshToken;
    const user = (req as any).user as AuthUser | undefined;
    this.clearRefreshCookie(res);
    return this.auth.logout(token, user?.id);
  }

  @Post("forgot-password")
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email, dto.organizationSlug);
  }

  @Post("reset-password")
  reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }

  @Post("verify-email")
  verify(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie("refreshToken", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.COOKIE_SECURE === "true",
      domain: process.env.COOKIE_DOMAIN || undefined,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.COOKIE_SECURE === "true",
      domain: process.env.COOKIE_DOMAIN || undefined,
      path: "/",
    });
  }
}
