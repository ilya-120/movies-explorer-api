const router = require('express').Router();
const {
  createFilmValidation,
  filmIdValidation,
} = require('../middlewares/validations');

const {
  getMovies,
  addMovie,
  deleteMovie,
} = require('../controllers/movies');

router.get('/movies', getMovies);

router.post('/movies', createFilmValidation, addMovie);

router.delete('/movies/:movieId', filmIdValidation, deleteMovie);

module.exports = router;
