import { Injectable } from '@angular/core';
interface User {}

interface LoginDto {}

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  init(): Promise<void> {
    throw new Error('Falta Implementar');
  }

  login(credentials: LoginDto): Promise<void> {
    throw new Error('Falta Implementar');
  }

  logout(): Promise<void> {
    throw new Error('Falta Implementar');
  }

  refresh(): Promise<void> {
    throw new Error('Falta Implementar');
  }

  isAuthenticated(): boolean {
    throw new Error('Falta Implementar');
  }

  currentUser(): User | null {
    throw new Error('Falta Implementar');
  }
}
