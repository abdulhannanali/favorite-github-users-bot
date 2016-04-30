const fs = require("fs")
const github = require("./lib/github")
const users = JSON.parse(fs.readFileSync("./github/favorite-users.json", "utf-8"))

var userDetailed = {}

users.forEach(function (user) {
    github.getUserDetails(user, function (error, response) {
        userDetailed[user] = JSON.parse(response)
        fs.writeFileSync("./github/favorite-users.json", JSON.stringify(userDetailed))
    })
})
