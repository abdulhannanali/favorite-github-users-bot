const request = require("request")
const url = require("url")
const path = require("path")
const endpoint = "https://api.github.com/"

function getUserDetails (username, cb) {
    
    var cb = cb || (() => {})
    
    if (!username || !username.trim()) {
        cb(new Error("Sorry! No username given to this function!"))
    }
    else {
        var user_url =  endpoint + "users/" + username
        console.log(user_url)
        request({
            headers: {
                "User-Agent": "request"
            },
            url: user_url    
        }, function (error, response, body) {
            if (error) {
                cb(error)
            }
            else {
                cb(undefined, body)
            }
        })
    }
}

function getFollowersList (username, page, per_page, cb) {
    if (!username) {
        cb(new Error("Sorry! No username given to us!"))
    }
    var page = page || 0
    var followers_endpoint = url.resolve(endpoint, path.join("users", username, "followers"))

    request({
        url: followers_endpoint,
        headers: {
            "User-Agent": "request"
        },
        qs: {
            page: page,
            per_page: per_page
        }
    }, cb)    
    
}


module.exports = {
    getUserDetails: getUserDetails,
    getFollowersList: getFollowersList
}