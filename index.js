const jsonServer = require('json-server')
const fs = require("fs")
const cron = require('node-cron')

require('dotenv').config()

const CHECKOUT_MINUTES = process.env.CHECKOUT_MINUTES || 5 // get checkout minutes from .env, default 5 minutes

const server = jsonServer.create()
const middlewares = jsonServer.defaults()

const readDBFile = () => {
  const fileStr = fs.readFileSync("./db.json")
  return JSON.parse(fileStr)
}

cron.schedule(`*/${CHECKOUT_MINUTES} * * * *`, () => {
  const data = readDBFile()
  const today = new Date();

  const cronData = data.map((el) => {
    if (el.checked_out_date) { // Find checked report which should be released
      const checkedDate = new Date(el.checked_out_date)
      if (today > checkedDate) { // Compare current time and checked out time
        return { ...el, checked_out: false, checkout_user_id: null, checked_out_date: null }
      }
      return el
    }
    return el
  })
  
  writeDBFile(cronData)
})

const writeDBFile = (data) => { // TODO: this should be replaced with database action on production
  fs.writeFileSync("./db.json", JSON.stringify(data))
}

server.post('/report/:id/checkout', (req, res) => {
  const { id } = req.params
  const { userid } = req.headers // Get userid from attached header
  const today = new Date()
  const data = readDBFile()

  if (id) { // If it is not a valid id
    const report = data.find((el) => el.id === id) // Find the report by id from request
    if (report) { // If exists
      if (report.checked_out) { // If the report was checked out already
        if (report.checkout_user_id === userid) { // If you already checked out the report
          res.jsonp({ error: true, message: "You already checked out this report." })
        } else { // If the other user already checked out the report
          res.jsonp({ error: true, message: "This report is being checked out by another user." })
        }
      } else {
        res.jsonp({ ...report, checked_out: true, checkout_user_id: userid, checked_out_date: today }) // Set checked_out as true
        writeDBFile(data.map((el) => {
          if (el.id === id)
            return { ...el, checked_out: true, checkout_user_id: userid, checked_out_date: today }
          return el
        }))
      }
    } else { // If not exists
      const report = { id, title: `${today}-report`, checked_out: true, checkout_user_id: userid, checked_out_date: today } // Create a new report with id
      res.jsonp(report)
      writeDBFile([...data, report]);
    }
  } else {
    res.jsonp({ error: 403, message: "Please input valid id." }) // return error for invalid id
  }
});

server.post('/report/:id/release', (req, res) => {
  const { id } = req.params
  const { userid } = req.headers
  const data = readDBFile()

  if (id) { // If it is not a valid id
    const report = data.find((el) => el.id === id) // Find the report by id from request
    if (report) { // If exists
      if (report.checked_out && report.checkout_user_id === userid) { // If the user checked out the report already
        res.jsonp({ ...report, checked_out: false, checkout_user_id: null, checked_out_date: null })
        writeDBFile(data.map((el) => {
          if (el.id === id)
            return { ...el, checked_out: false, checkout_user_id: null, checked_out_date: null }
          return el
        }))
      } else { // If the user didn't check out the report
        res.jsonp({ error: true, message: "You didn't check out this report." })
      }
    } else { // If not exists
      res.jsonp({ error: true, message: "This report with request id is not existed!" })
    }
  } else {
    res.jsonp({ error: true, message: "Please input valid id." }) // return error for invalid id
  }
});

server.post('/report/:id/renew', (req, res) => {
  const { id } = req.params
  const { userid } = req.headers
  const today = new Date()
  const data = readDBFile()

  if (id) { // If it is not a valid id
    const report = data.find((el) => el.id === id) // Find the report by id from request
    if (report) { // If exists
      if (userid === report.checkout_user_id) {
        res.jsonp({ ...report, checked_out: true, checkout_user_id: userid, checked_out_date: today })
        writeDBFile(data.map((el) => {
          if (el.id === id)
            return { ...el, checked_out: true, checkout_user_id: userid, checked_out_date: today }
          return el
        }))
      } else { // If the user didn't checked out this report
        res.jsonp({ error: true, message: "You can't renew this report" })
      }
    } else { // If not exists
      res.jsonp({ error: true, message: "This report with request id is not existed!" })
    }
  } else {
    res.jsonp({ error: true, message: "Please input valid id." }) // return error for invalid id
  }
});

server.use(middlewares)

server.listen(3000, () => {
  console.log('JSON Server is running')
})
