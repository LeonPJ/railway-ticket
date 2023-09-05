import puppeteer from 'puppeteer-extra';
import pluginRecaptcha from 'puppeteer-extra-plugin-recaptcha';
import nodemailer from 'nodemailer';
import pluginStealth from 'puppeteer-extra-plugin-stealth';

puppeteer.use(pluginStealth());

export async function Submit() {

    console.log('--> Start');

    let browserTimeout = setTimeout(() => {
        page.close();
        console.log('browser timeout');
        setInterval(Submit, 60000);
    }, 60000);

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
    await page.type('#startStation', process.env.START_STATION);
    await page.type('#endStation', process.env.END_STATION);

    // clear value and set date
    await page.focus('#rideDate1');
    await page.click('#rideDate1');
    await page.keyboard.press('ArrowRight');
    for (let i = 0; i <= 10; i++) {
        await page.keyboard.press('Backspace');
    }
    await page.waitForTimeout(100);
    await page.type('#rideDate1', process.env.DEPARTURE_DATE);
    await page.type('#trainNoList1', process.env.TRAIN_NUNBER);
    await page.waitForTimeout(100);
    await page.click('#chgSeat1');
    const { solved } = await page.solveRecaptchas();
    // console.log(solved);

    if (!solved) {
        console.log('captchas fail');
        page.close();
        // break;
    } else {
        console.log('captchas success');
    }

    await page.keyboard.press('Enter');

    await page.waitForTimeout(1000);

    /* Page 2 */
    const [page2Submit] = await page.$x('//*[@id="order"]/div[4]/button');
    if (page2Submit) {
        await page2Submit.click();
    }

    /* Page 3 */
    await page.waitForTimeout(1000);
    await page.select('#paymentMethod', process.env.PAYMENT_METHOD!);


    const [page3Submit] = await page.$x('//*[@id="order"]/div[4]/button[2]');
    if (page3Submit) {
        await page3Submit.click();
    }

    /* Page 4 */
    await page.waitForTimeout(1000);
    await page.waitForSelector('.code-space');
    await page.waitForTimeout(1000);
    let code = await page.$eval('#take-code > li > div:nth-child(4)', (result: any) => result.innerHTML);
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
        setInterval(Submit, 60000);
    }
}