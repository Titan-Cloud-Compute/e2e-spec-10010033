import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';

function makePrisma() {
  return {
    todo: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({ id: 't1', completed: false, createdAt: new Date(), ...data }),
      ),
    },
  };
}

function req(userId?: string): Request {
  return { session: userId ? { userId, role: 'USER', firmId: null } : undefined } as unknown as Request;
}

describe('TodosController', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let controller: TodosController;

  beforeEach(() => {
    prisma = makePrisma();
    controller = new TodosController(new TodosService(prisma as never));
  });

  it('is mounted at api/todos and guarded by JwtAuthGuard', () => {
    expect(Reflect.getMetadata(PATH_METADATA, TodosController)).toBe('api/todos');
    expect(Reflect.getMetadata(GUARDS_METADATA, TodosController)).toContain(JwtAuthGuard);
  });

  it('GET lists only the current user\'s todos', async () => {
    await expect(controller.list(req('u1'))).resolves.toEqual([]);
    expect(prisma.todo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } }),
    );
  });

  it('POST creates a todo owned by the current user and returns it', async () => {
    const todo = await controller.create(req('u1'), { title: '  Buy milk ' });
    expect(prisma.todo.create).toHaveBeenCalledWith({ data: { userId: 'u1', title: 'Buy milk' } });
    expect(todo).toMatchObject({ id: 't1', title: 'Buy milk', userId: 'u1', completed: false });
  });

  it('POST rejects an empty title', () => {
    expect(() => controller.create(req('u1'), { title: '   ' })).toThrow(BadRequestException);
    expect(() => controller.create(req('u1'), {})).toThrow(BadRequestException);
    expect(prisma.todo.create).not.toHaveBeenCalled();
  });

  it('rejects requests without a session', () => {
    expect(() => controller.list(req())).toThrow(UnauthorizedException);
  });
});
