require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const { errors } = require('celebrate');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes/index');
const { requestLogger, errorLogger } = require('./middlewares/logger');
// const cors = require('./middlewares/cors');
const { limiter } = require('./utils/rateLimiter');
const {
  PORT, NODE_ENV, MONGO_URL, MONGO_URL_DEV,
} = require('./utils/constants');

const app = express();

mongoose.connect(NODE_ENV === 'production' ? MONGO_URL : MONGO_URL_DEV, {
});

// логгер запросов
app.use(requestLogger);
app.use(limiter);
// helmet для защиты приложение от некоторых широко известных веб-уязвимостей
app.use(helmet());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cors);
app.use(routes);

// логгер ошибок
app.use(errorLogger);

app.use(errors());
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`сервер работает на порту ${PORT}`);
  console.log(process.env.NODE_ENV);
});
