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
        var url = '';
        if (e.subject.type === 'PullRequest') {
          url = getPullRequestUrl(e.subject.url)
        }
        if (url === '') {
          url = e.repository.html_url;
        }
        bodyMessage += sprintf("%s{%s}[%s]: %s %s\n\n",
            e.updated_at,
            e.subject.type,
            e.repository.name,
            e.subject.title,
            url);
      }
    });
    sendToSlack(bodyMessage);
    allReads();
  });
  response.status(200).send('ok');
};

const getPullRequestUrl = (uri) => {
  request.get({
    uri: uri,
    headers: {
      'user-agent': process.env.gh_api_uri,
      'authorization': 'token ' + process.env.gh_token
    }
  }, (error, res, body) => {
    if (!error && res.statusCode === 200) {
      return body.html_url;
    } else {
      return '';
    }
  });
};

const allReads = () => {
  request.put({
    uri: process.env.gh_api_uri + '/notifications',
    headers: {
      'user-agent': process.env.gh_api_uri,
      'authorization': 'token ' + process.env.gh_token
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

