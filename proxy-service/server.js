'use strict';

const express = require('express');
// const bodyParser = require('body-parser');
const rp = require('request-promise');


//const aws = require('aws-sdk');
//const awsSNS = new aws.SNS();

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

console.log('notification-proxy-server: intializing');

// App
const app = express();

// app.use(express.json());

app.get('/health', (req, res) => {
  res.send('ok');
});
app.post('/:address/*', express.json({type: '*/*'}), (req, res) => {  // Match IP/port address followed by container-specific path
  // Check for subscription confirmation
  var messageType = req.get("x-amz-sns-message-type");
  if (typeof messageType === undefined || messageType === null) {
    return res.status(400).send("Missing header: x-amz-sns-message-type");
  }
  console.log("Content-Type: " + req.get("Content-Type"));
  console.log('Message type: ' + messageType);
  console.log(JSON.stringify(req.body));
  if (messageType==='SubscriptionConfirmation') {
    var url = req.body.SubscribeURL;
    rp(url)
      .then(function(body) {
        res.status(200).end('ok');
      })
      .catch(function(err) {
        console.log(err);
        res.status(500).end();
      });


/*
    var params = {
      Token: 'STRING_VALUE', 
      TopicArn: 'STRING_VALUE', 
      AuthenticateOnUnsubscribe: 'STRING_VALUE'
    };
    sns.confirmSubscription(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });
*/

  // Send confirmation request
  }
  else if (messageType==='UnsubscribeConfirmation') {

  }
  else if (messageType==='Notification') {
    var address = req.params.address;
    var path = req.params[0];
    var endpoint = 'http://' + address + '/' + path;
    console.log('Endpoint: ' + endpoint);
    var rpOptions = {
      method: 'POST',
      uri: endpoint,
      body: req.body,
      json: true
    };
    console.log(rpOptions);
    console.log('Requesting...');
    rp(rpOptions)
      .then(function(pbody) {
        console.log("Post complete");
        res.status(200).end();
      })
      .catch(function(err) {
        console.log("Error forwarding body to " + endpoint);
        console.log(err);
        // Unsubscribe the endpoint
        res.status(404).end();
      })
  }
});
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
