'use strict';

require('dotenv').config();
const request = require('request');
const sprintf = require('sprintf-js').sprintf;
const GitHub = require('github-api');

exports.http = (request, response) => {
  const gh = new GitHub({
    token: process.env.GH_TOKEN
  });

  const me = gh.getUser();
  me.listNotifications((err, notifications) => {
    if (err) {
      console.log(err);
      response.status(500).send('fail api github api error');
    }
    var bodyMessage = '';
    notifications.forEach(e => {
      if (e.unread && !e.repository.private) {
        bodyMessage += sprintf("%s[%s]: %s %s\n\n",
            e.updated_at,
            e.repository.name,
            e.subject.title,
            e.repository.html_url);
      }
    });
    sendToSlack(bodyMessage);
    allReads();
  });
  response.status(200).send('ok');
};

const allReads = () => {
  request.put({
    uri: process.env.GH_API_URI + '/notifications',
    headers: {
      'User-Agent': process.env.GH_API_URI,
      'Authorization': 'token ' + process.env.GH_TOKEN
    }
  }, (error, res, body) => {
    if (!error && res.statusCode === 205) {
      console.log(body);
    } else {
      console.log(error);
      response.status(500).send('fail all reads');
    }
  });
};

const sendToSlack = (bodyMessage) => {
  request.post({
    uri: process.env.INCOME_URI,
    headers: { 'Content-Type': 'application/json' },
    json: {
      channel: '#oss',
      username: 'OSSチェッカー',
      icon_emoji: ':ghost:',
      text: bodyMessage
    }
  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      console.log(body);
    } else {
      console.log(error);
      response.status(500).send('fail send to slack');
    }
  });
};

exports.event = (event, callback) => {
  callback();
};

