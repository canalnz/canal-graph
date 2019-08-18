import * as express from 'express';
import oauthRouter from './oauth';

const app = express();
app.use('/api/oauth', oauthRouter);

export default app;
