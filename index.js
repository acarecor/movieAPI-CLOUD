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

mongoose.connect('mongodb://localhost:27017/cfDB', { useNewUrlParser: true, useUnifiedTopology:true});

let users =[

] 

// "in memory" array of objects with data about 5  top movies 
let movies = [
    


];

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
                return res.status(400).send(req.body.Username + 'already exists');
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


//UPDATE user info
app.put ('/users/:id', (req, res)=> {
    const { id } = req.params;
    const updatedUser = req.body;
    
    let user = users.find(user => user.id == id);

    if(user) {
        user.name = updatedUser.name;
        res.status(200).json(user);
    } else {
        res.status(400).send('User not found');
    }
})

    // add a movie to the user Favorites-------------------------------------------------------------------------------
//CREATE : ADD movie to a list of favorites
app.post ('/users/:id/:movieTitle', (req, res)=> {
    const { id, movieTitle } = req.params;
    
    let user = users.find(user => user.id == id);

    if(user) {
    user.favoritesMovies.push(movieTitle);
    res.status(200).send(`${movieTitle} has been added to  the list of favorites movies of user  ${id}`);
    } else {
        res.status(400).send('user not found');
    }
})
    
//READ a list of favorites movies

app.get('/users/:id/favorites', (req, res)=> {
    const { id, favoritesMovies } = req.params;
    let user = users.find(user => user.id == id);

    if(user) {
        res.status(200).json(user.favoritesMovies);
        } else {
            res.status(400).send('user not found');
        }
    })

//DELETE a movie from favorites list
app.delete('/users/:id/:movieTitle', (req, res)=> {
    
    const { id, movieTitle } = req.params;
    

    let user = users.find(user => user.id == id)

    if(user) {
    user.favoritesMovies = user.favoritesMovies.filter(title => title !== movieTitle);
    res.status(200).send(`${movieTitle} has been removed from to user's ${id} `);
    } else {
        res.status(400).send('user not found');
    }
})
    //-------------------------------------------------------

//DELETE a user account

app.delete('/users/:id', (req, res)=> {
    const { id} = req.params;
    
    let user = users.find(user => user.id == id)

    if(user) {
    users = users.filter(user => user.id == id);
    res.status(200).send(`user ${id} has been deleted`);
    } else {
        res.status(400).send('user not found');
    }
})

// movies---------------------------------------------------------------------------------------
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

app.get('/movies/genre/:genreName', (req, res)=> {
    const { genreName } = req.params;
    const genre = movies.find(movie => movie.Genre.Name === genreName).Genre;

    if (genre) {
        res.status(200).json(genre);
    } else {
        res.status(400).send('genre not found')
    }
})

app.get('/movies/director/:directorName', (req, res)=> {
    const { directorName } = req.params;
    const director = movies.find(movie => movie.Director.Name === directorName).Director;

    if (director) {
        res.status(200).json(director);
    } else {
        res.status(400).send('director not found')
    }
})

//-----------------------------------------------------------------------------------------
app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
})
