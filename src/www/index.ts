import * as express from 'express';
import oauthRouter from './oauth';

const app = express();
app.get('/system/health', (req, res) => {
  // The server listening is the last step. We can just make it always serve this.
  res.json({status: 'ok', message: 'nothing is visibly on fire!'});
});
app.use('/oauth', oauthRouter);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({
    message: 'An unexpected error occurred',
    code: 'internal-error',
    success: false
  });
});

export default app;
