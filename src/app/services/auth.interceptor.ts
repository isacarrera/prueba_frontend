import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return from(this.authService.getAccessToken()).pipe(
      switchMap(token => {
        if (token) {
          req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
        }

        return next.handle(req).pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
              return from(this.handle401(req, next));
            }
            return throwError(() => error);
          })
        );
      })
    ) as Observable<HttpEvent<any>>;
  }

  private handle401(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  return from(this.authService.getRefreshToken()).pipe(
    switchMap(refreshToken => {
      if (!refreshToken) {
        this.authService.logout();
        throw new Error('Session expired');
      }

      return this.authService.refreshToken(refreshToken).pipe(
        switchMap((res: any) => {
          this.authService.storage.set('access_token', res.token);

          const clonedReq = req.clone({
            setHeaders: { Authorization: `Bearer ${res.token}` }
          });

          return next.handle(clonedReq);
        })
      );
    })
  );
}

}
