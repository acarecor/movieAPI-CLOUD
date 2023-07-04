const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const uuid = require('uuid');

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
    check('Username', 'Username is required').isLength({min:5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email','Email does not appear to be valid').isEmail()
  ], (req, res) => {
  
  let errors = validationResult(req);
  
  if (!errors.isEmpty()){
    return res.status(422).json({errors:errors.array()});
  }
  

  let hashedPassword = Users.hashPassword(req.body.Password);
  
  Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + ' already exists');
      } else {
        Users.create({
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
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
app.get('/users/:Username', passport.authenticate('jwt', {session: false }),
(req, res) => {
  Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err); 
      res.status(500).send('Error: ' + err);
    });
});

//UPDATE user info (mongoose)
app.put('/users/:Username', passport.authenticate('jwt', {session: false }),
  [ 
    check('Username', 'Username is required').isLength({min:5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email','Email does not appear to be valid').isEmail()
  ], 
  (req, res) => {

  let errors = validationResult(req);
    
  if (!errors.isEmpty()){
    return res.status(422).json({errors:errors.array()});
  }
  let hashedPassword = Users.hashPassword(req.body.Password);

  Users.findOneAndUpdate(
    { Username: req.params.Username },
    {
      $set: {
        Username: req.body.Username,
        Password: hashedPassword,
        Email: req.body.Email,
        Birthday: req.body.Birthday,
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
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {session: false }), (req, res) => {
  Users.findOneAndUpdate(
    { Username: req.params.Username },
    {
      $addToSet: { FavoritesMovies: req.params.MovieID },
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
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {session: false }),(req, res) => {
  Users.findOneAndUpdate(
    { Username: req.params.Username },
    {
      $pull: { FavoritesMovies: req.params.MovieID },
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

app.delete("/users/:Username", passport.authenticate('jwt', {session: false }),
(req, res) => {
  Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + " was not found");
      } else {
        res.status(200).send(req.params.Username + " was deleted.");
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

app.get('/movies/:Title', passport.authenticate('jwt', {session: false }), 
(req, res) => {
  Movies.findOne({ Title: req.params.Title })
    .then((movie) => {
      if (!movie) {
        res.status(400).send(req.params.Title + ' was not found');
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
  Movies.findOne({ 'Genre.Name': req.params.genreName })
    .then((movie) => {
      if (!movie) {
        res.status(400).send('Genre was not found');
      } else {
        res.status(200).json(movie.Genre);
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
  Movies.findOne({ 'Director.Name': req.params.directorName })
    .then((movie) => {
      if (!movie) {
        res.status(400).send('Director was not found');
      } else {
        res.status(200).json(movie.Director);
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
