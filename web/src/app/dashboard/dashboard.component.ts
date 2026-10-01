import { Component, OnInit, inject, signal } from '@angular/core';
import { Todo, TodosService } from '../todos/todos.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="dashboard-page" data-placeholder>
      <header class="page-header">
        <h1>Dashboard</h1>
        <p class="subtitle">Your to-do list.</p>
      </header>
      <div class="placeholder-card">
        <form class="placeholder-form" (ngSubmit)="addTodo()">
          <div class="form-group" data-testid="todo-input">
            <label for="todo-input">New task</label>
            <input type="text" id="todo-input" data-testid="todo-title-input" [(ngModel)]="newTitle"
                   name="title" placeholder="What needs to be done?" autocomplete="off" />
          </div>
          <button type="submit" class="btn-primary" data-testid="todo-add"
                  [disabled]="saving() || !newTitle.trim()">Add</button>
          @if (error()) {
            <p class="form-error" role="alert">{{ error() }}</p>
          }
        </form>
        <ul class="todo-list" data-testid="todo-list">
          @for (todo of todos(); track todo.id) {
            <li class="todo-item" data-testid="todo-item">{{ todo.title }}</li>
          } @empty {
            <li class="todo-empty-item">
              <p class="placeholder-text" data-testid="todo-empty" style="margin:0">No tasks yet.</p>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    .page-header {
      margin-bottom: 2rem;
    }
    h1 {
      font-size: var(--font-size-xl);
      color: var(--color-text-primary);
      margin: 0 0 0.25rem;
    }
    .subtitle {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      margin: 0;
    }
    .placeholder-card {
      background: white;
      border-radius: var(--radius-card);
      border: 1px solid var(--color-border);
      padding: 2rem;
    }
    .placeholder-text {
      color: var(--color-text-secondary);
      margin: 1rem 0 0;
    }
    .btn-primary:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
    .form-error {
      color: var(--color-text-primary);
      font-size: var(--font-size-sm);
      margin: 0;
    }
    .todo-list {
      list-style: none;
      margin: 1.5rem 0 0;
      padding: 0;
    }
    .todo-item {
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-primary);
    }
    .placeholder-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    .form-group label {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .form-group input {
      padding: 0.625rem 0.75rem;
      font-size: var(--font-size-input, 1rem);
      border: 1px solid var(--color-gray-300);
      border-radius: var(--radius-btn);
      background: white;
      min-height: 44px;
    }
    .btn-primary {
      align-self: flex-start;
      padding: 0.625rem 1.5rem;
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: white;
      background: var(--color-primary);
      border: none;
      border-radius: var(--radius-btn);
      cursor: pointer;
      min-height: 44px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private todosApi = inject(TodosService);

  todos = signal<Todo[]>([]);
  loaded = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  newTitle = '';

  async ngOnInit(): Promise<void> {
    try {
      const list = await this.todosApi.list();
      this.todos.set(Array.isArray(list) ? list : []);
    } catch {
      this.error.set('Could not load your tasks.');
    } finally {
      this.loaded.set(true);
    }
  }

  async addTodo(): Promise<void> {
    const title = this.newTitle.trim();
    if (!title) {
      this.error.set('Please enter a task title.');
      return;
    }
    this.error.set(null);
    this.saving.set(true);
    try {
      const created = await this.todosApi.create(title);
      const todo: Todo = created && typeof created === 'object' && 'id' in created
        ? created
        : { id: `local-${Date.now()}`, title, completed: false, createdAt: new Date().toISOString() };
      this.todos.update((list) => [...list, { ...todo, title: todo.title || title }]);
      this.newTitle = '';
    } catch {
      this.error.set('Could not add the task. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }
}
