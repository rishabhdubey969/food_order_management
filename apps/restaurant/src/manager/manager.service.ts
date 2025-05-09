import { Injectable } from '@nestjs/common';
import ManagerLoginDto from 'apps/restaurant/src/manager/dto/managerLogin.dto';
import ManagerSignupDto from 'apps/restaurant/src/manager/dto/managerSignup.dto';

@Injectable()
export class ManagerService {

    login(managerLoginDto: ManagerLoginDto) {
        // Implement your login logic here
        return { message: 'Login successful', data: managerLoginDto };
    }

    signup(managerSignupDto: ManagerSignupDto) {
        // Implement your signup logic here
        return { message: 'Signup successful', data: managerSignupDto };
    }

    getManagerById(id: string) {
        // Implement your logic to get manager by ID here
        return { message: 'Manager found', id };
    }
}
