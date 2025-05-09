import { Injectable } from '@nestjs/common';

@Injectable()
export class ManagerService {

    login(email: string, password: string): string {
        // Implement your login logic here
        return `Logged in with email: ${email}`;
    }

    signup(name: string, email: string, phone: string, password: string, restaurantId?: string): string {
        // Implement your signup logic here
        return `Signed up with email: ${email}, name: ${name}, phone: ${phone}, restaurantId: ${restaurantId}`;
    }
}
