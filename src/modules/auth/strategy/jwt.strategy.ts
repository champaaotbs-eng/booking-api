import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/config/config.type';
import { User } from '@/modules/users/user.domain';

interface AuthPayload extends Partial<User> {
    adminId?: string
    username?: string
    fullName?: string
    roleId?: string | number
    modules?: string[]
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService<AllConfigType>) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('jwt.jwt_access_secret', { infer: true })
        });
    }

    async validate(payload: AuthPayload) {
        if (payload.adminId) {
            return {
                adminId: payload.adminId,
                username: payload.username,
                fullName: payload.fullName,
                roleId: payload.roleId,
                modules: payload.modules ?? [],
            }
        }

        const { userId, fullName, email, role } = payload
        return {
            userId,
            fullName,
            email,
            role,
            modules: payload.modules ?? [],
        }
    }

}
