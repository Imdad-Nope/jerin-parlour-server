const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.n5vc4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();

        const database = client.db("Receive_Messages")
        const messagesCollection = database.collection("Messages")
        const appointCollection = database.collection("appointment")
        const usersCollection = database.collection("saveUsers")

        // Messages Post
        app.post("/addMessages", async (req, res) => {
            const messages = req.body;
            console.log(messages)
            const result = await messagesCollection.insertOne(messages);
            res.json(result)
            // console.log(result)
        })

        // Appointment Post
        app.post("/appoint", async (req, res) => {
            const appoint = req.body;
            const result = await appointCollection.insertOne(appoint);
            res.json(result)
            // console.log(result)
        })
        // Receive appointments by Get
        app.get("/appointments", async (req, res) => {
            const email = req.query.email;
            const date = new Date(req.query.date).toLocaleDateString()
            const query = { email: email, date: date };
            const cursor = appointCollection.find(query);
            const appointments = await cursor.toArray();
            res.json(appointments);
        })

        // Delete Data
        app.delete("/appointments/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: ObjectId(id) }
            const cursor = await appointCollection.deleteOne(query);
            res.json(cursor);
        })

        // Save Users Post
        app.post("/users", async (req, res) => {
            const usersData = req.body;
            const result = await usersCollection.insertOne(usersData);
            // console.log(result);
            res.json(result);
        })

        // SaveUsers Put
        app.put("/users", async (req, res) => {
            const user = req.body;
            const filter = { email: user.email }
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const resultData = await usersCollection.updateOne(filter, updateDoc, options)
            // console.log(resultData);
            res.json(resultData)
        })

    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello Jerin!')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})