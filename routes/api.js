var express = require('express');
var router = express.Router();
var github = require('octonode');
var client = github.client();
var async = require('async');
const request = require('request-promise');
const _ = require('lodash');

router.get('/getUsersFromOrg', function (req, res, next) {
    var ghorg = client.org('Target');
    ghorg.members(function (err, data) {
        if (err) {
            res.json(err);
        } else {
            res.json(data);
        }
    });

});

router.get('/getProfileInfo/:username', function (req, res) {
    var user = req.params.username;
    var gitUser = client.user(user);
    async.auto({
        getUserInfo: function (callback) {
            gitUser.info(function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, result);
                }
            })
        },
        getUserRepos: function (callback) {
            getRepos(user).then(function (result) {
                callback(null, result);
            }, function (err) {
                callback(err);
            })
        },
        listOfReposContributedTo: function (callback) {
            listOfReposContributedTo(user).then(function (result) {
                callback(null, result);
            }, function (err) {
                callback(err);
            })
        }
    }, function (err, results) {
        if (err) {
            res.json(err);
        } else {
            res.json(results)
        }
    });

})

function getRepos(username) {
    const options = {
        method: 'GET',
        uri: 'https://api.github.com/users/' + username + '/repos',
        headers: {
            'User-Agent': 'request'
        },
        qs: {
            per_page: 5
        }
    }
    return new Promise((resolve, reject) => {
        request(options)
            .then(function (response) {
                // let followers = _.map(JSON.parse(response), 'login');
                resolve(JSON.parse(response));
            })
            .catch(function (response) {
                reject(response);
            })
    })
}

function listOfReposContributedTo(username) {
    const options = {
        method: 'GET',
        uri: 'https://api.github.com/users/' + username + '/received_events',
        headers: {
            'User-Agent': 'request'
        },
        qs: {
            per_page: 5
        }
    }
    return new Promise((resolve, reject) => {
        request(options)
            .then(function (response) {
                var obj = {};
                response = JSON.parse(response);
                obj.total = response.length;
                var arr = response.map(r => {
                    if (r.repo && r.repo.name) {
                        return r.repo.name;
                    }
                })
                // Remove the duplicate repos.
                obj.arr = arr.filter((el, i, a) => i === a.indexOf(el));
                resolve(obj);
            })
            .catch(function (response) {
                reject(response);
            })
    })
}

module.exports = router;
