const express = require("express");
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken')
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

            // jwt Related Data
            app.post('/jwt', async (req, res) => {
                  const user = req.body;
                  const token = jwt.sign(user, process.env.ACCESSS_TOKEN_SECRET, { expiresIn: '1h' })
                  res.send({ token })
            })

            // MiddleWare
            const verifyToken = (req, res, next) => {
                  console.log('Insite ferify token', req.headers.authorization)
                  if (!req.headers.authorization) {
                        return res.status(401).send({ message: 'unauthorized access' })
                  }
                  const token = req.headers.authorization.split(' ')[1];
                  jwt.verify(token, process.env.ACCESSS_TOKEN_SECRET, (err, decoded) => {
                        if (err) {
                              return res.status(401).send({ message: 'unauthorized access' })
                        }
                        req.decoded = decoded
                        next()
                  })
            }

            const verifyAdmin = async (req, res, next) => {
                  const email = req.decoded.email
                  const query = { email: email };
                  const user = await userCollection.findOne(query);
                  const isAdmin = user?.role === 'admin';
                  if (!isAdmin) {
                        return res.status(403).send({ message: 'forbidden asccess' });
                  }
                  next()
            }



            // User Related Data
            app.get('/users', verifyToken,verifyAdmin, async (req, res) => {
                  const result = await userCollection.find().toArray()
                  res.send(result)
            })
            app.get('/users/admin/:email', verifyToken, async (req, res) => {
                  const email = req.params.email;
                  if (email !== req.decoded.email) {
                        return res.status(403).send({ message: 'forbidden access' })
                  }
                  const query = { email: email }
                  const user = await userCollection.findOne(query)
                  let admin = false
                  if (user) {
                        admin = user?.role === 'admin';
                  }
                  res.send({ admin })
            })

            app.post("/users", async (req, res) => {
                  const user = req.body;
                  const query = { email: user.email }
                  const existingUsers = await userCollection.findOne(query)
                  if (existingUsers) {
                        return res.send({ message: 'User Already exists', insertedId: null })
                  }
                  const result = await userCollection.insertOne(user)
                  res.send(result)
            })



            app.delete('/users/:id', async (req, res) => {
                  const id = req.params.id
                  const query = { _id: new ObjectId(id) }
                  const result = await userCollection.deleteOne(query)
                  res.send(result)
            })
            app.patch('/users/admin/:id', async (req, res) => {
                  const id = req.params.id
                  const query = { _id: new ObjectId(id) }
                  const updateDoc = {
                        $set: {
                              role: 'admin'
                        }
                  }
                  const result = await userCollection.updateOne(query, updateDoc)
                  res.send(result)
            })

            // Carts Related Data
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