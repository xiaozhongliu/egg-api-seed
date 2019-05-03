import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg'

export default (appInfo: EggAppInfo) => {
    const config: PowerPartial<EggAppConfig> = {

        // override config from framework / plugin
        // use for cookie sign key, should change to your own and keep security
        keys: `${appInfo.name}_1540734627524_2946`,

        // add your egg config in here
        middleware: ['logger'],

        // add your special config in here
        sourceUrl: `https://github.com/eggjs/examples/tree/master/${appInfo.name}`,

        appName: appInfo.pkg.name,
        appVersion: appInfo.pkg.version,

        logger: {
            appLogName: 'common.log',
            coreLogName: 'common.log',
            agentLogName: 'common.log',
            errorLogName: 'common.log',
        },
        customLogger: {
            scheduleLogger: {
                file: `common.log`,
            },
        },

        DEBUG: true,
        LOG_PATH: `${appInfo.baseDir}/logs/${appInfo.name}/`,
    }
    return config
}
