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
const { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
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
const s3Client = new S3Client({
  region: "eu-central-1", 
});

//added fileUpload
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "./uploads",
  })
);

// Endpoint  to list objects form the s3 bucket (resized images )
app.get("/images", async (req, res) => {
  try {
    const listObjectsParams = {
      Bucket: process.env.OUTPUT_BUCKET, //bucket name resize
    };

    const listObjectsCommand = new ListObjectsV2Command(listObjectsParams);
    const listObjectsResponse = await s3Client.send(listObjectsCommand);

    const imageDetails = await Promise.all(
      listObjectsResponse.Contents.map(async (object) => {
        const params = {
          Bucket: process.env.OUTPUT_BUCKET, //bucket name resize
          Key: object.Key,
        };

        const getObjectCommand = new GetObjectCommand(params);
        const getObjectResponse = await s3Client.send(getObjectCommand);

        const chunks = [];
        getObjectResponse.Body.on("data", (chunk) => {
          chunks.push(chunk);
        });

        return new Promise((resolve) => {
          getObjectResponse.Body.on("end", () => {
            const dataBuffer = Buffer.concat(chunks);
            const contentType = getObjectResponse.ContentType;

            resolve({
              name: object.Key,
              content: dataBuffer.toString("base64"), // Devolver el contenido en base64
              contentType,
            });
          });
        });
      })
    );

    res.status(200).json(imageDetails);
  } catch (err) {
    console.error("Error retrieving S3 objects:", err);
    return res.status(500).json({ error: "Error retrieving objects" });
  }
});

//Endpoint to fetch images from s3 bucket (original size)
app.get("/images/:objectKey", async (req, res) => {
  const objectKey = req.params.objectKey;
  try {
    const params = {
      Bucket: process.env.BUCKET_NAME, //bucket name original
      Key: objectKey,
    };

    const getObjectCommand = new GetObjectCommand(params);
    const getObjectResponse = await s3Client.send(getObjectCommand);

    const chunks = [];
    getObjectResponse.Body.on("data", (chunk) => {
      chunks.push(chunk);
    });
    // console.log('GetObjectResponse: ', getObjectResponse);

    getObjectResponse.Body.on("end", () => {
      const dataBuffer = Buffer.concat(chunks);
      const contentType = getObjectResponse.ContentType;
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename=${objectKey}`);
      res.send(dataBuffer);
    });
  } catch (err) {
    console.error("Error retrieving S3 object:", err);
    return res.status(500).json({ error: "Error retrieving object" });
  }
});

// Endpoint to upload images to S3

app.post("/images", async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ error: "No files were uploaded." });
  }

  try {
    // Log the uploaded file information
    console.log(req.files.file);

    // Create a readable stream from the temporary file path
    const stream = fs.createReadStream(req.files.file.tempFilePath);

    // Set up parameters for S3 upload
    const uploadParams = {
      Bucket: process.env.BUCKET_NAME, //bucket name original
      Key: req.files.file.name,
      Body: stream,
    };

    // Create a new command for uploading to S3
    const command = new PutObjectCommand(uploadParams);

    try {
      // Send the S3 upload command
      const result = await s3Client.send(command);

      // Delete the temporary file from the server after uploading
      fs.unlink(req.files.file.tempFilePath, (unlinkError) => {
        if (unlinkError) {
          console.error("Error deleting temporary file:", unlinkError);
        } else {
          console.log(
            "Temporary file deleted successfully:",
            req.files.file.tempFilePath
          );
        }
      });

      // Return a success response with the S3 upload result
      return res.json({
        success: true,
        message: "File uploaded successfully",
        result,
      });
    } catch (error) {
      // Handle errors during S3 upload
      console.error("Error uploading file:", error);

      // Return an error response
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  } catch (error) {
    // Handle errors during the file upload process
    console.error("Error uploading file:", error);

    // Send a 500 Internal Server Error response
    return res.status(500).send("Internal server error");
  }
});


//////////////////////////////////////////////////////////////////////////

/**
 * express.static function for the public folder containing the documentation file
 */
app.use(express.static('public'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (
    err.name === "Error" &&
    err.message ===
      "The CORS policy for this application does not allow access from origin"
  ) {
    res.status(403); 
  } else {
    res.status(500);
  }

  // Config CORS headers
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");

  res.send("Something broke!");
});


//-----------------------------------------------------------------------------------------
const port = process.env.PORT || 8080;
app.listen(port,'0.0.0.0', () => {
  console.log('Listening on Port' + port);
});
