const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const admin = require("firebase-admin");
const ObjectId = require('mongodb').ObjectId;
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const serviceAccount = JSON.parse(process.env.FIREBASE_PRIVATE_KEY);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.n5vc4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function verifyToken(req, res, next) {

    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers?.authorization.split(' ')[1]

        try {
            const decodedUser = await admin.auth().verifyIdToken(token)
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }
    }


    next();
}

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
        app.get("/appointments", verifyToken, async (req, res) => {
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
        });

        // Make Role with Put
        app.put("/users/admin", verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email }
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    // console.log(result);
                    res.json(result)
                }
            }
            else {
                res.status(403).json({ messages: 'Sorry you are not allowed to make Admin' })
            }

        });

        // Make Admin with Get
        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await usersCollection.findOne(query);
            let isAdmin = false;
            if (result?.role == 'admin') {
                isAdmin = true;
            };
            res.json({ admin: isAdmin })
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