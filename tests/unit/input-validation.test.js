/* eslint-env jest */
const { cleanText, validateRequiredText, validateOptionalText, validateName } = require('../../src/services/input-validation')

describe('cleanText', () => {
  test('trims leading and trailing whitespace', () => {
    expect(cleanText('  hello  ')).toBe('hello')
  })

  test('returns empty string for null', () => {
    expect(cleanText(null)).toBe('')
  })

  test('returns empty string for undefined', () => {
    expect(cleanText(undefined)).toBe('')
  })

  test('converts non-string values to string', () => {
    expect(cleanText(123)).toBe('123')
  })
})

describe('validateRequiredText', () => {
  test('returns null for a valid value within limit', () => {
    expect(validateRequiredText('Title', 'My consultation', 100)).toBeNull()
  })

  test('returns error when value is empty', () => {
    expect(validateRequiredText('Title', '', 100)).toBe('Title is required.')
  })

  test('returns error when value is only whitespace', () => {
    expect(validateRequiredText('Title', '   ', 100)).toBe('Title is required.')
  })

  test('returns error when value exceeds maxLength', () => {
    const long = 'a'.repeat(101)
    expect(validateRequiredText('Title', long, 100)).toBe('Title must be 100 characters or fewer.')
  })

  test('returns null when value is exactly at maxLength', () => {
    const exact = 'a'.repeat(100)
    expect(validateRequiredText('Title', exact, 100)).toBeNull()
  })

  test('returns null for null input when treated as empty', () => {
    expect(validateRequiredText('Title', null, 100)).toBe('Title is required.')
  })
})

describe('validateOptionalText', () => {
  test('returns null for empty value', () => {
    expect(validateOptionalText('Description', '', 500)).toBeNull()
  })

  test('returns null for null value', () => {
    expect(validateOptionalText('Description', null, 500)).toBeNull()
  })

  test('returns null for value within limit', () => {
    expect(validateOptionalText('Description', 'Some text', 500)).toBeNull()
  })

  test('returns error when value exceeds maxLength', () => {
    const long = 'x'.repeat(501)
    expect(validateOptionalText('Description', long, 500)).toBe('Description must be 500 characters or fewer.')
  })

  test('returns null when value is exactly at maxLength', () => {
    const exact = 'x'.repeat(500)
    expect(validateOptionalText('Description', exact, 500)).toBeNull()
  })
})

describe('validateName', () => {
  test('returns null for a valid name', () => {
    expect(validateName('Full name', 'Jane Doe')).toBeNull()
  })

  test('returns error when name is empty', () => {
    expect(validateName('Full name', '')).toBe('Full name is required.')
  })

  test('returns error when name is only whitespace', () => {
    expect(validateName('Full name', '   ')).toBe('Full name is required.')
  })

  test('returns error when name exceeds 100 characters', () => {
    const long = 'a'.repeat(101)
    expect(validateName('Full name', long)).toBe('Full name must be 100 characters or fewer.')
  })

  test('returns null when name is exactly 100 characters', () => {
    const exact = 'a'.repeat(100)
    expect(validateName('Full name', exact)).toBeNull()
  })

  test('returns error for null input', () => {
    expect(validateName('Full name', null)).toBe('Full name is required.')
  })
})
