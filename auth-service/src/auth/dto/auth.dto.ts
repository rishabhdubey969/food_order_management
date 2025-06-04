
export class LoginRequestDto {
  email: string;
  password: string;
  deviceId: string;
  role:number
}

export class LogoutRequestDto {
  userId: string;
  deviceId: string;
}
