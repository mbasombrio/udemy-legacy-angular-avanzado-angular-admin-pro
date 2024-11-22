import { NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { SpinnerComponent } from '@components/spinner/spinner.component';
import { Usuario } from '@models/Hospital/usuario.model';
import { BusquedasService } from '@services/busquedas.service';
import { MessagesService } from '@services/messages.service';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [SpinnerComponent, NgIf],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
})
export class UsuariosComponent implements OnInit {
  userService = inject(UserService);
  messageService = inject(MessagesService);
  busquedaService = inject(BusquedasService);

  usuarios: Usuario[] = [];
  totalUsuarios = 0;
  desde = 0;
  loading = false;

  ngOnInit(): void {
    this.getUsers();
  }

  getUsers() {
    this.loading = true;
    this.userService.getUsers(this.desde).subscribe({
      next: ({ total, usuarios }) => {
        this.usuarios = usuarios;
        this.totalUsuarios = total;
      },
      error: (err) => {
        this.messageService.errorMessage(
          'Error al cargar los usuarios',
          err.error.msg
        );
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  changePage(value: number) {
    this.desde += value;
    if (this.desde < 0) {
      this.desde = 0;
    } else if (this.desde >= this.totalUsuarios) {
      this.desde -= value;
    }

    this.getUsers();
  }

  buscar(termino: string) {
    if (termino.length === 0) {
      return this.getUsers();
    }

    this.busquedaService.buscar('usuarios', termino).subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
      },
      error: (err) => {
        this.messageService.errorMessage(
          'Error al buscar usuarios',
          err.error.msg
        );
      },
    });
  }

  eliminarUsuario(usuario: Usuario) {
    if (usuario.uid === this.userService.uid) {
      return this.messageService.errorMessage(
        'Error al eliminar usuario',
        'No se puede eliminar a si mismo'
      );
    }

    this.messageService.questionMessage(
      'Eliminar usuario',
      `¿Estas seguro de eliminar a ${usuario.nombre}?`,
      () => {
        if (!usuario.uid) return;
        this.loading = true;
        this.userService.deleteUser(usuario.uid).subscribe({
          next: () => {
            this.getUsers();
            this.messageService.successMessage(
              'Usuario eliminado',
              'El usuario ha sido eliminado correctamente'
            );
            this.getUsers();
          },
          error: (err) => {
            this.messageService.errorMessage(
              'Error al eliminar usuario',
              err.error.msg
            );
          },
          complete: () => {
            this.loading = false;
          },
        });
      }
    );
  }
}
