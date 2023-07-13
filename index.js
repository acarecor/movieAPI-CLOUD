require ('dotenv').config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');


const mongoose = require('mongoose');
const Models = require('./models.js');

const cors= require('cors');
app.use(cors());

const Movies = Models.Movie;
const Users = Models.User;

const {check, validationResult} = require('express-validator');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('common'));


//importing the auth.js file

let auth = require ('./auth')(app);
const passport = require ('passport');
require('./passport');

//localhost
//mongoose.connect('mongodb://localhost:27017/cfDB', {
  //useNewUrlParser: true,
  //useUnifiedTopology: true,
//});
//conecting database atlas
mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// default text --------------------------------------------------------------------------------------

app.get('/', (req, res) => {
  res.send('Welcome to myFlix!');
});

//Users----------------------------------------------------------------
//CREATE a new user account add inn JSON format (mongoose)

app.post('/users', 
  [
    check('username', 'username is required').isLength({min:5}),
    check('username', 'username contains non alphanumeric characters - not allowed').isAlphanumeric(),
    check('password', 'Password is required').not().isEmpty(),
    check('email','email does not appear to be valid').isEmail()
  ], (req, res) => {
  
  let errors = validationResult(req);
  
  if (!errors.isEmpty()){
    return res.status(422).json({errors:errors.array()});
  }
  

  let hashedPassword = Users.hashPassword(req.body.password);
  
  Users.findOne({ username: req.body.username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.username + ' already exists');
      } else {
        Users.create({
          username: req.body.username,
          password: hashedPassword,
          email: req.body.email,
          birthday: req.body.birthday,
        })
          .then((user) => {
            res.status(201).json(user);
          })

          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          });
      }
    })

    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

//READ (get) a user by username  (mongoose)
app.get('/users/:username', passport.authenticate('jwt', {session: false }),
(req, res) => {
  Users.findOne({ username: req.params.username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err); 
      res.status(500).send('Error: ' + err);
    });
});

//UPDATE user info (mongoose)
app.put('/users/:username', passport.authenticate('jwt', {session: false }),
  [ 
    check('username', 'username is required').isLength({min:5}),
    check('username', 'username contains non alphanumeric characters - not allowed').isAlphanumeric(),
    check('password', 'password is required').not().isEmpty(),
    check('email','email does not appear to be valid').isEmail()
  ], 
  (req, res) => {

  let errors = validationResult(req);
    
  if (!errors.isEmpty()){
    return res.status(422).json({errors:errors.array()});
  }
  let hashedPassword = Users.hashPassword(req.body.password);

  Users.findOneAndUpdate(
    { username: req.params.username },
    {
      $set: {
        username: req.body.username,
        password: hashedPassword,
        email: req.body.email,
        birthday: req.body.birthday,
      },
    },
    { new: true }
  )
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// add a movie to the user Favorites-------------------------------------------------------------------------------
//CREATE : ADD movie to a list of favorites (mongoose)
app.post('/users/:username/movies/:movieId', passport.authenticate('jwt', {session: false }), (req, res) => {
  Users.findOneAndUpdate(
    { username: req.params.username },
    {
      $addToSet: { favoritesMovies: req.params.movieId },
    },
    { new: true },
    )
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//DELETE a movie from favorites list mongoose
app.delete('/users/:username/movies/:movieId', passport.authenticate('jwt', {session: false }),(req, res) => {
  Users.findOneAndUpdate(
    { username: req.params.username },
    {
      $pull: { favoritesMovies: req.params.movieId },
    },
    { new: true },
    )
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//-------------------------------------------------------

//DELETE a user account (mongoose)

app.delete("/users/:username", passport.authenticate('jwt', {session: false }),
(req, res) => {
  Users.findOneAndRemove({ username: req.params.username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.username + " was not found");
      } else {
        res.status(200).send(req.params._id + " was deleted.");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

// movies-----------------------------------------------------
//READ: get all movies (mongoose)
//  JWT authentication applied as a second parameter between URL and callback function
app.get('/movies', passport.authenticate('jwt', {session: false }),
(req, res) => {
  Movies.find()
    .then((movies) => {
      res.status(201).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//READ: get one  movie by title (mongoose)

app.get('/movies/:title', passport.authenticate('jwt', {session: false }), 
(req, res) => {
  Movies.findOne({ Title: req.params.title })
    .then((movie) => {
      if (!movie) {
        res.status(400).send(req.params.title + ' was not found');
      } else {
        res.status(200).json(movie);
      }
    })

    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//READ: get one  genre by name  (mongoose)
app.get('/movies/genre/:genreName', passport.authenticate('jwt', {session: false }),
(req, res) => {
  Movies.findOne({ "Genre.Name" : req.params.genreName })
    .then((movie) => {
      if (!movie) {
        res.status(400).send('Genre was not found');
      } else {
        res.status(200).json(movie.genre);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//READ: get one  director by name  (mongoose)
app.get('/movies/directors/:directorName', passport.authenticate('jwt', {session: false }), 
(req, res) => {
  Movies.findOne({ "Director.Name": req.params.directorName })
    .then((movie) => {
      if (!movie) {
        res.status(400).send('Director was not found');
      } else {
        res.status(200).json(movie.director);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// express.static function for the public folder containing the documentation file
app.use(express.static('public'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

//-----------------------------------------------------------------------------------------
const port = process.env.PORT || 8080;
app.listen(port,'0.0.0.0', () => {
  console.log('Listening on Port' + port);
});
