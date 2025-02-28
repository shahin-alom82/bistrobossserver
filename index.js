const express = require("express");
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());
require('dotenv').config()
const port = process.env.PORT || 5000;



// Mongobd Connect Start
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sozmemk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
      serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
      }
});
async function run() {
      try {
            await client.connect();



            const menuCollection = client.db('Bistroboss').collection('menu')
            const reviewsCollection = client.db('Bistroboss').collection('reviews')
            const cartsCollection = client.db('Bistroboss').collection('carts')
            const userCollection = client.db('Bistroboss').collection('users')

            app.get("/menu", async (req, res) => {
                  const result = await menuCollection.find().toArray()
                  res.send(result)
            })
            app.get("/reviews", async (req, res) => {
                  const result = await reviewsCollection.find().toArray()
                  res.send(result)
            })


            // User Related Data
            app.post("/users", async (req, res) => {
                  const user = req.body;
                  const result = await userCollection.insertOne(user)
                  res.send(result)
            })

            // Carts Collection
            app.get("/carts", async (req, res) => {
                  const email = req.query.email
                  const query = { email: email }
                  const result = await cartsCollection.find(query).toArray()
                  res.send(result)
            })
            app.post('/carts', async (req, res) => {
                  const cartItem = req.body;
                  const result = await cartsCollection.insertOne(cartItem)
                  res.send(result)
            })
            app.delete('/carts/:id', async (req, res) => {
                  const id = req.params.id
                  const query = { _id: new ObjectId(id) }
                  const result = await cartsCollection.deleteOne(query)
                  res.send(result)
            })

            await client.db("admin").command({ ping: 1 });
            console.log("Mongodb Connected successfully!");
      } finally {
      }
}
run().catch(console.dir);
// Mongobd Connect End




app.get('/', (req, res) => {
      res.send('Bistro is Running!')
})
app.listen(port, () => {
      console.log(`Bistro boss is Sitting On Port ${port}`)
})