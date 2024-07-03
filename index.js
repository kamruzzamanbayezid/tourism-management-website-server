const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
      origin: ['http://localhost:5173'],
      credentials: true
}));
app.use(express.json());
app.use(cookieParser())

// custom middlewares
const verifyToken = async (req, res, next) => {
      const token = req.cookies.token;
      if (!token) {
            return res.status(401).send({ message: 'Not Authorized' })
      }
      jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
            if (err) {
                  return res.status(401).send({ message: 'Not Authorized' })
            }
            req.user = decoded;
            next()
      })
}

const uri = `mongodb+srv://${process.env.SECRET_USER_NAME}:${process.env.SECRET_USER_PASSWORD}@cluster0.d8abmis.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
      serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
      }
});

async function run() {
      try {
            // Connect the client to the server	(optional starting in v4.7)
            // await client.connect();

            const touristsCollection = client.db("travelsDB").collection("touristSpots");
            const countriesCollection = client.db("travelsDB").collection("countries");
            const tourGuidesCollection = client.db("travelsDB").collection("tourGuides");

            // auth/jwt related api's

            // set token to browser cookie
            app.post('/jwt', async (req, res) => {
                  const user = req.body;
                  const token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '1h' });
                  res
                        .cookie('token', token, {
                              httpOnly: true,
                              sameSite: 'lax',
                              secure: false
                        })
                        .send({ message: true })
            })

            // remove token when logout
            app.post('/logout', async (req, res) => {
                  const user = req.body;
                  res
                        .clearCookie('token', { maxAge: 0 })
                        .send({ message: true })
            })

            // tourist spots related api's
            app.get('/touristSpots', async (req, res) => {
                  const result = await touristsCollection.find().toArray();
                  res.send(result);
            })

            app.get('/touristSpots/descending', async (req, res) => {
                  const options = {
                        // Sort returned documents in descending order by averageCost
                        sort: { averageCost: -1 },
                  };
                  const result = await touristsCollection.find({}, options).toArray();
                  res.send(result);
            });


            app.get('/touristSpotDetails/:id', async (req, res) => {
                  const id = req.params.id;
                  const query = { _id: new ObjectId(id) };
                  const result = await touristsCollection.findOne(query);
                  res.send(result);
            })

            // my list api
            app.get('/touristSpots/:email', verifyToken, async (req, res) => {

                  if (req.params?.email !== req.user?.email) {
                        return res.status(402).send({ message: 'Access Forbidden' })
                  }

                  const email = req.params.email;
                  const query = { email: email };

                  const result = await touristsCollection.find(query).toArray();
                  res.send(result);
            })

            app.post('/touristSpots', async (req, res) => {
                  const touristSpot = req.body;
                  const result = await touristsCollection.insertOne(touristSpot);
                  res.send(result);
            })

            app.put('/touristSpotDetails/:id', async (req, res) => {
                  const id = req.params.id;
                  const touristSpot = req.body;
                  const filter = { _id: new ObjectId(id) };
                  const options = { upsert: true };
                  const updateTouristSpot = {
                        $set: {
                              ...touristSpot
                        },
                  };
                  const result = await touristsCollection.updateOne(filter, updateTouristSpot, options);
                  res.send(result);
            })

            app.delete('/touristSpots/:id', async (req, res) => {
                  const id = req.params.id;
                  const query = { _id: new ObjectId(id) };
                  const result = await touristsCollection.deleteOne(query);
                  res.send(result);
            })

            // countries related api's
            app.get('/countries', async (req, res) => {
                  const result = await countriesCollection.find().toArray();
                  res.send(result);
            })

            app.get('/touristSpots/specificCountry/:countryName', async (req, res) => {
                  const countryName = req.params.countryName;
                  const query = { countryName: countryName }
                  const result = await touristsCollection.find(query).toArray();
                  res.send(result);
            })

            // fot tour guide
            app.get('/tourGuides', async (req, res) => {
                  const result = await tourGuidesCollection.find().toArray();
                  res.send(result);
            })



            // Send a ping to confirm a successful connection
            await client.db("admin").command({ ping: 1 });
            console.log("Pinged your deployment. You successfully connected to MongoDB!");
      } finally {
            // Ensures that the client will close when you finish/error
            // await client.close();
      }
}
run().catch(console.dir);


app.get('/', (req, res) => {
      res.send('Tourism Management website!')
})

app.listen(port, () => {
      console.log(`Tourism management website is listening on port ${port}`)
})