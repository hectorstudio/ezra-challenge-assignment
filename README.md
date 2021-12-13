# EZRA test project
## Hectorstudio

## Features

- /report/<id>/checkout :
Allows the user to checkout a report document after which no other user can checkout
that report. If a report id does not exist, create it in your data structure.
If the release endpoint (see below) is not called, the checked out report is released after
a certain number of minutes. The time is configurable as an environment variable.
- /report/<id>/release :
Allows the user who checked out the report with id <id> to release the report, another
user should now be able to checkout this report.
- /report/<id>/renew:
Allows the user who checked out the report to renew the lock.

## Notes
- Feel free to use some sort of in memory data structure and not worry about connecting
to a database
- For the purpose of this exercise the returned json can contain any information you think
is useful
- You should document how to run your server

## Tech Stack
Node.js, JSON-SERVER, NODE-CRON, DOT-ENV

## Installation

```sh
cd ezra
yarn install
node index.js
```


## How to check

- Open Postman to try to test the mock APIs
- Create a POST request and input the API url
For example:
http://localhost:3000/report/123/checkout
http://localhost:3000/report/123/release
http://localhost:3000/report/123/renew
- Add userid to request header
For example:
userid: 123
- Try the APIs


