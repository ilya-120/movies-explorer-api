const Movie = require('../models/movie');
const BadRequestError = require('../errors/BadRequestError');
const ForbiddenAccessError = require('../errors/ForbiddenAccessError');
const NotFoundError = require('../errors/NotFoundError');

// Получение Movies
module.exports.getMovies = (req, res, next) => {
  const owner = req.user._id;
  Movie.find({ owner })
    .then((movies) => res.send(movies))
    .catch(next);
};
// Создание Movie
module.exports.addMovie = (req, res, next) => {
  const {
    country,
    director,
    duration,
    year,
    description,
    image,
    trailerLink,
    nameRU,
    nameEN,
    thumbnail,
    movieId,
  } = req.body;

  Movie.create({
    country,
    director,
    duration,
    year,
    description,
    image,
    trailerLink,
    nameRU,
    nameEN,
    thumbnail,
    movieId,
    owner: req.user._id,
  })
    .then((movie) => res.send(movie))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return next(new BadRequestError('Переданы неверные данные.'));
      }
      return next(err);
    });
};
// Удаление Movie
module.exports.deleteMovie = (req, res, next) => {
  const { movieId } = req.params;
  const { _id } = req.user;
  Movie.findById(movieId)
    .then((movie) => {
      if (!movie) {
        throw new NotFoundError('Movie отсутствует.');
      }
      if (String(movie.owner) !== _id) {
        throw new ForbiddenAccessError('Нельзя удалять чужой Movie!');
      }
      movie.remove()
        .then(() => res.send({ message: movie }))
        .catch(next);
    })
    .catch(next);
};
