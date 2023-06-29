const jwtSecret = 'your_jwt_secret'; 
const jwt = require('jsonwebtoken'),
  passport = require('passport');

require('./passport');

/* generateJWTToken function  has an expiration date of 7 days*/

let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.Username, //the encoding username in the JWT
        expiresIn: '7d', //   has an expiration date of 7 days 
        algorithm: 'HS256' //algorith used to 'sign' or encode the values of the jwt
    });
}

/*POST login. */
module.exports = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate ('local', {session:false}, ( error, user, info) => {
            if(error || !user) {
                return res.status(400).json({ 
                    message: 'Something is not right',
                    user: user
                });
            }
            req.login(user, {session: false}, (error) => {
                if(error) {
                    res.send(error);
                }
                let token = generateJWTToken(user.toJSON());
                return res.json({user, token}); /*  keys user:user, token:token must be the same as the values*/
            });
        }) (req, res);
    });
}