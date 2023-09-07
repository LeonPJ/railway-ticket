import puppeteer from 'puppeteer-extra';
import pluginRecaptcha from 'puppeteer-extra-plugin-recaptcha';
import nodemailer from 'nodemailer';
import pluginStealth from 'puppeteer-extra-plugin-stealth';

puppeteer.use(pluginStealth());

const timeout = 120000;// 2 mins
const retryInterval = 3600000;// 1 hr

export async function Submit() {

    console.log('--> Start');

    let browserTimeout = setTimeout(() => {
        page.close();
        console.log('browser timeout');
        setInterval(Submit, retryInterval);
    }, timeout);

    puppeteer.use(pluginRecaptcha({
        provider: { id: '2captcha', token: process.env.CAPTCHA_SOLVER_TOKEN },
        visualFeedback: true
    }));

    const browser = await puppeteer.launch({
        headless: false,
    });

    const pages = await browser.pages();
    const page = pages[0];
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(process.env.URL!);

    await page.waitForTimeout(100);
    /* Page 1 */
    await page.type('#pid', process.env.ID);
    await page.select('select[name="ticketOrderParamList[0].startStation"]', process.env.START_STATION);
    await page.select('select[name="ticketOrderParamList[0].endStation"]', process.env.END_STATION);
    await page.select('select[name="ticketOrderParamList[0].rideDate"]', process.env.DEPARTURE_DATE);
    await page.type('#trainNo1', process.env.TRAIN_NUMBER);
    await page.select('#chgSeat0', process.env.CHANGE_SEAT);
    const { solved } = await page.solveRecaptchas();
    // console.log(solved);

    if (!solved) {
        console.log('captchas fail');
        page.close();
        // break;
    } else {
        console.log('captchas success');
        await page.click('#submitBtn');
    }

    /* Page 2 */
    await page.waitForTimeout(500);
    await page.waitForSelector('.booking-details');
    let code = await page.$eval('#content > div.columns.mt-2 > div > div > div.booking-title.clearfix > div > span', (result: any) => result.innerHTML);
    console.log('Get Take Code: ' + code);
    await page.close();

    clearTimeout(browserTimeout);

    let splitCode = [];

    for (let i = 0; i < code.length; i++) {

        if (parseInt(code[i])) {
            splitCode[i] = code[i];
        } else {// Nan
            break;
        }
    }
    const takeCode = splitCode.toString().split(',').join('');

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        secure: false,
        auth: {
            user: process.env.SERVER_MAIL_ACCOUNT,
            pass: process.env.SERVER_MAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.SERVER_MAIL_ACCOUNT, // sender
        to: process.env.MAIL, // receiver
        subject: process.env.DEPARTURE_DATE + '訂票代碼', // subject
        text: process.env.DEPARTURE_DATE + ' ' + process.env.START_STATION + ' -> ' + process.env.END_STATION + ': ' + takeCode, // plain text body
        // html: "<b>Hello world?</b>", // html body
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('send e-mail success');
    } catch (error) {
        console.log('send e-mail fail');
        setInterval(Submit, retryInterval);
    }
}