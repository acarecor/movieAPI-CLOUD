const express = require ('express'),
        app = express(),
        morgan = require ('morgan'),
        bodyParser = require('body-parser'),
        uuid = require('uuid');

app.use(bodyParser.json());



let users =[
    
    {   "id": ,  
        "username" : "",
        "password" : "",
        "favorites movies" : {
            "title":"",
        }
}

] 

// "in memory" array of objects with data about 10  top movies 
let topMovies = [
    
    {
        "Title":"Citizen Kane",
        "Genre":{
            "Name":"",
            "Description":"",
        "Description":"",
        "Director": {
            "Name":'Orson Welles',
            "Bio":"",
            "Birth": "",
        },
        "image Url":"",
        "year": '1941',
    },
    {
        title:'Bicycle Thieves',
        director:'Vittorio De Sica',
        year: '1948',
    },
    {
        title:"Schindler's List",
        director:'Steven Spielberg',
        year: '1993',
    },
    {
        title:'Il Postino',
        director:'Michael Radford',
        year: '1995',
    },
    {
        title:'The Godfather',
        director:'Francis Ford Coppola',
        year: '1972',
    },
    {
        title:'Casablanca',
        director:'Michael Curtiz',
        year: '1942',
    },
    {
        title:'Life is Beautiful',
        director:'Roberto Benigni',
        year: '1998',
    },
    {
        title:'Dead Poets Society',
        director:'Peter Weir',
        year: '1989',
    },
    {
        title:'The Matrix',
        director:'The Wachowsky Brothers',
        year: '1999',
    },
    {
        title:'The Shawshank Redemption',
        director:'Frank Darabont',
        year: '1994',
    }
];

// morgan  function use

app.use(morgan ('common'));

// express.static function for the public folder containing the documentation file
app.use(express.static('public'));

app.use((err, req, res, next)=> {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

//CREATE a new user

app.post('/users', (req, res) => {
    const newUser = req.body;

    if(!newUser.username){
        const message ='Missing username in request body';
        res.status(400).send(message);
    } else {
        newUser.id = uuid.v4();
        users.push(newUser);
        res.status(201).send(newUser);
    }
});

//UPDATE user info
app.put ('/users/:username', (req, res)=> {
    res.send('Successful PUT request returning updated user information')
})
//ADD movies to favorites
app.put ('/users/:username/:favorites', (req, res)=> {
    res.send('Successful PUT request returning the titles from the movie added to favorites')
});

//DELETE movies from favorites
app.delete('/users/:username/:favorites', (req, res)=> {
    res.send('Successful DELETE request returning the title of the deleted movie')
});

app.delete('/users/:username', (req, res)=> {
    res.send('Successful DELETE request returning the message indicating that the user was removed')
})
//READ 

app.get('/users/:username/:favorites', (req, res)=> {
    res.send('Succesful GET request returning the list to the favorites movies')
});

//GET request READ
app.get ('/', (req, res) => {
    res.send('Welcome to myFlix');
});

app.get('/movies', (req, res) => {
    res.status(200).json(topMovies);
});
app.get('movies/:title', (req, res)=> {
    const { title } = req.params;
    const movie = movies.find((movie) => movie.Title === title);

    res.json(movie);
    });

    
app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});
