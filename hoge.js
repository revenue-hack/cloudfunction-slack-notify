require('dotenv').config();
const GitHub = require('github-api');
const sprintf = require('sprintf-js').sprintf;
const request = require('request');
const gh = new GitHub({
  token: process.env.GH_TOKEN
});

const me = gh.getUser();
me.listNotifications((err, notifications) => {
  if (err) {
    console.log('fuck', err);
  }
  var bodyMessage = '';
  notifications.forEach(e => {
    if (!e.repository.private) {
      bodyMessage += sprintf("%s[%s]: %s %s\n\n",
          e.updated_at,
          e.repository.name,
          e.subject.title,
          e.subject.url);
    }
  });
  sendToSlack(bodyMessage);
});

sendToSlack = (bodyMessage) => {
  request.post({
    uri: process.env.INCOME_URI,
    headers: { 'Content-Type': 'application/json' },
    json: {
      username: 'OSSチェッカー',
      icon_emoji: ':ghost:',
      text: bodyMessage
    }
  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      console.log(body);
    } else {
      console.log('error');
    }
  });
};

