class CreateError extends Error {
  constructor(message = 'Ошибка  данных') {
    super(message);
    this.statusCode = 409;
  }
}

module.exports = CreateError;
