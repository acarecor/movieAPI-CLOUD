/**
 * @module index
 * @description   main module of the MOVIE_API application which contains all API calls.
 */


require ('dotenv').config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
//added new code for the aws sdk
const fileUpload = require ('express-fileupload');
const { S3Client, ListObjectsV2Command, PutObjectCommand  } = require('@aws-sdk/client-s3');
const fs = require('fs');


const mongoose = require('mongoose');
const Models = require('./models.js');

const cors= require('cors');

/**  
* added allowed Origins
*/
let allowedOrigins = [ 'http://localhost:8080', 'http://localhost:1234','http://localhost:4200','http://cineflix-app.s3-website.eu-central-1.amazonaws.com'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      let message = "The CORS policy for this application doesn't allow access from origin" + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));

const Movies = Models.Movie;
const Users = Models.User;

const {check, validationResult} = require('express-validator');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('common'));


/** 
 * importing the auth.js file
*/
let auth = require ('./auth')(app);
const passport = require ('passport');
require('./passport');


/**
 * Connection to mongoDB ec2 instance
 */
mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

/**
 * @description Serve static files from public folder
 */ 
 
app.get('/', (req, res) => {
  res.send("welcome to myFlix, in the Cloud!");
});

/**
 * @description create a new user account
 * @name POST /users
 * @example 
 * // Request data format: Array of JSON objects
 * [
 *  {
 *   "username": "string", 
 *   "password": "string", 
 *   "email": "string", 
 *   "birthday": "date" 
 *   }
 *  ]
 * @example 
 * // Response data format: A JSON object containing data about the user that has been added, including an ID
 * [
 *  {
 *   "id":" ",
 *   "username": "string", 
 *   "password": "string", 
 *   "email": "string", 
 *   "birthday": "Date", 
 *   "favoritesMovies: [movieId]
 *   }
 *  ]
*/

const s3Client = new S3Client({
  region: 'eu-central-1', // Replace with the region aws 
  //endpoint: 'http://localhost:4566', 
  //forcePathStyle: true
});


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

/**
 * @description Return information about the user
 * @name GET /user/:username
 * @example 
 * // Request data format: 
 * none
 * @example 
 * // Response data format: A JSON array of objects containing the informacion of the user
 * @param {authentication} - Bearer token (JWT)
 */
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

/**
 * @description Allow users to update their information
 * @name PUT /user/:username
 * @param {string} :username
 * @example 
 * // Request data format: Array of JSON objects
 * [
 *  {
 *   "username": "string", 
 *   "password": "string", 
 *   "email": "string", 
 *   "birthday": "date" 
 *   }
 *  ]
 * @example 
 * // Response data format: A JSON array of objects containing the informacion of the user
 * @param {authentication} - Bearer token (JWT)
 */
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

/**
 * @description Allow users to add a movie to their favorites list
 * @name POST /users/:username/movies/:movieId
 * @param {string} :username,
 * @param {string} :movieID
 * @example
 * // Request body data format:
 * none
 * @example 
 * // Response data format: A JSON object holding data about the user's updated information (movieId added)
 * @param {authentication} - Bearer token (JWT)
 */
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


/**
 * @description Allow users to remove a movie from their favorites list
 * @name DELETE /users/:username/movies/:movieId
 * @param {string} :username
 * @param {string} :movieID
 * @example
 * // Request body data format:
 * none
 * @example 
 * // Response data format: A JSON object holding data about the user's updated information (movieId deleted)
 * @param {authentication} - Bearer token (JWT)
 */
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


/**
 * @description Allow users to delete their account
 * @name DELETE /users/:username
 * @param {string} :username
 * @example
 * // Request body data format:
 * none
 * @example 
 * // Response : A text message indicating that the user's account has been deleted.
 * @param {authentication} - Bearer token (JWT)
 */
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

/**
 * @description Return a list of All movies to the user
 * @name GET /movies
 * @example
 * // Request body data format:
 * none
 * @example 
 * // Response : A JSON array of objects containing the informacion of all the movies
 * @param {authentication} - Bearer token (JWT)
 */
app.get('/movies',  passport.authenticate('jwt', {session: false }),
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

/**
 * @description Return data about a single movie by title to the user
 * @name GET /movies/:title
 * @param {string} :title
 * @example
 * // Request body data format:
 * none
 * @example 
 * // Response : A JSON object containing information about the requested movie
 * @param {authentication} - Bearer token (JWT)
 */
app.get('/movies/:title', passport.authenticate('jwt', {session: false }), 
(req, res) => {
  Movies.findOne({ title: req.params.title })
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

/**
 * @description Return data about a genre (description) to the user
 * @name GET /movies/genre/:genreName
 * @param {string} :genreName
 * @example
 * // Request body data format:
 * none
 * @example 
 * // Response : A JSON object containing information about the requested genre
 * @param {authentication} - Bearer token (JWT)
 */
app.get('/movies/genre/:genreName', passport.authenticate('jwt', {session: false }),
(req, res) => {
  Movies.findOne({ 'genre.name' : req.params.genreName })
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

/**
 * @description Return data about a genre (description) to the user
 * @name GET /movies/directors/:directorName
 * @param {string} :directorName
 * @example
 * // Request body data format:
 * none
 * @example 
 * // Response : A JSON object containing information about the requested director
 * @param {authentication} - Bearer token (JWT)
 */
app.get('/movies/directors/:directorName', passport.authenticate('jwt', {session: false }), 
(req, res) => {
  Movies.findOne({ 'director.name': req.params.directorName })
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

//////////////////////////////////////////////////////////
/////////////////////AWS SDK//////////////////////////////

// Endpoint  to list objects in the image bucket
app.get('/images', passport.authenticate('jwt', { session: false }), (req, res) => {
  const listObjectsParams = {
      Bucket: process.env.BUCKET_NAME, // Replace 
  };

  const listObjectsCmd = new ListObjectsV2Command(listObjectsParams);

  s3Client.send(listObjectsCmd)
      .then((listObjectsResponse) => {
          res.json(listObjectsResponse.Contents);
      })
      .catch((error) => {
          console.error(error);
          res.status(500).json({ error: 'Error listing objects in S3' });
      });
});

// Endpoint to upload images to S3
app.post('/images', passport.authenticate('jwt', { session: false }), (req, res) => {
  const file = req.files.image;
  const fileName = req.files.image.name;
  const tempPath = `./uploads/${fileName}`;

  file.mv(tempPath, (err) => {
      if (err) {
          return res.status(500).json({ error: 'Error saving the file' });
      }

      const uploadParams = {
          Bucket: process.env.BUCKET_NAME, // Replace with the name of the bucket S3
          Key: fileName,
          Body: fs.readFileSync(tempPath),
      };

      const putObjectCmd = new PutObjectCommand(uploadParams);

      s3Client.send(putObjectCmd)
          .then((uploadResponse) => {
              // Delete the file from the temporary path 
              fs.unlinkSync(tempPath);
              res.json({ success: true, data: uploadResponse });
          })
          .catch((error) => {
              console.error(error);
              res.status(500).json({ error: 'Error uploading the file to S3' });
          });
  });
});

// Endpoint to retrieve an object from S3
app.get('/images/:objectKey', passport.authenticate('jwt', { session: false }), (req, res) => {
  const objectKey = req.params.objectKey;
  const bucketName = process.env.BUCKET_NAME; // Replace with the name of the bucket S3

  const getObjectParams = {
      Bucket: bucketName,
      Key: objectKey,
  };

  const getObjectCmd = new GetObjectCommand(getObjectParams);

  s3Client.send(getObjectCmd)
      .then(({ Body }) => {
          res.send(Body);
      })
      .catch((error) => {
          console.error(error);
          res.status(500).json({ error: 'Error to retrieve an object from S3' });
      });
});

//////////////////////////////////////////////////////////////////////////

/**
 * express.static function for the public folder containing the documentation file
 */
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
