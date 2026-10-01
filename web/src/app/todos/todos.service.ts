import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../shared/api/api-client.service';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

/** HTTP client for the owner-scoped /api/todos endpoints (story: add-todo). */
@Injectable({ providedIn: 'root' })
export class TodosService {
  private api = inject(ApiClient);

  list(): Promise<Todo[]> {
    return this.api.get<Todo[]>('todos');
  }

  create(title: string): Promise<Todo> {
    return this.api.post<Todo>('todos', { title });
  }
}
