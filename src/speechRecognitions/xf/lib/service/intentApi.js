
function getToken() {
  return localStorage.getItem('MYTOKEN')
}

export function fetchIntent(msg) {
  return fetch('/chatbot/chat/allocation/link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      'modelType': '00'
    },
    body: JSON.stringify({
      key: msg,
      projectKey: 'zhengzhou'
    })
  }).then(res => {
    return res.json()
  })
}