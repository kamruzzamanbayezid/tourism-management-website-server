const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

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
            await client.connect();

            const touristsCollection = client.db("touristsDB").collection("tourists");
            const countriesCollection = client.db("touristsDB").collection("countries");
            const tourGuidesCollection = client.db("touristsDB").collection("tourGuides");

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

            app.get('/touristSpots/:email', async (req, res) => {
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

            // for countries
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