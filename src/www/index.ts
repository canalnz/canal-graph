import * as express from 'express';
import oauthRouter from './oauth';

const app = express();
app.use('/api/oauth', oauthRouter);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({
    message: 'An unexpected error occurred',
    code: 'internal-error',
    success: false
  });
});

export default app;
