//server/userController.js
const { User } = require('../model.js');
const fs = require('fs');
const userController = {};
const bcrypt = require('bcrypt');
require("dotenv").config();

/**
 * getAllUsers - retrieve all users from the database and stores it into res.locals
 * before moving on to next middleware.
 */
userController.getAllUsers = (req, res, next) => {
  User.find({}, (err, users) => {
    // if a database error occurs, call next with the error message passed in
    // for the express global error handler to catch
    if (err)
      return next(
        'Error in userController.getAllUsers: ' + JSON.stringify(err)
      );

    // store retrieved users into res.locals and move on to next middleware
    res.locals.users = users;
    return next();
  });
};

/**
 * createUser - create and save a new User into the database.
 */
userController.createUser = (req, res, next) => {
  const { username, password } = req.body;

  if(!username || !password){
    return next({
      log: 'Error in userController.createUser - no username and/or password.', 
      message: {err: 'Error creating your account, invalid username and/or password.'}
    });
  } 

  bcrypt.hash(password, Number(process.env.SALTROUNDS))
  .then( hash => {
    const newUser = new User({
      username: username,
      password: hash
    })
    return newUser
  
  })
  .then( newUserData => {
    //console.log(newUserData)
    return newUserData.save()
    // need to store user_id in locals
  })
  .then( data => {
    //console.log(data)
    //console.log('createUser object id: ', data._id.toString())
    res.locals.userId = data._id.toString();
    console.log(res.locals.userId)
    return next()
  })
  .catch( err => 
    next({
    log: `Error in userController.createUser: ${err}`, 
    message: {err: 'Error creating your account, see server log for details.'}
  })
 )
};

/**
 * verifyUser - Obtain username and password from the request body, locate
 * the appropriate user in the database, and then authenticate the submitted password
 * against the password stored in the database.
 */
userController.verifyUser = (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password)
    return next({
      log: 'Error in userController.verifyCookie - invalid username and/or password.', 
      message: {err: 'Error with your account, invalid username and/or password.'}
    });

  User.findOne({ username })
  .then( response => {
    console.log('user lookup response: ', response)
    if(!response) {
      console.log('user does not exist')
      // username does not exist
      // redirect to /signup - localhost:8080/signup won't work?
      // res.redirect('http://localhost:8080/signup') // does not end req-res cycle and continues to next middleware
      res.locals.redirectSignup = true;
      return next()
    }
    res.locals.userId = response._id.toString();
    // res.locals.path = '/';
    // res.locals.loggedIn = true;
    return next();
  })
  .catch ( err => next({
    log: `Error in userController.verifyUser: ${err}`,
    message: {err: 'Error with your account, invalid username and/or password.'}
  }))

};

module.exports = userController;