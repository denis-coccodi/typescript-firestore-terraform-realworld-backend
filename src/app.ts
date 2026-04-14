import { Firestore } from '@google-cloud/firestore';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { ArticlesRouter, ArticlesService } from './articles';
import { config } from './config';
import { errorHandler } from './error-handler';
import { Auth } from './middleware';
import { ProfilesRouter, ProfilesService } from './profiles';
import { JWTService, UsersRouter, UsersService } from './users';

const firestore = new Firestore({
  projectId: config.firestore.projectId,
});

const usersService = new UsersService(firestore);

const jwtService = new JWTService(usersService, config.jwt.secretKey, {
  issuer: config.jwt.issuer,
  secondsToExpiration: config.jwt.secondsToExpiration,
});

const profilesService = new ProfilesService(firestore, usersService);

const articlesService = new ArticlesService(
  firestore,
  usersService,
  profilesService
);

const auth = new Auth(jwtService);

const usersRouter = new UsersRouter(auth, usersService, jwtService).router;

const profilesRouter = new ProfilesRouter(auth, usersService, profilesService)
  .router;

const articlesRouter = new ArticlesRouter(
  auth,
  articlesService,
  usersService,
  profilesService
).router;

const app = express();

app.use(
  cors({
    origin: 'http://localhost:4200',
    credentials: true,
  })
);

app.use(express.json());

// Serve static files from the 'assets' directory
app.use('/assets', express.static(path.join(__dirname, '../assets')));

app.use('/api', usersRouter);

app.use('/api', profilesRouter);

app.use('/api', articlesRouter);

app.use(
  async (
    err: Error,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction
  ) => {
    await errorHandler.handleError(err, res);
  }
);

export { app };
