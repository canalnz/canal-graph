import * as testConfig from '../testConfig.secret';
import {createDbConnection} from './database';

describe('connect to the database', () => {
  beforeAll(() => {
    // Fixes a weird pg error. See https://github.com/sequelize/sequelize/issues/3781#issuecomment-522198459
    const pg = require('pg');
    delete pg.native; // Yay, fun hack time!
  });

  it('shouldn\'t crash and burn', async () => {
    expect(async () => await createDbConnection({
      host: testConfig.databaseHost,
      username: testConfig.databaseUser,
      password: testConfig.databasePassword
    })).not.toThrowError();
  });
});
