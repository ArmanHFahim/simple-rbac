import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { User } from '@entities';

import { JwtPayload, UserWithPassword } from '@common/types';

import { LoginDto } from '@auth/dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async login(dto: LoginDto) {
    console.log('Login attempt:', dto.email);

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .leftJoinAndSelect('user.teams', 'teams')
      .where('user.email = :email', { email: dto.email })
      .getOne();

    console.log('User found:', !!user, user?.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userWithPassword = user as UserWithPassword;
    console.log('Password hash exists:', !!userWithPassword.passwordHash);

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      userWithPassword.passwordHash,
    );

    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      permissions: user.role.getPermissionStrings(),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['role', 'role.permissions', 'teams'],
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const tokens = await this.generateTokens(user);

      return {
        user: this.sanitizeUser(user),
        permissions: user.role.getPermissionStrings(),
        ...tokens,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'role.permissions', 'teams'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate new tokens with updated permissions
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      permissions: user.role.getPermissionStrings(),
      ...tokens,
    };
  }

  private async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: {
        id: user.role.id,
        name: user.role.name,
        scope: user.role.scope,
      },
      permissions: user.role.getPermissionStrings(),
      teamIds: user.teams?.map((t) => t.id) || [],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload as any, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') || '15m') as any,
      }),
      this.jwtService.signAsync(payload as any, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d') as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      role: {
        id: user.role.id,
        name: user.role.name,
        scope: user.role.scope,
      },
      teams: user.teams?.map((t) => ({ id: t.id, name: t.name })) || [],
      createdAt: user.createdAt,
    };
  }
}
