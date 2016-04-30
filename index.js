const request = require("request")
const github = require("./lib/github")
const http = require("http")
const fs = require("fs")


const Bot = require("messenger-bot")

var ENV = process.env 
var NODE_ENV = ENV["NODE_ENV"] || "development"

if (NODE_ENV == "development") {
    require("./config.js")
} else {
    
}

var favoriteUsers = JSON.parse(fs.readFileSync("./github/favorite-users.json", "utf-8"))

const PORT = process.env.PORT || 9999
const HOST = process.env.HOST || "0.0.0.0"


var bot = new Bot({
    token: ENV["TOKEN"],
    verify: ENV["VERIFY"]
})

bot.on("message", function (payload, reply) {
    if (payload.message.text) {
        handleText(payload)
    }
})

function handleText (payload) {
    var text = payload.message.text
    
    if (text && text == "list") {
        listGithubUsers(payload)        
    }
    console.log("handleText")
}

function listGithubUsers (payload) {
    var elements = Object.keys(favoriteUsers).map(function (key, index, array) {
        var userDetails = favoriteUsers[key]
        var buttons = [
                {
                    type: "postback",
                    title: "Get Profile Picture",
                    payload: "USER_PROFILEPIC_" + key
                },
                {
                    type: "postback",
                    title: "Location!",
                    payload: "USER_LOCATION_" + key
                }
            ]
            
        if (Math.random() < 0.5) {
            buttons.push({
                    type: "postback",
                    title: "Detailed Info!",
                    payload: "USER_STATS_" + key
            })
        }
        
        return {
            title: userDetails.name || "No name",
            item_url: userDetails.html_url,
            image_url: userDetails.avatar_url,
            subtitle: key,
            buttons: buttons
        }
    })
    
    bot.sendMessage(payload.sender.id, {
        attachment: {
            type: "template",
            payload: {
                template_type: "generic",
                elements: elements
            }
        }
    }, function (error, success) {
        if (error) {
            console.error(error)
        }
        else if (success) {
            console.log("Message sent")
        }
    })
    
}

bot.on("postback", function (data, reply) {
    console.log(data)
    var postback = data.postback.payload
    var matches = postback.split("_") 
    
    if (matches && matches[1] && matches[2]) {
        var action = matches[1]
        var username = matches[2]
        var user = favoriteUsers[matches[2]]
        
        
        if (action == "PROFILEPIC") {
            reply({
                attachment: {
                    type: "image",
                    payload: {
                        url: user.avatar_url
                    }
                }
            })
        }
        else if (action == "LOCATION") {
            reply({
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: user.name + " lives in " + user.location,
                        buttons: [
                            {
                                type: "postback",
                                title: "Detailed Info",
                                payload: "USER_STATS_" + username
                            }
                        ]
                    }
                }
            }, function (error) {
                if (error) {
                    console.error(error)
                }
            })
        }
        else if (action == "STATS") {
            reply({
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: `Name: ${user.name}\nID: ${user.id}\nCompany: ${user.company}\nPublic Repos: ${user.public_repos}\nPublic Gists: ${user.public_gists}\nFollowers: ${user.followers}\nFollowing: ${user.following}\nLocation:${user.location}`,
                        buttons: [
                            {
                                type: "postback",
                                title: "Followers",
                                payload: "USER_FOLLOWERS_" + username + "_" + 0
                            }
                        ]
                    }
                }
            })
        }
        else if (action = "FOLLOWERS") {
            var number = parseInt(matches[3]) || 1
            var totalFollowers = user.followers
            var per_page = 10
            var numPages = Math.ceil(totalFollowers / per_page)
            
            if (number <= numPages) {
                github.getFollowersList(username, number, per_page, function (error, response, body) {
                    if (!error && response && response.body) {
                        var users = JSON.parse(response.body)
                        var elements = users.map(function (user, index, array) {
                            return {
                                title: user.login,
                                image_url: user.avatar_url,
                                item_url: user.html_url,
                                buttons: [
                                    {
                                        type: "web_url",
                                        title: "Visit Github Profile",
                                        url: user.html_url
                                    } 
                                ]
                            }
                        })
                        
                        reply({
                            attachment: {
                                type: "template",
                                payload: {
                                    template_type: "generic",
                                    elements: elements  
                                }
                            }
                        }, function (error, success) {
                            if (!error) {
                                reply({
                                    attachment: {
                                        type: "template",
                                        payload: {
                                            template_type: "button",
                                            text: `Next page of followers for ${username}`,
                                            buttons: [
                                                {
                                                    type: "postback",
                                                    title: "More Followers",
                                                    payload: "USER_FOLLOWERS_" + username + "_" + (number + 1)
                                                }
                                            ]
                                        }
                                    }
                                })
                            }
                        })
                    }
                })
            }            
        }
        
    } 
})

http.createServer(bot.middleware()).listen(PORT, HOST, function (error) {
    if (error) {
        console.error(error)
    } else {
        console.log("Server is listening on")
        console.log("PORT = " + PORT)
        console.log("HOST = " + HOST)
    }
})