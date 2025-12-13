import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const started = Date.now();

  console.log(`→ ${req.method} ${req.url}`);
  if (req.body) {
    console.log('  Body:', req.body);
  }

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event.type === 4) {
          // HttpResponse
          const elapsed = Date.now() - started;
          console.log(`← ${req.method} ${req.url} (${elapsed}ms)`);
          console.log('  Response:', event);
        }
      },
      error: (error) => {
        const elapsed = Date.now() - started;
        console.error(`✗ ${req.method} ${req.url} (${elapsed}ms)`, error);
      },
    })
  );
};
