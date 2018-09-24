//module require
const express = require('express');
const line = require('@line/bot-sdk');

const port = 3001;

const config = {
    channelAccessToken : 'lxDSFG57mPcz6g6uiyJJxWVMTMf2ud6xKhHDgSHf8Zj3af3OwD/2PvZewztMgP87rdgD697ZahJU/v2uLQcNNIx/GCW1ijK/S2sqQbfx55Y5lSQ1dt17CdnbCaN761Hil2L7Vhv8kekCLAg0wMiUGAdB04t89/1O/w1cDnyilFU=',
    channelSecret : '0df237545cb56f33f0ba68b846631bcf'
}

const app = express();
app.get('/' , (req, res) => res.send("Hello World"));
app.listen(3001 || 8000, () => console.log(`Listening on port ${port}!`));
app.post('/webhook', line.middleware(config), (req, res) => {
    Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

const client = new line.Client(config);
function handleEvent(event) {
    if (event.type === 'message') {
        const message = event.message;

        if (message.type == 'text') {
            console.log('masuk coy');
            
            return client.replyMessage(event.replyToken, {
                "type":"text",
                "text":"H3h3h3"
            });
        }
    } else{
        return Promise.resolve(null);
    }
}


















