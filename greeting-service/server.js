'use strict';

const awsParamStore = require('aws-param-store');
const express = require('express');
const bodyParser = require('body-parser');
const rp = require('request-promise');
const aws = require('aws-sdk');
const awsSNS = new aws.SNS();

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

const serverParams = {
  imageUrl : "",
  greeting: "hello",
  fontSize: "7"
};

const CONFIG_VERSION_PARAM_NAME = process.env.CONFIG_VERSION_PARAM_NAME;
const IMAGEURL_PARAM_NAME = process.env.IMAGEURL_PARAM_NAME;
const GREETING_PARAM_NAME = process.env.GREETING_PARAM_NAME;
const FONTSIZE_PARAM_NAME = process.env.FONTSIZE_PARAM_NAME;
const PARAM_CHANGE_SNS_ENDPOINT = process.env.PARAM_CHANGE_SNS_ENDPOINT;
const PARAM_CHANGE_TOPIC_ARN = process.env.PARAM_CHANGE_TOPIC_ARN;
// const PARAM_CHANGE_SNS_ENDPOINT = process.env.PARAM_CHANGE_SNS_ENDPOINT;

function getSSMParameters() {
  console.log('getSSMParams');
  let p = awsParamStore.getParametersSync(
    [ CONFIG_VERSION_PARAM_NAME, IMAGEURL_PARAM_NAME, GREETING_PARAM_NAME, FONTSIZE_PARAM_NAME]
  );
  
  console.log('Retrieved SSM params');
  
  var paramMap = new Map(p.Parameters.map(i => [i.Name, i.Value]));
  console.log(paramMap);
  serverParams.configVersion = paramMap.get(CONFIG_VERSION_PARAM_NAME);
  serverParams.imageUrl = paramMap.get(IMAGEURL_PARAM_NAME);
  serverParams.greeting = paramMap.get(GREETING_PARAM_NAME);
  serverParams.fontSize = paramMap.get(FONTSIZE_PARAM_NAME);
}

function getContainerIP() {
  const ECS_CONTAINER_METADATA_URI = process.env.ECS_CONTAINER_METADATA_URI;
  console.log('ECS Metadata uri: ' + ECS_CONTAINER_METADATA_URI);
  return rp(ECS_CONTAINER_METADATA_URI, { json: true })
    .then(function(body) {
      console.log('Container metadata');
      console.log(body);
      console.log('Container ID = ' + body.DockerId);
      serverParams.ip = body.Networks[0].IPv4Addresses[0];
      serverParams.containerId = body.DockerId;
      return body.Networks[0].IPv4Addresses[0];
    })
    .catch(function(err) {
      return console.log(err);
    });
}


function subscribeTopic() {
  var endpoint =
    'http://' + PARAM_CHANGE_SNS_ENDPOINT + '/' + serverParams.ip + ':'+ PORT + '/config/' + serverParams.containerId;
  console.log('Subscribing http endpoint to SNS');
  console.log(endpoint);

  awsSNS.subscribe({
    TopicArn: PARAM_CHANGE_TOPIC_ARN,
    Protocol: 'http',
    Endpoint: endpoint,
    /*
    Attributes: {
      'DeliveryPolicy' : 
    },
    */
    ReturnSubscriptionArn : true
  }, function(err, data) {
    if (err)
      console.log('Subscribe failed:\n' + JSON.stringify(err));
    else
      console.log('Subscribe ok:\n' + JSON.stringify(data));
  });
}

// App
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.get('/greeting/:id', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.send(
    '<img src="' + serverParams.imageUrl + '" width="100" align="middle"></img>' +
    '<font size="' + serverParams.fontSize + '">' +
    serverParams.greeting + ' ' + req.params.id +
    '</font>\n'
  );
});
app.get('/config', (req, res) => {
  res.send(
    '<h2>SSM Configuration parameters</h2>' +
    '<br><b>Image URL:</b> ' + serverParams.imageUrl +
    '<br><b>Greeting:</b> ' + serverParams.greeting +
    '<br><b>Font size:</b> ' + serverParams.fontSize + '\n' +
    '<br><br><hr><h2>Container metadata:</h2>' +
    '<br><b>IP:</b> ' + serverParams.ip +
    '<br><b>Container Id:</b> ' + serverParams.containerId + '\n'
  );
});
app.post('/config/:id', (req, res) => {
  if (req.params.id === serverParams.containerId) {
    console.log('POST /config/' + req.params.id + 'Match')
    getSSMParameters();
    res.send(
      '<h2>Updated SSM Config params:</h2>' +
      '<br><b>Image URL:</b> ' + serverParams.imageUrl +
      '<br><b>Greeting:</b> ' + serverParams.greeting +
      '<br><b>Font size:</b> ' + serverParams.fontSize + '\n'
    );
  }
  else {
    res.status(404).send("Invalid container id.")
  }
});


getContainerIP()
  .then(function(ip) {
    serverParams.ip = ip;
    console.log(`Server IP: ` + serverParams.ip);
    app.listen(PORT, HOST);
    console.log(`Running on http://${HOST}:${PORT}`);
    subscribeTopic();
    getSSMParameters();
    return;
  });
