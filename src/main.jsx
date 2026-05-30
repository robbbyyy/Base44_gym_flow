import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import moment from 'moment'
import 'moment/locale/it'
moment.locale('it')

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)