import * as http from 'http';
import * as url from 'url';
import * as express from 'express';
import * as bodyParser from 'body-parser';

const Port = 8080;

let app = express();

app.get('/', (req, res) => {
  res.send('hello');
});

app.listen(Port, () => console.log(`Listening on port ${Port}`));

export let App = app;
