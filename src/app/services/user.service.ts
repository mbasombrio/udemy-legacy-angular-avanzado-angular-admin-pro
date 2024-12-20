import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { LoginForm } from '@interfaces/login-form.interface';
import { renewTokenInterface } from '@interfaces/renew-token.interface';
import { ResponseCreateUser } from '@interfaces/response-create-user.interface';
import { Usuario } from '@models/Hospital/usuario.model';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { ResponseUsuariostDTO } from '@interfaces/responseListDTO.interface';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private router = inject(Router);

  userLogged = signal<Usuario>(new Usuario('', '', '', '', false, '', ''));
  user = computed(() => this.userLogged());

  constructor() {}

  get token(): string {
    return localStorage.getItem('token') || '';
  }

  get uid(): string {
    const user = this.userLogged();
    return user && user.uid ? user.uid : '';
  }

  get isGoogleUser(): boolean {
    const googleEmail = localStorage.getItem('googleEmail');
    return googleEmail ? true : false;
  }

  get headers() {
    return {
      headers: {
        'x-token': this.token,
      },
    };
  }

  logout() {
    localStorage.removeItem('token');
    const googleEmail = localStorage.getItem('googleEmail');
    if (googleEmail) {
      google.accounts.id.revoke(googleEmail, () => {
        localStorage.removeItem('googleEmail');
        this.router.navigateByUrl('/login');
      });
    } else {
      this.router.navigateByUrl('/login');
    }
  }

  validarToken(): Observable<boolean> {
    const token = this.token;
    // hacer .map y que devuelva el booleano

    return this.http
      .get<renewTokenInterface>(`${environment.apiUrl}login/renew`, {
        headers: {
          'x-token': token,
        },
      })
      .pipe(
        map((resp) => {
          const { nombre, email, role, google, img = '', uid } = resp.user;
          this.userLogged.set(
            new Usuario(nombre, email, role, '', google, img, uid)
          );
          localStorage.setItem('token', resp.token);
          return true;
        }),
        catchError(() => {
          return of(false);
        })
      );
  }

  createUser(user: Usuario) {
    return this.http
      .post<ResponseCreateUser>(`${environment.apiUrl}usuarios`, user)
      .pipe(
        tap((resp) => {
          localStorage.setItem('token', resp.token);
        })
      );
  }

  login(formData: LoginForm) {
    return this.http
      .post<{ ok: boolean; token: string }>(
        `${environment.apiUrl}login`,
        formData
      )
      .pipe(
        tap((resp) => {
          localStorage.setItem('token', resp.token);
        })
      );
  }

  loginGoogle(token: string) {
    return this.http
      .post<{ ok: boolean; email: String; token: string }>(
        `${environment.apiUrl}login/google`,
        { token }
      )
      .pipe(
        tap((resp) => {
          localStorage.setItem('token', resp.token);
        })
      );
  }

  actualizar(usuario: Usuario) {
    const data = {
      email: usuario.email,
      nombre: usuario.nombre,
      role: usuario.role,
    };
    return this.http.put<{ ok: string; usuario: Usuario; msg: string }>(
      `${environment.apiUrl}usuarios/${usuario.uid}`,
      data,
      {
        headers: {
          'x-token': this.token,
        },
      }
    );
  }

  getUsers(desde: number = 0) {
    let params = new HttpParams();
    params = params.append('desde', desde.toString());
    return this.http
      .get<ResponseUsuariostDTO>(`${environment.apiUrl}usuarios`, {
        ...this.headers,
        params,
      })
      .pipe(
        map((resp) => {
          const usuarios = resp.usuarios.map(
            (usuario) =>
              new Usuario(
                usuario.nombre,
                usuario.email,
                usuario.role,
                '',
                usuario.google,
                usuario.img,
                usuario.uid
              )
          );
          return {
            ok: resp.ok,
            total: resp.total,
            usuarios,
          };
        })
      );
  }

  deleteUser(uid: string) {
    return this.http.delete(`${environment.apiUrl}usuarios/${uid}`, {
      ...this.headers,
    });
  }
}
