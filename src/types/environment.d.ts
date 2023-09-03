export { };

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            PUPPETEER_TOKEN: string,
            NATIONALITY: string,
            ID: string,
            MAIL: string,
            START_STATION: string,
            END_STATION: string,
            DEPARTURE_DATE: string,
            TRAIN_NUNBER: string,
            SERVER_MAIL_ACCOUNT: string,
            SERVER_MAIL_PASSWORD: string,
            ENV: 'test' | 'dev' | 'prod';
        }
    }
}