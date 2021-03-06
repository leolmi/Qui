/* Created by Leo on 05/08/2015. */
'use strict';

var express = require('express');
var controller = require('./chat.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.post('/',auth.isAuthenticated(),  controller.insert);

module.exports = router;
