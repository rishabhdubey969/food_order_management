import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TokenService {

    constructor(private readonly jwtService: JwtService){}

    async hash(data: string){
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(data, salt);
    }

    async compare(data1: string, data2: string){
        return await bcrypt.compare(data1, data2);
    }

    async sign(payload: any, expiresIn?: string){
        const signOptions: { expiresIn?: string } = {};
        if (expiresIn) {
            signOptions.expiresIn = expiresIn;
        }
        return await this.jwtService.sign(payload, signOptions);
    }

    async verify(accessToken: string){
        return await this.jwtService.verify(accessToken);
    }
    
}
