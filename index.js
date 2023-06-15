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

// "in memory" array of objects with data about 10  top movies 
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
        "Description":"When a reporter is assigned to decipher newspaper magnate Charles Foster Kane's (Orson Welles) dying words, his investigation gradually reveals the fascinating portrait of a complex man who rose from obscurity to staggering heights. Though Kane's friend and colleague Jedediah Leland (Joseph Cotten), and his mistress, Susan Alexander (Dorothy Comingore), shed fragments of light on Kane's life, the reporter fears he may never penetrate the mystery of the elusive man's final word, 'Rosebud.'",
        "Director": {
            "Name": "Vittorio De Sica",
            "Bio":"",
            "Birth":"",
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
        "Description":"When a reporter is assigned to decipher newspaper magnate Charles Foster Kane's (Orson Welles) dying words, his investigation gradually reveals the fascinating portrait of a complex man who rose from obscurity to staggering heights. Though Kane's friend and colleague Jedediah Leland (Joseph Cotten), and his mistress, Susan Alexander (Dorothy Comingore), shed fragments of light on Kane's life, the reporter fears he may never penetrate the mystery of the elusive man's final word, 'Rosebud.'",
        "Director": {
            "Name": "Steven Spielberg",
            "Bio":"",
            "Birth":"",
        },
        "year": "1993",
    },
    {
        "Title":"Il Postino",
        "Genre ":{
            "Name":"Drama",
            "Description":"The drama genre features stories with high stakes and many conflicts. They're plot-driven and demand that every character and scene move the story forward. Dramas follow a clearly defined narrative plot structure, portraying real-life scenarios or extreme situations with emotionally-driven characters.",
        },
        "Description":"When a reporter is assigned to decipher newspaper magnate Charles Foster Kane's (Orson Welles) dying words, his investigation gradually reveals the fascinating portrait of a complex man who rose from obscurity to staggering heights. Though Kane's friend and colleague Jedediah Leland (Joseph Cotten), and his mistress, Susan Alexander (Dorothy Comingore), shed fragments of light on Kane's life, the reporter fears he may never penetrate the mystery of the elusive man's final word, 'Rosebud.'",
        "Director": {
            "Name": "Michael Radford",
            "Bio":"",
            "Birth":"",
        },
        "year": "1995",
    },
    {
        "Title" :'The Godfather',
        "Genre ":{
            "Name":"Drama",
            "Description":"The drama genre features stories with high stakes and many conflicts. They're plot-driven and demand that every character and scene move the story forward. Dramas follow a clearly defined narrative plot structure, portraying real-life scenarios or extreme situations with emotionally-driven characters.",
        },
        "Description":"When a reporter is assigned to decipher newspaper magnate Charles Foster Kane's (Orson Welles) dying words, his investigation gradually reveals the fascinating portrait of a complex man who rose from obscurity to staggering heights. Though Kane's friend and colleague Jedediah Leland (Joseph Cotten), and his mistress, Susan Alexander (Dorothy Comingore), shed fragments of light on Kane's life, the reporter fears he may never penetrate the mystery of the elusive man's final word, 'Rosebud.'",
        "Director":{
            "Name": "Francis Ford Coppola",
            "Bio":"",
            "Birth":"",
        },
        "year": "1972",
    },

];

// morgan  function use

//app.use(morgan ('common'));

// express.static function for the public folder containing the documentation file
app.use(express.static('public'));

app.use((err, req, res, next)=> {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

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

//USERS----------------------------------------------------------------
//UPDATE user info
app.put ('/users/:id', (req, res)=> {
    const { id } = req.params;
    const updatedUser = req.body;
    
    let user = user.find(user => user.id == id)

    if(user) {
    user.name = updatedUser.name;
    res.status(200).json(user)
    }else {
        res.status(400).send('user not found');
    }
})
//ADD movie to a list of favorites
app.post ('/users/:id/:movieTitle', (req, res)=> {
    const { id, movieTitle } = req.params;
    
    let user = user.find(user => user.id == id)

    if(user) {
    user.favoritesMovies.push(movieTitle);
    res.status(200).send(`${movieTitle} has been added to user ${id}' list`);
    } else {
        res.status(400).send('user not found');
    }
})
    
    

//DELETE movies from favorites
app.delete('/users/:id/:movieTitle', (req, res)=> {
    
    const { id, movieTitle } = req.params;
    

    let user = user.find(user => user.id == id)

    if(user) {
    user.favoritesMovies = user.favoritesMovies.filter(title => title !== movieTitle);
    res.status(200).send(`${movieTitle} has been removed from to user ${id}' list`);
    } else {
        res.status(400).send('user not found');
    }
})
    



app.delete('/users/:id', (req, res)=> {
    res.send('Successful DELETE request returning a message indicating that the user was removed')
})
//READ 

app.get('/users/:id/:favoritesMovies', (req, res)=> {
    res.send('Succesful GET request returning the list to the favorites movies')
})
// movies--------------------------------------
//READ
app.get ('/', (req, res) => {
    res.send('Welcome to myFlix');
})

app.get('/movies', (req, res) => {
    res.status(200).json(movies);
})
app.get('movies/:title', (req, res)=> {
    const { title } = req.params;
    const movie = movies.find(movie => movies.Title === Title);

    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(400).send('movie not found')
    }
})

app.get('movies/genre/:genreName', (req, res)=> {
    const { genreName } = req.params;
    const genre = movies.find(movie => movies.Genre.Name === genreName).Genre;

    if (genre) {
        res.status(200).json(genre);
    } else {
        res.status(400).send('genre not found')
    }
})

app.get('movies/director/:directorName', (req, res)=> {
    const { directorName } = req.params;
    const director = movies.find(movie => movies.Director.Name === directorName).Director;

    if (director) {
        res.status(200).json(director);
    } else {
        res.status(400).send('director not found')
    }
})

//------------------------------
app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
})
