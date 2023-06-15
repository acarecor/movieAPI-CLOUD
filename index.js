const express = require ('express'),
        app = express(),
        morgan = require ('morgan'),
        bodyParser = require('body-parser'),
        uuid = require('uuid');

app.use(bodyParser.json());



let users =[
    
] 

// "in memory" array of objects with data about 10  top movies 
let topMovies = [
    
    {
        title:'Citizen Kane',
        director:'Orson Welles',
        year: '1941',
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

//GET request
app.get ('/', (req, res) => {
    res.send('Welcome to myFlix');
});

app.get('/movies', (req, res) => {
    res.json(topMovies);
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});
