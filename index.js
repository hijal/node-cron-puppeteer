const cron = require('node-cron');
const ora = require('ora');
const chalk = require('chalk');
const puppeteer = require('puppeteer');

const url = 'https://www.worldometers.info/world-population/';

async function scrapePopulation() {
  console.log(chalk.green('Running scheduled job...'));
  const spinner = ora({
    text: 'Launch puppeteer..',
    color: 'blue',
    hideCursor: false,
  }).start();

  try {
    const date = Date.now();
    const browser = await puppeteer.launch();
    spinner.text = 'Launching browser..';
    const page = await browser.newPage();
    spinner.text = 'Navigating to the url..';
    await page.goto(url, { waitUntil: 'load', timeout: 0 });
    spinner.text = 'Scrapping the page...';

    const numberOfDigits = await page.evaluate(() => {
      const digits = [];
      const selector =
        '#maincounter-wrap .maincounter-number .rts-counter span';
      const digitSpans = document.querySelectorAll(selector);
      digitSpans.forEach((span) => {
        if (!isNaN(parseInt(span.textContent))) {
          digits.push(span.textContent);
        }
      });
      return JSON.stringify(digits);
    });

    spinner.text = 'Closing the browser...';
    await browser.close();

    spinner.succeed(
      'Page scrapping successfully on ' + `${Date.now() - date}ms.`
    );
    spinner.clear();

    console.log(
      chalk.yellow.bold.underline(
        `World pupulation on ${new Date().toLocaleDateString()} : `
      ),
      chalk.green.bold(`${JSON.parse(numberOfDigits).join(',')}`)
    );
  } catch (err) {
    spinner.fail('ops! failed to scrapping the page.');
    spinner.clear();

    console.error(err.message);
  }
}

const job = cron.schedule('*/1 * * * *', scrapePopulation);

job.start();
