/** Demo-only connection boundary. Never load environment files or open a network database. */
import 'reflect-metadata';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { PGliteDriver } from 'typeorm-pglite';
import type { PGliteOptions } from '@electric-sql/pglite';
import { createRequire } from 'node:module';
// CommonJS source uses TypeScript's node resolver; runtime package exports resolve this subpath.
const load = createRequire(__filename);
const { btree_gist } = load('@electric-sql/pglite/contrib/btree_gist') as { btree_gist: NonNullable<PGliteOptions['extensions']>[string] };
import { ENTITIES } from './entities';
import { compatibleDriver } from '../demo/pg-compat';

// The adapter owns a process singleton. This spike MUST run as one isolated process.
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  driver: compatibleDriver(new PGliteDriver({ dataDir: 'memory://', extensions: { btree_gist } }).driver),
  entities: ENTITIES,
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  migrationsRun: false,
  logging: false,
};
export default new DataSource(dataSourceOptions);
