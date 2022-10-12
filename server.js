import express from 'express';
import cors from 'cors';
import knex from 'knex';
import knexSettings from './knexSettings.js';
import bcrypt from 'bcrypt';

const app = express();
const db = knex(knexSettings);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.post("/register", (req, res) => {
    const { name, email, password } = req.body;

    if (!password)
        res.status(404).send("Not found password in your http body!");

    bcrypt.hash(password, 10, (err, hash) => {
        if (err)
            res.status(400).send("You have some sort of error here!");

        db("Users").insert({name,email}).then(() => {
            db("Passwords").insert({email,hash}).then(() => {
                db("Users").select("*").where({email}).then(resp => res.json(resp[0]));
            }).catch(err => res.json(err));
        }).catch(err => res.json(err));
    });
});

app.get("/profile/:id", (req, res) => {
    const { id } = req.params;
    db("Users").select("*").where({id}).then(resp => resp.length != 0 ? res.json(resp[0]): res.json("Id is not okay!")).catch(err => res.json(err));
});

app.post("/signin", (req, res) => {
    const { email, password } = req.body;
    db("Passwords").select("*").where({email}).then(resp => {
        bcrypt.compare(password, resp[0].hash, (err, same) => {
            if (err)
                res.status(400).send("There is some kind of error returned!");
            if (same) 
                db("Users").select("*").where({email}).then(resp => res.send(resp[0])).catch(err => res.status(400).json(err));
            else
                res.status(400).json("Passwords are not the same!");
        });
    }).catch(err => res.status(400).json(err));
});

app.put("/rank", (req, res) => {
    db("Users").where({email: req.query.email}).returning('rank').increment('rank', 1).then(resp => res.json(resp[0]));
});

//ovo ćemo srediti nakon što napravimo bazu podataka u postgres sqlu!

app.listen(3001);