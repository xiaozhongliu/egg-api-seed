// This file was auto created by egg-ts-helper
// Do not modify this file!!!!!!!!!

import 'egg'; // Make sure ts to import egg declaration at first
import { EggAppConfig } from 'egg';
import ExportConfigDefault from '../../config/config.default';
import ExportConfigLocal from '../../config/config.local';
type ConfigDefault = ReturnType<typeof ExportConfigDefault>;
type ConfigLocal = ReturnType<typeof ExportConfigLocal>;
declare module 'egg' {
  type NewEggAppConfig = ConfigDefault & ConfigLocal;
  interface EggAppConfig extends NewEggAppConfig { }
}