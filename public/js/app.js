document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form[action="/logout"]').forEach(form => {
    form.addEventListener('submit', e => {
      if (!confirm('Are you sure you want to log out?')) e.preventDefault()
    })
  })
})
