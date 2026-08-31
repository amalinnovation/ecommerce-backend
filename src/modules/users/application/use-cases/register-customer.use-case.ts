import bcrypt from 'bcrypt';
import { Inject, Injectable } from '@nestjs/common';
import type { User } from '../../domain/entities/user.entity';
import { USER_REPOSITORY_PORT, type UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { EmailAlreadyRegisteredError } from '../../domain/errors/email-already-registered.error';

const SALT_ROUNDS = 10;

@Injectable()
export class RegisterCustomerUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT) private readonly users: UserRepositoryPort,
  ) {}

  async execute(email: string, password: string): Promise<User> {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new EmailAlreadyRegisteredError('El email ya está registrado', { email });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    return this.users.create({ email, passwordHash, role: 'customer' });
  }
}
