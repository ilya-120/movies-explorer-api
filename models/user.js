const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const isEmail = require('validator/lib/isEmail');
const UnauthorizedError = require('../errors/UnauthorizedError');

const root = 'https://api.promo.nexus.moscow/static/avatars/';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v) => isEmail(v),
      message: 'Неправильный формат email',
    },
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
  },
  admin: {
    type: Boolean,
    required: false,
    default: false,
  },
  avatar: {
    type: String,
    required: false,
    default: 'icons-ava.png',
    set: (v) => `${root}${v}`,
  },
});

userSchema.statics.findUserByCredentials = function _(email, password) {
  return this.findOne({ email }).select('+password').then((user) => {
    // пользователь не нашёлся — отклоняем промис
    if (!user) {
      throw new UnauthorizedError('Неправильные почта или пароль');
    }

    // нашёлся — сравниваем хеши
    return bcrypt.compare(password, user.password).then((matched) => {
      // хеши не совпали — отклоняем промис
      if (!matched) {
        throw new UnauthorizedError('Неправильные почта или пароль');
      }
      // аутентификация успешна
      return user;
    });
  });
};

module.exports = mongoose.model('user', userSchema);
