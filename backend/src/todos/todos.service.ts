import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  create(userId: string, title: unknown) {
    const trimmed = typeof title === 'string' ? title.trim() : '';
    if (!trimmed) {
      throw new BadRequestException('title is required');
    }
    if (trimmed.length > 500) {
      throw new BadRequestException('title is too long');
    }
    return this.prisma.todo.create({ data: { userId, title: trimmed } });
  }
}
