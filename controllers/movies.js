const Movie = require('../models/movie');
const BadRequestError = require('../errors/BadRequestError');
const ForbiddenAccessError = require('../errors/ForbiddenAccessError');
const NotFoundError = require('../errors/NotFoundError');

// Получение Movies
module.exports.getMovies = (req, res, next) => {
  Movie.find({})
    .then((Movies) => res.send(Movies))
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
    owner: req.user._id 
  })
    .then((Movie) => res.send(Movie))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return next(new BadRequestError('Переданы неверные данные.'));
      }
      return next(err);
    });
};
// Удаление Movie
module.exports.deleteMovie = (req, res, next) => {
  const { MovieId } = req.params;
  const { _id } = req.user;
  Movie.findById(MovieId)
    .then((Movie) => {
      if (!Movie) {
        throw new NotFoundError('Movie отсутствует.');
      }
      if (Movie.owner.valueOf() !== _id) {
        throw new ForbiddenAccessError('Нельзя удалять чужой Movie!');
      }
      Movie.findByIdAndRemove(MovieId)
        .then((deleteMovie) => res.send(deleteMovie))
        .catch(next);
    })
    .catch(next);
};
