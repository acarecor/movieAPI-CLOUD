const express = require ('express'),
        app = express(),
        morgan = require ('morgan'),
        bodyParser = require('body-parser'),
        uuid = require('uuid');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

const mongoose =require ('mongoose');
const Models = require ('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/cfDB', { 
    useNewUrlParser: true, 
    useUnifiedTopology:true
});


// morgan  function use

app.use(morgan ('common'));

// express.static function for the public folder containing the documentation file
app.use(express.static('public'));

app.use((err, req, res, next)=> {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

//Users----------------------------------------------------------------
//CREATE a new user account add inn JSON format (mongoose)

app.post('/users', (req, res) => {
    Users.findOne ({ Username: req.body.Username})
        .then ((user) => {
            if (user) {
                return res.status(400).send(req.body.Username + ' already exists');
            } else {
                Users
                 .create( {
                    Username: req.body.Username,
                    Password: req.body.Password,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday
                 })
                 .then ((user) => {res.status(201).json(user)})
                
                .catch((error) => {
                    console.error(error);
                    res.status(500).send('Error: ' + error);
                })
            }  
        })

        .catch((error)=> {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });


});

//READ all users info (mongoose)
app.get('/users', (req, res) => {
    Users.find()
    .then ((users) => {
    res.status(201).json(users);
    })
    .catch ((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});
//READ get a user by username  (mongoose)
app.get('/users/:Username', (req,res) => {
    Users.findOne({Username: req.params.Username})
        .then((user) => {
            res.json(user);
        })
        .catch ((err)=> {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//UPDATE user info (mongoose)
app.put ('/users/:Username', (req, res)=> {
    Users.findOneAndUpdate ({Username:req.params.Username}, {$set:
        {
            Username: req.body.Username,
            Password:req.body.Password,
            Email: req.body.Email,
            Birthday:req.body.Birthday
        } 
    },
    {new: true},
    (err, updatedUser)=> {
        if (err) {
            console.error(err);
            res.status(500).send('Error: ' + err);
        } else {
            res.json(updatedUser);
        }
    });
});

// add a movie to the user Favorites-------------------------------------------------------------------------------
//CREATE : ADD movie to a list of favorites (mongoose)
app.post ('/users/:Username/movies/:MovieID', (req, res)=> {
    Users.findOneAndUpdate ({ Username: req.params.Username}, {
        $addToSet: { FavoritesMovies: req.params.MovieID}
    },
    {new:true},
    (err,updatedUser)=> {
        if(err) {
            console.error(err);
            res.status(500).send('Error: ' + err);
        } else {
            res.json(updatedUser);
        }
    });
    
});
    
//READ a list of favorites movies

app.get('/users/:Username/FavoritesMovies', (req, res)=> {
    Users.find({ Username: req.params.Username}, 
        {FavoritesMovies:req.params.MovieID}) 
    .then ((movies) => {
     res.status(200).json(movies);
    })
    .catch ((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});  

//DELETE a movie from favorites list mongoose
app.delete('/users/:Username/:MovieID', (req, res)=> {
    Users.findOneAndUpdate ({ Username: req.params.Username}, {
       $pull: { FavoritesMovies: req.params.MovieID}
    },
    {new:true},
    (err,updatedUser)=> {
       if(err) {
            console.error(err);
            res.status(500).send('Error: ' + err);
        } else {
            res.json(updatedUser);
        }
    });
});
  
    //-------------------------------------------------------

//DELETE a user account (mongoose)

app.delete('/users/:Username', (req, res)=> {
    Users.findOneAndRemove({ Username:req.params.Username})
        .then((user) => {
            if(!user){
                res.status(400).send(req.params.Username + ' was not found');
            } else {
                res.status(200).send (req.params.Username + ' was deleted.');
            }
        })
        .catch ((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });

});

// default text --------------------------------------------------------------------------------------

app.get('/' , (req, res) => {
    res.send ("Welcome to myFlix!");
});

// movies-----------------------------------------------------
//READ: get all movies (mongoose)
app.get('/movies', (req, res) => {
    Movies.find()
    .then ((movies) => {
        res.status(200).json(movies);
    })
    .catch ((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//READ: get one  movie by title (mongoose)

app.get('/movies/:Title', (req, res)=> {
    Movies.findOne({ Title: req.params.Title})
        .then ((movie) => {
            res.json(200).json(movie);
        })
        .catch ((err)=> {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//READ: get one  genre by name  (mongoose)
app.get('/movies/genres/:Genre', (req, res)=> {
    Movies.findOne({ 'Genre.Name': req.params.Genre})
    .then ((movies) => {
        res.json(200).json(movies.Genre);
    })
    .catch ((err)=> {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});
   
   
//READ: get one  director by name  (mongoose)
app.get('/movies/directors/:Director', (req, res)=> {
    Movies.findOne({ 'Director.Name' : req.params.Director})
    .then ((movie) => {
        res.json(200).json(movie.Director);
    })
    .catch ((err)=> {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//-----------------------------------------------------------------------------------------
app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
})

