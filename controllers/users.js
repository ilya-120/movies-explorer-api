const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const CreateError = require('../errors/CreateError');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');

const { NODE_ENV, JWT_SECRET, JWT_SECRET_DEV } = require('../utils/constants');

// возвращает информацию о текущем user
module.exports.getCurrentUser = (req, res, next) => {
  const { _id } = req.user;
  User.findById(_id).then((user) => {
    // проверяем, есть ли user с таким id
    if (!user) {
      return next(new NotFoundError('Пользователь не найден.'));
    }
    // возвращаем user, если он есть
    return res.send(user);
  }).catch(next);
};

// Создание нового user
module.exports.createUser = (req, res, next) => {
  const { email, password } = req.body;
  return User.findOne({ email }).then((user) => {
    if (user) {
      throw new CreateError(`Пользователь с ${email} уже существует.`);
    }
    return bcrypt.hash(password, 10);
  })
    .then((hash) => User.create({
      email,
      password: hash,
      name: req.body.name,
    }))
    .then((user) => res.send({
      name: user.name,
      _id: user._id,
      email: user.email,
    }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequestError('Неккоректные данные.'));
      }
      return next(err);
    });
};

// Аутентификация user
module.exports.login = (req, res, next) => {
  const { email, password } = req.body;
  return User.findUserByCredentials(email, password)
    .then((user) => {
      // создадим токен
      const token = jwt.sign(
        { _id: user._id },
        NODE_ENV === 'production' ? JWT_SECRET : JWT_SECRET_DEV,
        {
          expiresIn: '7d',
        },
      );

      // вернём токен
      return res.send({ token });
    })
    .catch(next);
};

// Обновление информации о user
module.exports.setUser = (req, res, next) => {
  const { name, email } = req.body;
  User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    { new: true, runValidators: true },
  )
    .then((user) => res.send(user))
    .catch((err) => {
      if (err.code === 11000) {
        return next(new CreateError('Неверный email.'));
      }
      if (err.name === 'ValidationError') {
        return next(new BadRequestError('Неверный тип данных.'));
      }
      return next(err);
    });
};
