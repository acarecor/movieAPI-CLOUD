const express = require ('express'),
        app = express(),
        morgan = require ('morgan'),
        bodyParser = require('body-parser'),
        uuid = require('uuid');

app.use(bodyParser.json());



let users =[
    {
        id:1,
        name:"Ana",
        favoritesMovies:[]
    },
    {
        id:2,
        name:"Christian",
        favoritesMovies:["Citizen Kane"]
    }
] 

// "in memory" array of objects with data about 5  top movies 
let movies = [
    
    {
        "Title" :"Citizen Kane",
        "Genre" :{
            "Name":"Drama",
            "Description":"The drama genre features stories with high stakes and many conflicts. They're plot-driven and demand that every character and scene move the story forward. Dramas follow a clearly defined narrative plot structure, portraying real-life scenarios or extreme situations with emotionally-driven characters."
        },
        "Description":"When a reporter is assigned to decipher newspaper magnate Charles Foster Kane's (Orson Welles) dying words, his investigation gradually reveals the fascinating portrait of a complex man who rose from obscurity to staggering heights. Though Kane's friend and colleague Jedediah Leland (Joseph Cotten), and his mistress, Susan Alexander (Dorothy Comingore), shed fragments of light on Kane's life, the reporter fears he may never penetrate the mystery of the elusive man's final word, 'Rosebud.'",
        "Director": {
            "Name":'Orson Welles',
            "Bio":"George Orson Welles (May 6, 1915 – October 10, 1985) was an American actor, director, screenwriter, and producer who is remembered for his innovative work in film, radio, and theatre. He is considered to be among the greatest and most influential filmmakers of all time. Kenosha, Wisconsin, U.S.",
            "Birth": "1915"
        },
        "imageURL" :"",
        "year": "1941",
    },
    {
        "Title":"Bicycle Thieves",
        "Genre ":{
            "Name":"Drama",
            "Description":"The drama genre features stories with high stakes and many conflicts. They're plot-driven and demand that every character and scene move the story forward. Dramas follow a clearly defined narrative plot structure, portraying real-life scenarios or extreme situations with emotionally-driven characters.",
        },
        "Description":"In poverty-stricken postwar Rome, a man is on his first day of a new job that offers hope of salvation for his desperate family when his bicycle, which he needs for work, is stolen. With his young son in tow, he sets off to track down the thief.",
        "Director": {
            "Name": "Vittorio De Sica",
            "Bio":"Italian director Vittorio De Sica was also a notable actor who appeared in over 100 films, to which he brought the same charm and brightness which infused his work behind the camera.",
            "Birth":"1901",
        },
        "imageURL":"",
        "year": "1948",
    },
    {
        "Title":"Schindler's List",
        "Genre ":{
            "Name":"Drama",
            "Description":"The drama genre features stories with high stakes and many conflicts. They're plot-driven and demand that every character and scene move the story forward. Dramas follow a clearly defined narrative plot structure, portraying real-life scenarios or extreme situations with emotionally-driven characters.",
        },
        "Description":"Businessman Oskar Schindler (Liam Neeson) arrives in Krakow in 1939, ready to make his fortune from World War II, which has just started. After joining the Nazi party primarily for political expediency, he staffs his factory with Jewish workers for similarly pragmatic reasons. When the SS begins exterminating Jews in the Krakow ghetto, Schindler arranges to have his workers protected to keep his factory in operation, but soon realizes that in so doing, he is also saving innocent lives.",
        "Director": {
            "Name": "Steven Spielberg",
            "Bio":"Steven Allan Spielberg  is an American filmmaker. A major figure of the New Hollywood era and pioneer of the modern blockbuster, he is the most commercially successful director in history.",
            "Birth":"1946",
        },
        "year": "1993",
    },
    {
        "Title":"Il Postino",
        "Genre ":{
            "Name":"Drama",
            "Description":"The drama genre features stories with high stakes and many conflicts. They're plot-driven and demand that every character and scene move the story forward. Dramas follow a clearly defined narrative plot structure, portraying real-life scenarios or extreme situations with emotionally-driven characters.",
        },
        "Description":"Based on true events, Il Postino portrays the story of a shy postman who develops a transformative friendship with the exiled Chilean poet Pablo Neruda. On a tiny island off the Italian coast in 1953, the postman has been given the job of delivering mail to the town's new resident.",
        "Director": {
            "Name": "Michael Radford",
            "Bio":"Radford was born on 24 February 1946, in New Delhi, India, to a British father and an Austrian Jewish mother. He was educated at Bedford School before attending Worcester College, Oxford. After teaching for a few years, he went to the National Film and Television School, becoming a student there in its inaugural year.",
            "Birth":"1946",
        },
        "year": "1995",
    },
    {
        "Title" :'The Godfather',
        "Genre ":{
            "Name":"Drama",
            "Description":"The drama genre features stories with high stakes and many conflicts. They're plot-driven and demand that every character and scene move the story forward. Dramas follow a clearly defined narrative plot structure, portraying real-life scenarios or extreme situations with emotionally-driven characters.",
        },
        "Description":"The Godfather is set in the 1940s and takes place entirely within the world of the Corleones, a fictional New York Mafia family. It opens inside the dark office of the family patriarch, Don Vito Corleone (also known as the Godfather and played by Brando), on the wedding day of his daughter, Connie (Talia Shire).",
        "Director":{
            "Name": "Francis Ford Coppola",
            "Bio":"He is an American film director, producer, and screenwriter. He is considered one of the major figures of the New Hollywood filmmaking movement of the 1960s and 1970s.",
            "Birth":"1939",
        },
        "year": "1972",
    },

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
//CREATE a new user

app.post('/users', (req, res) => {
    const newUser = req.body;

    if(newUser.name){
        newUser.id = uuid.v4();
        users.push(newUser);
        res.status(201).json(newUser);
    } else {
        const message ='Missing username in request body';
        res.status(400).send(message);
    } 
})


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

//DELETE user

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

// User Favorites-------------------------------------------------------------------------------
//CREATE : ADD movie to a list of favorites
app.post ('/users/:id/:movieTitle', (req, res)=> {
    const { id, movieTitle } = req.params;
    
    let user = users.find(user => user.id == id);

    if(user) {
    user.favoritesMovies.push(movieTitle);
    res.status(200).send(`${movieTitle} has been added to  the user's  ${id}`);
    } else {
        res.status(400).send('user not found');
    }
})
    
//READ 

app.get('/users/:id/favorites', (req, res)=> {
    const { id, favoritesMovies } = req.params;
    let user = users.find(user => user.id == id);

    if(user) {
        res.status(200).json(user.favoritesMovies);
        } else {
            res.status(400).send('user not found');
        }
    })

//DELETE movies from favorites
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

// movies---------------------------------------------------------------------------------------
//READ
app.get ('/', (req, res) => {
    res.send('Welcome to myFlix');
})

app.get('/movies', (req, res) => {
    res.status(200).json(movies);
})

app.get('/movies/:title', (req, res)=> {
    const { title } = req.params;
    const movie = movies.find(movie => movie.Title === title);

    if (movie) {
        return res.status(200).json(movie);
    } else {
        res.status(400).send('movie not found')
    }
})

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
