const Telegraf = require('telegraf');
const axios = require('axios');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const { leave } = Stage;

const dotenv = require('dotenv');

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);
const date = new Date().setHours(0, 0, 0, 0);
bot.use(Telegraf.log());

bot.command('start', ({ reply }) => {
  reply(
    'Welcome to Info Data Covid-19',
    Markup.keyboard(['/help']).oneTime().resize().extra()
  );
});
const helpMessage = `BOT DATA COVID
/country : untuk mencari info Covid-19 berdasarkan negara, langsung ketikan nama negaranya \n/provinsi : untuk mencari info Covid-19 berdasarkan provinsi di Indonesia`;
bot.help((ctx) => {
  ctx.reply(helpMessage);
});

const country = new Scene('country');
country.enter((ctx) => ctx.reply('Please input name of country : '));
country.leave((ctx) =>
  ctx.reply('Bye', Markup.keyboard(['/help']).oneTime().resize().extra())
);
country.hears(/cancel/gi, leave());
country.on('text', async (ctx) => {
  try {
    const country = ctx.message.text;
    const replay = ctx.reply(`Looking for ${country}...`);
    if (replay) {
      const { data } = await axios.get(
        `https://api.covid19api.com/country/${country}?from=2020-09-27T00:00:00Z&to=${date}`
      );
      ctx.reply(
        'Result: \nNegara: ' +
          data[0].Country +
          '\nPositif Corona: ' +
          data[0].Confirmed +
          '\nMeninggal: ' +
          data[0].Deaths +
          '\nSembuh: ' +
          data[0].Recovered +
          '\nDirawat: ' +
          data[0].Active
      );
      ctx.reply('input cancel or click /cancel for exit');
    }
  } catch (error) {
    console.log(error);
  }
});

const provinsi = new Scene('provinsi');
provinsi.enter(async (ctx) => {
  try {
    const { data } = await axios.get(
      `https://api.kawalcorona.com/indonesia/provinsi`
    );
    const dataProvinsi = data;
    const A = [];
    let B = [];
    dataProvinsi.map((val) => {
      A.push(val.attributes.Provinsi);
    });
    const result = [];
    const size = 3;
    for (var i = 0; i <= A.length; i += size) {
      result.push(A.slice(i, i + size));
    }
    await ctx.reply(
      'Please Choose one province',
      Markup.keyboard(result).oneTime().resize().extra()
    );
    provinsi.on('text', async (ctx) => {
      const input = ctx.update.message.text;
      const array = input.split('_');
      const provinsi = data.find((val) => val.attributes.Provinsi == array[0]);
      await ctx.reply(
        `Data Covid Provinsi:\nProvinsi: ${provinsi.attributes.Provinsi}\nPositif: ${provinsi.attributes.Kasus_Posi}\nSembuh: ${provinsi.attributes.Kasus_Semb}\nMeninggal: ${provinsi.attributes.Kasus_Meni}`
      );
      ctx.reply('input cancel or click /cancel for exit');
    });
  } catch (error) {
    console.log(error);
  }
});
provinsi.leave((ctx) =>
  ctx.reply('Bye', Markup.keyboard(['/help']).oneTime().resize().extra())
);
provinsi.hears(/cancel/gi, leave());

// Create scene manager
const stage = new Stage();
stage.command('cancel', leave());

// Scene registration
stage.register(country);
stage.register(provinsi);

bot.use(session());
bot.use(stage.middleware());
bot.command('country', (ctx) => ctx.scene.enter('country'));
bot.command('provinsi', (ctx) => ctx.scene.enter('provinsi'));
bot.startPolling();
