const router = require('express').Router();
const { updateUserValidation } = require('../middlewares/validations');

const {
  getCurrentUser,
  setUser,
  getUsers,
  deleteUser,
  setEditUser,
  setEditUserAvatar,
} = require('../controllers/users');

router.get('/users', getUsers);

router.get('/users/me', getCurrentUser);

router.patch('/users/me', updateUserValidation, setUser);

router.patch('/users', updateUserValidation, setEditUser);

router.post('/users', setEditUserAvatar);

router.delete('/users/me', deleteUser);

module.exports = router;
