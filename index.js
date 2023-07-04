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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('common'));


//importing the auth.js file

let auth = require ('./auth')(app);
const passport = require ('passport');
require('./passport');

mongoose.connect('mongodb://localhost:27017/cfDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// default text --------------------------------------------------------------------------------------

app.get('/', (req, res) => {
  res.send('Welcome to myFlix!');
});

//Users----------------------------------------------------------------
//CREATE a new user account add inn JSON format (mongoose)

app.post('/users', (req, res) => {
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

//READ all users info (mongoose)
app.get('/users', (req, res) => {
  Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//READ (get) a user by username  (mongoose)
app.get('/users/:Username', passport.authenticate('jwt', {session: false }),(req, res) => {
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
app.put('/users/:Username', passport.authenticate('jwt', {session: false }), (req, res) => {
  Users.findOneAndUpdate(
    { Username: req.params.Username },
    {
      $set: {
        Username: req.body.Username,
        Password: req.body.Password,
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
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});
