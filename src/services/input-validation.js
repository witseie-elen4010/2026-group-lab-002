function cleanText(value) {
  return String(value || '').trim()
}

function validateRequiredText(fieldName, value, maxLength) {
  const cleaned = cleanText(value)

  if (!cleaned) {
    return `${fieldName} is required.`
  }

  if (cleaned.length > maxLength) {
    return `${fieldName} must be ${maxLength} characters or fewer.`
  }

  return null
}

function validateOptionalText(fieldName, value, maxLength) {
  const cleaned = cleanText(value)

  if (cleaned.length > maxLength) {
    return `${fieldName} must be ${maxLength} characters or fewer.`
  }

  return null
}

function validateName(fieldName, value) {
  const cleaned = cleanText(value)

  if (!cleaned) {
    return `${fieldName} is required.`
  }

  if (cleaned.length > 100) {
    return `${fieldName} must be 100 characters or fewer.`
  }

  return null
}

module.exports = {
  cleanText,
  validateRequiredText,
  validateOptionalText,
  validateName
}
