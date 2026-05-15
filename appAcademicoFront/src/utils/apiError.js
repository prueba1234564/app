const getErrorMessage = (error, fallback = 'Ocurrio un error inesperado.') => {
  const validationErrors = error?.response?.data?.errors;

  if (validationErrors && typeof validationErrors === 'object') {
    return Object.values(validationErrors)
      .flat()
      .filter(Boolean)
      .join('\n');
  }

  return error?.response?.data?.message ?? error?.message ?? fallback;
};

export default getErrorMessage;
