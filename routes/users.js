const router = require('express').Router();
const { updateUserValidation } = require('../middlewares/validations');

const {
  getCurrentUser,
  setUser,
} = require('../controllers/users');

router.get('/users/me', getCurrentUser);

router.patch('/users/me', updateUserValidation, setUser);

module.exports = router;
