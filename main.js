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
bot.use(Telegraf.log());

bot.start((ctx) =>
  ctx.reply(
    'Selamat datang di Info Data Covid-19',
    Markup.keyboard(['/help']).oneTime().resize().extra()
  )
);
// bot.on('message', (ctx) => ctx.reply('/start'));
const helpMessage = `BOT DATA COVID
/country :  untuk melihat info Covid-19 di Indonesia \n\n/provinsi : untuk mencari info Covid-19 berdasarkan provinsi di Indonesia`;
bot.help((ctx) => {
  ctx.reply(helpMessage);
});

const country = new Scene('country');
country.enter(async (ctx) => {
  try {
    const { data } = await axios.get(`https://api.kawalcorona.com/indonesia`);
    await ctx.reply(
      'Result: \nNegara : ' +
        data[0].name +
        '\nPositif Corona : ' +
        data[0].positif +
        '\nMeninggal : ' +
        data[0].meninggal +
        '\nSembuh: ' +
        data[0].sembuh +
        '\nDirawat: ' +
        data[0].dirawat
    );
    ctx.reply('silahkan ketik cancel atau click /cancel for exit');
  } catch (error) {
    console.log(error);
  }
});
country.leave((ctx) =>
  ctx.reply(
    'Untuk info lainya silahkan click tombol help yang sudah disediakan',
    Markup.keyboard(['/help']).oneTime().resize().extra()
  )
);
country.hears(/cancel/gi, leave());

const provinsi = new Scene('provinsi');
provinsi.enter(async (ctx) => {
  try {
    const { data } = await axios.get(
      `https://api.kawalcorona.com/indonesia/provinsi`
    );
    const dataProvinsi = data;
    const loop = [];
    dataProvinsi.map((val) => {
      loop.push(val.attributes.Provinsi);
    });
    const result = [];
    const size = 3;
    for (var i = 0; i <= loop.length; i += size) {
      result.push(loop.slice(i, i + size));
    }
    await ctx.reply(
      'Please Choose one province',
      Markup.keyboard(result).oneTime().resize().extra()
    );
    provinsi.on('text', async (ctx) => {
      const input = ctx.update.message.text;
      const provinsi = data.find((val) => val.attributes.Provinsi);
      const found = data.some((val) => val.attributes.Provinsi == input);
      if (!found) {
        return ctx.reply('Sory, please choose in markup keyboard');
      }
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
  ctx.reply(
    'Untuk info lainya silahkan click tombol help yang sudah disediakan',
    Markup.keyboard(['/help']).oneTime().resize().extra()
  )
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
bot.on('text', (ctx, next) => {
  ctx.reply('Hallo, silahkan klik tombol /help untuk informasi yang lainya');
  return next();
});
bot.startPolling();
