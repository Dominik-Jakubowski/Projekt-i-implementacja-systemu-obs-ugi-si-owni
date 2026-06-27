function isUniqueConstraintError(error) {
  return error && (error.number === 2601 || error.number === 2627);
}

module.exports = {
  isUniqueConstraintError,
};
