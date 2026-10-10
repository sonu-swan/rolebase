import { NgModule, inject, provideAppInitializer } from "@angular/core";
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from "@angular/common/http";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const t = inject(AuthService).token;
  return next(t ? req.clone({ setHeaders: { Authorization: `Bearer ${t}` } }) : req);
};
export const loggedInGuard: CanActivateFn = () => {
  const auth = inject(AuthService), router = inject(Router);
  return auth.user ? true : router.parseUrl("/login");
};
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService), router = inject(Router);
  return auth.isAdmin ? true : router.parseUrl("/dashboard");
};

@NgModule({
  providers: [
    provideHttpClient(withInterceptors([tokenInterceptor])),
    provideAppInitializer(() => inject(AuthService).restoreSession()),
  ],
})
export class CoreModule {}
