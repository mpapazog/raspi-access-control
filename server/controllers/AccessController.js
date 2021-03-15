// AccessController.js

const USE_CASE_CLIENT = 'raspi';
const USE_CASE_SERVER = 'appServer';


var express = require('express');
var router = express.Router();
router.use(express.json());

var Access = require('../models/Access');

function decodeCredentials(authorizationString) {
    var username = "";
    var password = "";
    
    if (typeof authorizationString == "string") {
        if (authorizationString.length > 6) {
            var base64part = authorizationString.substring(6); // Skip "Basic "
            var decoded = Buffer.from(base64part, 'base64').toString();
            var splitStr = decoded.split(":");
            if (splitStr.length == 2) {
                username = splitStr[0];
                password = splitStr[1];
            }
        }
    }
    
    return {username: username, password: password};
}

function validateCredentials (headers, useCase) {
    if (Access.getAuthSettings(useCase).authenticationRequired) {
        if (typeof headers.authorization != "undefined") {
            var credentials = decodeCredentials(headers.authorization);
            var user = credentials.username.replace(/['"]+/g, '?');
            var pass = credentials.password.replace(/['"]+/g, '?');
            var success = Access.authenticate(user, pass, useCase);   
            console.log(new Date().toISOString() + ' User "' + user + 
                '": Authentication ' + (success ? 'successful' : 'failed'));
            return success;            
        }
        return false;
    } else { // Authentication is disabled in the config
        return true;
    }
}

// Returns if access has been requested
router.get('/button', function (req, res) {   
    if (validateCredentials (req.headers, USE_CASE_SERVER)) {
        res.status(200).json({status: Access.getButtonStatus()});
    } else {
        res.status(401).json({errors:"Authorization required"});
    }  
});

// Pushes the access control button
router.put('/button', function (req, res) {   
    if (validateCredentials (req.headers, USE_CASE_CLIENT)) {
        Access.updateButtonStatus(Access)
            .then(function (response) {
                res.status(200).json(response);
            })
            .catch(function (error) {
                res.status(500).json({errors:"Server error"});
            })
            .finally(function () {
                // always executed
            });      
    } else {
        res.status(401).json({errors:"Authorization required"});
    }  
});

// Returns authorization state
router.get('/door', function (req, res) {   
    if (validateCredentials (req.headers, USE_CASE_CLIENT)) {
        res.status(200).json({approval: Access.getApprovalStatus()});
    } else {
        res.status(401).json({errors:"Authorization required"});
    }  
});

// Modifies access approval state
router.put('/door', function (req, res) {
    if (validateCredentials (req.headers, USE_CASE_SERVER)) {
        if (req.body) {
            if (req.body.approval) {
                Access.updateApprovalStatus(req.body.approval, Access)
                    .then(function (response) {
                        res.status(200).json(response);
                    })
                    .catch(function (error) {
                        res.status(500).json({errors:"Server error"});
                    })
                    .finally(function () {
                        // always executed
                    });                            
            } else {
                res.status(400).json({errors:"Wrong request body format"});                
            }                      
        } else {
            res.status(400).json({errors:"No request body"});
        }    
    } else {
        res.status(401).json({errors:"Authorization required"});
    }  
});

module.exports = router;