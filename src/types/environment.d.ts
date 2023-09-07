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
            TRAIN_NUMBER: string,
            CHANGE_SEAT: string,
            SERVER_MAIL_ACCOUNT: string,
            SERVER_MAIL_PASSWORD: string,
            BACK_START_STATION: string,
            BACK_END_STATION: string,
            BACK_DEPARTURE_DATE: string,
            BACK_TRAIN_NUMBER: string,
            ENV: 'test' | 'dev' | 'prod';
        }
    }
}