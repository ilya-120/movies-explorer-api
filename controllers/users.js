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

// возвращает информацию о users для администратора
module.exports.getUsers = (req, res, next) => {
  const { _id } = req.user;
  User.findById(_id).then((user) => {
    // проверяем, есть ли права администратора
    if (user.admin === false || !user.admin) {
      return next(new NotFoundError('Пользователь не является администратором.'));
    }
    return User.find()
      .then((users) => res.send(users))
      .catch(next);
  }).catch(next);
};

// Удаление user для администратора
module.exports.deleteUser = (req, res, next) => {
  const { _id } = req.body;
  const id = req.user._id;
  User.findById(id).then((userAdm) => {
    // проверяем, есть ли права администратора
    if (userAdm.admin === false || !userAdm.admin) {
      return next(new NotFoundError('Пользователь не является администратором.'));
    }
    if (_id === id) {
      return next(new NotFoundError('Пользователь является администратором, не возможно удалить свой аккаунт'));
    }
    return User.findById(_id).then((user) => {
      if (!user) {
        throw new NotFoundError('Пользователь отсутствует.');
      }
      user.remove()
        .then(() => res.send({ message: user }))
        .catch(next);
    }).catch(next);
  }).catch(next);
};

// редактирование информации о users для администратора
module.exports.setEditUser = (req, res, next) => {
  const { _id } = req.body;
  const { name, email } = req.body;
  const id = req.user._id;
  User.findById(id).then((userAdm) => {
    // проверяем, есть ли права администратора
    if (userAdm.admin === false || !userAdm.admin) {
      return next(new NotFoundError('Пользователь не является администратором.'));
    }
    return User.findById(_id).then((user) => {
      if (!user) {
        throw new NotFoundError('Пользователь отсутствует.');
      }
      user.update(
        { name, email },
        { new: true, runValidators: true },
      )
        .then((newUsers) => res.send(newUsers))
        .catch((err) => {
          if (err.code === 11000) {
            return next(new CreateError('Неверный email.'));
          }
          if (err.name === 'ValidationError') {
            return next(new BadRequestError('Неверный тип данных.'));
          }
          return next(err);
        });
    }).catch(next);
  }).catch(next);
};

module.exports.setEditUserAvatar = (req, res, next) => {
  const image = req.files.file;
  const avatarId = req.body.userId;
  const arrayOfAllowedFiles = ['png', 'PNG', 'jpeg', 'jpg', 'gif'];
  const arrayOfAllowedFileTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
  const allowedFileSize = 2;
  const fileExtension = String(image.name).replace(/.*\./, '');
  if ((!arrayOfAllowedFiles.includes(fileExtension))
    || (!arrayOfAllowedFileTypes.includes(image.mimetype))) {
    throw new BadRequestError(`формат этого файла: ${fileExtension}, допустимы только форматы: 'png', 'jpeg', 'jpg', 'gif'`);
  }
  if ((image.size / (1024 * 1024)) > allowedFileSize) {
    throw new BadRequestError(`${image.size} этот файл слишком большой`);
  }
  try {
    if (!req.files) {
      res.send({
        status: false,
        message: 'No file uploaded',
      });
    } else {
      const avatar = req.files.file;
      avatar.mv(`./files/avatars/${avatar.name}`);
      res.send({
        status: true,
        message: 'File is uploaded',
        path: `/static/avatars/${avatar.name}`,
        name: `${avatar.name}`,
      });
    }
  } catch (err) {
    res.status(500).send(err);
  }
  return User.findById(avatarId).then((user) => {
    const { avatar } = { avatar: `${String(image.name)}` };
    if (!user) {
      throw new NotFoundError('Пользователь отсутствует.');
    }
    user.updateOne(
      { avatar },
      { new: true, runValidators: true },
    )
      .then((newUsers) => res.send(newUsers))
      .catch((err) => {
        if (err.name === 'ValidationError') {
          return next(new BadRequestError('Неверный тип данных.'));
        }
        return next(err);
      });
  });
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
