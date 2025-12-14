import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Always include credentials (cookies) with requests
  const cloned = req.clone({
    withCredentials: true,
  });

  return next(cloned);
};
