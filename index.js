const express = require ('express');
const app = express();

let topMovies = [
    {
        title:'Citizen Kane',
        director:'Orson Welles',
        year: '1941'
    },
    {
        title:'Bicycle Thieves',
        director:'Vittorio De Sica',
        year: '1948'
    },
    {
        title:"Schindler's List",
        director:'Steven Spielberg',
        year: '1993'
    },
    {
        title:'Il Postino',
        director:'Michael Radford',
        year: '1995'
    },
    {
        title:'The Godfather',
        director:'Francis Ford Coppola',
        year: '1972'
    },
    {
        title:'Casablanca',
        director:'Michael Curtiz',
        year: '1942'
    },
    {
        title:'Life is Beautiful',
        director:'Roberto Benigni',
        year: '1998'
    },
    {
        title:'Dead Poets Society',
        director:'Peter Weir',
        year: '1989'
    },
    {
        title:'The Matrix',
        director:'The Wachowsky Brothers',
        year: '1999'
    },
    {
        title:'The Shawshank Redemption',
        director:'Frank Darabont',
        year: '1994'
    }
];
//GET request
app.get ('/', (req, res) => {
    res.send('Welcome to myFlix');
});

app.get('/documentation', (req, res) => {
    res.sendFile('public/documentation.htms', { root:__dirname});
});

app.get('/movies', (req, res) => {
    res.json(topMovies);
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});
