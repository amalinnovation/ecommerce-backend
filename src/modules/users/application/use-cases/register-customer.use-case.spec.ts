import bcrypt from 'bcrypt';
import { describe, expect, it, vi } from 'vitest';
import type { User } from '../../domain/entities/user.entity';
import type { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { EmailAlreadyRegisteredError } from '../../domain/errors/email-already-registered.error';
import { RegisterCustomerUseCase } from './register-customer.use-case';

class FakeUserRepository implements UserRepositoryPort {
  users: User[] = [];

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(this.users.find((u) => u.email === email) ?? null);
  }

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.find((u) => u.id === id) ?? null);
  }

  create(data: { email: string; passwordHash: string; role: User['role'] }): Promise<User> {
    const user: User = { id: `user-${this.users.length + 1}`, createdAt: new Date(), ...data };
    this.users.push(user);
    return Promise.resolve(user);
  }
}

describe('RegisterCustomerUseCase', () => {
  it('email ya registrado lanza EmailAlreadyRegisteredError y no crea nada', async () => {
    const repo = new FakeUserRepository();
    repo.users.push({
      id: 'user-1',
      email: 'ya@existe.com',
      passwordHash: 'hash',
      role: 'customer',
      createdAt: new Date(),
    });
    const createSpy = vi.spyOn(repo, 'create');
    const useCase = new RegisterCustomerUseCase(repo);

    await expect(useCase.execute('ya@existe.com', 'password123')).rejects.toThrow(
      EmailAlreadyRegisteredError,
    );
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('camino feliz crea un customer con el password hasheado', async () => {
    const repo = new FakeUserRepository();
    const useCase = new RegisterCustomerUseCase(repo);

    const user = await useCase.execute('nueva@cliente.com', 'password123');

    expect(user.email).toBe('nueva@cliente.com');
    expect(user.role).toBe('customer');
    expect(user.passwordHash).not.toBe('password123');
    expect(await bcrypt.compare('password123', user.passwordHash)).toBe(true);
  });
});
