import { RolesGuard } from "./role.guard";

describe('RoleGuard', () => {
  it('should be defined', () => {
    expect(new RolesGuard()).toBeDefined();
  });
});
